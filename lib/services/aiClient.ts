import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider =
  | "google"
  | "groq"
  | "openrouter"
  | "perplexity"
  | "openai"
  | "anthropic"
  | "custom";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type CallAIProviderArgs = {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  workType: WorkType;
  customBaseUrl?: string | null;
};

export type WorkType = "research" | "execution" | "reviewing" | "reasoning";

const BASE_SYSTEM_PROMPT = `
You are CoWork.ai, a unified multi-model AI workspace.

You may be powered by different AI providers at different times, but you must behave as one continuous assistant with one shared memory.

Use the full conversation history as your own memory.
Do not say that you are a different model unless the user explicitly asks.
Continue naturally from previous messages, even if another model produced them.

Your response should feel like it comes from one consistent CoWork.ai assistant.
`.trim();

const ROLE_PROMPTS: Record<WorkType, string> = {
  reasoning: `
Current mode: Reasoning.

Focus on planning, architecture, tradeoffs, technical decisions, and breaking complex tasks into clear steps.
Be structured, skeptical, and precise.
Do not jump into implementation unless the user asks.
`.trim(),

  research: `
Current mode: Research.

Focus on gathering, comparing, explaining, and organizing information.
Clearly separate facts, assumptions, and recommendations.
If web access is not available, say what information may need verification.
`.trim(),

  execution: `
Current mode: Execution.

Focus on producing usable outputs: code, commands, schemas, files, implementation steps, and concrete deliverables.
Prefer complete working examples over vague explanations.
Mention exact file paths when giving code.
`.trim(),

  reviewing: `
Current mode: Reviewing.

Focus on checking correctness, bugs, security issues, missing edge cases, UX problems, and architectural weaknesses.
Be critical but constructive.
Give fixes, not just criticism.
`.trim(),
};

function buildSystemPrompt(workType: WorkType) {
  return `${BASE_SYSTEM_PROMPT}\n\n${ROLE_PROMPTS[workType]}`;
}

function normalizeMessages(messages: ChatMessage[], workType: WorkType) {
  const cleaned = messages
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  return [{ role: "system" as const, content: buildSystemPrompt(workType) }, ...cleaned];
}

function mergeGeminiTurns(messages: ChatMessage[]) {
  const withoutSystem = messages.filter((message) => message.role !== "system");

  const merged: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const message of withoutSystem) {
    const role = message.role === "assistant" ? "model" : "user";
    const text = message.content.trim();

    if (!text) continue;

    const last = merged[merged.length - 1];

    if (last && last.role === role) {
      last.parts[0].text += `\n\n${text}`;
    } else {
      merged.push({
        role,
        parts: [{ text }],
      });
    }
  }

  return merged;
}

async function callGemini({
  apiKey,
  model,
  messages,
  workType,
}: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  workType: WorkType;
}) {
  const genAI = new GoogleGenerativeAI(apiKey);

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: buildSystemPrompt(workType),
  });

  const normalized = mergeGeminiTurns(messages);

  const lastMessage = normalized[normalized.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Gemini requires the latest message to be from the user.");
  }

  const history = normalized.slice(0, -1);

  const chat = geminiModel.startChat({
    history,
  });

  const result = await chat.sendMessage(lastMessage.parts[0].text);

  return result.response.text();
}

function getOpenAICompatibleBaseUrl(provider: AIProvider, customBaseUrl?: string | null) {
  if (provider === "groq") return "https://api.groq.com/openai/v1";
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (provider === "perplexity") return "https://api.perplexity.ai";
  if (provider === "openai") return "https://api.openai.com/v1";
  if (provider === "custom") return customBaseUrl;

  return null;
}

async function callOpenAICompatible({
  provider,
  apiKey,
  model,
  messages,
  workType,
  customBaseUrl,
}: CallAIProviderArgs) {
  const baseUrl = getOpenAICompatibleBaseUrl(provider, customBaseUrl);

  if (!baseUrl) {
    throw new Error(`${provider} is not supported by the OpenAI-compatible client.`);
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider === "openrouter"
        ? {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CoWork.ai",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      messages: normalizeMessages(messages, workType),
      temperature: 0.7,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `${provider} API request failed with status ${res.status}`
    );
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`${provider} returned an empty response.`);
  }

  return content;
}

export async function callAIProvider(args: CallAIProviderArgs) {
  if (args.provider === "google") {
    return callGemini({
  apiKey: args.apiKey,
  model: args.model,
  messages: args.messages,
  workType: args.workType,
});
  }

  if (args.provider === "anthropic") {
    throw new Error("Anthropic direct integration is not added yet. Use OpenRouter for Claude models for now.");
  }

  return callOpenAICompatible(args);
}