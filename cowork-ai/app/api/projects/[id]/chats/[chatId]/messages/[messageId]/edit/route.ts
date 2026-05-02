import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { canEditProject, getProjectAccess } from "@/lib/auth/projectAccess";
import { decryptText } from "@/lib/crypto/encrypt";
import { getDefaultModel } from "@/lib/router/modelRouter";
import { AIProvider, callAIProvider, ChatMessage } from "@/lib/services/aiClient";

type RouteParams = {
  params: Promise<{
    id: string;
    chatId: string;
    messageId: string;
  }>;
};

type WorkType = "research" | "execution" | "reviewing" | "reasoning";

const editSchema = z.object({
  content: z.string().min(1),
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

    const { id: projectId, chatId, messageId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json(
        { error: "You do not have permission to edit messages." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Edited content is required." },
        { status: 400 }
      );
    }

    const originalRows = await sql`
      SELECT id, parent_message_id, role
      FROM contexts
      WHERE id = ${messageId}
      AND project_id = ${projectId}
      AND chat_id = ${chatId}
      LIMIT 1
    `;

    if (originalRows.length === 0) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const original = originalRows[0];

    if (original.role !== "user") {
      return NextResponse.json(
        { error: "Only user messages can be edited." },
        { status: 400 }
      );
    }

    const userGroupId = original.parent_message_id || original.id;

    const versionRows = await sql`
      SELECT COALESCE(MAX(version_number), 1)::int AS max_version
      FROM contexts
      WHERE id = ${userGroupId}
      OR parent_message_id = ${userGroupId}
    `;

    const nextVersion = Number(versionRows[0]?.max_version || 1) + 1;

    await sql`
      UPDATE contexts
      SET active_version = false
      WHERE id = ${userGroupId}
      OR parent_message_id = ${userGroupId}
    `;

    const newUserMessage = await sql`
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
        ${userGroupId},
        ${nextVersion},
        true,
        'user',
        null,
        ${parsed.data.content},
        ${Math.ceil(parsed.data.content.length / 4)}
      )
      RETURNING id, parent_message_id, reply_to_message_id, version_number, active_version, role, model, content, tokens_used, timestamp
    `;

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
    ];

    const assistantResponse = await callAIProvider({
      provider: selectedProvider as AIProvider,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      workType,
      messages,
    });

    const previousAssistantRows = await sql`
      SELECT id, parent_message_id
      FROM contexts
      WHERE project_id = ${projectId}
      AND chat_id = ${chatId}
      AND role = 'assistant'
      AND timestamp > (
        SELECT timestamp FROM contexts WHERE id = ${messageId} LIMIT 1
      )
      ORDER BY timestamp ASC
      LIMIT 1
    `;

    const assistantGroupId =
      previousAssistantRows[0]?.parent_message_id ||
      previousAssistantRows[0]?.id ||
      null;

    if (assistantGroupId) {
      await sql`
        UPDATE contexts
        SET active_version = false
        WHERE id = ${assistantGroupId}
        OR parent_message_id = ${assistantGroupId}
      `;
    }

    const assistantVersionRows = assistantGroupId
      ? await sql`
          SELECT COALESCE(MAX(version_number), 1)::int AS max_version
          FROM contexts
          WHERE id = ${assistantGroupId}
          OR parent_message_id = ${assistantGroupId}
        `
      : [{ max_version: 0 }];

    const assistantNextVersion =
      Number(assistantVersionRows[0]?.max_version || 0) + 1;

    const newAssistantMessage = await sql`
      INSERT INTO contexts (
        project_id,
        chat_id,
        parent_message_id,
        reply_to_message_id,
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
        ${newUserMessage[0].id},
        ${assistantNextVersion},
        true,
        'assistant',
        ${selectedModel},
        ${assistantResponse},
        ${Math.ceil(assistantResponse.length / 4)}
      )
      RETURNING id, parent_message_id, reply_to_message_id, version_number, active_version, role, model, content, tokens_used, timestamp
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
      message: "Message edited successfully.",
      userMessage: newUserMessage[0],
      assistantMessage: newAssistantMessage[0],
    });
  } catch (error: any) {
    console.error("[edit message] Failed:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to edit message." },
      { status: 500 }
    );
  }
}