import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    await sql`
      UPDATE users
      SET onboarding_completed = true
      WHERE id = ${payload.userId}
    `;

    return NextResponse.json({ message: "Onboarding skipped." }, { status: 200 });
  } catch (error) {
    console.error("[onboarding/skip]", error);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}