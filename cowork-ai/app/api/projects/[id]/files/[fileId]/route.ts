import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { canEditProject, getProjectAccess } from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string; fileId: string }>;
};

export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, fileId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete files." },
        { status: 403 }
      );
    }

    const deleted = await sql`
      DELETE FROM project_files
      WHERE id = ${fileId}
      AND project_id = ${projectId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("[files DELETE] Failed:", error);
    return NextResponse.json(
      { error: "Failed to delete file." },
      { status: 500 }
    );
  }
}