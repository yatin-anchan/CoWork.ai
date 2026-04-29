"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  Brain,
  ChevronDown,
  Code2,
  FileSearch,
  LayoutDashboard,
  Menu,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

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

type SelectedRole =
  | "reasoning"
  | "research"
  | "execution"
  | "reviewing"
  | "auto";

type RoleProviderMap = {
  reasoning: string;
  research: string;
  execution: string;
  reviewing: string;
};

const providerOptions = [
  { value: "google", label: "Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Claude" },
  { value: "openai", label: "ChatGPT" },
  { value: "perplexity", label: "Perplexity" },
];

const roleButtons: {
  value: keyof RoleProviderMap;
  fallbackLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "reasoning",
    fallbackLabel: "Gemini",
    icon: <Brain size={17} />,
  },
  {
    value: "research",
    fallbackLabel: "Perplexity",
    icon: <FileSearch size={17} />,
  },
  {
    value: "execution",
    fallbackLabel: "Groq",
    icon: <Code2 size={17} />,
  },
  {
    value: "reviewing",
    fallbackLabel: "Gemini",
    icon: <ShieldCheck size={17} />,
  },
];

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ContextMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("reasoning");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [roleProviders, setRoleProviders] = useState<RoleProviderMap>({
    reasoning: "google",
    research: "perplexity",
    execution: "groq",
    reviewing: "google",
  });

  function getToken() {
    return localStorage.getItem("token");
  }

  function getProviderLabel(provider: string) {
    return (
      providerOptions.find((item) => item.value === provider)?.label ||
      provider
    );
  }

  async function fetchRoleAssignments() {
    const token = getToken();

    if (!token) return;

    const res = await fetch("/api/models/roles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const data = await res.json();

    const nextProviders: RoleProviderMap = {
      reasoning: "google",
      research: "perplexity",
      execution: "groq",
      reviewing: "google",
    };

    data.roles?.forEach(
      (item: { role: keyof RoleProviderMap; provider: string }) => {
        if (item.role in nextProviders) {
          nextProviders[item.role] = item.provider;
        }
      }
    );

    setRoleProviders(nextProviders);
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
    await fetchRoleAssignments();
    setLoading(false);
  }

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function updateRoleProvider(
    role: keyof RoleProviderMap,
    provider: string
  ) {
    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setRoleProviders((prev) => ({
      ...prev,
      [role]: provider,
    }));

    await fetch("/api/models/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        role,
        provider,
      }),
    });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim()) return;

    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const messageText = input;
    setInput("");

    const res = await fetch(`/api/projects/${projectId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: messageText,
        selectedRole,
      }),
    });

    if (!res.ok) {
      alert("Failed to send message.");
      return;
    }

    await fetchProject();
  }

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-white">
        Loading project...
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-black text-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800 bg-black px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
            <Bot size={21} />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">CoWork.ai</h1>
            <p className="text-xs text-neutral-500">Multi-AI workspace</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
        >
          Dashboard
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-16 shrink-0 flex-col items-center justify-between border-r border-neutral-800 bg-black py-5">
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="space-y-4">
            <button
              onClick={() => router.push("/settings")}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <User size={22} />
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              <Settings size={22} />
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <aside className="w-72 shrink-0 border-r border-neutral-800 bg-neutral-950 p-5">
            <div>
              <h2 className="truncate text-sm font-semibold text-white">
                {project?.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                {project?.description || "No description"}
              </p>
            </div>

            <div className="mt-8 space-y-2">
              <button className="w-full rounded-xl bg-white px-4 py-2.5 text-left text-sm font-medium text-black hover:bg-neutral-200">
                + New Chat
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                <LayoutDashboard size={16} />
                New Project
              </button>

              <button className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900">
                History
              </button>

              <button
                onClick={() => router.push("/api-manager")}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                API Manager
              </button>

              <button
                onClick={() => router.push("/settings")}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                Settings
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-neutral-800 bg-black p-4 text-sm">
              <p className="font-medium text-white">Token Usage</p>
              <p className="mt-2 text-neutral-500">Used: 0</p>
              <p className="text-neutral-500">Remaining: Not tracked yet</p>
              <p className="text-neutral-500">
                Active:{" "}
                {selectedRole === "auto"
                  ? "Auto"
                  : getProviderLabel(roleProviders[selectedRole])}
              </p>
            </div>
          </aside>
        )}

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
          <div className="shrink-0 border-b border-neutral-800 px-6 py-4">
            <h2 className="text-base font-semibold">{project?.name}</h2>
            <p className="text-xs text-neutral-500">
              Choose a role/model below, then send a message.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                    <Bot size={24} />
                  </div>
                  <p className="mt-4 text-lg font-semibold">
                    Start with a selected model
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Use the model row below to switch reasoning, research,
                    execution, or reviewing without opening API Manager.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl border px-4 py-3 ${
                      message.role === "user"
                        ? "ml-auto border-neutral-700 bg-white text-black"
                        : "mr-auto border-neutral-800 bg-neutral-950 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                    {message.model && (
                      <p className="mt-2 text-xs text-neutral-500">
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
            className="shrink-0 border-t border-neutral-800 bg-black px-6 py-5"
          >
            <div className="mx-auto max-w-5xl">
              <div className="flex items-center rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 shadow-lg">
                <button
                  type="button"
                  className="mr-3 rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                >
                  <Plus size={22} />
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message CoWork.ai..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                />

                <button
                  type="submit"
                  className="ml-3 rounded-xl bg-white p-2 text-black hover:bg-neutral-200"
                >
                  <Send size={18} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {roleButtons.map((role) => {
                  const active = selectedRole === role.value;
                  const providerLabel = getProviderLabel(
                    roleProviders[role.value]
                  );

                  return (
                    <div
                      key={role.value}
                      className={`flex items-center rounded-xl border text-sm ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className="flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5"
                      >
                        {role.icon}
                        <span className="truncate">{providerLabel}</span>
                      </button>

                      <div className="relative mr-2 flex items-center">
                        <ChevronDown
                          size={15}
                          className={
                            active ? "text-black" : "text-neutral-500"
                          }
                        />

                        <select
                          value={roleProviders[role.value]}
                          onChange={(e) =>
                            updateRoleProvider(role.value, e.target.value)
                          }
                          title={`Change ${role.value} model`}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        >
                          {providerOptions.map((provider) => (
                            <option
                              key={provider.value}
                              value={provider.value}
                            >
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedRole("auto")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                    selectedRole === "auto"
                      ? "border-white bg-white text-black"
                      : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900"
                  }`}
                >
                  <Bot size={17} />
                  Auto
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}