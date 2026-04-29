import { sql } from "@/lib/db/neon";
import { callAIProvider } from "@/lib/services/aiClient";

export async function summarizeContext(
  projectId: string,
  messages: { role: string; content: string }[]
) {
  const text = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const summary = await callAIProvider({
    provider: "groq",
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Summarize the conversation into short memory points. Keep important facts, decisions, context.",
      },
      {
        role: "user",
        content: text,
      },
    ],
    workType: "reasoning",
  });

  await sql`
    INSERT INTO memories (project_id, summary)
    VALUES (${projectId}, ${summary})
  `;
}