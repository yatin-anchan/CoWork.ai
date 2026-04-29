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
  if (provider === "openrouter") return "google/gemini-2.0-flash-exp:free";
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
      SELECT id
      FROM projects
      WHERE id = ${projectId}
      AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (project.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

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

    const roleAssignment = await sql`
      SELECT provider, custom_key_id
      FROM role_assignments
      WHERE user_id = ${user.userId}
      AND role = ${workType}
      LIMIT 1
    `;

    const defaultModel = getDefaultModel(workType);

    const selectedProvider =
      roleAssignment.length > 0
        ? roleAssignment[0].provider
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

    const sharedHistory: ChatMessage[] = historyRows.map((item: any) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));

    const messagesForProvider: ChatMessage[] = [
      ...sharedHistory,
      {
        role: "user",
        content,
      },
    ];

    const assistantResponse = await callAIProvider({
      provider: selectedProvider as AIProvider,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      messages: messagesForProvider,
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