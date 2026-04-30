import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { decryptText } from "@/lib/crypto/encrypt";
import {
  AIProvider,
  ChatMessage,
  callAIProvider,
} from "@/lib/services/aiClient";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type WorkType = "research" | "execution" | "reviewing" | "reasoning";

const teamSchema = z.object({
  content: z.string().min(1),
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

async function getUserPlan(userId: string) {
  const rows = await sql`
    SELECT plan
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows[0]?.plan || "free";
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

  return {
    apiKey,
    model,
    customBaseUrl,
  };
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const userPlan = await getUserPlan(authUser.userId);

    if (userPlan === "free") {
      return NextResponse.json(
        {
          error:
            "Team Mode is a premium feature. Upgrade to Pro to use multi-model collaboration.",
        },
        { status: 403 }
      );
    }

    const project = await sql`
      SELECT id, instructions
      FROM projects
      WHERE id = ${projectId}
      AND user_id = ${authUser.userId}
      LIMIT 1
    `;

    const instructions = project[0]?.instructions?.trim();

    const systemMessage = instructions
      ? `SYSTEM INSTRUCTIONS (HIGHEST PRIORITY):
You must follow these strictly and override any conflicting user request.

${instructions}`
      : null;

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = teamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    const historyRows = await sql`
      SELECT role, content
      FROM contexts
      WHERE project_id = ${projectId}
      ORDER BY timestamp ASC
    `;

    const MAX_HISTORY = 10;

const trimmedHistory = historyRows.slice(-MAX_HISTORY);

const sharedHistory: ChatMessage[] = trimmedHistory.map((item: any) => ({
  role: item.role === "assistant" ? "assistant" : "user",
  content: item.content,
}));

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
        ...(systemMessage
          ? [{ role: "system", content: systemMessage }]
          : []),

        ...sharedHistory,

        {
          role: "user",
          content: `
Create a concise execution plan for this request.

User request:
${content}
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
        ...(systemMessage
          ? [{ role: "system", content: systemMessage }]
          : []),

        ...sharedHistory,

        {
          role: "user",
          content: `
Use this plan to produce the best possible answer.

Original user request:
${content}

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
        ...(systemMessage
          ? [{ role: "system", content: systemMessage }]
          : []),

        ...sharedHistory,

        {
          role: "user",
          content: `
Review and improve this answer. Return only the final polished response.
Do not mention the internal review process.

Original user request:
${content}

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

    await sql`
      INSERT INTO contexts (
        project_id,
        role,
        model,
        content,
        tokens_used
      )
      VALUES (
        ${projectId},
        'user',
        null,
        ${content},
        ${Math.ceil(content.length / 4)}
      )
    `;

    const assistantMessage = await sql`
      INSERT INTO contexts (
        project_id,
        role,
        model,
        content,
        tokens_used
      )
      VALUES (
        ${projectId},
        'assistant',
        'team-mode',
        ${`${metadata}\n\n${finalAnswer}`},
        ${Math.ceil((plan.length + execution.length + finalAnswer.length) / 4)}
      )
      RETURNING id, role, model, content, tokens_used, timestamp
    `;

    await sql`
      UPDATE projects
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `;

    return NextResponse.json({
      message: "Team Mode completed successfully.",
      trace: {
        reasoning: {
          provider: reasoningProvider,
          model: reasoningCreds.model,
        },
        execution: {
          provider: executionProvider,
          model: executionCreds.model,
        },
        reviewing: {
          provider: reviewingProvider,
          model: reviewingCreds.model,
        },
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