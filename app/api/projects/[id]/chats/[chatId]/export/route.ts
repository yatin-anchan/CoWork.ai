import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { getProjectAccess } from "@/lib/auth/projectAccess";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
} from "pdf-lib";

type RouteParams = {
  params: Promise<{ id: string; chatId: string }>;
};

// ── Layout constants ──────────────────────────────────────────────
const PAGE_WIDTH  = 595;   // A4
const PAGE_HEIGHT = 842;
const MARGIN_X    = 48;
const MARGIN_TOP  = 48;
const MARGIN_BOT  = 48;
const CONTENT_W   = PAGE_WIDTH - MARGIN_X * 2;

const FONT_SIZE_BODY   = 10;
const FONT_SIZE_ROLE   = 10;
const FONT_SIZE_HEADER = 11;
const FONT_SIZE_TITLE  = 16;

const LINE_HEIGHT_BODY   = 15;
const LINE_HEIGHT_ROLE   = 16;
const LINE_HEIGHT_HEADER = 14;
const LINE_HEIGHT_TITLE  = 22;

const COLOR_USER      = rgb(0.10, 0.35, 0.75);   // blue
const COLOR_ASSISTANT = rgb(0.12, 0.55, 0.25);   // green
const COLOR_META      = rgb(0.45, 0.45, 0.45);   // grey
const COLOR_BLACK     = rgb(0, 0, 0);
const COLOR_DIVIDER   = rgb(0.80, 0.80, 0.80);

// ── Cursor that auto-adds pages ───────────────────────────────────
class PageCursor {
  doc: PDFDocument;
  page!: PDFPage;
  y!: number;

  regularFont!: PDFFont;
  boldFont!: PDFFont;
  italicFont!: PDFFont;
  boldItalicFont!: PDFFont;

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  async init() {
    this.regularFont   = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont      = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.italicFont    = await this.doc.embedFont(StandardFonts.HelveticaOblique);
    this.boldItalicFont = await this.doc.embedFont(StandardFonts.HelveticaBoldOblique);
    this.addPage();
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN_TOP;
  }

  /** Ensure there's `needed` vertical space; add new page if not. */
  ensureSpace(needed: number) {
    if (this.y - needed < MARGIN_BOT) {
      this.addPage();
    }
  }

  /** Move cursor down by `amount`. */
  moveDown(amount: number) {
    this.y -= amount;
    if (this.y < MARGIN_BOT) {
      this.addPage();
    }
  }

  /** Draw a horizontal rule. */
  drawRule(color = COLOR_DIVIDER) {
    this.ensureSpace(1);
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end:   { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 0.5,
      color,
    });
    this.moveDown(10);
  }

  /**
   * Word-wrap `text` and draw it, returning total height used.
   * Supports simple **bold**, *italic*, ***bold-italic*** inline markers
   * parsed into segments so each segment can use a different font.
   */
  drawWrappedText(
    text: string,
    opts: {
      font?: PDFFont;
      fontSize?: number;
      color?: typeof COLOR_BLACK;
      lineHeight?: number;
      indent?: number;
    } = {}
  ) {
    const {
      fontSize   = FONT_SIZE_BODY,
      color      = COLOR_BLACK,
      lineHeight = LINE_HEIGHT_BODY,
      indent     = 0,
    } = opts;

    const maxW = CONTENT_W - indent;

    // Parse inline markdown into segments: { text, bold, italic }
    const segments = parseInline(sanitizePdfText(text));

    // Build lines by word-wrapping across segments
    const lines = wrapSegments(segments, maxW, fontSize, {
      regular:    this.regularFont,
      bold:       this.boldFont,
      italic:     this.italicFont,
      boldItalic: this.boldItalicFont,
    });

    for (const lineSegs of lines) {
      this.ensureSpace(lineHeight);

      let x = MARGIN_X + indent;
      for (const seg of lineSegs) {
        const f = pickFont(seg, {
          regular:    this.regularFont,
          bold:       this.boldFont,
          italic:     this.italicFont,
          boldItalic: this.boldItalicFont,
        });
        if (seg.text) {
          this.page.drawText(seg.text, { x, y: this.y, size: fontSize, font: f, color });
          x += f.widthOfTextAtSize(seg.text, fontSize);
        }
      }
      this.moveDown(lineHeight);
    }
  }

  /** Draw a simple single-font line (e.g. role labels, headers). */
  drawLine(
    text: string,
    opts: {
      font?: PDFFont;
      fontSize?: number;
      color?: typeof COLOR_BLACK;
      lineHeight?: number;
      indent?: number;
    } = {}
  ) {
    const {
      font       = this.regularFont,
      fontSize   = FONT_SIZE_BODY,
      color      = COLOR_BLACK,
      lineHeight = LINE_HEIGHT_BODY,
      indent     = 0,
    } = opts;
    this.ensureSpace(lineHeight);
    this.page.drawText(sanitizePdfText(text), {
  x: MARGIN_X + indent,
  y: this.y,
  size: fontSize,
  font,
  color,
});
    this.moveDown(lineHeight);
  }
}

function sanitizePdfText(text: string) {
  return String(text ?? "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // emoji/symbol pictographs
    .replace(/[\u{2600}-\u{27BF}]/gu, "") // misc symbols
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ""); // non-WinAnsi fallback
}

// ── Inline markdown parser ────────────────────────────────────────
interface Segment { text: string; bold: boolean; italic: boolean }

function parseInline(text: string): Segment[] {
  const result: Segment[] = [];
  // Handle ***bold-italic***, **bold**, *italic*
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      result.push({ text: text.slice(last, m.index), bold: false, italic: false });
    }
    if (m[2] !== undefined) result.push({ text: m[2], bold: true,  italic: true  });
    else if (m[3] !== undefined) result.push({ text: m[3], bold: true,  italic: false });
    else if (m[4] !== undefined) result.push({ text: m[4], bold: false, italic: true  });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    result.push({ text: text.slice(last), bold: false, italic: false });
  }
  return result;
}

function pickFont(seg: Segment, fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }) {
  if (seg.bold && seg.italic) return fonts.boldItalic;
  if (seg.bold)               return fonts.bold;
  if (seg.italic)             return fonts.italic;
  return fonts.regular;
}

// Word-wrap a sequence of styled segments into lines of segments
function wrapSegments(
  segments: Segment[],
  maxW: number,
  fontSize: number,
  fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }
): Segment[][] {
  const lines: Segment[][] = [];
  let currentLine: Segment[] = [];
  let currentW = 0;

  // Expand segments into words (preserving style per word)
  const words: Segment[] = [];
  for (const seg of segments) {
    const parts = seg.text.split(/( )/);
    for (const p of parts) {
      if (p !== "") words.push({ text: p, bold: seg.bold, italic: seg.italic });
    }
  }

  for (const word of words) {
    const f = pickFont(word, fonts);
    const w = f.widthOfTextAtSize(word.text, fontSize);

    if (word.text === " ") {
      // Space: append to last segment or add
      if (currentLine.length > 0) {
        currentLine[currentLine.length - 1].text += " ";
        currentW += w;
      }
      continue;
    }

    if (currentW + w > maxW && currentLine.length > 0) {
      // Trim trailing space from last segment
      if (currentLine.length > 0) {
        currentLine[currentLine.length - 1].text = currentLine[currentLine.length - 1].text.trimEnd();
      }
      lines.push(currentLine);
      currentLine = [];
      currentW = 0;
    }

    currentLine.push({ text: word.text, bold: word.bold, italic: word.italic });
    currentW += w;
  }

  if (currentLine.length > 0) {
    currentLine[currentLine.length - 1].text = currentLine[currentLine.length - 1].text.trimEnd();
    lines.push(currentLine);
  }

  return lines;
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDateTime(date: Date) {
  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

// ── Route handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: projectId, chatId } = await context.params;

    const access = await getProjectAccess({ projectId, userId: user.userId });
    if (!access.hasAccess) {
      return NextResponse.json({ error: "You do not have access." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      includeQuestions = true,
      format           = "pdf",
      messageIds       = null,
      chatTitle        = "Chat Export",
      ownerName        = user.email ?? "Unknown",
      chatCreatedAt    = null,
    } = body;

    const hasSelectedMessages = Array.isArray(messageIds) && messageIds.length > 0;

    // ── Fetch messages (same logic as before) ──
    const messages = hasSelectedMessages
      ? includeQuestions
        ? await sql`
            WITH selected_messages AS (
              SELECT id, role, reply_to_message_id, timestamp
              FROM contexts
              WHERE project_id = ${projectId} AND chat_id = ${chatId}
              AND id = ANY(${messageIds})
            ),
            direct_parent_questions AS (
              SELECT reply_to_message_id AS id FROM selected_messages
              WHERE role = 'assistant' AND reply_to_message_id IS NOT NULL
            ),
            fallback_parent_questions AS (
              SELECT DISTINCT ON (selected_messages.id) previous_user.id
              FROM selected_messages
              JOIN LATERAL (
                SELECT contexts.id FROM contexts
                WHERE contexts.project_id = ${projectId} AND contexts.chat_id = ${chatId}
                AND contexts.role = 'user' AND contexts.timestamp < selected_messages.timestamp
                ORDER BY contexts.timestamp DESC LIMIT 1
              ) previous_user ON true
              WHERE selected_messages.role = 'assistant'
              AND selected_messages.reply_to_message_id IS NULL
            ),
            export_ids AS (
              SELECT id FROM selected_messages
              UNION SELECT id FROM direct_parent_questions
              UNION SELECT id FROM fallback_parent_questions
            )
            SELECT DISTINCT contexts.id, contexts.role, contexts.content, contexts.timestamp
            FROM contexts JOIN export_ids ON export_ids.id = contexts.id
            WHERE contexts.project_id = ${projectId} AND contexts.chat_id = ${chatId}
            ORDER BY contexts.timestamp ASC
          `
        : await sql`
            SELECT id, role, content, timestamp FROM contexts
            WHERE project_id = ${projectId} AND chat_id = ${chatId}
            AND id = ANY(${messageIds})
            ORDER BY timestamp ASC
          `
      : await sql`
          SELECT id, role, content, timestamp FROM contexts
          WHERE project_id = ${projectId} AND chat_id = ${chatId}
          AND active_version = true
          ORDER BY timestamp ASC
        `;

    // ── Plain text export ──
    if (format === "txt") {
      let text = `${chatTitle}\nExported: ${formatDateTime(new Date())}\nOwner: ${ownerName}\n\n`;
      for (const msg of messages) {
        if (!includeQuestions && msg.role === "user") continue;
        text += `${String(msg.role).toUpperCase()}:\n${msg.content}\n\n`;
      }
      return NextResponse.json({ content: text.trim() });
    }

    // ── PDF export ────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const cursor = new PageCursor(pdfDoc);
    await cursor.init();

    const exportedAt = new Date();
    const chatCreated = chatCreatedAt ? new Date(chatCreatedAt) : null;

    // ── Header block ──────────────────────────────────────────────
    // Title
    cursor.drawLine(chatTitle, {
      font:       cursor.boldFont,
      fontSize:   FONT_SIZE_TITLE,
      color:      COLOR_BLACK,
      lineHeight: LINE_HEIGHT_TITLE,
    });

    // Meta row: owner
    cursor.drawLine(`Owner: ${ownerName}`, {
      font:       cursor.regularFont,
      fontSize:   FONT_SIZE_HEADER,
      color:      COLOR_META,
      lineHeight: LINE_HEIGHT_HEADER,
    });

    // Meta row: export date
    cursor.drawLine(`Exported: ${formatDateTime(exportedAt)}`, {
      font:       cursor.regularFont,
      fontSize:   FONT_SIZE_HEADER,
      color:      COLOR_META,
      lineHeight: LINE_HEIGHT_HEADER,
    });

    // Meta row: chat created (if available)
    if (chatCreated) {
      cursor.drawLine(`Chat created: ${formatDateTime(chatCreated)}`, {
        font:       cursor.regularFont,
        fontSize:   FONT_SIZE_HEADER,
        color:      COLOR_META,
        lineHeight: LINE_HEIGHT_HEADER,
      });
    }

    cursor.moveDown(6);
    cursor.drawRule();

    // ── Messages ──────────────────────────────────────────────────
    for (const msg of messages) {
      if (!includeQuestions && msg.role === "user") continue;

      const isUser = msg.role === "user";
      const roleLabel = isUser ? "USER" : "ASSISTANT";
      const roleColor = isUser ? COLOR_USER : COLOR_ASSISTANT;

      // Role label (bold + colored)
      cursor.ensureSpace(LINE_HEIGHT_ROLE + LINE_HEIGHT_BODY);
      cursor.drawLine(roleLabel, {
        font:       cursor.boldFont,
        fontSize:   FONT_SIZE_ROLE,
        color:      roleColor,
        lineHeight: LINE_HEIGHT_ROLE,
      });

      // Message content — supports **bold** *italic* ***bold-italic***
      const content = String(msg.content ?? "").trim();
      const paragraphs = content.split(/\n+/);
      for (const para of paragraphs) {
        if (!para.trim()) {
          cursor.moveDown(LINE_HEIGHT_BODY * 0.4);
          continue;
        }
        cursor.drawWrappedText(para.trim(), {
          fontSize:   FONT_SIZE_BODY,
          color:      COLOR_BLACK,
          lineHeight: LINE_HEIGHT_BODY,
          indent:     0,
        });
      }

      cursor.moveDown(6);
      cursor.drawRule();
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes.buffer as BodyInit, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="chat-export.pdf"`,
      },
    });
  } catch (error) {
    console.error("[export] Failed:", error);
    return NextResponse.json({ error: "Failed to export messages." }, { status: 500 });
  }
}
