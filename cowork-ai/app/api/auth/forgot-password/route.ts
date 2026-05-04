import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    const users = await sql`
      SELECT id, email, name
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomUUID();

    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${users[0].id}, ${token}, NOW() + INTERVAL '30 minutes')
    `;

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/auth/reset-password/${token}`;

    await sendPasswordResetEmail({
      to: users[0].email,
      name: users[0].name || users[0].email,
      resetLink,
    });

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[forgot-password] Failed:", error);
    return NextResponse.json({ error: "Failed to request password reset." }, { status: 500 });
  }
}