"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => { if (res.ok) router.replace("/dashboard"); })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) throw new Error(data.error || "Login failed. Please try again.");
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.26),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_46%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr]">

        {/* ── Left panel ── */}
        <div className="hidden border-r border-white/10 bg-white/[0.025] p-10 md:flex md:flex-col md:justify-between">
          <div>
            {/* Logo */}
            <a href="/" className="mb-10 flex items-center gap-3 no-underline">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
                <span className="text-lg font-black">C</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                CoWork<span className="text-violet-300">AI</span>
              </span>
            </a>

            {/* Headline */}
            <p className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">
              Multi-model workspace
            </p>
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight">
              Welcome back to<br />your AI team.
            </h1>
            <p className="mb-8 text-sm leading-7 text-slate-400">
              Pick up right where you left off. Your projects, chats, and model configurations are waiting.
            </p>

            {/* Feature list */}
            <div className="mb-8 space-y-3">
              {[
                { icon: "🧠", label: "Persistent project memory",    sub: "AI remembers context across all chats" },
                { icon: "⚡", label: "Multi-model routing",           sub: "Reasoning, Research, Execution & Review" },
                { icon: "👥", label: "Team Mode collaboration",       sub: "4 models work together on one message" },
                { icon: "🔑", label: "Bring your own API keys",       sub: "Pay providers directly, no markup" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-sm">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: "6+",    label: "AI Providers" },
              { val: "BYOK",  label: "Your Keys" },
              { val: "Free",  label: "To Start" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                <div className="font-['Syne',sans-serif] text-lg font-black text-indigo-300">{s.val}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <form onSubmit={handleLogin} className="flex flex-col justify-between p-7 sm:p-10">
          <div>
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

            <h2 className="text-2xl font-black tracking-tight">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-400">Enter your credentials to access your workspace.</p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* Email */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-300">Email Address</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                />
              </label>

              {/* Password */}
              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Password</span>
                  <a href="/auth/forgot-password" className="text-xs text-indigo-400 transition hover:text-indigo-300">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 transition hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <a href="/auth/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
                Create one free
              </a>
            </p>
          </div>

          {/* ── Bottom trust section — fills the empty space ── */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span>Why CoWork.ai?</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "🔒", title: "Keys never exposed",   sub: "Encrypted at rest, never returned to frontend" },
                { icon: "💸", title: "No markup on AI",      sub: "Pay providers directly at their own rates" },
                { icon: "🆓", title: "Free to start",        sub: "No credit card. Use Groq for free forever." },
                { icon: "⚡", title: "Ultra-fast responses",  sub: "Groq LPU runs at 800+ tokens/sec" },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="mb-1 text-base">{c.icon}</div>
                  <div className="text-xs font-semibold text-slate-300">{c.title}</div>
                  <div className="mt-0.5 text-[10.5px] leading-relaxed text-slate-600">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Provider logos row */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Works with
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {[
                  { icon: "✦", label: "Gemini",      color: "#4285F4" },
                  { icon: "◎", label: "OpenAI",      color: "#10a37f" },
                  { icon: "◈", label: "Claude",      color: "#d97757" },
                  { icon: "⚡", label: "Groq",        color: "#f55036" },
                  { icon: "◉", label: "Perplexity",  color: "#20b2aa" },
                  { icon: "⊕", label: "OpenRouter",  color: "#9061f9" },
                ].map((p) => (
                  <div key={p.label} className="flex flex-col items-center gap-1">
                    <span style={{ color: p.color }} className="text-base leading-none">{p.icon}</span>
                    <span className="text-[9px] text-slate-600">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}