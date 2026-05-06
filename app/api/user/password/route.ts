import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";
import { sql } from "@/lib/db/neon";
import { comparePassword, hashPassword } from "@/lib/auth/hash";

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword?.trim() || !newPassword?.trim()) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (newPassword.length > 128) {
    return NextResponse.json({ error: "Password must be under 128 characters." }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password must differ from current password." }, { status: 400 });
  }

  const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.userId}`;
  if (!rows.length) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const valid = await comparePassword(currentPassword, rows[0].password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const hash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${user.userId}`;

  return NextResponse.json({ message: "Password changed successfully." });
}