import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await context.params;

    const inviteRows = await sql`
      SELECT *
      FROM project_invites
      WHERE token = ${token}
      AND accepted = false
      LIMIT 1
    `;

    if (inviteRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    const invite = inviteRows[0];

    // Add to project_members
    await sql`
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (${invite.project_id}, ${user.userId}, ${invite.role})
      ON CONFLICT DO NOTHING
    `;

    // Mark invite accepted
    await sql`
      UPDATE project_invites
      SET accepted = true
      WHERE id = ${invite.id}
    `;

    return NextResponse.json({
      message: "Joined project successfully",
      projectId: invite.project_id,
    });
  } catch (err) {
    console.error("[accept invite] error:", err);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}