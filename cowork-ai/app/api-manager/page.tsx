"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApiKey = {
  id: string;
  provider: string;
  status: string;
  model_config: unknown;
  created_at: string;
  updated_at: string;
};

type RoleAssignment = {
  id: string;
  role: string;
  provider: string;
  custom_key_id: string | null;
  updated_at: string;
};

const providers = [
  { value: "google", label: "Google Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "openai", label: "OpenAI" },
  { value: "perplexity", label: "Perplexity" },
];

const roles = [
  { value: "reasoning", label: "Reasoning" },
  { value: "research", label: "Research" },
  { value: "execution", label: "Execution" },
  { value: "reviewing", label: "Reviewing" },
];

export default function ApiManagerPage() {
  const router = useRouter();

  const [provider, setProvider] = useState("google");
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleForm, setRoleForm] = useState<Record<string, string>>({
    reasoning: "google",
    research: "openrouter",
    execution: "groq",
    reviewing: "google",
  });

  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  async function fetchKeysAndRoles() {
    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const keysRes = await fetch("/api/auth/keys", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (keysRes.status === 401) {
      localStorage.removeItem("token");
      router.push("/auth/login");
      return;
    }

    const keysData = await keysRes.json();
    setKeys(keysData.keys || []);

    const rolesRes = await fetch("/api/models/roles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const rolesData = await rolesRes.json();
    const loadedRoles = rolesData.roles || [];

    setRoleAssignments(loadedRoles);

    const nextRoleForm = { ...roleForm };

    loadedRoles.forEach((item: RoleAssignment) => {
      nextRoleForm[item.role] = item.provider;
    });

    setRoleForm(nextRoleForm);
    setPageLoading(false);
  }

  useEffect(() => {
    fetchKeysAndRoles();
  }, []);

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setApiKey("");
      setMessage("API key saved successfully.");
      await fetchKeysAndRoles();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRoles() {
    const token = getToken();

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setRoleLoading(true);
    setMessage("");

    try {
      for (const role of roles) {
        const res = await fetch("/api/models/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: role.value,
            provider: roleForm[role.value],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Failed to save ${role.label}`);
        }
      }

      setMessage("Role assignments saved successfully.");
      await fetchKeysAndRoles();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setRoleLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Loading API Manager...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <nav className="flex items-center justify-between border-b border-neutral-800 px-8 py-5">
        <h1 className="text-2xl font-bold">API Manager</h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
        >
          Back to Dashboard
        </button>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-8 px-8 py-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Connect AI Providers</h2>
          <p className="mt-2 text-neutral-400">
            Add your own API keys. Keys are encrypted and never returned to the frontend.
          </p>

          <form
            onSubmit={handleSaveKey}
            className="mt-6 space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Provider
              </label>

              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
              >
                {providers.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                API Key
              </label>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save API Key"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-4 text-xl font-semibold">Connected Providers</h3>

            {keys.length === 0 ? (
              <p className="text-neutral-400">No providers connected yet.</p>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div>
                      <p className="font-medium capitalize">{key.provider}</p>
                      <p className="text-sm text-neutral-500">
                        Updated: {new Date(key.updated_at).toLocaleString()}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-900 px-3 py-1 text-sm text-green-200">
                      {key.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold">Role Assignments</h2>
          <p className="mt-2 text-neutral-400">
            Choose which provider handles each AI role.
          </p>

          <div className="mt-6 space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            {roles.map((role) => (
              <div key={role.value}>
                <label className="mb-2 block text-sm text-neutral-300">
                  {role.label}
                </label>

                <select
                  value={roleForm[role.value]}
                  onChange={(e) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      [role.value]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
                >
                  {providers.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {message && <p className="text-sm text-neutral-300">{message}</p>}

            <button
              type="button"
              onClick={handleSaveRoles}
              disabled={roleLoading}
              className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
            >
              {roleLoading ? "Saving..." : "Save Role Assignments"}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-4 text-xl font-semibold">Current Assignments</h3>

            {roleAssignments.length === 0 ? (
              <p className="text-neutral-400">Using default assignments.</p>
            ) : (
              <div className="space-y-3">
                {roleAssignments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <p className="font-medium capitalize">{item.role}</p>
                    <p className="text-sm text-neutral-400 capitalize">
                      {item.provider}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}