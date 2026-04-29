export type WorkType = "research" | "execution" | "reviewing" | "reasoning";

export function classifyMessage(message: string): WorkType {
  const text = message.toLowerCase();

  if (
    text.includes("search") ||
    text.includes("find") ||
    text.includes("latest") ||
    text.includes("research") ||
    text.includes("documentation")
  ) {
    return "research";
  }

  if (
    text.includes("build") ||
    text.includes("code") ||
    text.includes("create") ||
    text.includes("implement") ||
    text.includes("fix")
  ) {
    return "execution";
  }

  if (
    text.includes("review") ||
    text.includes("check") ||
    text.includes("debug") ||
    text.includes("validate") ||
    text.includes("improve")
  ) {
    return "reviewing";
  }

  return "reasoning";
}

export function getDefaultModel(workType: WorkType) {
  const defaults = {
    research: {
      provider: "openrouter",
      model: "openrouter/free",
    },
    execution: {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
    },
    reviewing: {
      provider: "google",
      model: "gemini-2.5-flash",
    },
    reasoning: {
      provider: "google",
      model: "gemini-2.5-flash",
    },
  };

  return defaults[workType];
}