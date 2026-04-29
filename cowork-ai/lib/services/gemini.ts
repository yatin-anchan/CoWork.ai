import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function callGemini({
  apiKey,
  messages,
}: {
  apiKey: string;
  messages: ChatMessage[];
}): Promise<string> {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Gemini API key is empty.");
  }

  if (!messages || messages.length === 0) {
    throw new Error("No messages provided.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

  // Last message must be from user
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from the user.");
  }

  // Everything before the last message is history
  const historyMessages = messages.slice(0, -1);

  // Merge consecutive same-role messages (Gemini requires strictly alternating)
  const mergedHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const msg of historyMessages) {
    const geminiRole = msg.role === "assistant" ? "model" : "user";
    const last = mergedHistory[mergedHistory.length - 1];

    if (last && last.role === geminiRole) {
      last.parts.push({ text: msg.content });
    } else {
      mergedHistory.push({
        role: geminiRole,
        parts: [{ text: msg.content }],
      });
    }
  }

  // History must start with user turn
  if (mergedHistory.length > 0 && mergedHistory[0].role !== "user") {
    mergedHistory.shift();
  }

  const chat = model.startChat({
    history: mergedHistory,
  });

  const result = await chat.sendMessage(lastMessage.content);

  if (!result.response) {
    throw new Error("Empty response from Gemini.");
  }

  const text = result.response.text();

  if (!text) {
    throw new Error("Gemini returned empty text.");
  }

  return text;
}