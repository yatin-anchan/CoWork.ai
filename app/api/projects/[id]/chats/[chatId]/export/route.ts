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
      format = "pdf", // pdf or txt
    } = body;

    const messages = await sql`
      SELECT role, content, timestamp
      FROM contexts
      WHERE project_id = ${projectId}
      AND chat_id = ${chatId}
      AND active_version = true
      ORDER BY timestamp ASC
    `;

    let formattedText = "";

    for (const msg of messages) {
      if (!includeQuestions && msg.role === "user") continue;

      if (msg.role === "user") {
        formattedText += `\n\nUSER:\n${msg.content}\n`;
      } else {
        formattedText += `\n\nASSISTANT:\n${msg.content}\n`;
      }
    }

    // TXT fallback
    if (format === "txt") {
      return NextResponse.json({
        content: formattedText.trim(),
      });
    }

    // -------- PDF GENERATION --------
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    let y = height - 40;

    const fontSize = 10;
    const lineHeight = 14;
    const maxWidth = width - 80;

    function wrapText(text: string, maxChars = 90) {
      const words = text.split(" ");
      let lines: string[] = [];
      let current = "";

      for (const word of words) {
        if ((current + word).length > maxChars) {
          lines.push(current);
          current = word + " ";
        } else {
          current += word + " ";
        }
      }

      if (current) lines.push(current);
      return lines;
    }

    const lines = wrapText(formattedText);

    for (const line of lines) {
      if (y < 40) {
        const newPage = pdfDoc.addPage();
        y = height - 40;

        newPage.drawText(line, {
          x: 40,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });

        continue;
      }

      page.drawText(line, {
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