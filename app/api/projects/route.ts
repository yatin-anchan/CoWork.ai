import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const projects = await sql`
    SELECT id, name, description, status, created_at, updated_at
    FROM projects
    WHERE user_id = ${user.userId}
    ORDER BY updated_at DESC
  `;

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    const inserted = await sql`
      INSERT INTO projects (user_id, name, description)
      VALUES (${user.userId}, ${name}, ${description || null})
      RETURNING id, name, description, status, created_at, updated_at
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