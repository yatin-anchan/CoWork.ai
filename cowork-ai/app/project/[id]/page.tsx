"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RichMessage from "@/components/chat/RichMessage";

import {
  BarChart3,
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

type UsageData = {
  totalTokensToday: number;
  mostUsedModel: string | null;
  usageByModel: {
    model: string;
    tokens_used: number;
  }[];
  usageByDay: {
    date: string;
    tokens_used: number;
  }[];
  connectedProviders: {
    provider: string;
    status: string;
  }[];
  providerUsage: {
    provider: string;
    limit: number;
    usedToday: number;
    remaining: number;
  }[];
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
  icon: React.ReactNode;
}[] = [
  { value: "reasoning", icon: <Brain size={17} /> },
  { value: "research", icon: <FileSearch size={17} /> },
  { value: "execution", icon: <Code2 size={17} /> },
  { value: "reviewing", icon: <ShieldCheck size={17} /> },
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
  const [usageOpen, setUsageOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);

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

  function getConnectedProviderOptions() {
    if (!usage?.connectedProviders?.length) return [];

    return providerOptions.filter((provider) =>
      usage.connectedProviders.some(
        (connected) => connected.provider === provider.value
      )
    );
  }

  async function fetchUsage() {
    const token = getToken();
    if (!token) return;

    const res = await fetch("/api/usage", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return;

    const data = await res.json();
    setUsage(data);
  }

  async function fetchRoleAssignments() {
    const token = getToken();
    if (!token) return;

    const globalRes = await fetch("/api/models/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const projectRes = await fetch(`/api/projects/${projectId}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const nextProviders: RoleProviderMap = {
      reasoning: "google",
      research: "perplexity",
      execution: "groq",
      reviewing: "google",
    };

    if (globalRes.ok) {
      const globalData = await globalRes.json();
      globalData.roles?.forEach(
        (item: { role: keyof RoleProviderMap; provider: string }) => {
          if (item.role in nextProviders) {
            nextProviders[item.role] = item.provider;
          }
        }
      );
    }

    if (projectRes.ok) {
      const projectData = await projectRes.json();
      projectData.roles?.forEach(
        (item: { role: keyof RoleProviderMap; provider: string }) => {
          if (item.role in nextProviders) {
            nextProviders[item.role] = item.provider;
          }
        }
      );
    }

    setRoleProviders(nextProviders);
  }

  async function fetchProject() {
    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
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

      if (!res.ok) {
        console.error(`fetchProject failed: ${res.status} ${res.statusText}`);
        setLoading(false);
        return;
      }

      const text = await res.text();

      if (!text) {
        console.error("fetchProject: empty response body");
        setLoading(false);
        return;
      }

      const data = JSON.parse(text);

      setProject(data.project);
      setMessages(data.contexts || []);
      await fetchRoleAssignments();
      await fetchUsage();
    } catch (err) {
      console.error("fetchProject error:", err);
    } finally {
      setLoading(false);
    }
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

    const res = await fetch(`/api/projects/${projectId}/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role, provider }),
    });

    if (!res.ok) {
      alert("Failed to update project model.");
      return;
    }

    await fetchRoleAssignments();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim()) return;

    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const messageText = input.trim();
    setInput("");

    const tempUserMessage: ContextMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      model: null,
      content: messageText,
      tokens_used: 0,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
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
        const errData = await res.json().catch(() => ({}));
        console.error("Send message failed:", errData);
        alert(errData.error || "Failed to send message.");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return;
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        {
          id: data.userMessage.id,
          role: "user",
          model: null,
          content: messageText,
          tokens_used: Math.ceil(messageText.length / 4),
          timestamp: new Date().toISOString(),
        },
        data.assistantMessage,
      ]);

      await fetchUsage();
    } catch (err) {
      console.error("handleSendMessage error:", err);
      alert("Something went wrong. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    }
  }

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-white">
        Loading project...
      </main>
    );
  }

  const connectedOptions = getConnectedProviderOptions();

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUsageOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            <BarChart3 size={16} />
            Usage Analysis
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Dashboard
          </button>
        </div>
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
              <p className="mt-2 text-neutral-500">
                Used today: {usage?.totalTokensToday ?? 0}
              </p>
              <p className="text-neutral-500">
                Most used: {usage?.mostUsedModel || "None"}
              </p>
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
              Choose a connected model below, then send a message.
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
                    Use the bottom model row to switch providers without opening
                    API Manager.
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
                    <RichMessage content={message.content} />
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

              {usage?.connectedProviders?.length === 0 && (
                <p className="mt-3 rounded-xl border border-yellow-800 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-300">
                  No API keys connected. Go to API Manager to connect at least
                  one model provider.
                </p>
              )}

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
                          className={active ? "text-black" : "text-neutral-500"}
                        />
                        <select
                          value={roleProviders[role.value]}
                          onChange={(e) =>
                            updateRoleProvider(role.value, e.target.value)
                          }
                          disabled={connectedOptions.length === 0}
                          title={`Change ${role.value} model`}
                          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        >
                          {connectedOptions.map((provider) => (
                            <option key={provider.value} value={provider.value}>
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

      {usageOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <aside className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Usage Analysis</h2>
                <p className="text-sm text-neutral-500">
                  Token usage across connected models.
                </p>
              </div>
              <button
                onClick={() => setUsageOpen(false)}
                className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <p className="text-sm text-neutral-500">Total used today</p>
              <p className="mt-2 text-3xl font-bold">
                {usage?.totalTokensToday ?? 0}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Most used: {usage?.mostUsedModel || "None"}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <h3 className="font-semibold">Connected Model Limits</h3>
              {!usage?.providerUsage?.length ? (
                <p className="mt-3 text-sm text-yellow-400">
                  No connected API keys. Connect providers in API Manager.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {usage.providerUsage.map((item) => {
                    const percentage =
                      item.limit > 0
                        ? Math.min((item.usedToday / item.limit) * 100, 100)
                        : 0;
                    return (
                      <div key={item.provider}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{item.provider}</span>
                          <span className="text-neutral-500">
                            {item.usedToday} / {item.limit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800">
                          <div
                            className="h-2 rounded-full bg-white"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          Remaining: {item.remaining}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <h3 className="font-semibold">Usage by Model Today</h3>
              {!usage?.usageByModel?.length ? (
                <p className="mt-3 text-sm text-neutral-500">No usage yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {usage.usageByModel.map((item) => (
                    <div
                      key={item.model}
                      className="flex justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm"
                    >
                      <span>{item.model}</span>
                      <span className="text-neutral-400">
                        {item.tokens_used} tokens
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <h3 className="font-semibold">Last 3 Days</h3>
              {!usage?.usageByDay?.length ? (
                <p className="mt-3 text-sm text-neutral-500">
                  No historical usage yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {usage.usageByDay.map((item) => {
                    const max = Math.max(
                      ...usage.usageByDay.map((day) => day.tokens_used),
                      1
                    );
                    const width = Math.min(
                      (item.tokens_used / max) * 100,
                      100
                    );
                    return (
                      <div key={item.date}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="text-neutral-500">
                            {item.tokens_used}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800">
                          <div
                            className="h-2 rounded-full bg-white"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}