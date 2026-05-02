import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string; chatId: string }>;
};

const patchChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

// GET /api/projects/[id]/chats/[chatId] — fetch chat + its messages
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, chatId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });

    if (!access.role) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const chatRows = await sql`
      SELECT id, project_id, user_id, title, visibility, created_at, updated_at
      FROM chats
      WHERE id = ${chatId}
      AND project_id = ${projectId}
      LIMIT 1
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const chat = chatRows[0];

    // Non-owners can only access public chats
    if (access.role !== "owner" && chat.visibility !== "public") {
      return NextResponse.json(
        { error: "You do not have access to this private chat." },
        { status: 403 }
      );
    }

    const contexts = await sql`
  SELECT
    id,
    parent_message_id,
    reply_to_message_id,
    version_number,
    active_version,
    role,
    model,
    content,
    tokens_used,
    timestamp
  FROM contexts
  WHERE project_id = ${projectId}
  AND chat_id = ${chatId}
  ORDER BY timestamp ASC
`;

    return NextResponse.json({ chat, contexts });
  } catch (error: any) {
    console.error("[chat GET] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch chat." },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/chats/[chatId] — update title or visibility (owner only)
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, chatId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });

    if (!access.role) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (access.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can update chat settings." },
        { status: 403 }
      );
    }

    const chatRows = await sql`
      SELECT id FROM chats
      WHERE id = ${chatId}
      AND project_id = ${projectId}
      LIMIT 1
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = patchChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { title, visibility } = parsed.data;

    // Build update dynamically — only update fields that were provided
    if (title !== undefined && visibility !== undefined) {
      await sql`
        UPDATE chats
        SET title = ${title}, visibility = ${visibility}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${chatId} AND project_id = ${projectId}
      `;
    } else if (title !== undefined) {
      await sql`
        UPDATE chats
        SET title = ${title}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${chatId} AND project_id = ${projectId}
      `;
    } else if (visibility !== undefined) {
      await sql`
        UPDATE chats
        SET visibility = ${visibility}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${chatId} AND project_id = ${projectId}
      `;
    }

    const updated = await sql`
      SELECT id, project_id, user_id, title, visibility, created_at, updated_at
      FROM chats
      WHERE id = ${chatId}
      LIMIT 1
    `;

    return NextResponse.json({ chat: updated[0] });
  } catch (error: any) {
    console.error("[chat PATCH] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update chat." },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/chats/[chatId] — delete chat and all its messages
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, chatId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });

    if (!access.role) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (access.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can delete chats." },
        { status: 403 }
      );
    }

    const chatRows = await sql`
      SELECT id FROM chats
      WHERE id = ${chatId}
      AND project_id = ${projectId}
      LIMIT 1
    `;

    if (chatRows.length === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    // Delete messages first (if no ON DELETE CASCADE on the FK)
    await sql`
      DELETE FROM contexts
      WHERE chat_id = ${chatId}
      AND project_id = ${projectId}
    `;

    await sql`
      DELETE FROM chats
      WHERE id = ${chatId}
      AND project_id = ${projectId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[chat DELETE] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete chat." },
      { status: 500 }
    );
  }
}