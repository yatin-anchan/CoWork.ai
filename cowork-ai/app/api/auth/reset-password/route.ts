import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db/neon";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid token and password are required." },
        { status: 400 }
      );
    }

    const resetRows = await sql`
      SELECT id, user_id
      FROM password_resets
      WHERE token = ${parsed.data.token}
        AND expires_at > NOW()
        AND used = false
      LIMIT 1
    `;

    if (resetRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE id = ${resetRows[0].user_id}
    `;

    await sql`
      UPDATE password_resets
      SET used = true
      WHERE id = ${resetRows[0].id}
    `;

    return NextResponse.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("[reset-password] Failed:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}