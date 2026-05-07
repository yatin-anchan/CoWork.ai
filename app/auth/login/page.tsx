"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Theme persistence key ────────────────────────────────────────────────────
const THEME_KEY = "coworkai-theme";

// ─── Icon ────────────────────────────────────────────────────────────────────
function Icon({
  name,
  size = 20,
  style = {},
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="material-icons-round"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// ─── Global styles + fonts ────────────────────────────────────────────────────
function GlobalStyles({ dark }: { dark: boolean }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
        rel="stylesheet"
      />
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
  margin: 0;
  font-family: "Inter", sans-serif;
  background: ${dark ? "#020617" : "#f8fafc"};
  overflow: hidden; /* ✅ THIS STOPS SCROLL */
}
        ::selection {
          background: ${dark ? "rgba(139,92,246,0.35)" : "rgba(79,70,229,0.18)"};
        }
        ::-webkit-scrollbar { width: 7px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.18)"};
          border-radius: 999px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.65s ease both; }
        .fade-up-1 { animation: fadeUp 0.65s 0.08s ease both; }
        .fade-up-2 { animation: fadeUp 0.65s 0.16s ease both; }
        .fade-up-3 { animation: fadeUp 0.65s 0.24s ease both; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px ${dark ? "#050816" : "#f0f4ff"} inset !important;
          -webkit-text-fill-color: ${dark ? "#f8fafc" : "#0f172a"} !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}

// ─── Particle system (identical to landing page) ───────────────────────────────
type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; opacity: number;
  depth: number;
  pulse: number; pulseSpeed: number;
};

function ParticleCanvas({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    const COUNT = 90;
    particlesRef.current = Array.from({ length: COUNT }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * (0.08 + depth * 0.22),
        vy: (Math.random() - 0.5) * (0.08 + depth * 0.22),
        radius: 1 + depth * 3.5,
        opacity: 0.08 + depth * 0.38,
        depth,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.004 + Math.random() * 0.008,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      if (mx > -999) {
        const glowR = 280;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
        if (dark) {
          grad.addColorStop(0, "rgba(99,102,241,0.13)");
          grad.addColorStop(0.45, "rgba(139,92,246,0.05)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          grad.addColorStop(0, "rgba(99,102,241,0.09)");
          grad.addColorStop(0.45, "rgba(79,70,229,0.03)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      const ps = particlesRef.current;
      for (const p of ps) {
        if (mx > -999 && p.depth > 0.55) {
          const dx = mx - p.x, dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const force = (1 - dist / 300) * 0.012 * p.depth;
            p.vx += dx * force * 0.01;
            p.vy += dy * force * 0.01;
          }
        }
        p.vx *= 0.998; p.vy *= 0.998;
        p.x += p.vx; p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const pulseScale = 1 + Math.sin(p.pulse) * 0.18;
        const r = p.radius * pulseScale;
        const alpha = p.opacity * (0.82 + Math.sin(p.pulse) * 0.18);

        if (p.depth > 0.6) {
          ctx.shadowColor = dark
            ? `rgba(139,92,246,${alpha * 0.35})`
            : `rgba(79,70,229,${alpha * 0.25})`;
          ctx.shadowBlur = r * 4;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(${p.depth > 0.6 ? "167,139,250" : "148,163,184"},${alpha})`
          : `rgba(${p.depth > 0.6 ? "99,102,241" : "148,163,184"},${alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.shadowBlur = 0;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j];
          if (Math.abs(a.depth - b.depth) > 0.3) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 110 + a.depth * 60;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.06 * a.depth;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = dark
              ? `rgba(139,92,246,${lineAlpha})`
              : `rgba(79,70,229,${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// ─── Cursor light (identical to landing page) ─────────────────────────────────
function CursorLight({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -9999, y: -9999 });
  const cur = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      cur.current.x += (pos.current.x - cur.current.x) * 0.07;
      cur.current.y += (pos.current.y - cur.current.y) * 0.07;
      if (ref.current) {
        ref.current.style.background = dark
          ? `radial-gradient(600px circle at ${cur.current.x}px ${cur.current.y}px, rgba(79,70,229,0.07) 0%, rgba(124,58,237,0.04) 30%, transparent 65%)`
          : `radial-gradient(600px circle at ${cur.current.x}px ${cur.current.y}px, rgba(79,70,229,0.055) 0%, rgba(99,102,241,0.025) 30%, transparent 65%)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
    };
  }, [dark]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// ─── Background (identical to landing page) ───────────────────────────────────
function Background({ dark }: { dark: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: dark
            ? `radial-gradient(circle at 18% 12%, rgba(79,70,229,0.22), transparent 32%),
               radial-gradient(circle at 82% 18%, rgba(14,165,233,0.13), transparent 30%),
               radial-gradient(circle at 50% 85%, rgba(124,58,237,0.10), transparent 34%),
               linear-gradient(180deg, #020617 0%, #050816 46%, #020617 100%)`
            : `radial-gradient(circle at 18% 10%, rgba(79,70,229,0.09), transparent 31%),
               radial-gradient(circle at 82% 18%, rgba(14,165,233,0.08), transparent 29%),
               radial-gradient(circle at 50% 80%, rgba(124,58,237,0.06), transparent 32%),
               linear-gradient(180deg, #f8fafc 0%, #eef2ff 44%, #ffffff 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            opacity: dark ? 0.12 : 0.18,
            backgroundImage: `
              linear-gradient(${dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)"} 1px, transparent 1px),
              linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)"} 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>
      <ParticleCanvas dark={dark} />
      <CursorLight dark={dark} />
    </>
  );
}

// ─── Theme toggle (identical to landing page) ─────────────────────────────────
function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        width: 44, height: 26, borderRadius: 999, cursor: "pointer",
        border: `1px solid ${dark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)"}`,
        background: dark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)",
        display: "flex", alignItems: "center", padding: 3,
      }}
    >
      <span
        style={{
          width: 20, height: 20, borderRadius: "50%",
          transform: dark ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.25s ease",
          background: dark
            ? "linear-gradient(135deg,#4f46e5,#8b5cf6)"
            : "linear-gradient(135deg,#4f46e5,#38bdf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={dark ? "dark_mode" : "light_mode"} size={12} style={{ color: "#fff" }} />
      </span>
    </button>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  dark, icon, label, sub,
}: { dark: boolean; icon: string; label: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 14,
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.72)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)"}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: 34, height: 34, flexShrink: 0, borderRadius: 10,
          background: dark ? "rgba(79,70,229,0.18)" : "rgba(79,70,229,0.09)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: dark ? "#e2e8f0" : "#0f172a",
        }}>{label}</div>
        <div style={{ fontSize: 11, color: dark ? "#64748b" : "#94a3b8", marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Stat badge ───────────────────────────────────────────────────────────────
function StatBadge({ dark, val, label }: { dark: boolean; val: string; label: string }) {
  return (
    <div
      style={{
        padding: "12px 8px", borderRadius: 14, textAlign: "center",
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.72)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)"}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{
        fontSize: 18, fontWeight: 900,
        color: dark ? "#a78bfa" : "#4f46e5",
        letterSpacing: "-0.03em",
      }}>{val}</div>
      <div style={{ fontSize: 11, color: dark ? "#64748b" : "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function InputField({
  dark, label, type, placeholder, value, onChange, autoFocus, autoComplete, extra,
}: {
  dark: boolean; label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  autoFocus?: boolean; autoComplete?: string;
  extra?: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 7,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "#cbd5e1" : "#334155" }}>
          {label}
        </span>
        {extra}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", borderRadius: 12, outline: "none",
          padding: "13px 16px", fontSize: 14,
          background: dark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.9)",
          border: `1px solid ${dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.12)"}`,
          color: dark ? "#f8fafc" : "#0f172a",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          fontFamily: "inherit",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = dark ? "rgba(139,92,246,0.55)" : "rgba(79,70,229,0.45)";
          e.currentTarget.style.boxShadow = dark
            ? "0 0 0 4px rgba(79,70,229,0.12)"
            : "0 0 0 4px rgba(79,70,229,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.12)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </label>
  );
}

// ─── Trust card ───────────────────────────────────────────────────────────────
function TrustCard({ dark, icon, title, sub }: { dark: boolean; icon: string; title: string; sub: string }) {
  return (
    <div
      style={{
        padding: "12px 10px", borderRadius: 12,
        background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.72)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)"}`,
      }}
    >
      <div style={{ fontSize: 15, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#cbd5e1" : "#1e293b" }}>{title}</div>
      <div style={{ fontSize: 10.5, lineHeight: 1.5, color: dark ? "#64748b" : "#94a3b8", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // Read theme from localStorage (synced with landing page)
  const [dark, setDark] = useState(true);
  const [themeReady, setThemeReady] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Hydrate theme from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored !== null) setDark(stored === "dark");
    } catch {}
    setThemeReady(true);
  }, []);

  const toggleTheme = () => {
    setDark((v) => {
      const next = !v;
      try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
      return next;
    });
  };

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

  if (checking || !themeReady) {
    return (
      <main
        style={{
          display: "flex",height: "100vh",
          alignItems: "center", justifyContent: "center",
          background: "#020617",
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "#8b5cf6",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  const cardBg = dark ? "rgba(5,8,22,0.72)" : "rgba(255,255,255,0.82)";
  const cardBorder = dark ? "rgba(148,163,184,0.14)" : "rgba(15,23,42,0.10)";
  const textPrimary = dark ? "#f8fafc" : "#0f172a";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const dividerColor = dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)";

  return (
    <>
      <GlobalStyles dark={dark} />

      {/* Fixed background (particles + cursor light + grid) */}
      <Background dark={dark} />

      {/* Theme toggle — top right */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 50 }}>
        <ThemeToggle dark={dark} toggle={toggleTheme} />
      </div>

      <main
        style={{
          position: "relative", zIndex: 1,
          minHeight: "100vh", display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "16px",
          color: textPrimary,
        }}
      >
        <div
          className="fade-up"
          style={{
            width: "100%", maxWidth: 930,maxHeight: "92vh",
            borderRadius: 28, overflow: "hidden",
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: dark
              ? "0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.08)"
              : "0 40px 100px rgba(15,23,42,0.12)",
            backdropFilter: "blur(20px)",
            display: "grid",
            gridTemplateColumns: "clamp(0px, 45%, 440px) 1fr",
          }}
        >
          {/* ── Left panel ── */}
          <div
            style={{
              padding: "32px 30px",
              borderRight: `1px solid ${dividerColor}`,
              background: dark ? "rgba(255,255,255,0.02)" : "rgba(248,250,252,0.72)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              // Hide on mobile via inline media query isn't possible — handled by grid col collapsing
            }}
            className="login-left-panel"
          >
            {/* Logo */}
            <div>
              <a
                href="/"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  textDecoration: "none", marginBottom: 32,
                }}
              >
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 28px rgba(79,70,229,0.28)",
                  }}
                >
                  <Icon name="hub" size={18} style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: textPrimary }}>
                  CoWork<span style={{ color: dark ? "#a78bfa" : "#4f46e5" }}>AI</span>
                </span>
              </a>

              <h1
                style={{
                  margin: "0 0 14px", fontSize: "clamp(1.5rem,3vw,2.1rem)",
                  fontWeight: 900, lineHeight: 1.08,
                  letterSpacing: "-0.045em", color: textPrimary,
                }}
              >
                Welcome to<br />your AI team.
              </h1>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {[
                  { icon: "🧠", label: "Persistent project memory", sub: "AI remembers context across all chats" },
                  { icon: "⚡", label: "Multi-model routing", sub: "Reasoning, Research, Execution & Review" },
                  { icon: "👥", label: "Team Mode collaboration", sub: "4 models work together on one message" },
                  { icon: "🔑", label: "Bring your own API keys", sub: "Pay providers directly, no markup" },
                ].map((item) => (
                  <FeatureCard key={item.label} dark={dark} {...item} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel — form ── */}
          <form
  onSubmit={handleLogin}
  style={{
    padding: "32px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100%",
    gap: 20,
  }}
>
            <div>
              {/* Mobile logo — shown only when left panel is hidden */}
              <div className="login-mobile-logo" style={{ display: "none", marginBottom: 28 }}>
                <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="hub" size={17} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: textPrimary }}>
                    CoWork<span style={{ color: dark ? "#a78bfa" : "#4f46e5" }}>AI</span>
                  </span>
                </a>
              </div>

              <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: textPrimary }}>
                Sign in
              </h2>

              {/* Error */}
              {error && (
                <div
                  className="fade-up"
                  style={{
                    marginBottom: 20, padding: "12px 16px", borderRadius: 12,
                    background: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    color: "#fca5a5", fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <InputField
                  dark={dark} label="Email Address" type="email"
                  placeholder="you@example.com" value={email}
                  onChange={(v) => { setEmail(v); setError(""); }}
                  autoFocus autoComplete="email"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 7,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "#cbd5e1" : "#334155" }}>
                      Password
                    </span>
                    <a
                      href="/auth/forgot-password"
                      style={{
                        fontSize: 12, fontWeight: 700,
                        color: dark ? "#a78bfa" : "#4f46e5",
                        textDecoration: "none",
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      style={{
                        width: "100%", borderRadius: 12, outline: "none",
                        padding: "13px 52px 13px 16px", fontSize: 14,
                        background: dark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.9)",
                        border: `1px solid ${dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.12)"}`,
                        color: textPrimary, transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        fontFamily: "inherit",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = dark ? "rgba(139,92,246,0.55)" : "rgba(79,70,229,0.45)";
                        e.currentTarget.style.boxShadow = dark ? "0 0 0 4px rgba(79,70,229,0.12)" : "0 0 0 4px rgba(79,70,229,0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.12)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute", right: 14, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: dark ? "#64748b" : "#94a3b8",
                        fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                        transition: "color 0.2s ease",
                        padding: 0,
                      }}
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
                style={{
                  width: "100%", borderRadius: 12, border: "none",
                  padding: "13px 16px", cursor: loading ? "not-allowed" : "pointer",
                  background: loading
                    ? dark ? "rgba(79,70,229,0.5)" : "rgba(79,70,229,0.4)"
                    : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  color: "#fff", fontSize: 15, fontWeight: 800,
                  letterSpacing: "-0.01em", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 12px 36px rgba(79,70,229,0.28)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 18px 48px rgba(79,70,229,0.36)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = loading ? "none" : "0 12px 36px rgba(79,70,229,0.28)";
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <Icon name="arrow_forward" size={17} />
                  </>
                )}
              </button>

              <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: textMuted }}>
                Don&apos;t have an account?{" "}
                <a
                  href="/auth/register"
                  style={{
                    fontWeight: 700,
                    color: dark ? "#a78bfa" : "#4f46e5",
                    textDecoration: "none",
                  }}
                >
                  Create one free
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Responsive: hide left panel on mobile, show mobile logo */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 720px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
          /* Single column on mobile */
          [style*="gridTemplateColumns: clamp"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}