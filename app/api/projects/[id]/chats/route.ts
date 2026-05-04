import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";
import { getUserPlan, getPlanLimits } from "@/lib/billing/plan";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
});

// GET /api/projects/[id]/chats?activeChatId=<uuid>
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

    const activeChatId = req.nextUrl.searchParams.get("activeChatId") || null;

    let chats;

    if (activeChatId) {
      if (access.role === "owner") {
        chats = await sql`
          SELECT
            c.id, c.project_id, c.user_id, c.title, c.visibility,
            c.created_at, c.updated_at,
            u.email AS creator_email,
            pm.role  AS creator_role
          FROM chats c
          LEFT JOIN users u  ON u.id = c.user_id
          LEFT JOIN project_members pm
            ON pm.project_id = c.project_id AND pm.user_id = c.user_id
          WHERE c.project_id = ${projectId}
          AND (
            c.id = ${activeChatId}
            OR EXISTS (SELECT 1 FROM contexts WHERE contexts.chat_id = c.id)
          )
          ORDER BY c.updated_at DESC
        `;
      } else {
        chats = await sql`
          SELECT
            c.id, c.project_id, c.user_id, c.title, c.visibility,
            c.created_at, c.updated_at,
            u.email AS creator_email,
            pm.role  AS creator_role
          FROM chats c
          LEFT JOIN users u  ON u.id = c.user_id
          LEFT JOIN project_members pm
            ON pm.project_id = c.project_id AND pm.user_id = c.user_id
          WHERE c.project_id = ${projectId}
          AND c.visibility = 'public'
          AND (
            c.id = ${activeChatId}
            OR EXISTS (SELECT 1 FROM contexts WHERE contexts.chat_id = c.id)
          )
          ORDER BY c.updated_at DESC
        `;
      }
    } else {
      if (access.role === "owner") {
        chats = await sql`
          SELECT
            c.id, c.project_id, c.user_id, c.title, c.visibility,
            c.created_at, c.updated_at,
            u.email AS creator_email,
            pm.role  AS creator_role
          FROM chats c
          LEFT JOIN users u  ON u.id = c.user_id
          LEFT JOIN project_members pm
            ON pm.project_id = c.project_id AND pm.user_id = c.user_id
          WHERE c.project_id = ${projectId}
          AND EXISTS (SELECT 1 FROM contexts WHERE contexts.chat_id = c.id)
          ORDER BY c.updated_at DESC
        `;
      } else {
        chats = await sql`
          SELECT
            c.id, c.project_id, c.user_id, c.title, c.visibility,
            c.created_at, c.updated_at,
            u.email AS creator_email,
            pm.role  AS creator_role
          FROM chats c
          LEFT JOIN users u  ON u.id = c.user_id
          LEFT JOIN project_members pm
            ON pm.project_id = c.project_id AND pm.user_id = c.user_id
          WHERE c.project_id = ${projectId}
          AND c.visibility = 'public'
          AND EXISTS (SELECT 1 FROM contexts WHERE contexts.chat_id = c.id)
          ORDER BY c.updated_at DESC
        `;
      }
    }

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error("[chats GET] Failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch chats." },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/chats — create a new chat
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

    // Enforce private chats as Pro only
    if (visibility === "private") {
      const plan = await getUserPlan(user.userId);
      const limits = getPlanLimits(plan);

      if (!limits.canUsePrivateChats) {
        return NextResponse.json(
          { error: "Private chats are a Pro feature. Upgrade to Pro to use them." },
          { status: 403 }
        );
      }
    }

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