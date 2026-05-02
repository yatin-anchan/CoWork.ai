"use client";

import { useEffect, useRef, useState } from "react";
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

type Chat = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
  creator_email?: string;       // ← add
  creator_role?: string;        // ← add
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  memory_summary?: string | null;
  memory_updated_at?: string | null;
  my_role: "owner" | "editor" | "viewer";
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

  // Chat states
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatListOpen, setChatListOpen] = useState(false);

  // Use a ref so rename callbacks always see the current chatId without stale closure
  const activeChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Chat title rename states
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [chatTitleDraft, setChatTitleDraft] = useState("");

  const canEditProject = project?.my_role === "owner" || project?.my_role === "editor";
  const canManageProject = project?.my_role === "owner";
  const canSendMessages = project?.my_role === "owner" || project?.my_role === "editor";

  // Project Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");

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
      providerOptions.find((item) => item.value === provider)?.label || provider
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

  async function retryAssistantMessage(assistantMessageId: string) {
  if (!activeChatId) {
    alert("Select a chat first.");
    return;
  }

  const assistantIndex = messages.findIndex(
    (message) => message.id === assistantMessageId
  );

  if (assistantIndex <= 0) {
    alert("No previous user message found.");
    return;
  }

  const previousUserMessage = [...messages]
    .slice(0, assistantIndex)
    .reverse()
    .find((message) => message.role === "user");

  if (!previousUserMessage) {
    alert("No previous user message found.");
    return;
  }

  const token = getToken();

  if (!token) {
    router.push("/auth/login");
    return;
  }

  setIsStreaming(true);

  setMessages((prev) =>
    prev.map((message) =>
      message.id === assistantMessageId
        ? {
            ...message,
            content: "",
            model:
              messageMode === "team"
                ? "team-mode"
                : selectedRole === "auto"
                  ? "streaming"
                  : getProviderLabel(roleProviders[selectedRole]),
          }
        : message
    )
  );

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
        content: previousUserMessage.content,
        selectedRole,
        chatId: activeChatId,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || "Failed to retry message.");
      return;
    }

    if (messageMode === "team") {
      const data = await res.json();

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                model: "team-mode",
                content: data.assistantMessage?.content || "",
              }
            : message
        )
      );

      await fetchChatMessages(activeChatId);
      return;
    }

    if (!res.body) {
      alert("Streaming response was empty.");
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
          message.id === assistantMessageId
            ? {
                ...message,
                content: streamedText,
              }
            : message
        )
      );
    }

    await fetchChatMessages(activeChatId);
  } catch (error) {
    console.error("Retry error:", error);
    alert("Failed to retry message.");
  } finally {
    setIsStreaming(false);
    await fetchUsage();
  }
}

  async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    alert("Failed to copy.");
  }
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
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members || []);
    setMyProjectRole(data.myRole || null);
  }

  async function inviteMember() {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    if (!inviteEmail.trim()) { alert("Enter an email address."); return; }

    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to invite member."); return; }
    setInviteEmail("");
    setInviteRole("viewer");
    await fetchMembers();
  }

  async function removeMember(userId: string) {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    const confirmed = confirm("Remove this member from the project?");
    if (!confirmed) return;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to remove member."); return; }
    await fetchMembers();
  }

  async function fetchRoleAssignments() {
    const token = getToken();
    if (!token) return;

    const [globalRes, projectRes] = await Promise.all([
      fetch("/api/models/roles", { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/projects/${projectId}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

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
          if (item.role in nextProviders) nextProviders[item.role] = item.provider;
        }
      );
    }
    if (projectRes.ok) {
      const projectData = await projectRes.json();
      projectData.roles?.forEach(
        (item: { role: keyof RoleProviderMap; provider: string }) => {
          if (item.role in nextProviders) nextProviders[item.role] = item.provider;
        }
      );
    }
    setRoleProviders(nextProviders);
  }

  async function fetchProject() {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem("token"); router.push("/auth/login"); return; }
      if (res.status === 404) { router.push("/dashboard"); return; }
      if (!res.ok) { console.error(`fetchProject failed: ${res.status}`); setLoading(false); return; }

      const text = await res.text();
      if (!text) { console.error("fetchProject: empty response body"); setLoading(false); return; }

      const data = JSON.parse(text);
      setProject(data.project);
      await fetchRoleAssignments();
      await fetchUsage();
    } catch (err) {
      console.error("fetchProject error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Always pass a real UUID or nothing — never an empty string
  async function fetchChats(currentActiveChatId?: string | null) {
    const token = getToken();
    if (!token) return;

    const activeId = currentActiveChatId ?? activeChatIdRef.current ?? null;
    const url = activeId
      ? `/api/projects/${projectId}/chats?activeChatId=${activeId}`
      : `/api/projects/${projectId}/chats`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    const nextChats: Chat[] = data.chats || [];
    setChats(nextChats);

    setActiveChatId((prev) => {
      if (!prev && nextChats.length > 0) return nextChats[0].id;
      return prev;
    });

    return nextChats;
  }

  async function fetchChatMessages(chatId: string) {
    const token = getToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${projectId}/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    setMessages(data.contexts || []);
  }

  async function createNewChat() {
    const token = getToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${projectId}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visibility: "public" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to create chat."); return; }

    const newChat: Chat = data.chat;

    // Inject immediately so the title is available for rename before fetchChats returns
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    activeChatIdRef.current = newChat.id;
    setChatTitleDraft(newChat.title);
    setMessages([]);

    // Sync with server — pass the new id explicitly so it's pinned even though it's empty
    await fetchChats(newChat.id);
  }

  async function updateChatVisibility(chatId: string, visibility: "public" | "private") {
    const token = getToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${projectId}/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visibility }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to update chat."); return; }
    await fetchChats();
  }

  // Accept an explicit chatId so this always works even right after creation
  async function updateChatTitle(chatId?: string) {
    const targetId = chatId ?? activeChatIdRef.current;
    if (!targetId || !chatTitleDraft.trim()) return;
    const token = getToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${projectId}/chats/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: chatTitleDraft.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to rename chat."); return; }

    // Real-time optimistic update in both chat header and chat list
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === targetId ? { ...chat, title: data.chat.title } : chat
      )
    );
    setEditingChatTitle(false);
  }

  async function deleteChat() {
    if (!activeChatId) return;
    const confirmed = confirm("Delete this chat and all its messages?");
    if (!confirmed) return;
    const token = getToken();
    if (!token) return;

    const res = await fetch(`/api/projects/${projectId}/chats/${activeChatId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("Failed to delete chat."); return; }

    setMessages([]);
    setActiveChatId(null);
    activeChatIdRef.current = null;
    await fetchChats(null);
  }

  // Mount: load project and chats in parallel
  useEffect(() => {
    fetchProject();
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      fetchChatMessages(activeChatId);
      setEditingChatTitle(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // Sync title draft when active chat or chat list changes
  useEffect(() => {
    const activeChat = chats.find((chat) => chat.id === activeChatId);
    if (activeChat) setChatTitleDraft(activeChat.title);
  }, [activeChatId, chats]);

  // Populate settings fields when project loads
  useEffect(() => {
    if (project) {
      setEditName(project.name || "");
      setEditDescription(project.description || "");
      setEditInstructions(project.instructions || "");
    }
  }, [project]);

  async function updateRoleProvider(role: keyof RoleProviderMap, provider: string) {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setRoleProviders((prev) => ({ ...prev, [role]: provider }));
    const res = await fetch(`/api/projects/${projectId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role, provider }),
    });
    if (!res.ok) { alert("Failed to update project model."); return; }
    await fetchRoleAssignments();
  }

  async function saveProjectSettings() {
    const token = getToken();
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        instructions: editInstructions.slice(0, 4000),
      }),
    });
    if (!res.ok) { alert("Failed to update project."); return; }
    await fetchProject();
    setShowSettings(false);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!canSendMessages) { alert("Viewer access cannot send messages."); return; }
    if (!activeChatId) { alert("Create or select a chat first."); return; }
    if (!input.trim()) return;

    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: messageText, selectedRole, chatId: activeChatId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to send message.");
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMessage.id && m.id !== tempAssistantMessage.id)
        );
        return;
      }

      if (messageMode === "team") {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantMessage.id
              ? { ...m, model: "team-mode", content: data.assistantMessage?.content || "" }
              : m
          )
        );
        await fetchProject();
        return;
      }

      if (!res.body) {
        alert("Streaming response was empty.");
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMessage.id && m.id !== tempAssistantMessage.id)
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
          prev.map((m) =>
            m.id === tempAssistantMessage.id ? { ...m, content: streamedText } : m
          )
        );
      }

      await fetchProject();
    } catch (error) {
      console.error("Message send error:", error);
      alert("Failed to send message.");
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMessage.id && m.id !== tempAssistantMessage.id)
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
            onClick={async () => { setMembersOpen(true); await fetchMembers(); }}
            title="Project members"
            className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            <UserPlus size={16} />
            {canManageProject ? "Invite" : "Members"}
          </button>
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
            onClick={() => setSidebarOpen((v) => !v)}
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
              <h2 className="truncate text-sm font-semibold text-white">{project?.name}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                {project?.description || "No description"}
              </p>
            </div>

            <div className="mt-8 space-y-2">
              <button
                onClick={createNewChat}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-left text-sm font-medium text-black hover:bg-neutral-200"
              >
                + New Chat
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                <LayoutDashboard size={16} />
                New Project
              </button>

              <button
                onClick={() => setChatListOpen(true)}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                Chat List
              </button>

              <button
                onClick={deleteChat}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-900"
              >
                Delete Chat
              </button>

              <button
                onClick={() => router.push("/api-manager")}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-900"
              >
                API Manager
              </button>

              {canEditProject && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                >
                  Project Settings
                </button>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-neutral-800 bg-black p-4 text-sm">
              <p className="font-medium text-white">Token Usage</p>
              <p className="mt-2 text-3xl font-bold">{usage?.totalTokensToday ?? 0}</p>
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
          {/* Chat header with inline rename */}
          <div className="shrink-0 border-b border-neutral-800 px-6 py-4">
            {editingChatTitle ? (
              <input
                value={chatTitleDraft}
                onChange={(e) => setChatTitleDraft(e.target.value)}
                onBlur={() => updateChatTitle()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateChatTitle();
                  if (e.key === "Escape") setEditingChatTitle(false);
                }}
                autoFocus
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-base font-semibold text-white outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => activeChatIdRef.current && setEditingChatTitle(true)}
                title={activeChatIdRef.current ? "Click to rename" : undefined}
                className={`text-base font-semibold ${
                  activeChatIdRef.current ? "cursor-pointer hover:underline" : "cursor-default"
                }`}
              >
                {chats.find((c) => c.id === activeChatId)?.title || project?.name || "New Chat"}
              </button>
            )}
            {activeChatId && !editingChatTitle && (
              <p className="mt-0.5 text-xs text-neutral-600">Click title to rename</p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                    <Bot size={24} />
                  </div>
                  <p className="mt-4 text-lg font-semibold">Start with a selected model</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Use the bottom model row to switch providers without opening API Manager.
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
                   <div className="group">
  <RichMessage content={message.content} />

  <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
    <button
      type="button"
      onClick={() => copyToClipboard(message.content)}
      className="rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
    >
      Copy
    </button>

    {canSendMessages && message.role === "assistant" && (
      <button
        type="button"
        onClick={() => retryAssistantMessage(message.id)}
        className="rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
      >
        Retry
      </button>
    )}

    {canSendMessages && message.role === "user" && (
      <button
        type="button"
        onClick={() => setInput(message.content)}
        className="rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-white"
      >
        Edit
      </button>
    )}
  </div>
</div>
                    {message.model && (
                      <p className="mt-2 text-xs text-neutral-500">Model: {message.model}</p>
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
                  disabled={!canSendMessages}
                  placeholder={
                    canSendMessages
                      ? "Message CoWork.ai..."
                      : "Viewer access: messaging is disabled"
                  }
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600 disabled:cursor-not-allowed disabled:text-neutral-600"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim() || !canSendMessages}
                  className="ml-3 rounded-xl bg-white p-2 text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                      messageMode === "single" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Single Model
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageMode("team")}
                    className={`rounded-md px-4 py-2 text-sm ${
                      messageMode === "team" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
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
                  No API keys connected. Go to API Manager to connect at least one model provider.
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {roleButtons.map((role) => {
                  const active = selectedRole === role.value;
                  const providerLabel = getProviderLabel(roleProviders[role.value]);

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
                        onClick={() => { if (!canEditProject) return; setSelectedRole(role.value); }}
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
                          onChange={(e) => updateRoleProvider(role.value, e.target.value)}
                          disabled={connectedOptions.length === 0 || !canEditProject}
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
                  onClick={() => { if (!canEditProject) return; setSelectedRole("auto"); }}
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

      {/* Chat List modal */}
      {chatListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chats</h2>
              <button
                onClick={() => setChatListOpen(false)}
                className="rounded-lg border border-neutral-800 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {chats.length === 0 ? (
                <p className="text-sm text-neutral-500">No chats yet. Create one to get started.</p>
              ) : (
                chats.map((chat) => (
  <div
    key={chat.id}
    onClick={() => { setActiveChatId(chat.id); setChatListOpen(false); }}
    className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
      activeChatId === chat.id
        ? "border-white bg-white text-black"
        : "border-neutral-800 bg-black text-white hover:bg-neutral-900"
    }`}
  >
    <div>
      <p className="text-sm font-medium">{chat.title}</p>
      <p className="text-xs opacity-60">
        {new Date(chat.updated_at).toLocaleString()}
      </p>
      {chat.creator_email && (
        <p className={`text-xs mt-0.5 ${activeChatId === chat.id ? "text-neutral-600" : "text-neutral-500"}`}>
          Created by {chat.creator_email}
          {chat.creator_role && (
            <span className="ml-1 capitalize rounded-full border px-1.5 py-0.5 text-[10px] border-neutral-700">
              {chat.creator_role}
            </span>
          )}
        </p>
      )}
    </div>

    {project?.my_role === "owner" ? (
      <select
        value={chat.visibility}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) =>
          updateChatVisibility(chat.id, e.target.value as "public" | "private")
        }
        className={`rounded-lg border px-2 py-1 text-xs ${
          activeChatId === chat.id
            ? "border-neutral-400 bg-white text-black"
            : "border-neutral-700 bg-black text-white"
        }`}
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    ) : (
      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
        {chat.visibility}
      </span>
    )}
  </div>
))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Usage Analysis panel */}
      {usageOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <aside className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Usage Analysis</h2>
                <p className="text-sm text-neutral-500">Token usage across connected models.</p>
              </div>
              <button
                onClick={() => setUsageOpen(false)}
                className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <p className="mt-2 text-3xl font-bold">{usage?.totalTokensToday ?? 0}</p>
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
                      item.limit > 0 ? Math.min((item.usedToday / item.limit) * 100, 100) : 0;
                    return (
                      <div key={item.provider}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="capitalize">{item.provider}</span>
                          <span className="text-neutral-500">{item.usedToday} / {item.limit}</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800">
                          <div className="h-2 rounded-full bg-white" style={{ width: `${percentage}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">Remaining: {item.remaining}</p>
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
                      <span className="text-neutral-400">{item.tokens_used} tokens</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-black p-5">
              <h3 className="font-semibold mb-4">Usage Trend</h3>
              {usage?.usageByDay?.length ? (
                <div style={{ width: "100%", height: 260,  minHeight: 260 }}>
                  <ResponsiveContainer width="100%"  height={260}>
                    <LineChart data={usage.usageByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a3a3a3" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="tokens_used" strokeWidth={2} />
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
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={usage.providerUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="provider" tick={{ fontSize: 12, fill: "#a3a3a3" }} />
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

      {/* Project Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[700px] max-w-full rounded-2xl border border-neutral-800 bg-black p-6">
            <h2 className="text-lg font-semibold mb-4">Project Settings</h2>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 mb-3 text-white outline-none"
              placeholder="Project name"
            />

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2 mb-3 text-white outline-none resize-none"
              rows={2}
              placeholder="Description"
            />

            <div className="flex gap-2 mb-2 text-sm">
              {[
                { label: "B", cls: "font-bold", insert: "**bold** " },
                { label: "I", cls: "italic", insert: "*italic* " },
                { label: "•", cls: "", insert: "- item\n" },
                { label: "H", cls: "", insert: "## Heading\n" },
                { label: "❝", cls: "", insert: "> quote\n" },
                { label: "</>", cls: "font-mono", insert: "`code` " },
              ].map(({ label, cls, insert }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setEditInstructions((prev) => prev + insert)}
                  className={`rounded px-2 py-1 border border-neutral-700 hover:bg-neutral-800 ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              className="w-full h-40 rounded-lg border border-neutral-800 bg-neutral-950 p-2 text-white outline-none resize-none font-mono text-sm"
              placeholder="Project instructions (max 4000 chars)"
            />
            <p className="text-xs text-neutral-500 mt-1">{editInstructions.length}/4000</p>

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

      {/* Members Modal */}
      {membersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Project Members</h2>
                <p className="text-sm text-neutral-500">Invite teammates and manage access.</p>
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
                    onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
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
                      <p className="text-xs capitalize text-neutral-500">{member.role}</p>
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