import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { canEditProject, getProjectAccess } from "@/lib/auth/projectAccess";
import { sendInviteEmail } from "@/lib/email/resend";
import crypto from "crypto";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = "viewer" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Fetch project name and inviter email for the email copy
    const [projectRow, inviterRow] = await Promise.all([
      sql`SELECT name FROM projects WHERE id = ${projectId} LIMIT 1`,
      sql`SELECT email FROM users WHERE id = ${user.userId} LIMIT 1`,
    ]);

    const projectName = projectRow[0]?.name ?? "a project";
    const inviterEmail = inviterRow[0]?.email ?? "A teammate";

    const token = crypto.randomUUID();

    const invite = await sql`
      INSERT INTO project_invites (
        project_id,
        email,
        role,
        token,
        invited_by
      )
      VALUES (
        ${projectId},
        ${email.toLowerCase()},
        ${role},
        ${token},
        ${user.userId}
      )
      RETURNING id, email, role, token
    `;

    await sendInviteEmail({
      to: email.toLowerCase(),
      inviterEmail,
      projectName,
      role,
      token: invite[0].token,
    });

    return NextResponse.json({
      message: "Invite created",
      invite: invite[0],
    });
  } catch (err) {
    console.error("[invite] error:", err);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}