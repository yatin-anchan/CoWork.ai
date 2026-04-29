import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { classifyMessage, getDefaultModel } from "@/lib/router/modelRouter";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const messageSchema = z.object({
  content: z.string().min(1),
  selectedRole: z
    .enum(["auto", "research", "execution", "reviewing", "reasoning"])
    .default("auto"),
});

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: projectId } = await context.params;

    const project = await sql`
      SELECT id FROM projects
      WHERE id = ${projectId}
      AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
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

    const workType =
      selectedRole === "auto" ? classifyMessage(content) : selectedRole;

    const roleAssignment = await sql`
  SELECT provider
  FROM role_assignments
  WHERE user_id = ${user.userId}
  AND role = ${workType}
  LIMIT 1
`;

const selectedModel =
  roleAssignment.length > 0
    ? {
        provider: roleAssignment[0].provider,
        model: `${roleAssignment[0].provider}-default`,
      }
    : getDefaultModel(workType);

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

    const mockResponse = `Mock ${workType} response from ${selectedModel.provider}/${selectedModel.model}.\n\nYou said: ${content}`;

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
        ${selectedModel.model},
        ${mockResponse},
        ${Math.ceil(mockResponse.length / 4)}
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
      model: selectedModel,
      userMessage: userMessage[0],
      assistantMessage: assistantMessage[0],
    });
  } catch (error) {
    console.error("Message route error:", error);

    return NextResponse.json(
      { error: "Failed to process message." },
      { status: 500 }
    );
  }
}