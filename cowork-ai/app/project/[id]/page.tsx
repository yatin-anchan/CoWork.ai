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
  UserPlus,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Project = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
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

type ProjectMember = {
  id: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

type UsageData = {
  totalTokensToday: number;
  totalCostToday: number;
  mostUsedModel: string | null;
  teamModeUsage: number;
  usageByModel: {
    model: string;
    provider: string;
    tokens_used: number;
    cost: number;
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
    costToday: number;
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
  const [messageMode, setMessageMode] = useState<"single" | "team">("single");
  const [isStreaming, setIsStreaming] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
const [members, setMembers] = useState<ProjectMember[]>([]);
const [myProjectRole, setMyProjectRole] = useState<"owner" | "editor" | "viewer" | null>(null);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");

  // ── Project Settings state ──────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  // ────────────────────────────────────────────────────────────────────────

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

  async function fetchMembers() {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`/api/projects/${projectId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return;

  const data = await res.json();

  setMembers(data.members || []);
  setMyProjectRole(data.myRole || null);
}

async function inviteMember() {
  const token = getToken();

  if (!token) {
    router.push("/auth/login");
    return;
  }

  if (!inviteEmail.trim()) {
    alert("Enter an email address.");
    return;
  }

  const res = await fetch(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: inviteEmail.trim(),
      role: inviteRole,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    alert(data.error || "Failed to invite member.");
    return;
  }

  setInviteEmail("");
  setInviteRole("viewer");
  await fetchMembers();
}

async function removeMember(userId: string) {
  const token = getToken();

  if (!token) {
    router.push("/auth/login");
    return;
  }

  const confirmed = confirm("Remove this member from the project?");
  if (!confirmed) return;

  const res = await fetch(`/api/projects/${projectId}/members`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    alert(data.error || "Failed to remove member.");
    return;
  }

  await fetchMembers();
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

  // ── Populate settings fields whenever project loads ─────────────────────
  useEffect(() => {
    if (project) {
      setEditName(project.name || "");
      setEditDescription(project.description || "");
      setEditInstructions(project.instructions || "");
    }
  }, [project]);
  // ────────────────────────────────────────────────────────────────────────

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

  // ── Save project settings ───────────────────────────────────────────────
  async function saveProjectSettings() {
    const token = getToken();

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        instructions: editInstructions.slice(0, 4000),
      }),
    });

    if (!res.ok) {
      alert("Failed to update project.");
      return;
    }

    await fetchProject();
    setShowSettings(false);
  }
  // ────────────────────────────────────────────────────────────────────────

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
  setIsStreaming(true);

  const tempUserMessage: ContextMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    model: null,
    content: messageText,
    tokens_used: Math.ceil(messageText.length / 4),
    timestamp: new Date().toISOString(),
  };

  const tempAssistantMessage: ContextMessage = {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    model:
      messageMode === "team"
        ? "team-mode"
        : selectedRole === "auto"
          ? "streaming"
          : getProviderLabel(roleProviders[selectedRole]),
    content: "",
    tokens_used: 0,
    timestamp: new Date().toISOString(),
  };

  setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);

  try {
    const endpoint =
      messageMode === "team"
        ? `/api/projects/${projectId}/message/team`
        : `/api/projects/${projectId}/message/stream`;

    const res = await fetch(endpoint, {
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

      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== tempUserMessage.id &&
            message.id !== tempAssistantMessage.id
        )
      );

      return;
    }

    if (messageMode === "team") {
      const data = await res.json();

      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempAssistantMessage.id
            ? {
                ...message,
                model: "team-mode",
                content: data.assistantMessage?.content || "",
              }
            : message
        )
      );

      await fetchProject();
      return;
    }

    if (!res.body) {
      alert("Streaming response was empty.");

      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== tempUserMessage.id &&
            message.id !== tempAssistantMessage.id
        )
      );

      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let streamedText = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      streamedText += chunk;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempAssistantMessage.id
            ? {
                ...message,
                content: streamedText,
              }
            : message
        )
      );
    }

    await fetchProject();
  } catch (error) {
    console.error("Message send error:", error);

    alert("Failed to send message.");

    setMessages((prev) =>
      prev.filter(
        (message) =>
          message.id !== tempUserMessage.id &&
          message.id !== tempAssistantMessage.id
      )
    );
  } finally {
    setIsStreaming(false);
    await fetchUsage();
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
  onClick={async () => {
    setMembersOpen(true);
    await fetchMembers();
  }}
  title="Invite members"
  className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
>
  <UserPlus size={16} />
  Invite
</button>

          {/* ── Project Settings button ── */}

          

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
            onClick={() => setShowSettings(true)}
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
          >
            Project Settings
          </button>
            </div>

            <div className="mt-8 rounded-2xl border border-neutral-800 bg-black p-4 text-sm">
              <p className="font-medium text-white">Token Usage</p>
               <p className="mt-2 text-3xl font-bold">
    {usage?.totalTokensToday ?? 0}
  </p>

  <p className="text-sm text-neutral-500">
    Cost today: ${usage?.totalCostToday?.toFixed(4) || "0.0000"}
  </p>

  <p className="mt-1 text-sm text-neutral-500">
    Most used: {usage?.mostUsedModel || "None"}
  </p>

  <p className="text-sm text-neutral-500">
    Team Mode used: {usage?.teamModeUsage ?? 0} times
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

              <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-2">
  <div className="flex rounded-lg bg-black p-1">
    <button
      type="button"
      onClick={() => setMessageMode("single")}
      className={`rounded-md px-4 py-2 text-sm ${
        messageMode === "single"
          ? "bg-white text-black"
          : "text-neutral-400 hover:text-white"
      }`}
    >
      Single Model
    </button>

    <button
      type="button"
      onClick={() => setMessageMode("team")}
      className={`rounded-md px-4 py-2 text-sm ${
        messageMode === "team"
          ? "bg-white text-black"
          : "text-neutral-400 hover:text-white"
      }`}
    >
      Team Mode Pro
    </button>
  </div>

  <p className="text-xs text-neutral-500">
    Team Mode uses reasoning → execution → review.
  </p>
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

      {/* ── Usage Analysis panel ─────────────────────────────────────────── */}
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
              <p className="mt-2 text-3xl font-bold">
  {usage?.totalTokensToday ?? 0}
</p>

<p className="text-sm text-neutral-500">
  Cost today: ${usage?.totalCostToday?.toFixed(4) || "0.0000"}
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
                        <p className="text-xs text-neutral-400">
  Cost: ${item.costToday?.toFixed(4) || "0.0000"}
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
  <h3 className="font-semibold mb-4">Usage Trend</h3>

  {usage?.usageByDay?.length ? (
    <div style={{ width: "100%", height: 260, minHeight: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={usage.usageByDay}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="tokens_used"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p className="text-sm text-neutral-500">No data yet</p>
  )}
</div>
<div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
  <h3 className="font-semibold mb-4">Usage by Provider</h3>

  {usage?.providerUsage?.length ? (
    <div style={{ width: "100%", height: 260, minHeight: 260 }}> 
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={usage.providerUsage}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="provider"
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} />
          <Tooltip />
          <Bar dataKey="usedToday" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p className="text-sm text-neutral-500">No provider usage yet</p>
  )}
</div>
          </aside>
        </div>
      )}

      {/* ── Project Settings Modal ───────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[700px] max-w-full rounded-2xl border border-neutral-800 bg-black p-6">

            <h2 className="text-lg font-semibold mb-4">
              Project Settings
            </h2>

            {/* Name */}
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 mb-3 text-white outline-none"
              placeholder="Project name"
            />

            {/* Description */}
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 mb-3 text-white outline-none resize-none"
              rows={2}
              placeholder="Description"
            />

            {/* Markdown Toolbar */}
            <div className="flex gap-2 mb-2 text-sm">
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "**bold** ")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800 font-bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "*italic* ")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800 italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "- item\n")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "## Heading\n")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800"
              >
                H
              </button>
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "> quote\n")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800"
              >
                ❝
              </button>
              <button
                type="button"
                onClick={() => setEditInstructions((prev) => prev + "`code` ")}
                className="rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800 font-mono"
              >
                {"</>"}
              </button>
            </div>

            {/* Instructions */}
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              className="w-full h-40 rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-white outline-none resize-none font-mono text-sm"
              placeholder="Project instructions (max 4000 chars)"
            />

            <p className="text-xs text-neutral-500 mt-1">
              {editInstructions.length}/4000
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProjectSettings}
                className="rounded-lg bg-white px-4 py-2 text-black text-sm font-medium hover:bg-neutral-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {membersOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Members</h2>
          <p className="text-sm text-neutral-500">
            Invite teammates and manage access.
          </p>
        </div>

        <button
          onClick={() => setMembersOpen(false)}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
        >
          Close
        </button>
      </div>

      {myProjectRole === "owner" && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-4">
          <p className="text-sm font-medium">Invite teammate</p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-neutral-600"
            />

            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "editor" | "viewer")
              }
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>

            <button
              onClick={inviteMember}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Invite
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            The user must already have a CoWork.ai account.
          </p>
        </div>
      )}

      {myProjectRole !== "owner" && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-4 text-sm text-neutral-400">
          You can view members, but only the project owner can invite or remove teammates.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {members.length === 0 ? (
          <p className="text-sm text-neutral-500">No members found.</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-black px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{member.email}</p>
                <p className="text-xs capitalize text-neutral-500">
                  {member.role}
                </p>
              </div>

              {myProjectRole === "owner" && member.role !== "owner" && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
    </main>
  );
}