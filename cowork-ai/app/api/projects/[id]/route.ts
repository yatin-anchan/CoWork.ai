import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;

    const projects = await sql`
      SELECT id, name, description, status, created_at, updated_at
      FROM projects
      WHERE id = ${id}
      AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (projects.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const contexts = await sql`
      SELECT id, role, model, content, tokens_used, timestamp
      FROM contexts
      WHERE project_id = ${id}
      ORDER BY timestamp ASC
    `;

    return NextResponse.json({
      project: projects[0],
      contexts,
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Failed to load project." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;

    const deleted = await sql`
      DELETE FROM projects
      WHERE id = ${id}
      AND user_id = ${user.userId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project." },
      { status: 500 }
    );
  }
}