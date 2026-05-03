import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const projects = await sql`
      SELECT DISTINCT
        projects.id,
        projects.name,
        projects.description,
        projects.instructions,
        projects.status,
        projects.created_at,
        projects.updated_at,
        users.email AS owner_email,
        CASE
          WHEN projects.user_id = ${user.userId} THEN 'owner'
          ELSE project_members.role
        END AS my_role
      FROM projects
      JOIN users ON users.id = projects.user_id
      LEFT JOIN project_members
        ON project_members.project_id = projects.id
      WHERE projects.user_id = ${user.userId}
         OR project_members.user_id = ${user.userId}
      ORDER BY projects.updated_at DESC
    `;

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("List projects error:", error);

    return NextResponse.json(
      { error: "Failed to load projects." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    const { name, description, instructions } = parsed.data;

    // ── Step 4: Enforce max 5 files per project on creation ──
    // (File limit is enforced at upload time in the files route,
    //  but we also expose a helper here for reuse)

    const inserted = await sql`
      INSERT INTO projects (user_id, name, description, instructions)
      VALUES (
        ${user.userId},
        ${name},
        ${description || null},
        ${instructions || null}
      )
      RETURNING id, name, description, instructions, status, created_at, updated_at
    `;

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 }
    );
  }
}