"use client";

import { useEffect, useMemo, useState } from "react";

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

function ProfessionalBackground({ dark }: ThemeProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: dark
          ? `
            radial-gradient(circle at 18% 12%, rgba(79,70,229,0.26), transparent 32%),
            radial-gradient(circle at 82% 18%, rgba(14,165,233,0.16), transparent 30%),
            radial-gradient(circle at 50% 85%, rgba(124,58,237,0.12), transparent 34%),
            linear-gradient(180deg, #020617 0%, #050816 46%, #020617 100%)
          `
          : `
            radial-gradient(circle at 18% 10%, rgba(79,70,229,0.11), transparent 31%),
            radial-gradient(circle at 82% 18%, rgba(14,165,233,0.10), transparent 29%),
            radial-gradient(circle at 50% 80%, rgba(124,58,237,0.07), transparent 32%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 44%, #ffffff 100%)
          `,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: dark ? 0.16 : 0.22,
          backgroundImage: `
            linear-gradient(${dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)"} 1px, transparent 1px),
            linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)"} 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, black, transparent 85%)",
        }}
      />
    </div>
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

            <h1
              style={{
                margin: 0,
                color: dark ? "#f8fafc" : "#0f172a",
                fontSize: "clamp(3rem, 7vw, 5.7rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.075em",
                fontWeight: 900,
              }}
            >
              The AI workspace for serious project work.
            </h1>

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
  const items = [
    ["One-thread tools", "Generic chat boxes collapse under real project work."],
    ["Single-model limits", "No single model is best at reasoning, execution, and review."],
    ["Context loss", "Important decisions disappear across sessions and chats."],
    ["Weak collaboration", "Sharing, permissions, and team workflows are usually bolted on."],
  ];

  return (
    <section style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHeader
          dark={dark}
          eyebrow="THE PROBLEM"
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: dark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <Icon name={["forum", "model_training", "history", "group_off"][i]} size={18} style={{ color: "#ef4444" }} />
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

  return (
    <section id="features" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHeader
          dark={dark}
          eyebrow="FEATURES"
          title="A complete workspace around your AI team."
          subtitle="Everything is designed around projects, continuity, collaboration, and model specialization."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          {features.map(([icon, title, text]) => (
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

              <h3
                style={{
                  margin: "0 0 8px",
                  color: dark ? "#f8fafc" : "#0f172a",
                  fontSize: 16,
                  fontWeight: 850,
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

function WorkflowSection({ dark }: ThemeProps) {
  const steps = [
    ["01", "Create a project", "Add project instructions, context, teammates, and model role preferences."],
    ["02", "Open focused chats", "Create public or private chats for different workstreams inside the same project."],
    ["03", "Route work to models", "Use specialized models for research, reasoning, execution, and review."],
    ["04", "Collaborate and export", "Invite teammates, manage permissions, retry/edit versions, and export outputs."],
  ];

  return (
    <section id="workflow" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <SectionHeader
          dark={dark}
          eyebrow="WORKFLOW"
          title="From idea to finished work without losing context."
        />

        <div style={{ display: "grid", gap: 14 }}>
          {steps.map(([n, title, text]) => (
            <div
              key={n}
              className="card-hover"
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr",
                gap: 20,
                padding: 22,
                borderRadius: 18,
                background: dark ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.82)",
                border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                {n}
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 6px",
                    color: dark ? "#f8fafc" : "#0f172a",
                    fontSize: 17,
                    fontWeight: 850,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: dark ? "#94a3b8" : "#64748b",
                    fontSize: 14,
                    lineHeight: 1.75,
                  }}
                >
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ dark }: ThemeProps) {
  const [annual, setAnnual] = useState(false);

  const plans = useMemo(
    () => [
      {
        name: "Free",
        price: "$0",
        description: "For personal exploration.",
        features: ["Projects and chats", "Single-model responses", "Basic project instructions", "Bring your own API keys"],
        highlighted: false,
      },
      {
        name: "Pro",
        price: annual ? "$19" : "$25",
        description: "For serious builders.",
        features: ["Unlimited projects", "AI Team Mode", "Message versioning", "Usage analytics", "Advanced project memory"],
        highlighted: true,
      },
      {
        name: "Team",
        price: annual ? "$49" : "$59",
        description: "For collaborative teams.",
        features: ["Shared projects", "Owner/editor/viewer roles", "Public/private chats", "Admin controls", "Priority support"],
        highlighted: false,
      },
    ],
    [annual]
  );

  return (
    <section id="pricing" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <SectionHeader
          dark={dark}
          eyebrow="PRICING"
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
                    ? dark
                      ? "rgba(139,92,246,0.45)"
                      : "rgba(79,70,229,0.28)"
                    : dark
                      ? "rgba(148,163,184,0.12)"
                      : "rgba(15,23,42,0.08)"
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
                {plan.price !== "$0" && (
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
  const items = [
    ["lock", "Encrypted API keys", "Keys are encrypted at rest and never exposed in responses."],
    ["admin_panel_settings", "Role-based access", "Owners, editors, and viewers have explicit permissions."],
    ["visibility_off", "Private chats", "Owners can keep sensitive chats private inside shared projects."],
    ["shield", "Secure by default", "JWT auth, scoped project access, and server-enforced permissions."],
  ];

  return (
    <section id="security" style={{ position: "relative", zIndex: 1, padding: "90px 24px" }}>
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          borderRadius: 28,
          padding: "58px 34px",
          background: dark ? "rgba(2,6,23,0.60)" : "rgba(255,255,255,0.82)",
          border: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"}`,
        }}
      >
        <SectionHeader
          dark={dark}
          eyebrow="SECURITY"
          title="Your data, keys, and project context stay protected."
          subtitle="Security is enforced server-side across projects, chats, API keys, and collaboration."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {items.map(([icon, title, text]) => (
            <div key={title} style={{ textAlign: "center", padding: 18 }}>
              <Icon name={icon} size={30} style={{ color: dark ? "#a78bfa" : "#4f46e5", marginBottom: 14 }} />
              <h3 style={{ color: dark ? "#f8fafc" : "#0f172a", margin: "0 0 8px", fontSize: 16, fontWeight: 850 }}>
                {title}
              </h3>
              <p style={{ color: dark ? "#94a3b8" : "#64748b", margin: 0, fontSize: 14, lineHeight: 1.65 }}>
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