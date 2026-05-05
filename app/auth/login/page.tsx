"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) router.replace("/dashboard");
      })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ No localStorage — cookie is set by server automatically
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.26),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_46%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl md:grid-cols-[1fr_0.9fr]">

        {/* Left panel */}
        <div className="hidden border-r border-white/10 bg-white/[0.025] p-10 md:block">
          <a href="/" className="mb-16 flex items-center gap-3 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <span className="text-lg font-black">C</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              CoWork<span className="text-violet-300">AI</span>
            </span>
          </a>

          <div className="max-w-sm">
            <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">
              Multi-model workspace
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              Build with your AI team from day one.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Create your workspace, connect your AI providers, and start
              building with persistent project memory and multi-model routing.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              {[
                "Free to get started",
                "Bring your own API keys",
                "Multi-chat project workflows",
                "Team Mode with role-based models",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-xs text-indigo-300">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <form onSubmit={handleRegister} className="p-7 sm:p-10">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden">
            <a href="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
                <span className="text-lg font-black">C</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                CoWork<span className="text-violet-300">AI</span>
              </span>
            </a>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Free forever. No credit card required.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-7 space-y-5">
            {/* Name */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Full Name
              </span>
              <input
                type="text"
                placeholder="Your name"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>

            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Email Address
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            By creating an account you agree to our{" "}
            <a href="/terms" className="text-indigo-300 hover:text-indigo-200">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-indigo-300 hover:text-indigo-200">Privacy Policy</a>.
          </p>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <a href="/auth/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Sign in
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}