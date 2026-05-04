import { sql } from "@/lib/db/neon";
import { AIProvider, callAIProvider, ChatMessage, WorkType } from "@/lib/services/aiClient";

const RECENT_MESSAGE_LIMIT = 16;
const SUMMARY_TRIGGER_LIMIT = 28;

export async function getOptimizedProjectContext({
  projectId,
}: {
  projectId: string;
}) {
  const projectRows = await sql`
    SELECT instructions, memory_summary
    FROM projects
    WHERE id = ${projectId}
    LIMIT 1
  `;

  const project = projectRows[0];

  const allMessages = await sql`
    SELECT role, content, timestamp
    FROM contexts
    WHERE project_id = ${projectId}
    ORDER BY timestamp ASC
  `;

  const recentMessages = allMessages.slice(-RECENT_MESSAGE_LIMIT);

  const optimizedMessages: ChatMessage[] = [];

  if (project?.memory_summary) {
    optimizedMessages.push({
      role: "system",
      content: `PROJECT MEMORY SUMMARY:
${project.memory_summary}`,
    });
  }

  optimizedMessages.push(
    ...recentMessages.map((item: any) => ({
  role: (item.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
  content: item.content,
}))
  );

  return {
    instructions: project?.instructions || null,
    memorySummary: project?.memory_summary || null,
    messages: optimizedMessages,
    totalMessageCount: allMessages.length,
    shouldSummarize: allMessages.length >= SUMMARY_TRIGGER_LIMIT,
  };
}

export async function maybeUpdateProjectMemory({
  projectId,
  provider,
  apiKey,
  model,
  customBaseUrl,
}: {
  projectId: string;
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string | null;
}) {
  const allMessages = await sql`
    SELECT role, content
    FROM contexts
    WHERE project_id = ${projectId}
    ORDER BY timestamp ASC
  `;

  if (allMessages.length < SUMMARY_TRIGGER_LIMIT) return;

  const projectRows = await sql`
    SELECT memory_summary
    FROM projects
    WHERE id = ${projectId}
    LIMIT 1
  `;

  const previousSummary = projectRows[0]?.memory_summary || "";

  const olderMessages = allMessages.slice(0, -RECENT_MESSAGE_LIMIT);

  const summarizationInput = olderMessages
    .map((item: any) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n\n");

  const summary = await callAIProvider({
    provider,
    apiKey,
    model,
    customBaseUrl,
    workType: "reasoning",
    messages: [
      {
        role: "system",
        content: `
You are maintaining long-term project memory for CoWork.ai.

Create a compact but useful memory summary.
Preserve:
- user preferences
- project decisions
- technical stack
- unresolved tasks
- important constraints
- names, APIs, routes, schema decisions
- mistakes or fixes already made

Do not include filler conversation.
        `.trim(),
      },
      {
        role: "user",
        content: `
Previous memory summary:
${previousSummary || "None"}

Conversation to summarize:
${summarizationInput}
        `.trim(),
      },
    ],
  });

  await sql`
    UPDATE projects
    SET memory_summary = ${summary},
        memory_updated_at = CURRENT_TIMESTAMP
    WHERE id = ${projectId}
  `;
}
