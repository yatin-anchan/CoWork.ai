import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const users = await sql`
    SELECT id, email, plan, created_at
    FROM users
    WHERE id = ${authUser.userId}
    LIMIT 1
  `;

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      userId: users[0].id,
      email: users[0].email,
      plan: users[0].plan,
      created_at: users[0].created_at,
    },
  });
}