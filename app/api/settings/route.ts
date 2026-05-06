import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

const DEFAULTS = {
  theme:         "dark",
  accent_color:  "#4D9FFF",
  weekly_digest: false,
};

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const rows = await sql`
    SELECT theme, accent_color, weekly_digest
    FROM user_settings
    WHERE user_id = ${authUser.userId}
    LIMIT 1
  `;

  const settings = rows.length > 0 ? rows[0] : { ...DEFAULTS };
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();

  const theme         = body.theme         ?? DEFAULTS.theme;
  const accent_color  = body.accent_color  ?? DEFAULTS.accent_color;
  const weekly_digest = body.weekly_digest ?? DEFAULTS.weekly_digest;

  // Validate accent_color is a hex color
  if (!/^#[0-9A-Fa-f]{6}$/.test(accent_color))
    return NextResponse.json({ error: "Invalid accent color." }, { status: 400 });

  // Validate theme
  if (!["dark", "light", "system"].includes(theme))
    return NextResponse.json({ error: "Invalid theme." }, { status: 400 });

  await sql`
    INSERT INTO user_settings (user_id, theme, accent_color, weekly_digest, updated_at)
    VALUES (
      ${authUser.userId},
      ${theme},
      ${accent_color},
      ${weekly_digest},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      theme         = EXCLUDED.theme,
      accent_color  = EXCLUDED.accent_color,
      weekly_digest = EXCLUDED.weekly_digest,
      updated_at    = NOW()
  `;

  return NextResponse.json({ ok: true });
}