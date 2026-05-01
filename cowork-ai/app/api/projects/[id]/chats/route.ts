import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
});

// GET /api/projects/[id]/chats — list all chats the user can see
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });

    if (!access.role) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Owners and editors see all chats; viewers only see public chats
    const chats =
      access.role === "owner"
        ? await sql`
            SELECT id, project_id, user_id, title, visibility, created_at, updated_at
            FROM chats
            WHERE project_id = ${projectId}
            ORDER BY updated_at DESC
          `
        : await sql`
            SELECT id, project_id, user_id, title, visibility, created_at, updated_at
            FROM chats
            WHERE project_id = ${projectId}
            AND visibility = 'public'
            ORDER BY updated_at DESC
          `;

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error("[chats GET] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch chats." },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/chats — create a new chat (auto-name if no title given)
export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });

    if (!access.role) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (access.role === "viewer") {
      return NextResponse.json(
        { error: "Viewers cannot create chats." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { visibility } = parsed.data;

    // Auto-name: "Chat N" based on how many chats already exist in this project
    const countRows = await sql`
      SELECT COUNT(*) AS count
      FROM chats
      WHERE project_id = ${projectId}
    `;

    const chatNumber = Number(countRows[0]?.count ?? 0) + 1;
    const title = parsed.data.title?.trim() || `Chat ${chatNumber}`;

    const rows = await sql`
      INSERT INTO chats (project_id, user_id, title, visibility)
      VALUES (${projectId}, ${user.userId}, ${title}, ${visibility})
      RETURNING id, project_id, user_id, title, visibility, created_at, updated_at
    `;

    return NextResponse.json({ chat: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[chats POST] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create chat." },
      { status: 500 }
    );
  }
}