import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await sql`
    UPDATE users
    SET plan = 'pro'
    WHERE id = ${user.userId}
  `;

  return NextResponse.json({
    message: "User upgraded to pro for development.",
  });
}