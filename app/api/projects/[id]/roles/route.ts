import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const roleSchema = z.object({
  role: z.enum(["research", "execution", "reviewing", "reasoning"]),
  provider: z.enum([
    "google",
    "groq",
    "openrouter",
    "anthropic",
    "openai",
    "perplexity",
    "custom",
  ]),
});

export async function GET(req: NextRequest, context: RouteParams) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const roles = await sql`
    SELECT role, provider, updated_at
    FROM project_role_assignments
    WHERE project_id = ${projectId}
    AND user_id = ${user.userId}
  `;

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest, context: RouteParams) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const body = await req.json();
  const parsed = roleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project role assignment." },
      { status: 400 }
    );
  }

  const { role, provider } = parsed.data;

  const saved = await sql`
    INSERT INTO project_role_assignments (
      project_id,
      user_id,
      role,
      provider,
      updated_at
    )
    VALUES (
      ${projectId},
      ${user.userId},
      ${role},
      ${provider},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (project_id, user_id, role)
    DO UPDATE SET
      provider = EXCLUDED.provider,
      updated_at = CURRENT_TIMESTAMP
    RETURNING role, provider, updated_at
  `;

  return NextResponse.json({
    message: "Project role assignment saved.",
    role: saved[0],
  });
}