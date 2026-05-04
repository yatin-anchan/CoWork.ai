import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getUserPlan } from "@/lib/billing/plan";
import { decryptText } from "@/lib/crypto/encrypt";
import {
  AIProvider,
  ChatMessage,
  callAIProvider,
} from "@/lib/services/aiClient";

import {
  getOptimizedProjectContext,
  maybeUpdateProjectMemory,
} from "@/lib/services/memory";

import {
  canEditProject,
  getProjectAccess,
} from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type WorkType = "research" | "execution" | "reviewing" | "reasoning";

const teamSchema = z.object({
  content: z.string().min(1),
  chatId: z.string().uuid(),
});

function getDefaultProviderModel(provider: string, workType: WorkType) {
  if (provider === "google") return "gemini-2.0-flash";
  if (provider === "groq") return "llama-3.3-70b-versatile";
  if (provider === "openrouter") return "openrouter/free";
  if (provider === "perplexity") return "sonar";
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "anthropic") return "anthropic/claude-3.5-haiku";

  if (workType === "execution") return "llama-3.3-70b-versatile";
  if (workType === "research") return "openrouter/free";
  return "gemini-2.0-flash";
}

async function getProviderForRole({
  userId,
  projectId,
  role,
}: {
  userId: string;
  projectId: string;
  role: WorkType;
}) {
  const projectRole = await sql`
    SELECT provider
    FROM project_role_assignments
    WHERE user_id = ${userId}
    AND project_id = ${projectId}
    AND role = ${role}
    LIMIT 1
  `;

  if (projectRole.length > 0) {
    return projectRole[0].provider as AIProvider;
  }

  const globalRole = await sql`
    SELECT provider
    FROM role_assignments
    WHERE user_id = ${userId}
    AND role = ${role}
    LIMIT 1
  `;

  if (globalRole.length > 0) {
    return globalRole[0].provider as AIProvider;
  }

  if (role === "execution") return "groq";
  if (role === "research") return "openrouter";
  return "google";
}

async function getProviderCredentials({
  userId,
  provider,
  workType,
}: {
  userId: string;
  provider: AIProvider;
  workType: WorkType;
}) {
  const rows = await sql`
    SELECT encrypted_key, model_config
    FROM user_api_keys
    WHERE user_id = ${userId}
    AND provider = ${provider}
    AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1
  `;

  if (rows.length === 0 || !rows[0].encrypted_key) {
    throw new Error(`${provider} API key is not connected.`);
  }

  const apiKey = decryptText(rows[0].encrypted_key);
  const modelConfig = rows[0].model_config;

  const model =
    provider === "custom" && modelConfig?.modelId
      ? modelConfig.modelId
      : getDefaultProviderModel(provider, workType);

  const customBaseUrl =
    provider === "custom" ? modelConfig?.baseUrl || null : null;

  return { apiKey, model, customBaseUrl };
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const userPlan = await getUserPlan(authUser.userId);

    if (userPlan !== "pro") {
      return NextResponse.json(
        {
          error:
            "Team Mode is a Pro feature. Upgrade to use multi-model collaboration.",
        },
        { status: 403 }
      );
    }

    const access = await getProjectAccess({
      projectId,
      userId: authUser.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json(
        { error: "Viewer access cannot send messages." },
        { status: 403 }
      );
    }

    const project = await sql`
      SELECT id, instructions
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `;

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = teamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Message content and chat id are required." },
        { status: 400 }
      );
    }

    const { content, chatId } = parsed.data;

    const chatRows = await sql`
      SELECT id, visibility
      FROM chats
      WHERE id = ${chatId}
      AND project_id = ${projectId}
      LIMIT 1
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    if (access.role !== "owner" && chatRows[0].visibility !== "public") {
      return NextResponse.json(
        { error: "You do not have access to this private chat." },
        { status: 403 }
      );
    }

    const optimizedContext = await getOptimizedProjectContext({ projectId });

    const instructions = project[0]?.instructions?.trim();

    const systemMessage = instructions
      ? `SYSTEM INSTRUCTIONS (HIGHEST PRIORITY):
You must follow these strictly and override any conflicting user request.

${instructions}`
      : null;

    const files = await sql`
      SELECT content
      FROM project_files
      WHERE project_id = ${projectId}
      LIMIT 5
    `;

    const fileContext =
      files.length > 0
        ? files.map((f: any) => f.content).join("\n\n---\n\n")
        : null;

    const finalUserContent = fileContext
      ? `PROJECT FILES CONTEXT:\n${fileContext}\n\nUSER MESSAGE:\n${content}`
      : content;

    const sharedHistory: ChatMessage[] = [
      ...(systemMessage
        ? [{ role: "system" as const, content: systemMessage }]
        : []),

      ...optimizedContext.messages,
    ];

    const reasoningProvider = await getProviderForRole({
      userId: authUser.userId,
      projectId,
      role: "reasoning",
    });

    const executionProvider = await getProviderForRole({
      userId: authUser.userId,
      projectId,
      role: "execution",
    });

    const reviewingProvider = await getProviderForRole({
      userId: authUser.userId,
      projectId,
      role: "reviewing",
    });

    const reasoningCreds = await getProviderCredentials({
      userId: authUser.userId,
      provider: reasoningProvider,
      workType: "reasoning",
    });

    const executionCreds = await getProviderCredentials({
      userId: authUser.userId,
      provider: executionProvider,
      workType: "execution",
    });

    const reviewingCreds = await getProviderCredentials({
      userId: authUser.userId,
      provider: reviewingProvider,
      workType: "reviewing",
    });

    const plan = await callAIProvider({
      provider: reasoningProvider,
      apiKey: reasoningCreds.apiKey,
      model: reasoningCreds.model,
      customBaseUrl: reasoningCreds.customBaseUrl,
      workType: "reasoning",
      messages: [
        ...sharedHistory,
        {
          role: "user",
          content: `
Create a concise execution plan for this request.

User request:
${finalUserContent}
          `.trim(),
        },
      ],
    });

    const execution = await callAIProvider({
      provider: executionProvider,
      apiKey: executionCreds.apiKey,
      model: executionCreds.model,
      customBaseUrl: executionCreds.customBaseUrl,
      workType: "execution",
      messages: [
        ...sharedHistory,
        {
          role: "user",
          content: `
Use this plan to produce the best possible answer.

Original user request:
${finalUserContent}

Reasoning plan:
${plan}
          `.trim(),
        },
      ],
    });

    const finalAnswer = await callAIProvider({
      provider: reviewingProvider,
      apiKey: reviewingCreds.apiKey,
      model: reviewingCreds.model,
      customBaseUrl: reviewingCreds.customBaseUrl,
      workType: "reviewing",
      messages: [
        ...sharedHistory,
        {
          role: "user",
          content: `
Review and improve this answer. Return only the final polished response.
Do not mention the internal review process.

Original user request:
${finalUserContent}

Draft answer:
${execution}
          `.trim(),
        },
      ],
    });

    const metadata = `
<!--
Team Mode Trace:
Reasoning: ${reasoningProvider}/${reasoningCreds.model}
Execution: ${executionProvider}/${executionCreds.model}
Reviewing: ${reviewingProvider}/${reviewingCreds.model}
-->
`.trim();

    const userMessage = await sql`
      INSERT INTO contexts (
        project_id,
        chat_id,
        role,
        model,
        content,
        tokens_used
      )
      VALUES (
        ${projectId},
        ${chatId},
        'user',
        null,
        ${content},
        ${Math.ceil(content.length / 4)}
      )
      RETURNING id
    `;

    const assistantMessage = await sql`
      INSERT INTO contexts (
        project_id,
        chat_id,
        reply_to_message_id,
        role,
        model,
        content,
        tokens_used
      )
      VALUES (
        ${projectId},
        ${chatId},
        ${userMessage[0].id},
        'assistant',
        'team-mode',
        ${`${metadata}\n\n${finalAnswer}`},
        ${Math.ceil((plan.length + execution.length + finalAnswer.length) / 4)}
      )
      RETURNING id, parent_message_id, reply_to_message_id, version_number, active_version, role, model, content, tokens_used, timestamp
    `;

    await sql`
      UPDATE chats
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${chatId}
      AND project_id = ${projectId}
    `;

    await sql`
      UPDATE projects
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `;

    maybeUpdateProjectMemory({
      projectId,
      provider: reviewingProvider,
      apiKey: reviewingCreds.apiKey,
      model: reviewingCreds.model,
      customBaseUrl: reviewingCreds.customBaseUrl,
    }).catch((error) => {
      console.error("[memory] Failed to update project memory:", error);
    });

    return NextResponse.json({
      message: "Team Mode completed successfully.",
      trace: {
        reasoning: { provider: reasoningProvider, model: reasoningCreds.model },
        execution: { provider: executionProvider, model: executionCreds.model },
        reviewing: { provider: reviewingProvider, model: reviewingCreds.model },
      },
      assistantMessage: assistantMessage[0],
    });
  } catch (error: any) {
    console.error("[team mode] Failed:", error);

    return NextResponse.json(
      { error: error?.message || "Team Mode failed." },
      { status: 500 }
    );
  }
}