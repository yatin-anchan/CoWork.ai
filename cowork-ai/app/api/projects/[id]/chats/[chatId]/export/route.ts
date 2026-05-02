import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";

type RouteParams = {
  params: Promise<{ id: string; chatId: string }>;
};

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, chatId } = await context.params;

    const access = await getProjectAccess({
      projectId,
      userId: user.userId,
    });

   if (!access.hasAccess) {
      return NextResponse.json(
        { error: "You do not have access." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const { includeQuestions = true, messageIds = null } = body;

    let messages;

    if (messageIds && Array.isArray(messageIds)) {
      messages = await sql`
        SELECT role, content, timestamp
        FROM contexts
        WHERE project_id = ${projectId}
        AND chat_id = ${chatId}
        AND id = ANY(${messageIds})
        ORDER BY timestamp ASC
      `;
    } else {
      messages = await sql`
        SELECT role, content, timestamp
        FROM contexts
        WHERE project_id = ${projectId}
        AND chat_id = ${chatId}
        AND active_version = true
        ORDER BY timestamp ASC
      `;
    }

    let text = "";

    for (const msg of messages) {
      if (!includeQuestions && msg.role === "user") continue;

      if (msg.role === "user") {
        text += `\n\nUSER:\n${msg.content}\n`;
      } else {
        text += `\n\nASSISTANT:\n${msg.content}\n`;
      }
    }

    return NextResponse.json({
      content: text.trim(),
    });
  } catch (error) {
    console.error("[export] Failed:", error);

    return NextResponse.json(
      { error: "Failed to export messages." },
      { status: 500 }
    );
  }
}