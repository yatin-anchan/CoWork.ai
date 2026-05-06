import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";
import { sql } from "@/lib/db/neon";

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length > 100) {
    return NextResponse.json({ error: "Name must be under 100 characters." }, { status: 400 });
  }

  // Check if email is taken by another user
  const existing = await sql`
    SELECT id FROM users WHERE email = ${trimmedEmail} AND id != ${user.userId}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
  }

  await sql`
    UPDATE users
    SET name = ${trimmedName}, email = ${trimmedEmail}, updated_at = NOW()
    WHERE id = ${user.userId}
  `;

  return NextResponse.json({ message: "Profile updated successfully." });
}