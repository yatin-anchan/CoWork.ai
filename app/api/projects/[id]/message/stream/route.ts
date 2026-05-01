import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { classifyMessage, getDefaultModel } from "@/lib/router/modelRouter";
import { decryptText } from "@/lib/crypto/encrypt";
import {
  AIProvider,
  ChatMessage,
  streamAIProvider,
} from "@/lib/services/aiClient";

import {
  canEditProject,
  getProjectAccess,
} from "@/lib/auth/projectAccess";

import {
  getOptimizedProjectContext,
  maybeUpdateProjectMemory,
} from "@/lib/services/memory";

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

function extractOpenAIStreamText(line: string) {
  if (!line.startsWith("data: ")) return "";

  const data = line.replace("data: ", "").trim();

  if (data === "[DONE]") return "[DONE]";

  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content || "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({
  projectId,
  userId: user.userId,
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

if (!canEditProject(access.role)) {
  return NextResponse.json(
    { error: "Viewer access cannot send messages." },
    { status: 403 }
  );
}

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

    const optimizedContext = await getOptimizedProjectContext({ projectId });

    const instructions = project[0]?.instructions?.trim();

    const systemMessage = instructions
      ? `SYSTEM INSTRUCTIONS (HIGHEST PRIORITY):
You must follow these strictly and override any conflicting user request.

${instructions}`
      : null;

    const messagesForProvider: ChatMessage[] = [
      ...(systemMessage
        ? [{ role: "system" as const, content: systemMessage }]
        : []),

      ...optimizedContext.messages,

      { role: "user", content },
    ];

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

    const providerStream = await streamAIProvider({
      provider: selectedProvider as AIProvider,
      apiKey,
      model: selectedModel,
      customBaseUrl,
      messages: messagesForProvider,
      workType,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let finalText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = providerStream.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const text = extractOpenAIStreamText(line.trim());

              if (!text) continue;
              if (text === "[DONE]") continue;

              finalText += text;
              controller.enqueue(encoder.encode(text));
            }
          }

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
              'assistant',
              ${selectedModel},
              ${finalText},
              ${Math.ceil(finalText.length / 4)}
            )
          `;

          await sql`
            UPDATE projects
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ${projectId}
          `;

          maybeUpdateProjectMemory({
            projectId,
            provider: selectedProvider as AIProvider,
            apiKey,
            model: selectedModel,
            customBaseUrl,
          }).catch((error) => {
            console.error("[memory] Failed to update project memory:", error);
          });

          controller.close();
        } catch (error) {
          console.error("[stream route] Stream failed:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[stream route] Failed:", error);

    return NextResponse.json(
      { error: error?.message || "Streaming failed." },
      { status: 500 }
    );
  }
}