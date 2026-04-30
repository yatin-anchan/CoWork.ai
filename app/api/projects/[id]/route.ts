import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;

    const projects = await sql`
      SELECT id, name, description, instructions, status, created_at, updated_at
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

export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project update payload." },
        { status: 400 }
      );
    }

    const current = await sql`
      SELECT id, name, description, instructions
      FROM projects
      WHERE id = ${id}
      AND user_id = ${user.userId}
      LIMIT 1
    `;

    if (current.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const updatedName = parsed.data.name ?? current[0].name;
    const updatedDescription =
      parsed.data.description !== undefined
        ? parsed.data.description
        : current[0].description;

    const updatedInstructions =
      parsed.data.instructions !== undefined
        ? parsed.data.instructions
        : current[0].instructions;

    const updated = await sql`
      UPDATE projects
      SET name = ${updatedName},
          description = ${updatedDescription || null},
          instructions = ${updatedInstructions || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      AND user_id = ${user.userId}
      RETURNING id, name, description, instructions, status, created_at, updated_at
    `;

    return NextResponse.json({
      message: "Project updated successfully.",
      project: updated[0],
    });
  } catch (error) {
    console.error("Update project error:", error);

    return NextResponse.json(
      { error: "Failed to update project." },
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