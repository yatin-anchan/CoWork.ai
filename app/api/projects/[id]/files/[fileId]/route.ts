import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { canEditProject, getProjectAccess } from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string; fileId: string }>;
};

const updateFileSchema = z.object({
  fileName: z.string().min(1).max(255),
});

export async function PATCH(req: NextRequest, context: RouteParams) {
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
        { error: "You do not have permission to rename files." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateFileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid file name is required." },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE project_files
      SET file_name = ${parsed.data.fileName}
      WHERE id = ${fileId}
      AND project_id = ${projectId}
      RETURNING id, file_name, file_type, created_at
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "File renamed successfully.",
      file: updated[0],
    });
  } catch (error) {
    console.error("[files PATCH] Failed:", error);
    return NextResponse.json(
      { error: "Failed to rename file." },
      { status: 500 }
    );
  }
}

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