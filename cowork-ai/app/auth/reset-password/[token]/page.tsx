"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 text-white">
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
              Account Security
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              Set a new password for your workspace.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              Choose a strong password to keep your projects, API keys, and
              team collaborations secure.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              {[
                "At least 6 characters long",
                "Mix letters, numbers and symbols",
                "Never reuse old passwords",
                "Keep it unique to CoWork AI",
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

        {/* Right panel */}
        <form onSubmit={handleSubmit} className="p-7 sm:p-10">
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
            <h2 className="text-2xl font-black tracking-tight">Reset password</h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter and confirm your new password below.
            </p>
          </div>

          {status === "error" && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                New Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
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

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Confirm Password
              </span>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || status === "success"}
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Remember your password?{" "}
            <a
              href="/auth/login"
              className="font-semibold text-indigo-300 hover:text-indigo-200"
            >
              Sign in
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}