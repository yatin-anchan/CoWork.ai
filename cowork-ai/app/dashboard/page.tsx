"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  userId: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }

    fetchUser();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <nav className="flex items-center justify-between border-b border-neutral-800 px-8 py-5">
        <h1 className="text-2xl font-bold">CoWork.ai</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user?.email}</span>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-neutral-400">
            Manage your AI projects, API keys, and model workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <button
            onClick={() => router.push("/api-manager")}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left hover:bg-neutral-800"
          >
            <h3 className="text-xl font-semibold">API Manager</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Connect Gemini, Groq, OpenRouter, or custom models.
            </p>
          </button>

          <button
            onClick={() => router.push("/project/new")}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left hover:bg-neutral-800"
          >
            <h3 className="text-xl font-semibold">New Project</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Start a new AI workspace with shared context.
            </p>
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left hover:bg-neutral-800"
          >
            <h3 className="text-xl font-semibold">Settings</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Manage your account and preferences.
            </p>
          </button>
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="text-xl font-semibold">Projects</h3>
          <p className="mt-2 text-neutral-400">
            No projects yet. Create your first project to begin.
          </p>
        </div>
      </section>
    </main>
  );
}