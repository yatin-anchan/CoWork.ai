import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";
import { sql } from "@/lib/db/neon";

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, email } = await req.json();
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: "Name and email required." }, { status: 400 });
  await sql`UPDATE users SET name = ${name.trim()}, email = ${email.trim().toLowerCase()} WHERE id = ${user.userId}`;
  return NextResponse.json({ message: "Profile updated." });
}