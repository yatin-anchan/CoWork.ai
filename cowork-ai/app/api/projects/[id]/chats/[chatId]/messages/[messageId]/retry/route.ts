import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import {
  canEditProject,
  getProjectAccess,
} from "@/lib/auth/projectAccess";
import { decryptText } from "@/lib/crypto/encrypt";
import {
  AIProvider,
  ChatMessage,
  callAIProvider,
} from "@/lib/services/aiClient";
import { getDefaultModel } from "@/lib/router/modelRouter";

type RouteParams = {
  params: Promise<{
    id: string;
    chatId: string;
    messageId: string;
  }>;
};

type WorkType = "research" | "execution" | "reviewing" | "reasoning";

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

    const { id: projectId, chatId, messageId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json(
        { error: "You do not have permission to retry messages." },
        { status: 403 }
      );
    }

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

    const assistantRows = await sql`
      SELECT id, parent_message_id, role, model
      FROM contexts
      WHERE id = ${messageId}
      AND project_id = ${projectId}
      AND chat_id = ${chatId}
      LIMIT 1
    `;

    if (assistantRows.length === 0) {
      return NextResponse.json(
        { error: "Assistant message not found." },
        { status: 404 }
      );
    }

    const assistantMessage = assistantRows[0];

    if (assistantMessage.role !== "assistant") {
      return NextResponse.json(
        { error: "Only assistant messages can be retried." },
        { status: 400 }
      );
    }

    const assistantGroupId =
      assistantMessage.parent_message_id || assistantMessage.id;

    const previousUserRows = await sql`
      SELECT id, parent_message_id, content
      FROM contexts
      WHERE project_id = ${projectId}
      AND chat_id = ${chatId}
      AND role = 'user'
      AND timestamp < (
        SELECT timestamp
        FROM contexts
        WHERE id = ${messageId}
        LIMIT 1
      )
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    if (previousUserRows.length === 0) {
      return NextResponse.json(
        { error: "Previous user message not found." },
        { status: 404 }
      );
    }

    const userPrompt = previousUserRows[0].content;

    const projectRows = await sql`
      SELECT instructions
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `;

    const instructions = projectRows[0]?.instructions?.trim();

    const systemMessage = instructions
      ? `SYSTEM INSTRUCTIONS (HIGHEST PRIORITY):
You must follow these strictly and override any conflicting user request.

${instructions}`
      : null;

    const workType: WorkType = "reasoning";

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
        { error: `${selectedProvider} API key is not connected.` },
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
      SELECT role, content
      FROM contexts
      WHERE project_id = ${projectId}
      AND chat_id = ${chatId}
      AND active_version = true
      ORDER BY timestamp ASC
    `;

    const history: ChatMessage[] = historyRows.map((item: any) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));

    const messages: ChatMessage[] = [
      ...(systemMessage
        ? [{ role: "system" as const, content: systemMessage }]
        : []),
      ...history,
      { role: "user", content: userPrompt },
    ];

    const response = await callAIProvider({
      provider: selectedProvider as AIProvider,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      workType,
      messages,
    });

    const versionRows = await sql`
      SELECT COALESCE(MAX(version_number), 1)::int AS max_version
      FROM contexts
      WHERE id = ${assistantGroupId}
      OR parent_message_id = ${assistantGroupId}
    `;

    const nextVersion = Number(versionRows[0]?.max_version || 1) + 1;

    await sql`
      UPDATE contexts
      SET active_version = false
      WHERE id = ${assistantGroupId}
      OR parent_message_id = ${assistantGroupId}
    `;

    const inserted = await sql`
      INSERT INTO contexts (
        project_id,
        chat_id,
        parent_message_id,
        version_number,
        active_version,
        role,
        model,
        content,
        tokens_used
      )
      VALUES (
        ${projectId},
        ${chatId},
        ${assistantGroupId},
        ${nextVersion},
        true,
        'assistant',
        ${selectedModel},
        ${response},
        ${Math.ceil(response.length / 4)}
      )
      RETURNING id, parent_message_id, version_number, active_version, role, model, content, tokens_used, timestamp
    `;

    await sql`
      UPDATE chats
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${chatId}
    `;

    await sql`
      UPDATE projects
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `;

    return NextResponse.json({
      message: "Message retried successfully.",
      assistantMessage: inserted[0],
    });
  } catch (error: any) {
    console.error("[retry message] Failed:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to retry message." },
      { status: 500 }
    );
  }
}