import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { canEditProject, getProjectAccess } from "@/lib/auth/projectAccess";
import { getPlanLimits, getUserPlan } from "@/lib/billing/plan";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".html",
  ".css",
  ".xml",
  ".yaml",
  ".yml",
  ".pdf",
  ".docx",
];

function getExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  const index = lower.lastIndexOf(".");
  return index >= 0 ? lower.slice(index) : "";
}

async function extractText(file: File, extension: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (extension === ".pdf") {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(arrayBuffer));
    return Array.isArray(text) ? text.join('\n') : text;
  }

  if (extension === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  return buffer.toString("utf-8");
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const files = await sql`
      SELECT
        project_files.id,
        project_files.chat_id,
        project_files.file_name,
        project_files.file_type,
        project_files.created_at,
        chats.title AS chat_title
      FROM project_files
      LEFT JOIN chats ON chats.id = project_files.chat_id
      WHERE project_files.project_id = ${projectId}
      ORDER BY project_files.created_at DESC
    `;

    return NextResponse.json({ files });
  } catch (error) {
    console.error("[files GET] Failed:", error);
    return NextResponse.json(
      { error: "Failed to load files." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

    if (!canEditProject(access.role)) {
      return NextResponse.json(
        { error: "You do not have permission to upload files." },
        { status: 403 }
      );
    }

    const plan = await getUserPlan(user.userId);
    const limits = getPlanLimits(plan);

    const existing = await sql`
      SELECT COUNT(*)::int AS count
      FROM project_files
      WHERE project_id = ${projectId}
    `;

    if (Number(existing[0]?.count || 0) >= limits.maxFilesPerProject) {
      return NextResponse.json(
        {
          error:
            plan === "pro"
              ? "Maximum 30 files allowed per project."
              : "Free plan allows up to 5 files per project. Upgrade to Pro for 30 files.",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const chatId = formData.get("chatId");
    const normalizedChatId =
      typeof chatId === "string" && chatId.length > 0 ? chatId : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be 5MB or smaller." },
        { status: 400 }
      );
    }

    const extension = getExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 }
      );
    }

    const content = (await extractText(file, extension)).trim();

    if (!content) {
      return NextResponse.json(
        { error: "Could not extract readable text from this file." },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO project_files (
        project_id,
        chat_id,
        user_id,
        file_name,
        file_type,
        content
      )
      VALUES (
        ${projectId},
        ${normalizedChatId},
        ${user.userId},
        ${file.name},
        ${extension},
        ${content.slice(0, 50000)}
      )
      RETURNING id, chat_id, file_name, file_type, created_at
    `;

    return NextResponse.json(
      {
        message: "File uploaded successfully.",
        file: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[files POST] Failed:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}