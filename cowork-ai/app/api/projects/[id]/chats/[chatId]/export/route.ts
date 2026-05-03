import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

    const {
      includeQuestions = true,
      format = "pdf",
      messageIds = null,
    } = body;

    const hasSelectedMessages =
      Array.isArray(messageIds) && messageIds.length > 0;

    const messages = hasSelectedMessages
      ? includeQuestions
        ? await sql`
    WITH selected_messages AS (
      SELECT id, role, reply_to_message_id, timestamp
      FROM contexts
      WHERE project_id = ${projectId}
      AND chat_id = ${chatId}
      AND id = ANY(${messageIds})
    ),
    direct_parent_questions AS (
      SELECT reply_to_message_id AS id
      FROM selected_messages
      WHERE role = 'assistant'
      AND reply_to_message_id IS NOT NULL
    ),
    fallback_parent_questions AS (
      SELECT DISTINCT ON (selected_messages.id)
        previous_user.id
      FROM selected_messages
      JOIN LATERAL (
        SELECT contexts.id
        FROM contexts
        WHERE contexts.project_id = ${projectId}
        AND contexts.chat_id = ${chatId}
        AND contexts.role = 'user'
        AND contexts.timestamp < selected_messages.timestamp
        ORDER BY contexts.timestamp DESC
        LIMIT 1
      ) previous_user ON true
      WHERE selected_messages.role = 'assistant'
      AND selected_messages.reply_to_message_id IS NULL
    ),
    export_ids AS (
      SELECT id FROM selected_messages
      UNION
      SELECT id FROM direct_parent_questions
      UNION
      SELECT id FROM fallback_parent_questions
    )
    SELECT DISTINCT
      contexts.id,
      contexts.role,
      contexts.content,
      contexts.timestamp
    FROM contexts
    JOIN export_ids ON export_ids.id = contexts.id
    WHERE contexts.project_id = ${projectId}
    AND contexts.chat_id = ${chatId}
    ORDER BY contexts.timestamp ASC
  `
        : await sql`
            SELECT id, role, content, timestamp
            FROM contexts
            WHERE project_id = ${projectId}
            AND chat_id = ${chatId}
            AND id = ANY(${messageIds})
            ORDER BY timestamp ASC
          `
      : await sql`
          SELECT id, role, content, timestamp
          FROM contexts
          WHERE project_id = ${projectId}
          AND chat_id = ${chatId}
          AND active_version = true
          ORDER BY timestamp ASC
        `;

    let formattedText = "";

    for (const msg of messages) {
      if (!includeQuestions && msg.role === "user") continue;

      formattedText += `\n\n${String(msg.role).toUpperCase()}:\n${msg.content}\n`;
    }

    formattedText = formattedText.trim();

    if (format === "txt") {
      return NextResponse.json({
        content: formattedText,
      });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    let y = height - 40;

    const fontSize = 10;
    const lineHeight = 14;

    function wrapText(text: string, maxChars = 90) {
      const lines: string[] = [];

      for (const paragraph of text.split("\n")) {
        if (!paragraph.trim()) {
          lines.push("");
          continue;
        }

        const words = paragraph.split(" ");
        let current = "";

        for (const word of words) {
          if ((current + word).length > maxChars) {
            lines.push(current.trim());
            current = `${word} `;
          } else {
            current += `${word} `;
          }
        }

        if (current.trim()) {
          lines.push(current.trim());
        }
      }

      return lines;
    }

    const lines = wrapText(formattedText);

    for (const line of lines) {
      if (y < 40) {
        page = pdfDoc.addPage();
        y = height - 40;
      }

      page.drawText(line || " ", {
        x: 40,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="chat-export.pdf"`,
      },
    });
  } catch (error) {
    console.error("[export] Failed:", error);

    return NextResponse.json(
      { error: "Failed to export messages." },
      { status: 500 }
    );
  }
}