import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

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
  customKeyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const roles = await sql`
    SELECT id, role, provider, custom_key_id, updated_at
    FROM role_assignments
    WHERE user_id = ${user.userId}
    ORDER BY role ASC
  `;

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = roleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid role assignment payload." },
        { status: 400 }
      );
    }

    const { role, provider, customKeyId } = parsed.data;

    const saved = await sql`
      INSERT INTO role_assignments (
        user_id,
        role,
        provider,
        custom_key_id,
        updated_at
      )
      VALUES (
        ${user.userId},
        ${role},
        ${provider},
        ${customKeyId || null},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id, role)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        custom_key_id = EXCLUDED.custom_key_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, role, provider, custom_key_id, updated_at
    `;

    return NextResponse.json({
      message: "Role assignment saved successfully.",
      role: saved[0],
    });
  } catch (error) {
    console.error("Save role assignment error:", error);

    return NextResponse.json(
      { error: "Failed to save role assignment." },
      { status: 500 }
    );
  }
}