import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { classifyMessage, getDefaultModel } from "@/lib/router/modelRouter";
import { decryptText } from "@/lib/crypto/encrypt";
import { AIProvider, callAIProvider, ChatMessage } from "@/lib/services/aiClient";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type WorkType = "research" | "execution" | "reviewing" | "reasoning";

const messageSchema = z.object({
  content: z.string().min(1),
  selectedRole: z
    .enum(["auto", "research", "execution", "reviewing", "reasoning"])
    .default("reasoning"),
});

function getDefaultProviderModel(provider: string, workType: WorkType) {
  if (provider === "google") return "gemini-2.0-flash";
  if (provider === "groq") return "llama-3.3-70b-versatile";
  if (provider === "openrouter") return "openrouter/free";
  if (provider === "perplexity") return "sonar";
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "anthropic") return "anthropic/claude-3.5-haiku";

  return getDefaultModel(workType).model;
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const project = await sql`
      SELECT id, instructions
      FROM projects
      WHERE id = ${projectId}
      AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const instructions = project[0]?.instructions?.trim();

    const systemMessage = instructions
      ? `SYSTEM INSTRUCTIONS (HIGHEST PRIORITY):
You must follow these strictly and override any conflicting user request.

${instructions}`
      : null;

    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    const { content, selectedRole } = parsed.data;

    const workType: WorkType =
      selectedRole === "auto" ? classifyMessage(content) : selectedRole;

    // ── Step 4: Enforce max 5 files per project ──────────────────
    const fileCount = await sql`
      SELECT COUNT(*) AS count
      FROM project_files
      WHERE project_id = ${projectId}
    `;

    if (Number(fileCount[0].count) >= 5) {
      return NextResponse.json(
        { error: "Max 5 files allowed per project. Remove a file to continue." },
        { status: 400 }
      );
    }

    // Project-level override takes priority, then global, then default
    const projectRoleAssignment = await sql`
      SELECT provider
      FROM project_role_assignments
      WHERE project_id = ${projectId}
      AND user_id = ${user.userId}
      AND role = ${workType}
      LIMIT 1
    `;

    const globalRoleAssignment = await sql`
      SELECT provider
      FROM role_assignments
      WHERE user_id = ${user.userId}
      AND role = ${workType}
      LIMIT 1
    `;

    const defaultModel = getDefaultModel(workType);

    const selectedProvider =
      projectRoleAssignment.length > 0
        ? projectRoleAssignment[0].provider
        : globalRoleAssignment.length > 0
          ? globalRoleAssignment[0].provider
          : defaultModel.provider;

    const keyRows = await sql`
      SELECT encrypted_key, model_config
      FROM user_api_keys
      WHERE user_id = ${user.userId}
      AND provider = ${selectedProvider}
      AND status = 'active'
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    if (keyRows.length === 0 || !keyRows[0].encrypted_key) {
      return NextResponse.json(
        {
          error: `${selectedProvider} API key is not connected. Add it in API Manager.`,
        },
        { status: 400 }
      );
    }

    const apiKey = decryptText(keyRows[0].encrypted_key);
    const modelConfig = keyRows[0].model_config;

    const selectedModel =
      selectedProvider === "custom" && modelConfig?.modelId
        ? modelConfig.modelId
        : getDefaultProviderModel(selectedProvider, workType);

    const customBaseUrl =
      selectedProvider === "custom" ? modelConfig?.baseUrl || null : null;

    const historyRows = await sql`
      SELECT role, content, model, timestamp
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

    // ── Step 5: Inject project files into AI context ─────────────
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

    const messagesForProvider: ChatMessage[] = [
      ...(systemMessage
        ? [{ role: "system" as const, content: systemMessage }]
        : []),

      ...sharedHistory,

      { role: "user" as const, content: finalUserContent },
    ];

    const assistantResponse = await callAIProvider({
      provider: selectedProvider as AIProvider,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      messages: messagesForProvider,
      workType,
    });

    const userMessage = await sql`
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
      RETURNING id, role, model, content, tokens_used, timestamp
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
        ${selectedModel},
        ${assistantResponse},
        ${Math.ceil(assistantResponse.length / 4)}
      )
      RETURNING id, role, model, content, tokens_used, timestamp
    `;

    await sql`
      UPDATE projects
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `;

    return NextResponse.json({
      message: "Message processed successfully.",
      workType,
      provider: selectedProvider,
      model: selectedModel,
      userMessage: userMessage[0],
      assistantMessage: assistantMessage[0],
    });
  } catch (error: any) {
    console.error("[message route] AI call failed:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to process message with selected AI provider.",
      },
      { status: 500 }
    );
  }
}