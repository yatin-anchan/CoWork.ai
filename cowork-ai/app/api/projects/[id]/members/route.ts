import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import {
  canManageMembers,
  getProjectAccess,
} from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("viewer"),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(req: NextRequest, context: RouteParams) {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const access = await getProjectAccess({
    projectId,
    userId: authUser.userId,
  });

  if (!access.hasAccess) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const owner = await sql`
    SELECT id, email, 'owner' AS role, created_at
    FROM users
    WHERE id = (
      SELECT user_id FROM projects WHERE id = ${projectId}
    )
  `;

  const members = await sql`
    SELECT users.id, users.email, project_members.role, project_members.created_at
    FROM project_members
    JOIN users ON users.id = project_members.user_id
    WHERE project_members.project_id = ${projectId}
    ORDER BY project_members.created_at ASC
  `;

  return NextResponse.json({
    members: [...owner, ...members],
    myRole: access.role,
  });
}

export async function POST(req: NextRequest, context: RouteParams) {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const access = await getProjectAccess({
    projectId,
    userId: authUser.userId,
  });

  if (!canManageMembers(access.role)) {
    return NextResponse.json(
      { error: "Only the project owner can invite members." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid email and role are required." },
      { status: 400 }
    );
  }

  const invitedUser = await sql`
    SELECT id, email
    FROM users
    WHERE email = ${parsed.data.email}
    LIMIT 1
  `;

  if (invitedUser.length === 0) {
    return NextResponse.json(
      { error: "User must register before being invited." },
      { status: 404 }
    );
  }

  const project = await sql`
    SELECT user_id
    FROM projects
    WHERE id = ${projectId}
    LIMIT 1
  `;

  if (project.length === 0) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (project[0].user_id === invitedUser[0].id) {
    return NextResponse.json(
      { error: "Owner is already a project member." },
      { status: 400 }
    );
  }

  const member = await sql`
    INSERT INTO project_members (
      project_id,
      user_id,
      role
    )
    VALUES (
      ${projectId},
      ${invitedUser[0].id},
      ${parsed.data.role}
    )
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET role = EXCLUDED.role
    RETURNING project_id, user_id, role, created_at
  `;

  return NextResponse.json({
    message: "Member added successfully.",
    member: {
      userId: member[0].user_id,
      email: invitedUser[0].email,
      role: member[0].role,
      created_at: member[0].created_at,
    },
  });
}

export async function DELETE(req: NextRequest, context: RouteParams) {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const access = await getProjectAccess({
    projectId,
    userId: authUser.userId,
  });

  if (!canManageMembers(access.role)) {
    return NextResponse.json(
      { error: "Only the project owner can remove members." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid user id is required." },
      { status: 400 }
    );
  }

  await sql`
    DELETE FROM project_members
    WHERE project_id = ${projectId}
    AND user_id = ${parsed.data.userId}
  `;

  return NextResponse.json({
    message: "Member removed successfully.",
  });
}