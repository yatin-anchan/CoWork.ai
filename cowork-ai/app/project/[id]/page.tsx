"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  Brain,
  Code2,
  Compass,
  FileSearch,
  Menu,
  Plus,
  Send,
  Settings,
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

const roleButtons: {
  value: SelectedRole;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "reasoning",
    label: "Reasoning",
    icon: <Brain size={18} />,
  },
  {
    value: "research",
    label: "Research",
    icon: <FileSearch size={18} />,
  },
  {
    value: "execution",
    label: "Execution",
    icon: <Code2 size={18} />,
  },
  {
    value: "reviewing",
    label: "Reviewing",
    icon: <Compass size={18} />,
  },
  {
    value: "auto",
    label: "Auto",
    icon: <Bot size={18} />,
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
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        Loading project...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <header className="flex h-[62px] items-center border-b border-black bg-neutral-200 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
            <Bot size={22} />
          </div>
          <h1 className="text-xl font-bold">CoWork - AI</h1>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="flex w-16 flex-col items-center justify-between border-r border-black bg-neutral-200 py-6">
          <div className="space-y-6">
            <button
              onClick={() => setSidebarOpen((value) => !value)}
              className="rounded-md p-2 hover:bg-neutral-300"
            >
              {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          <div className="space-y-6">
            <button
              onClick={() => router.push("/settings")}
              className="rounded-md p-2 hover:bg-neutral-300"
            >
              <User size={28} />
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="rounded-md p-2 hover:bg-neutral-300"
            >
              <Settings size={28} />
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <aside className="w-64 border-r border-black bg-neutral-200 p-5">
            <h2 className="font-semibold">{project?.name}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {project?.description || "No description"}
            </p>

            <div className="mt-8 space-y-3">
              <button className="w-full rounded-lg border border-black bg-white px-4 py-2 text-left text-sm hover:bg-neutral-100">
                + New Chat
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-lg border border-black bg-white px-4 py-2 text-left text-sm hover:bg-neutral-100"
              >
                New Project
              </button>

              <button className="w-full rounded-lg border border-black bg-white px-4 py-2 text-left text-sm hover:bg-neutral-100">
                History
              </button>

              <button
                onClick={() => router.push("/api-manager")}
                className="w-full rounded-lg border border-black bg-white px-4 py-2 text-left text-sm hover:bg-neutral-100"
              >
                API Manager
              </button>

              <button
                onClick={() => router.push("/settings")}
                className="w-full rounded-lg border border-black bg-white px-4 py-2 text-left text-sm hover:bg-neutral-100"
              >
                Settings
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-black bg-white p-4 text-sm">
              <p className="font-semibold">Token Usage</p>
              <p className="mt-2 text-neutral-600">Used: 0</p>
              <p className="text-neutral-600">Remaining: Not tracked yet</p>
              <p className="text-neutral-600">Mode: {selectedRole}</p>
            </div>
          </aside>
        )}

        <section className="relative flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-8 pb-44">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-neutral-500">
                <div>
                  <p className="text-xl font-semibold text-black">
                    Start with a selected AI role
                  </p>
                  <p className="mt-2 text-sm">
                    Choose Reasoning, Research, Execution, or Reviewing before sending.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl border border-black p-4 ${
                      message.role === "user"
                        ? "ml-auto bg-neutral-200"
                        : "mr-auto bg-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

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
            className="absolute bottom-8 left-1/2 w-full max-w-5xl -translate-x-1/2 px-6"
          >
            <div className="flex items-center rounded-[28px] border border-black bg-neutral-200 px-5 py-4">
              <button
                type="button"
                className="mr-5 rounded-full p-1 hover:bg-neutral-300"
              >
                <Plus size={28} />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type Here............"
                className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-neutral-500"
              />

              <button
                type="submit"
                className="ml-5 rounded-full bg-black p-2 text-white hover:bg-neutral-800"
              >
                <Send size={20} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-4">
              {roleButtons.map((role) => {
                const active = selectedRole === role.value;

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                      active
                        ? "bg-black text-white"
                        : "bg-neutral-200 text-black hover:bg-neutral-300"
                    }`}
                  >
                    {role.icon}
                    {role.label}
                  </button>
                );
              })}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}