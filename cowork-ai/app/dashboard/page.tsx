"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  userId: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  owner_email: string;
my_role: "owner" | "editor" | "viewer";
};



export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState("");


  async function fetchUserAndProjects() {
  const userRes = await fetch("/api/me", {
    credentials: "include", // ← sends cookie automatically
  });

  if (!userRes.ok) {
    router.push("/auth/login");
    return;
  }

  const userData = await userRes.json();
  setUser(userData.user);

  const projectRes = await fetch("/api/projects", {
    credentials: "include",
  });

  const projectData = await projectRes.json();
  setProjects(projectData.projects || []);
  setLoading(false);
}

  useEffect(() => {
    fetchUserAndProjects();
  }, []);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();

    setProjectLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // ← replaces Authorization header
  body: JSON.stringify({ name, description }),
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setName("");
      setDescription("");

      await fetchUserAndProjects();
    } catch (err) {
  setError(err instanceof Error ? err.message : "Failed to create project");
}
    finally {
      setProjectLoading(false);
    }
  }

  async function handleDeleteProject(projectId: string) {

    const confirmed = confirm("Delete this project? This cannot be undone.");

    if (!confirmed) return;

    await fetch(`/api/projects/${projectId}`, {
  method: "DELETE",
  credentials: "include", // ← replaces Authorization header
});

    await fetchUserAndProjects();
  }

  async function handleLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  router.push("/auth/login");
}

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Loading dashboard...
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
            onClick={() => router.push("/api-manager")}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
          >
            API Manager
          </button>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Your Projects</h2>
          <p className="mt-2 text-neutral-400">
            Create AI workspaces with persistent conversation memory.
          </p>
        </div>

        <form
          onSubmit={handleCreateProject}
          className="mb-10 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
        >
          <h3 className="text-xl font-semibold">Create New Project</h3>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project description"
            className="min-h-24 w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-white"
          />

          <button
            type="submit"
            disabled={projectLoading}
            className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
          >
            {projectLoading ? "Creating..." : "Create Project"}
          </button>
        </form>

        <div className="grid gap-4">
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
              No projects yet. Create your first project above.
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold">{project.name} &nbsp;
                     {project.my_role !== "owner" && (
    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
      Shared
    </span>
  )}<span className="rounded-full border border-neutral-800 px-2 py-0.5 text-xs capitalize text-neutral-500">
    {project.my_role}
  </span></h3>
                    <p className="mt-2 text-neutral-400">
                      {project.description || "No description"}
                    </p>
                    {project.my_role !== "owner" && (
  <p className="mt-2 text-xs text-neutral-500">
    Owner: {project.owner_email}
  </p>
)}
                    <p className="mt-3 text-sm text-neutral-500">
                      Updated: {new Date(project.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-300 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}