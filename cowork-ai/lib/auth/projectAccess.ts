import { sql } from "@/lib/db/neon";

export type ProjectRole = "owner" | "editor" | "viewer";

export async function getProjectAccess({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const ownerRows = await sql`
    SELECT id
    FROM projects
    WHERE id = ${projectId}
    AND user_id = ${userId}
    LIMIT 1
  `;

  if (ownerRows.length > 0) {
    return {
      hasAccess: true,
      role: "owner" as ProjectRole,
    };
  }

  const memberRows = await sql`
    SELECT role
    FROM project_members
    WHERE project_id = ${projectId}
    AND user_id = ${userId}
    LIMIT 1
  `;

  if (memberRows.length === 0) {
    return {
      hasAccess: false,
      role: null,
    };
  }

  return {
    hasAccess: true,
    role: memberRows[0].role as ProjectRole,
  };
}

export function canEditProject(role: ProjectRole | null) {
  return role === "owner" || role === "editor";
}

export function canManageMembers(role: ProjectRole | null) {
  return role === "owner";
}