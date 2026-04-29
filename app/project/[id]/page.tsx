"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ContextMessage = {
  id: string;
  role: "user" | "assistant";
  model: string | null;
  content: string;
  tokens_used: number;
  timestamp: string;
};

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ContextMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [loading, setLoading] = useState(true);

  function getToken() {
    return localStorage.getItem("token");
  }

  async function fetchProject() {
    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const res = await fetch(`/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      router.push("/auth/login");
      return;
    }

    if (res.status === 404) {
      router.push("/dashboard");
      return;
    }

    const data = await res.json();

    setProject(data.project);
    setMessages(data.contexts || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim()) return;

    alert("Message API will be added in Step 8.");

    setInput("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Loading project...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-neutral-950 text-white">
      <aside className="hidden w-72 border-r border-neutral-800 bg-neutral-950 p-5 md:block">
        <h1 className="text-2xl font-bold">CoWork.ai</h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 w-full rounded-lg border border-neutral-700 px-4 py-2 text-left text-sm hover:bg-neutral-900"
        >
          ← Dashboard
        </button>

        <div className="mt-8 space-y-3">
          <button className="w-full rounded-lg bg-white px-4 py-2 text-left text-sm font-medium text-black">
            + New Chat
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-lg border border-neutral-800 px-4 py-2 text-left text-sm hover:bg-neutral-900"
          >
            New Project
          </button>

          <button className="w-full rounded-lg border border-neutral-800 px-4 py-2 text-left text-sm hover:bg-neutral-900">
            History
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="w-full rounded-lg border border-neutral-800 px-4 py-2 text-left text-sm hover:bg-neutral-900"
          >
            Settings
          </button>

          <button
            onClick={() => router.push("/api-manager")}
            className="w-full rounded-lg border border-neutral-800 px-4 py-2 text-left text-sm hover:bg-neutral-900"
          >
            API Manager
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm font-medium">Token Usage</p>
          <p className="mt-2 text-xs text-neutral-400">Used: 0</p>
          <p className="text-xs text-neutral-400">Remaining: Not tracked yet</p>
          <p className="text-xs text-neutral-400">Regular model: Auto</p>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="border-b border-neutral-800 px-6 py-4">
          <h2 className="text-xl font-semibold">{project?.name}</h2>
          <p className="text-sm text-neutral-400">
            {project?.description || "No description"}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-neutral-500">
              <div>
                <p className="text-lg font-medium">Start the conversation</p>
                <p className="mt-2 text-sm">
                  Ask CoWork.ai to plan, research, build, or review something.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl p-4 ${
                    message.role === "user"
                      ? "ml-auto bg-white text-black"
                      : "mr-auto bg-neutral-900 text-white"
                  } max-w-[80%]`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.model && (
                    <p className="mt-2 text-xs opacity-60">
                      Model: {message.model}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="border-t border-neutral-800 p-4"
        >
          <div className="mx-auto flex max-w-4xl gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-white"
            >
              <option value="auto">Auto Route</option>
              <option value="reasoning">Reasoning</option>
              <option value="execution">Execution</option>
              <option value="search">Search</option>
              <option value="reviewing">Reviewing</option>
            </select>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message CoWork.ai..."
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
            />

            <button
              type="submit"
              className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-neutral-200"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}