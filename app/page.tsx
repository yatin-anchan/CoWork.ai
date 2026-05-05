"use client";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ThemeProps = {
  dark: boolean;
};

type IconProps = {
  name: string;
  size?: number;
  style?: React.CSSProperties;
};

function Icon({ name, size = 20, style = {} }: IconProps) {
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

function GlobalStyles({ dark }: ThemeProps) {
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
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: "Inter", sans-serif;
          background: ${dark ? "#020617" : "#f8fafc"};
        }

        ::selection {
          background: ${dark ? "rgba(139,92,246,0.35)" : "rgba(79,70,229,0.18)"};
        }

        ::-webkit-scrollbar {
          width: 7px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.18)"};
          border-radius: 999px;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatSoft {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .fade-up {
          animation: fadeUp 0.7s ease both;
        }

        .card-hover {
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }

        .card-hover:hover {
          transform: translateY(-4px);
          border-color: ${dark ? "rgba(139,92,246,0.42)" : "rgba(79,70,229,0.28)"};
          box-shadow: ${dark ? "0 24px 80px rgba(0,0,0,0.28)" : "0 22px 60px rgba(15,23,42,0.08)"};
        }

        .nav-link {
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: ${dark ? "#ffffff" : "#111827"} !important;
        }

        .primary-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: ${dark ? "0 18px 50px rgba(79,70,229,0.34)" : "0 18px 45px rgba(79,70,229,0.24)"};
        }

        .secondary-btn {
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .secondary-btn:hover {
          background: ${dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)"};
        }

        @media (max-width: 900px) {
          .desktop-only {
            display: none !important;
          }

          .two-col {
            grid-template-columns: 1fr !important;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .hero-actions a {
            width: 100%;
            justify-content: center;
          }

          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   PARTICLE SYSTEM  (depth-of-field nodes + cursor light)
───────────────────────────────────────────────────────────── */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  depth: number; // 0 (far) → 1 (near)
  pulse: number;
  pulseSpeed: number;
};

function ParticleCanvas({ dark }: ThemeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    /* resize */
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* mouse */
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    /* init particles */
    const COUNT = 90;
    particlesRef.current = Array.from({ length: COUNT }, () => {
      const depth = Math.random(); // 0=far, 1=near
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

    /* draw */
    let frameCount = 0;
    const draw = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: mx, y: my } = mouseRef.current;

      /* cursor glow */
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

      /* particles */
      const ps = particlesRef.current;
      for (const p of ps) {
        /* subtle attraction toward cursor for near particles */
        if (mx > -999 && p.depth > 0.55) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const force = (1 - dist / 300) * 0.012 * p.depth;
            p.vx += dx * force * 0.01;
            p.vy += dy * force * 0.01;
          }
        }

        /* dampen velocity */
        p.vx *= 0.998;
        p.vy *= 0.998;

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        /* wrap */
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        /* DOF blur simulation via opacity + size pulse */
        const pulseScale = 1 + Math.sin(p.pulse) * 0.18;
        const r = p.radius * pulseScale;
        const alpha = p.opacity * (0.82 + Math.sin(p.pulse) * 0.18);

        /* blur glow for near particles */
        if (p.depth > 0.6) {
          const glowColor = dark
            ? `rgba(139,92,246,${alpha * 0.35})`
            : `rgba(79,70,229,${alpha * 0.25})`;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = r * 4;
        } else {
          ctx.shadowBlur = 0;
        }

        const nodeColor = dark
          ? `rgba(${p.depth > 0.6 ? "167,139,250" : "148,163,184"},${alpha})`
          : `rgba(${p.depth > 0.6 ? "99,102,241" : "148,163,184"},${alpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* draw subtle lines between nearby particles (same depth layer) */
      ctx.shadowBlur = 0;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i];
          const b = ps[j];
          if (Math.abs(a.depth - b.depth) > 0.3) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 1,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   CURSOR LIGHT OVERLAY  (smooth follow-the-cursor radial light)
───────────────────────────────────────────────────────────── */
function CursorLight({ dark }: ThemeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -9999, y: -9999 });
  const cur = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      /* smooth lerp */
      cur.current.x += (pos.current.x - cur.current.x) * 0.07;
      cur.current.y += (pos.current.y - cur.current.y) * 0.07;

      if (ref.current) {
        ref.current.style.background = dark
          ? `radial-gradient(600px circle at ${cur.current.x}px ${cur.current.y}px,
              rgba(79,70,229,0.07) 0%,
              rgba(124,58,237,0.04) 30%,
              transparent 65%)`
          : `radial-gradient(600px circle at ${cur.current.x}px ${cur.current.y}px,
              rgba(79,70,229,0.055) 0%,
              rgba(99,102,241,0.025) 30%,
              transparent 65%)`;
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        transition: "opacity 0.3s ease",
      }}
    />
  );
}

function ProfessionalBackground({ dark }: ThemeProps) {
  return (
    <>
      {/* Static gradient base */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: dark
            ? `
              radial-gradient(circle at 18% 12%, rgba(79,70,229,0.22), transparent 32%),
              radial-gradient(circle at 82% 18%, rgba(14,165,233,0.13), transparent 30%),
              radial-gradient(circle at 50% 85%, rgba(124,58,237,0.10), transparent 34%),
              linear-gradient(180deg, #020617 0%, #050816 46%, #020617 100%)
            `
            : `
              radial-gradient(circle at 18% 10%, rgba(79,70,229,0.09), transparent 31%),
              radial-gradient(circle at 82% 18%, rgba(14,165,233,0.08), transparent 29%),
              radial-gradient(circle at 50% 80%, rgba(124,58,237,0.06), transparent 32%),
              linear-gradient(180deg, #f8fafc 0%, #eef2ff 44%, #ffffff 100%)
            `,
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
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

      {/* Depth-of-field particle layer */}
      <ParticleCanvas dark={dark} />

      {/* Smooth cursor light */}
      <CursorLight dark={dark} />
    </>
  );
}

function ThemeToggle({
  dark,
  toggle,
}: {
  dark: boolean;
  toggle: () => void;
}) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${dark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.12)"}`,
        background: dark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)",
        display: "flex",
        alignItems: "center",
        padding: 3,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          transform: dark ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.25s ease",
          background: dark
            ? "linear-gradient(135deg,#4f46e5,#8b5cf6)"
            : "linear-gradient(135deg,#4f46e5,#38bdf8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={dark ? "dark_mode" : "light_mode"} size={12} style={{ color: "#fff" }} />
      </span>
    </button>
  );
}

function Nav({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    ["Features", "#features"],
    ["Workflow", "#workflow"],
    ["Pricing", "#pricing"],
    ["Security", "#security"],
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: scrolled
          ? `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`
          : "1px solid transparent",
        background: scrolled
          ? dark
            ? "rgba(2,6,23,0.78)"
            : "rgba(255,255,255,0.78)"
          : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          height: 72,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <a
          href="#"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(79,70,229,0.28)",
            }}
          >
            <Icon name="hub" size={18} style={{ color: "#fff" }} />
          </div>

          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: dark ? "#f8fafc" : "#0f172a",
            }}
          >
            CoWork<span style={{ color: dark ? "#a78bfa" : "#4f46e5" }}>AI</span>
          </span>
        </a>

        <div
          className="desktop-only"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="nav-link"
              style={{
                color: dark ? "#94a3b8" : "#475569",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle dark={dark} toggle={toggle} />

          <a
            href="/auth/login"
            className="desktop-only secondary-btn"
            style={{
              textDecoration: "none",
              color: dark ? "#cbd5e1" : "#334155",
              fontSize: 14,
              fontWeight: 700,
              padding: "9px 15px",
              borderRadius: 10,
              border: `1px solid ${dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.10)"}`,
            }}
          >
            Sign in
          </a>

          <a
            href="/auth/register"
            className="primary-btn"
            style={{
              textDecoration: "none",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              padding: "10px 17px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Get started
            <Icon name="arrow_forward" size={16} />
          </a>
        </div>
      </div>
    </nav>
  );
}

function SectionHeader({
  dark,
  eyebrow,
  title,
  subtitle,
}: ThemeProps & {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 54 }}>
      {eyebrow && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            marginBottom: 16,
            background: dark ? "rgba(79,70,229,0.12)" : "rgba(79,70,229,0.07)",
            border: `1px solid ${dark ? "rgba(139,92,246,0.22)" : "rgba(79,70,229,0.14)"}`,
            color: dark ? "#c4b5fd" : "#4f46e5",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {eyebrow}
        </div>
      )}

      <h2
        style={{
          margin: 0,
          color: dark ? "#f8fafc" : "#0f172a",
          fontSize: "clamp(2rem, 4vw, 3.1rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.055em",
          fontWeight: 900,
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          style={{
            maxWidth: 620,
            margin: "18px auto 0",
            color: dark ? "#94a3b8" : "#475569",
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Hero({ dark }: ThemeProps) {
  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        padding: "148px 24px 88px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%" }}>
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div className="fade-up">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 999,
                marginBottom: 26,
                color: dark ? "#c4b5fd" : "#4338ca",
                background: dark ? "rgba(79,70,229,0.13)" : "rgba(79,70,229,0.08)",
                border: `1px solid ${dark ? "rgba(139,92,246,0.26)" : "rgba(79,70,229,0.16)"}`,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <Icon name="bolt" size={16} />
              Multi-model AI workspace for teams
            </div>

            <h3
              style={{
                margin: 0,
                color: dark ? "#f8fafc" : "#0f172a",
                fontSize: "clamp(1.5rem, 7vw, 4.5rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.0em",
                fontWeight: 900,
              }}
            >
              One AI was Never Enough.
            </h3>

            <p
              style={{
                margin: "26px 0 0",
                maxWidth: 620,
                color: dark ? "#94a3b8" : "#475569",
                fontSize: "clamp(1rem, 2vw, 1.18rem)",
                lineHeight: 1.78,
              }}
            >
              CoWork AI brings project memory, multi-chat workflows, role-based
              model routing, and collaborative AI teams into one secure workspace.
            </p>

            <div
              className="hero-actions"
              style={{
                display: "flex",
                gap: 14,
                marginTop: 36,
              }}
            >
              <a
                href="/auth/register"
                className="primary-btn"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Start building free
                <Icon name="arrow_forward" size={18} />
              </a>

              <a
                href="#workflow"
                className="secondary-btn"
                style={{
                  textDecoration: "none",
                  color: dark ? "#e2e8f0" : "#0f172a",
                  padding: "14px 22px",
                  borderRadius: 12,
                  fontWeight: 800,
                  border: `1px solid ${dark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.12)"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                See workflow
                <Icon name="play_circle" size={18} style={{ color: dark ? "#a78bfa" : "#4f46e5" }} />
              </a>
            </div>

            <div
              style={{
                marginTop: 44,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                color: dark ? "#64748b" : "#64748b",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>Works with</span>
              {["OpenAI", "Anthropic", "Gemini", "Groq", "OpenRouter"].map(
                (name) => (
                  <span
                    key={name}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: dark
                        ? "rgba(255,255,255,0.045)"
                        : "rgba(255,255,255,0.72)",
                      border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
                      color: dark ? "#94a3b8" : "#475569",
                    }}
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>

          <ProductPreview dark={dark} />
        </div>
      </div>
    </section>
  );
}

function ProductPreview({ dark }: ThemeProps) {
  const messages = [
    {
      role: "user",
      text: "Plan the launch workflow for our AI workspace.",
    },
    {
      role: "Reasoning",
      icon: "psychology",
      text: "Breaking the request into milestones, dependencies, risks, and owner responsibilities.",
    },
    {
      role: "Execution",
      icon: "terminal",
      text: "Drafting the launch plan, task structure, release checklist, and rollout sequence.",
    },
    {
      role: "Review",
      icon: "verified",
      text: "Checking for gaps: billing, onboarding, invite flows, analytics, and access controls.",
    },
  ];

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: "0.12s",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -28,
          borderRadius: 34,
          background: dark
            ? "radial-gradient(circle at 40% 20%, rgba(79,70,229,0.32), transparent 44%)"
            : "radial-gradient(circle at 40% 20%, rgba(79,70,229,0.14), transparent 44%)",
          filter: "blur(10px)",
        }}
      />

      <div
        style={{
          position: "relative",
          borderRadius: 26,
          overflow: "hidden",
          background: dark ? "rgba(2,6,23,0.82)" : "rgba(255,255,255,0.88)",
          border: `1px solid ${dark ? "rgba(148,163,184,0.16)" : "rgba(15,23,42,0.08)"}`,
          boxShadow: dark
            ? "0 34px 100px rgba(0,0,0,0.5)"
            : "0 34px 100px rgba(15,23,42,0.12)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div
          style={{
            height: 54,
            padding: "0 18px",
            borderBottom: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 7 }}>
            {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
              <span
                key={c}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              color: dark ? "#94a3b8" : "#475569",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <span>Project: Launch OS</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr",
            minHeight: 430,
          }}
        >
          <div
            className="desktop-only"
            style={{
              padding: 16,
              borderRight: `1px solid ${dark ? "rgba(148,163,184,0.10)" : "rgba(15,23,42,0.08)"}`,
              background: dark ? "rgba(15,23,42,0.38)" : "rgba(248,250,252,0.74)",
            }}
          >
            {["Launch plan", "Pricing", "Invite flow", "Export system"].map(
              (item, index) => (
                <div
                  key={item}
                  style={{
                    padding: "10px 11px",
                    borderRadius: 10,
                    marginBottom: 8,
                    color: index === 0 ? (dark ? "#fff" : "#111827") : dark ? "#64748b" : "#64748b",
                    background:
                      index === 0
                        ? dark
                          ? "rgba(79,70,229,0.18)"
                          : "rgba(79,70,229,0.08)"
                        : "transparent",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>

          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    gap: 10,
                  }}
                >
                  {m.role !== "user" && (
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        background:
                          m.role === "Reasoning"
                            ? "#4f46e5"
                            : m.role === "Execution"
                              ? "#7c3aed"
                              : "#0891b2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={m.icon || "smart_toy"} size={15} style={{ color: "#fff" }} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "12px 14px",
                      borderRadius:
                        m.role === "user" ? "16px 16px 5px 16px" : "5px 16px 16px 16px",
                      background:
                        m.role === "user"
                          ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                          : dark
                            ? "rgba(30,41,59,0.72)"
                            : "rgba(248,250,252,0.95)",
                      border:
                        m.role === "user"
                          ? "none"
                          : `1px solid ${dark ? "rgba(148,163,184,0.10)" : "rgba(15,23,42,0.07)"}`,
                      color: m.role === "user" ? "#fff" : dark ? "#e2e8f0" : "#0f172a",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {m.role !== "user" && (
                      <div
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 900,
                          color: dark ? "#a78bfa" : "#4f46e5",
                          marginBottom: 4,
                        }}
                      >
                        {m.role}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "12px 14px",
                borderRadius: 14,
                background: dark ? "rgba(15,23,42,0.72)" : "#f8fafc",
                border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: dark ? "#64748b" : "#64748b",
                fontSize: 12,
              }}
            >
              Ask your AI team something...
              <Icon name="send" size={16} style={{ color: dark ? "#a78bfa" : "#4f46e5" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection({ dark }: ThemeProps) {
  const [logoHovered, setLogoHovered] = useState(false);

  const items = [
    ["One-thread tools", "Generic chat boxes collapse under real project work."],
    ["Single-model limits", "No single model is best at reasoning, execution, and review."],
    ["Context loss", "Important decisions disappear across sessions and chats."],
    ["Weak collaboration", "Sharing, permissions, and team workflows are usually bolted on."],
  ];

  return (
    <section style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              cursor: "default",
              transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease",
              willChange: "transform",
              transform: logoHovered ? "scale(1.22) translateY(-6px)" : "scale(1) translateY(0px)",
              filter: logoHovered
                ? "drop-shadow(0 12px 28px rgba(99,102,241,0.45))"
                : "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.13)" : "rgba(79,70,229,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="report_problem" size={26} style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: dark ? "#818cf8" : "#6366f1",
              }}
            >
              The Problem
            </p>
          </div>
        </div>

        <SectionHeader
          dark={dark}
          title="AI chat is not enough for project work."
          subtitle="Serious builders need persistent context, structured workspaces, model specialization, and collaboration."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
          }}
        >
          {items.map(([title, text], i) => (
            <div
              key={title}
              className="card-hover"
              style={{
                padding: 24,
                borderRadius: 18,
                background: dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: dark ? "rgba(79,70,229,0.16)" : "rgba(79,70,229,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <Icon
                  name={["forum", "model_training", "history", "group_off"][i]}
                  size={18}
                  style={{ color: dark ? "#a78bfa" : "#4f46e5" }}
                />
              </div>
              <h3
                style={{
                  margin: "0 0 8px",
                  color: dark ? "#f8fafc" : "#0f172a",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: dark ? "#94a3b8" : "#64748b",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ dark }: ThemeProps) {
  const [logoHovered, setLogoHovered] = useState(false);

  const features = [
    ["forum", "Multi-chat projects", "Create multiple chats under one project while preserving shared context and memory."],
    ["groups_3", "AI Team Mode", "Route work through reasoning, execution, and review models for stronger outputs."],
    ["account_tree", "Message versioning", "Edit questions, retry answers, and navigate versions without losing history."],
    ["memory", "Project memory", "Keep decisions, stack choices, constraints, and unresolved tasks available across the project."],
    ["diversity_3", "Team collaboration", "Invite owners, editors, and viewers. Share public chats or keep private work separate."],
    ["vpn_key", "Bring your own keys", "Use OpenAI, Anthropic, Gemini, Groq, OpenRouter, Perplexity, and custom providers."],
    ["bar_chart", "Usage analytics", "Track token usage, provider activity, and Team Mode consumption."],
    ["download", "Exports", "Export responses or full conversations to share work outside the app."],
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const pauseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemsPerSlide = 2;
  const totalSlides = Math.ceil(features.length / itemsPerSlide);
  const AUTOPLAY_INTERVAL = 3500; // ms between slides
  const RESUME_DELAY = 6000;      // ms before auto-play resumes after manual interaction

  // Auto-advance
  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % totalSlides);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, totalSlides]);

  // After user interacts, pause for a bit then resume
  const handleManual = (newIndex: number) => {
    setCurrentIndex(newIndex);
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setPaused(false), RESUME_DELAY);
  };

  const prev = () => handleManual((currentIndex - 1 + totalSlides) % totalSlides);
  const next = () => handleManual((currentIndex + 1) % totalSlides);

  const visible = features.slice(
    currentIndex * itemsPerSlide,
    currentIndex * itemsPerSlide + itemsPerSlide
  );

  return (
    <section id="features" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* ── Section icon + label ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              cursor: "default",
              transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease",
              willChange: "transform",
              transform: logoHovered ? "scale(1.22) translateY(-6px)" : "scale(1) translateY(0px)",
              filter: logoHovered ? "drop-shadow(0 12px 28px rgba(99,102,241,0.45))" : "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.13)" : "rgba(79,70,229,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="auto_awesome" size={26} style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: dark ? "#818cf8" : "#6366f1",
              }}
            >
              Features
            </p>
          </div>
        </div>

        <SectionHeader
          dark={dark}
          title="A complete workspace around your AI team."
          subtitle="Everything is designed around projects, continuity, collaboration, and model specialization."
        />

        <div style={{ position: "relative" }}>

          {/* ── Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {visible.map(([icon, title, text]) => (
              <div
                key={title}
                className="card-hover"
                style={{
                  padding: 24,
                  borderRadius: 18,
                  background: dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                  border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
                  backdropFilter: "blur(14px)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: dark ? "rgba(79,70,229,0.16)" : "rgba(79,70,229,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <Icon name={icon} size={20} style={{ color: dark ? "#a78bfa" : "#4f46e5" }} />
                </div>
                <h3 style={{ margin: "0 0 8px", color: dark ? "#f8fafc" : "#0f172a", fontSize: 16, fontWeight: 850 }}>
                  {title}
                </h3>
                <p style={{ margin: 0, color: dark ? "#94a3b8" : "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* ── Controls row ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 32,
            }}
          >
            {/* Prev */}
            <button
              onClick={prev}
              aria-label="Previous slide"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${dark ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.12)"}`,
                background: dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: dark ? "#94a3b8" : "#64748b",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
            >
              <Icon name="chevron_left" size={20} />
            </button>

            {/* Dot indicators with SVG progress ring */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {Array.from({ length: totalSlides }).map((_, i) => {
                const isActive = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleManual(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      position: "relative",
                      width: 28,
                      height: 28,
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Progress ring — only on active dot when auto-playing */}
                    {isActive && !paused && (
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        style={{
                          position: "absolute",
                          inset: 0,
                          transform: "rotate(-90deg)",
                        }}
                      >
                        <circle
                          cx="14"
                          cy="14"
                          r="11"
                          fill="none"
                          stroke={dark ? "rgba(167,139,250,0.18)" : "rgba(79,70,229,0.12)"}
                          strokeWidth="2"
                        />
                        <circle
                          cx="14"
                          cy="14"
                          r="11"
                          fill="none"
                          stroke={dark ? "#a78bfa" : "#4f46e5"}
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 11}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          style={{
                            animation: `progress-ring ${AUTOPLAY_INTERVAL}ms linear forwards`,
                          }}
                        />
                      </svg>
                    )}
                    {/* Dot */}
                    <span
                      style={{
                        display: "block",
                        width: isActive ? 8 : 6,
                        height: isActive ? 8 : 6,
                        borderRadius: "50%",
                        background: isActive
                          ? dark ? "#a78bfa" : "#4f46e5"
                          : dark ? "rgba(148,163,184,0.3)" : "rgba(15,23,42,0.15)",
                        transition: "width 0.25s ease, height 0.25s ease, background 0.25s ease",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={next}
              aria-label="Next slide"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${dark ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.12)"}`,
                background: dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: dark ? "#94a3b8" : "#64748b",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>

          {/* ── Pause/resume hint ── */}
          <p
            style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: 12,
              color: dark ? "#475569" : "#94a3b8",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {paused ? "Resuming auto-scroll soon…" : `${currentIndex + 1} / ${totalSlides}`}
          </p>
        </div>
      </div>

      {/* Keyframe for the SVG progress ring */}
      <style>{`
        @keyframes progress-ring {
          from { stroke-dashoffset: ${2 * Math.PI * 11}; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
}

function WorkflowSection({ dark }: ThemeProps) {
  const [logoHovered, setLogoHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const isLockedRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const steps = [
    ["01", "Create a project", "Add project instructions, context, teammates, and model role preferences."],
    ["02", "Open focused chats", "Create public or private chats for different workstreams inside the same project."],
    ["03", "Route work to models", "Use specialized models for research, reasoning, execution, and review."],
    ["04", "Collaborate and export", "Invite teammates, manage permissions, retry/edit versions, and export outputs."],
  ];

  const STEP_DURATION = 620; // ms between steps

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // IntersectionObserver: engage/disengage scroll lock
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          isLockedRef.current = false;
          // Reset when section leaves viewport
          setActiveIndex(null);
        }
      },
      { threshold: 0.55 }
    );
    observer.observe(section);

    // ── Wheel handler ──
    const onWheel = (e: WheelEvent) => {
      const sec = sectionRef.current;
      if (!sec) return;

      const rect = sec.getBoundingClientRect();
      const inView = rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.55;

      if (!inView) return;

      const scrollingDown = e.deltaY > 0;

      // Activate lock when user first scrolls into section going down
      if (!isLockedRef.current && scrollingDown) {
        // Only lock if we haven't started the sequence yet
        setActiveIndex((cur) => {
          if (cur === null) {
            isLockedRef.current = true;
            return 0;
          }
          return cur;
        });
      }

      if (!isLockedRef.current) return;

      e.preventDefault();

      if (isAnimatingRef.current) return;

      setActiveIndex((cur) => {
        const current = cur ?? 0;

        if (scrollingDown) {
          if (current < steps.length - 1) {
            // Advance to next step
            isAnimatingRef.current = true;
            setTimeout(() => { isAnimatingRef.current = false; }, STEP_DURATION);
            return current + 1;
          } else {
            // All steps done — release scroll lock
            isLockedRef.current = false;
            return current;
          }
        } else {
          // Scrolling up
          if (current > 0) {
            isAnimatingRef.current = true;
            setTimeout(() => { isAnimatingRef.current = false; }, STEP_DURATION);
            return current - 1;
          } else {
            // Back to top of section — release lock
            isLockedRef.current = false;
            return null;
          }
        }
      });
    };

    // ── Touch handler ──
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const sec = sectionRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const inView = rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.55;
      if (!inView) return;

      const dy = touchStartY - e.touches[0].clientY;
      const scrollingDown = dy > 12;
      const scrollingUp = dy < -12;
      if (!scrollingDown && !scrollingUp) return;

      if (!isLockedRef.current && scrollingDown) {
        setActiveIndex((cur) => {
          if (cur === null) {
            isLockedRef.current = true;
            return 0;
          }
          return cur;
        });
      }

      if (!isLockedRef.current) return;
      e.preventDefault();

      if (isAnimatingRef.current) return;

      setActiveIndex((cur) => {
        const current = cur ?? 0;
        if (scrollingDown) {
          if (current < steps.length - 1) {
            isAnimatingRef.current = true;
            setTimeout(() => { isAnimatingRef.current = false; }, STEP_DURATION);
            touchStartY = e.touches[0].clientY;
            return current + 1;
          } else {
            isLockedRef.current = false;
            return current;
          }
        } else {
          if (current > 0) {
            isAnimatingRef.current = true;
            setTimeout(() => { isAnimatingRef.current = false; }, STEP_DURATION);
            touchStartY = e.touches[0].clientY;
            return current - 1;
          } else {
            isLockedRef.current = false;
            return null;
          }
        }
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [steps.length]);

  return (
    <section
      id="workflow"
      ref={sectionRef}
      style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* ── Icon + label ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              cursor: "default",
              transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease",
              willChange: "transform",
              transform: logoHovered ? "scale(1.22) translateY(-6px)" : "scale(1) translateY(0px)",
              filter: logoHovered ? "drop-shadow(0 12px 28px rgba(99,102,241,0.45))" : "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.13)" : "rgba(79,70,229,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="account_tree" size={26} style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: dark ? "#818cf8" : "#6366f1",
              }}
            >
              Workflow
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <h2
            style={{
              margin: 0,
              color: dark ? "#f8fafc" : "#0f172a",
              fontSize: "clamp(2rem, 4vw, 3.1rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.055em",
              fontWeight: 900,
            }}
          >
            From idea to finished work, without losing context.
          </h2>
        </div>

        {/* ── Scroll hint ── */}
        <p
          style={{
            textAlign: "center",
            marginBottom: 32,
            fontSize: 13,
            color: dark ? "#475569" : "#94a3b8",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Icon
            name="mouse"
            size={14}
            style={{ color: dark ? "#475569" : "#94a3b8" }}
          />
          Scroll to step through
        </p>

        {/* ── Step cards ── */}
        <div style={{ display: "grid", gap: 14, position: "relative" }}>
          {steps.map(([n, title, text], i) => {
            const isActive = activeIndex === i;
            const isBlurred = activeIndex !== null && !isActive;
            const isDimmed = activeIndex !== null && i > activeIndex;

            return (
              <div
                key={n}
                onMouseEnter={() => {
                  // Keep hover working when not scroll-locked
                  if (!isLockedRef.current) setActiveIndex(i);
                }}
                onMouseLeave={() => {
                  if (!isLockedRef.current) setActiveIndex(null);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr",
                  gap: 20,
                  padding: isActive ? "28px 26px" : "22px",
                  borderRadius: 18,
                  background: isActive
                    ? dark ? "rgba(79,70,229,0.18)" : "rgba(79,70,229,0.06)"
                    : dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                  border: `1px solid ${
                    isActive
                      ? dark ? "rgba(124,58,237,0.5)" : "rgba(79,70,229,0.3)"
                      : dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"
                  }`,
                  boxShadow: isActive
                    ? dark
                      ? "0 8px 32px rgba(79,70,229,0.25), 0 2px 8px rgba(0,0,0,0.3)"
                      : "0 8px 32px rgba(79,70,229,0.12), 0 2px 8px rgba(0,0,0,0.06)"
                    : "none",
                  transform: isActive
                    ? "scale(1.02) translateY(-2px)"
                    : isBlurred
                    ? "scale(0.98) translateY(1px)"
                    : "scale(1) translateY(0)",
                  filter: isBlurred ? "blur(1.5px)" : "none",
                  opacity: isDimmed ? 0.35 : isBlurred ? 0.55 : 1,
                  zIndex: isActive ? 2 : 1,
                  position: "relative",
                  cursor: "default",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  backdropFilter: "blur(14px)",
                }}
              >
                {/* Step number badge */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive
                      ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                      : dark ? "rgba(79,70,229,0.22)" : "rgba(79,70,229,0.10)",
                    color: isActive ? "#fff" : dark ? "#818cf8" : "#4f46e5",
                    fontWeight: 900,
                    fontSize: isActive ? 17 : 15,
                    flexShrink: 0,
                    transition: "all 0.4s ease",
                    boxShadow: isActive ? "0 6px 20px rgba(79,70,229,0.35)" : "none",
                  }}
                >
                  {n}
                </div>

                <div>
                  <h3
                    style={{
                      margin: "0 0 6px",
                      color: isActive ? (dark ? "#ffffff" : "#0f172a") : dark ? "#f8fafc" : "#0f172a",
                      fontSize: isActive ? 18 : 17,
                      fontWeight: isActive ? 900 : 800,
                      transition: "all 0.4s ease",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: isActive
                        ? dark ? "#c4b5fd" : "#4f46e5"
                        : dark ? "#94a3b8" : "#64748b",
                      fontSize: 14,
                      lineHeight: 1.75,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Progress indicator ── */}
        {activeIndex !== null && (
          <div
            style={{
              marginTop: 28,
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {steps.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 4,
                  borderRadius: 999,
                  background:
                    i <= activeIndex
                      ? dark ? "#a78bfa" : "#4f46e5"
                      : dark ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.1)",
                  transition: "width 0.35s ease, background 0.35s ease",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PricingSection({ dark }: ThemeProps) {
  const [annual, setAnnual] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  const plans = useMemo(
    () => [
      {
        name: "Free",
        price: "₹0",
        description: "For personal exploration.",
        features: ["Projects and chats", "Single-model responses", "Basic project instructions", "Bring your own API keys"],
        highlighted: false,
      },
      {
        name: "Pro",
        price: annual ? "₹290" : "₹350",
        description: "For serious builders.",
        features: ["Unlimited projects", "AI Team Mode", "Usage analytics", "Shared projects", "Owner/editor/viewer roles", "Public/private chats", "Priority support"],
        highlighted: true,
      },
    ],
    [annual]
  );

  return (
    <section id="pricing" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 850, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "default",
              transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease",
              willChange: "transform",
              transform: logoHovered ? "scale(1.22) translateY(-6px)" : "scale(1) translateY(0px)",
              filter: logoHovered ? "drop-shadow(0 12px 28px rgba(99,102,241,0.38))" : "none",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.13)" : "rgba(99,102,241,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text
                  x="19"
                  y="27"
                  textAnchor="middle"
                  fontFamily="system-ui,sans-serif"
                  fontSize="22"
                  fontWeight="700"
                  fill={dark ? "#818cf8" : "#6366f1"}
                >
                  ₹
                </text>
              </svg>
            </div>
            <span
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: dark ? "#818cf8" : "#6366f1",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              PRICING
            </span>
          </div>
        </div>

        <SectionHeader
          dark={dark}
          title="Start free. Upgrade when your workflow needs a team."
          subtitle="Simple plans for individuals, builders, and teams."
        />

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 34 }}>
          <span style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 700 }}>Monthly</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 999,
              border: "none",
              background: annual ? "#4f46e5" : dark ? "#1e293b" : "#e2e8f0",
              padding: 3,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "block",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transform: annual ? "translateX(22px)" : "translateX(0)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>
          <span style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 700 }}>
            Annual <span style={{ color: dark ? "#a78bfa" : "#4f46e5" }}>Save 20%</span>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="card-hover"
              style={{
                padding: 28,
                borderRadius: 22,
                position: "relative",
                background: plan.highlighted
                  ? dark
                    ? "linear-gradient(180deg,rgba(79,70,229,0.18),rgba(15,23,42,0.72))"
                    : "linear-gradient(180deg,rgba(79,70,229,0.08),rgba(255,255,255,0.9))"
                  : dark
                    ? "rgba(15,23,42,0.58)"
                    : "rgba(255,255,255,0.82)",
                border: `1px solid ${
                  plan.highlighted
                    ? dark ? "rgba(139,92,246,0.45)" : "rgba(79,70,229,0.28)"
                    : dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"
                }`,
              }}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: 28,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ color: dark ? "#f8fafc" : "#0f172a", fontSize: 22, margin: "0 0 6px", fontWeight: 900 }}>
                {plan.name}
              </h3>
              <p style={{ color: dark ? "#94a3b8" : "#64748b", margin: "0 0 22px", fontSize: 14 }}>
                {plan.description}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ color: dark ? "#f8fafc" : "#0f172a", fontSize: 42, fontWeight: 900 }}>
                  {plan.price}
                </span>
                {plan.price !== "₹0" && (
                  <span style={{ color: dark ? "#94a3b8" : "#64748b", marginLeft: 4, fontWeight: 700 }}>
                    /mo
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gap: 11, marginBottom: 26 }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <Icon name="check_circle" size={17} style={{ color: dark ? "#a78bfa" : "#4f46e5" }} />
                    <span style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 14, fontWeight: 600 }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href="/auth/register"
                className={plan.highlighted ? "primary-btn" : "secondary-btn"}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontWeight: 850,
                  color: plan.highlighted ? "#fff" : dark ? "#e2e8f0" : "#0f172a",
                  background: plan.highlighted ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "transparent",
                  border: plan.highlighted
                    ? "none"
                    : `1px solid ${dark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.12)"}`,
                }}
              >
                {plan.name === "Team" ? "Contact sales" : "Start now"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection({ dark }: ThemeProps) {
  const [logoHovered, setLogoHovered] = useState(false);

  const items = [
    {
      icon: "lock",
      title: "Data Encryption",
      text: "All data is encrypted in transit and at rest using AES-256 and TLS 1.3 — industry-leading protocols you can rely on.",
    },
    {
      icon: "admin_panel_settings",
      title: "Access Control",
      text: "Role-based access and scoped permissions ensure only the right people can see and do the right things.",
    },
    {
      icon: "cloud",
      title: "Secure Infrastructure",
      text: "Our infrastructure runs on secure, redundant, and monitored cloud environments — built for uptime and resilience.",
    },
    {
      icon: "verified_user",
      title: "Compliance & Privacy",
      text: "We adhere to global compliance standards and are committed to protecting your privacy at every layer.",
    },
  ];

  const cardBg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)";
  const cardBorder = dark ? "1px solid rgba(99,120,200,0.22)" : "1px solid rgba(79,70,229,0.14)";
  const cardGlow = dark
    ? "0 0 0 1px rgba(99,120,200,0.10), 0 8px 32px rgba(80,100,220,0.10)"
    : "0 4px 24px rgba(79,70,229,0.07)";

  return (
    <section
      id="security"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "100px 24px",
        background: dark
          ? "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56,70,180,0.18) 0%, transparent 70%)"
          : "none",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              cursor: "default",
              transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease",
              willChange: "transform",
              transform: logoHovered ? "scale(1.22) translateY(-6px)" : "scale(1) translateY(0px)",
              filter: logoHovered ? "drop-shadow(0 12px 28px rgba(99,102,241,0.45))" : "none",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: dark ? "rgba(99,120,255,0.15)" : "rgba(79,70,229,0.08)",
                border: `1.5px solid ${dark ? "rgba(99,120,255,0.35)" : "rgba(79,70,229,0.2)"}`,
                boxShadow: dark ? "0 0 24px rgba(99,120,255,0.20)" : "none",
              }}
            >
              <Icon name="shield" size={26} style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: dark ? "#818cf8" : "#6366f1",
              }}
            >
              Security
            </p>
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            margin: "0 0 20px",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: dark ? "#f0f4ff" : "#0f172a",
          }}
        >
          Security You Can Trust
        </h2>

        <p
          style={{
            textAlign: "center",
            margin: "0 auto 60px",
            maxWidth: 580,
            fontSize: 17,
            lineHeight: 1.75,
            color: dark ? "#94a3b8" : "#64748b",
          }}
        >
          We use enterprise-grade security practices to protect your data and
          keep your trust at the center of everything we do.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginBottom: 52,
          }}
        >
          {items.map(({ icon, title, text }) => (
            <div
              key={title}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: 18,
                boxShadow: cardGlow,
                padding: "36px 28px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 0,
                backdropFilter: dark ? "blur(12px)" : "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = dark
                  ? "0 0 0 1px rgba(99,120,200,0.20), 0 16px 48px rgba(80,100,220,0.18)"
                  : "0 8px 32px rgba(79,70,229,0.13)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = cardGlow;
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: dark ? "rgba(99,120,255,0.12)" : "rgba(79,70,229,0.07)",
                  border: `1.5px solid ${dark ? "rgba(99,120,255,0.28)" : "rgba(79,70,229,0.16)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  boxShadow: dark ? "0 0 20px rgba(99,120,255,0.14)" : "none",
                }}
              >
                <Icon name={icon} size={28} style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
              </div>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 18,
                  fontWeight: 750,
                  letterSpacing: "-0.01em",
                  color: dark ? "#f0f4ff" : "#0f172a",
                }}
              >
                {title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.72,
                  color: dark ? "#94a3b8" : "#64748b",
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ dark }: ThemeProps) {
  return (
    <section style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          textAlign: "center",
          borderRadius: 30,
          padding: "72px 28px",
          background: dark
            ? "linear-gradient(135deg,rgba(79,70,229,0.18),rgba(15,23,42,0.74))"
            : "linear-gradient(135deg,rgba(79,70,229,0.08),rgba(255,255,255,0.86))",
          border: `1px solid ${dark ? "rgba(139,92,246,0.22)" : "rgba(79,70,229,0.16)"}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: dark ? "#f8fafc" : "#0f172a",
            fontSize: "clamp(2.2rem, 5vw, 3.7rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.06em",
            fontWeight: 900,
          }}
        >
          Build with an AI team, not a blank chat box.
        </h2>

        <p
          style={{
            margin: "18px auto 34px",
            maxWidth: 560,
            color: dark ? "#94a3b8" : "#475569",
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          Organize projects, route work across models, collaborate with teammates,
          and keep context alive from idea to delivery.
        </p>

        <a
          href="/auth/register"
          className="primary-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "#fff",
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            padding: "14px 24px",
            borderRadius: 12,
            fontWeight: 900,
          }}
        >
          Start building free
          <Icon name="arrow_forward" size={18} />
        </a>
      </div>
    </section>
  );
}

function Footer({ dark }: ThemeProps) {
  const columns = [
    ["Product", ["Features", "Pricing", "Security", "Roadmap"]],
    ["Integrations", ["OpenAI", "Anthropic", "Gemini", "Groq"]],
    ["Company", ["About", "Blog", "Careers", "Contact"]],
    ["Legal", ["Privacy", "Terms", "Security", "GDPR"]],
  ];

  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        padding: "64px 24px 36px",
        borderTop: `1px solid ${dark ? "rgba(148,163,184,0.10)" : "rgba(15,23,42,0.08)"}`,
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr repeat(4, 1fr)",
            gap: 34,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="hub" size={17} style={{ color: "#fff" }} />
              </div>
              <strong style={{ color: dark ? "#f8fafc" : "#0f172a", fontSize: 17 }}>
                CoWorkAI
              </strong>
            </div>
            <p style={{ color: dark ? "#64748b" : "#64748b", fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>
              Multi-model collaborative AI workspace for builders, teams, and serious project workflows.
            </p>
          </div>

          {columns.map(([title, links]) => (
            <div key={title as string}>
              <h4 style={{ color: dark ? "#e2e8f0" : "#0f172a", fontSize: 13, margin: "0 0 14px", fontWeight: 900 }}>
                {title}
              </h4>
              <div style={{ display: "grid", gap: 10 }}>
                {(links as string[]).map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      color: dark ? "#64748b" : "#64748b",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 46,
            paddingTop: 22,
            borderTop: `1px solid ${dark ? "rgba(148,163,184,0.10)" : "rgba(15,23,42,0.08)"}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            color: dark ? "#64748b" : "#64748b",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>© {new Date().getFullYear()} CoWorkAI. All rights reserved.</span>
          <span>Built for project-based AI collaboration.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [dark, setDark] = useState(true);

  return (
    <>
      <GlobalStyles dark={dark} />
      <main
        style={{
          minHeight: "100vh",
          color: dark ? "#f8fafc" : "#0f172a",
          background: dark ? "#020617" : "#f8fafc",
          overflow: "hidden",
        }}
      >
        <ProfessionalBackground dark={dark} />
        <Nav dark={dark} toggle={() => setDark((v) => !v)} />
        <Hero dark={dark} />
        <ProblemSection dark={dark} />
        <FeaturesSection dark={dark} />
        <WorkflowSection dark={dark} />
        <PricingSection dark={dark} />
        <SecuritySection dark={dark} />
        <CTASection dark={dark} />
        <Footer dark={dark} />
      </main>
    </>
  );
}
