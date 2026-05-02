"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Google Fonts + Material Icons injection ──────────────────────────────────
function GlobalStyles({ dark }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes twinkle {
          0%   { opacity: 0.15; transform: scale(0.8); }
          100% { opacity: 0.9;  transform: scale(1.2); }
        }
        @keyframes floatPetal {
          0%   { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-28px) rotate(12deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes themeFlash {
          0%   { opacity: 0; }
          40%  { opacity: 0.55; }
          100% { opacity: 0; }
        }

        .mat-icon { font-family: 'Material Icons Round'; font-style: normal; font-weight: normal; font-size: 20px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; user-select: none; }
        .mat-icon-sm { font-size: 16px; }
        .mat-icon-lg { font-size: 28px; }
        .mat-icon-xl { font-size: 40px; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#3b5bdb55" : "#e91e8c55"}; border-radius: 4px; }

        .hero-btn-primary:hover { transform: translateY(-3px) scale(1.03); }
        .hero-btn-secondary:hover { background: ${dark ? "rgba(59,91,219,0.1)" : "rgba(233,30,140,0.07)"} !important; }
        .card-hover:hover { transform: translateY(-6px); }
        .step-hover:hover { transform: translateX(10px); }
        .nav-link:hover { color: ${dark ? "#f1f5f9" : "#e91e8c"} !important; }
        .footer-link:hover { color: ${dark ? "#7c8cf8" : "#e91e8c"} !important; }
        .social-link:hover { color: ${dark ? "#7c8cf8" : "#e91e8c"} !important; }
      `}</style>
    </>
  );
}

// ─── Icon component ───────────────────────────────────────────────────────────
function Icon({ name, size = "", style = {}, className = "" }) {
  const sizeClass = size === "sm" ? "mat-icon-sm" : size === "lg" ? "mat-icon-lg" : size === "xl" ? "mat-icon-xl" : "";
  return <span className={`mat-icon ${sizeClass} ${className}`} style={style}>{name}</span>;
}

// ─── Types / Hooks ─────────────────────────────────────────────────────────────
function useStars(count = 180) {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(Array.from({ length: count }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      r: Math.random() * 1.6 + 0.4,
      o: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 3 + 2,
    })));
  }, [count]);
  return stars;
}

function useParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: (e.clientX / window.innerWidth - 0.5) * 24, y: (e.clientY / window.innerHeight - 0.5) * 24 });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let s = 0; const step = to / 60;
    const id = setInterval(() => {
      s += step;
      if (s >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(s));
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      style={{
        position: "relative", width: 52, height: 28, borderRadius: 14,
        border: `1.5px solid ${dark ? "rgba(124,140,248,0.35)" : "rgba(233,30,140,0.3)"}`,
        background: dark ? "rgba(15,23,42,0.9)" : "#fff0f5",
        cursor: "pointer", outline: "none", transition: "all 0.4s",
        display: "flex", alignItems: "center", padding: "3px",
      }}
      aria-label="Toggle theme"
    >
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#f06292)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: dark ? "translateX(24px)" : "translateX(0)",
        transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: dark ? "0 0 10px #3b5bdb88" : "0 0 10px #e91e8c55",
      }}>
        <Icon name={dark ? "dark_mode" : "light_mode"} style={{ color: "#fff", fontSize: 12 }} />
      </span>
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Nav({ dark, toggle }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features", icon: "auto_awesome" },
    { label: "How it works", href: "#how-it-works", icon: "timeline" },
    { label: "Pricing", href: "#pricing", icon: "payments" },
    { label: "Security", href: "#security", icon: "shield" },
  ];

  const textColor = dark ? "#94a3b8" : "#374151";
  const logoTextColor = dark ? "#f1f5f9" : "#111827";
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const navBg = dark
    ? scrolled ? "rgba(2,8,23,0.92)" : "transparent"
    : scrolled ? "rgba(255,255,255,0.96)" : "transparent";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      borderBottom: scrolled ? `1px solid ${dark ? "rgba(59,91,219,0.15)" : "rgba(0,0,0,0.06)"}` : "1px solid transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      transition: "all 0.4s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#f06292)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: dark ? "0 4px 16px #3b5bdb44" : "0 4px 16px #e91e8c33",
          }}>
            <Icon name="hub" style={{ color: "#fff", fontSize: 18 }} />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: logoTextColor }}>
            CoWork<span style={{ color: accentColor }}>AI</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className="nav-link"
              style={{ textDecoration: "none", fontSize: 14, fontWeight: 500, color: textColor, display: "flex", alignItems: "center", gap: 5, transition: "color 0.2s" }}>
              <Icon name={l.icon} size="sm" style={{ opacity: 0.7 }} />
              {l.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle dark={dark} toggle={toggle} />
          <a href="/auth/login" style={{
            textDecoration: "none", fontSize: 14, fontWeight: 500, color: textColor,
            padding: "8px 18px", borderRadius: 8, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"; e.currentTarget.style.color = textColor; }}
          >Sign in</a>
          <a href="/auth/register" style={{
            textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#fff",
            padding: "8px 20px", borderRadius: 8,
            background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)",
            boxShadow: dark ? "0 4px 18px #3b5bdb44" : "0 4px 18px #e91e8c33",
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.25s",
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "none")}
          >
            Get started
            <Icon name="arrow_forward" size="sm" />
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ dark, parallax, stars }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const accentColor = dark ? "#7c8cf8" : "#e91e8c";

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 80 }}>
      {/* Stars (dark) */}
      {dark && stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2, borderRadius: "50%",
          background: `rgba(180,200,255,${s.o})`,
          animation: `twinkle ${s.speed}s ease-in-out infinite alternate`,
          animationDelay: `${(i * 0.05) % s.speed}s`, pointerEvents: "none",
        }} />
      ))}

      {/* Light mode petals */}
      {!dark && [...Array(10)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
          left: `${(i * 10 + 3) % 95}%`, top: `${(i * 13 + 5) % 80}%`,
          width: 30 + (i % 4) * 20, height: 30 + (i % 4) * 20,
          background: i % 2 === 0 ? "rgba(233,30,140,0.08)" : "rgba(244,143,177,0.1)",
          animation: `floatPetal ${5 + i * 0.4}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.25}s`, pointerEvents: "none",
        }} />
      ))}

      {/* Moon (dark) */}
      {dark && (
        <div style={{
          position: "absolute", right: "9%", top: "11%",
          transform: `translate(${parallax.x * -0.4}px, ${parallax.y * -0.4}px)`,
          transition: "transform 0.12s ease-out", pointerEvents: "none",
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #e8eaf6, #9fa8da 45%, #5c6bc0 85%)",
            boxShadow: "0 0 48px 16px rgba(124,140,248,0.2), 0 0 90px 30px rgba(59,91,219,0.08)",
          }} />
          {[[22, 28, 10], [58, 52, 8], [38, 64, 6]].map(([x, y, s], i) => (
            <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s, height: s, borderRadius: "50%", background: "#3949ab", opacity: 0.35 }} />
          ))}
        </div>
      )}

      {/* Nebula glow */}
      <div style={{
        position: "absolute", width: 800, height: 550,
        left: "50%", top: "45%",
        transform: `translate(calc(-50% + ${parallax.x * 0.25}px), calc(-50% + ${parallax.y * 0.25}px))`,
        transition: "transform 0.14s ease-out",
        background: dark
          ? "radial-gradient(ellipse, rgba(59,91,219,0.12) 0%, rgba(124,58,237,0.06) 55%, transparent 75%)"
          : "radial-gradient(ellipse, rgba(233,30,140,0.06) 0%, rgba(244,143,177,0.04) 55%, transparent 75%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 860, padding: "0 28px" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "6px 16px", borderRadius: 100,
          background: dark ? "rgba(59,91,219,0.1)" : "rgba(233,30,140,0.07)",
          border: `1px solid ${dark ? "rgba(124,140,248,0.25)" : "rgba(233,30,140,0.25)"}`,
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: accentColor, letterSpacing: "0.04em" }}>Now in public beta · Multi-model AI workspace</span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.6rem, 7.5vw, 5.2rem)",
          fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em",
          color: dark ? "#f1f5f9" : "#111827",
          marginBottom: 24,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(28px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}>
          Where AI Teams{" "}
          <span style={{display: "inline-block",
background: "linear-gradient(135deg,#e91e8c,#f06292,#ec4899)",
WebkitBackgroundClip: "text",
backgroundClip: "text",
WebkitTextFillColor: "transparent",
color: "transparent",
          }}>Think Together</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
          fontWeight: 400, lineHeight: 1.75,
          color: dark ? "#94a3b8" : "#4b5563",
          maxWidth: 620, margin: "0 auto 40px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}>
          CoWork AI is the collaborative workspace where multiple AI models reason, execute, and review together—inside organized projects with persistent memory and real-time streaming.
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.32s",
        }}>
          <a href="/auth/register" className="hero-btn-primary" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 16,
            color: "#fff", textDecoration: "none",
            background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)",
            boxShadow: dark ? "0 8px 30px #3b5bdb44" : "0 8px 30px #e91e8c44",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <Icon name="rocket_launch" style={{ fontSize: 18 }} />
            Start building free
          </a>
          <a href="#how-it-works" className="hero-btn-secondary" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: 12, fontWeight: 600, fontSize: 16,
            color: dark ? "#94a3b8" : "#374151", textDecoration: "none",
            border: `1.5px solid ${dark ? "rgba(124,140,248,0.22)" : "rgba(0,0,0,0.12)"}`,
            transition: "all 0.25s",
          }}>
            <Icon name="play_circle" style={{ fontSize: 18, color: accentColor }} />
            See how it works
          </a>
        </div>

        {/* Trust bar */}
        <div style={{
          marginTop: 64, display: "flex", flexWrap: "wrap", justifyContent: "center",
          gap: 24, alignItems: "center",
          opacity: mounted ? 1 : 0, transition: "opacity 1s 0.6s",
        }}>
          <span style={{ fontSize: 12, color: dark ? "#475569" : "#9ca3af", letterSpacing: "0.06em", fontWeight: 500 }}>WORKS WITH</span>
          {["OpenAI", "Anthropic", "Google Gemini", "Groq", "OpenRouter"].map(p => (
            <span key={p} style={{ fontSize: 13, fontWeight: 600, color: dark ? "#64748b" : "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="check_circle" size="sm" style={{ color: accentColor, opacity: 0.7 }} />
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.4, animation: "floatPetal 2s ease-in-out infinite alternate" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: dark ? "#475569" : "#9ca3af", letterSpacing: "0.1em" }}>SCROLL</span>
        <Icon name="keyboard_arrow_down" style={{ color: dark ? "#475569" : "#9ca3af", fontSize: 20 }} />
      </div>
    </section>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, children, style = {} }) {
  const { ref, inView } = useInView();
  return (
    <section id={id} ref={ref} style={{
      padding: "96px 28px",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(36px)",
      transition: "opacity 0.8s ease, transform 0.8s ease",
      ...style,
    }}>
      {children}
    </section>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ dark, tag, tagIcon, title, subtitle }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  return (
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      {tag && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 100, marginBottom: 16,
          background: dark ? "rgba(59,91,219,0.1)" : "rgba(233,30,140,0.07)",
          border: `1px solid ${dark ? "rgba(124,140,248,0.22)" : "rgba(233,30,140,0.22)"}`,
        }}>
          {tagIcon && <Icon name={tagIcon} size="sm" style={{ color: accentColor }} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: "0.06em" }}>{tag}</span>
        </div>
      )}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
        fontWeight: 900, color: dark ? "#f1f5f9" : "#111827",
        marginBottom: 16, lineHeight: 1.15,
      }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 17, color: dark ? "#94a3b8" : "#4b5563", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function ProblemSection({ dark }) {
  const problems = [
    { icon: "link_off", title: "One chat at a time", desc: "Locked into a single conversation—no projects, no parallel thinking, no organization." },
    { icon: "psychology_alt", title: "Single-model ceiling", desc: "No one model is great at everything. Reasoning, execution, and review need different strengths." },
    { icon: "cloud_off", title: "No persistent memory", desc: "Every session starts blank. Your context, instructions, and history vanish every time." },
    { icon: "group_off", title: "No team collaboration", desc: "AI tools are built for individuals. Sharing work and managing access is near impossible." },
  ];
  return (
    <Section id="problem">
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <SectionHeader dark={dark} tag="THE PROBLEM" tagIcon="error_outline"
          title="Single-model tools are holding you back"
          subtitle="You've outgrown the chat box. Building complex things needs more than one model talking at you." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {problems.map((p, i) => (
            <div key={i} className="card-hover" style={{
              borderRadius: 20, padding: "28px 24px",
              background: dark ? "rgba(15,23,42,0.65)" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`,
              backdropFilter: "blur(12px)",
              boxShadow: dark ? "none" : "0 2px 16px rgba(0,0,0,0.04)",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                background: "rgba(239,68,68,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={p.icon} style={{ color: "#ef4444", fontSize: 22 }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: dark ? "#e2e8f0" : "#111827", marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: dark ? "#64748b" : "#6b7280", lineHeight: 1.65 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Solution Section ─────────────────────────────────────────────────────────
function SolutionSection({ dark }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const points = [
    { icon: "folder_special", text: "Projects with persistent context & memory" },
    { icon: "forum", text: "Multiple chats per project, all organized" },
    { icon: "groups", text: "AI team: reasoning → execution → review" },
    { icon: "history", text: "Message versioning & retry history" },
    { icon: "manage_accounts", text: "Team collaboration with role-based access" },
  ];
  const chatMessages = [
    { role: "user", msg: "Analyze the market trends for AI tooling in 2025" },
    { role: "ai", model: "Reasoner", icon: "psychology", color: "#3b5bdb", msg: "Breaking down key signals: enterprise adoption up 340%, open-source models closing the gap fast..." },
    { role: "ai", model: "Executor", icon: "code", color: "#7c3aed", msg: "Generating competitive matrix with 12 key players and scoring rubric..." },
    { role: "ai", model: "Reviewer", icon: "fact_check", color: "#059669", msg: "Cross-checking sources—flagging 2 inconsistencies for revision." },
  ];
  return (
    <Section id="solution">
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 100, marginBottom: 20,
            background: dark ? "rgba(59,91,219,0.1)" : "rgba(233,30,140,0.07)",
            border: `1px solid ${dark ? "rgba(124,140,248,0.22)" : "rgba(233,30,140,0.22)"}`,
          }}>
            <Icon name="lightbulb" size="sm" style={{ color: accentColor }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: "0.06em" }}>THE SOLUTION</span>
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            fontWeight: 900, color: dark ? "#f1f5f9" : "#111827",
            lineHeight: 1.15, marginBottom: 20,
          }}>A workspace where AI models collaborate like a team</h2>
          <p style={{ fontSize: 16, color: dark ? "#94a3b8" : "#4b5563", lineHeight: 1.75, marginBottom: 32 }}>
            CoWork AI organizes your work into projects with persistent memory. Each project has multiple chats and a team of AI models—each with a dedicated role.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {points.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: dark ? "rgba(59,91,219,0.15)" : "rgba(233,30,140,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={p.icon} size="sm" style={{ color: accentColor }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: dark ? "#94a3b8" : "#374151" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat mockup */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: dark ? "rgba(10,16,40,0.85)" : "#ffffff",
          border: `1px solid ${dark ? "rgba(59,91,219,0.18)" : "rgba(0,0,0,0.08)"}`,
          boxShadow: dark ? "0 40px 80px rgba(0,0,0,0.55)" : "0 24px 64px rgba(0,0,0,0.08)",
        }}>
          {/* Window chrome */}
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}` }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["Research","search","#3b5bdb"], ["Execution","settings","#7c3aed"], ["Review","verified","#059669"]].map(([t, ico, c], i) => (
                <div key={i} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                  background: i === 0 ? (dark ? "rgba(59,91,219,0.22)" : "rgba(233,30,140,0.1)") : "transparent",
                  color: i === 0 ? (dark ? "#7c8cf8" : "#e91e8c") : (dark ? "#475569" : "#9ca3af"),
                }}>
                  <Icon name={ico} style={{ fontSize: 11 }} />
                  {t}
                </div>
              ))}
            </div>
            <Icon name="more_horiz" size="sm" style={{ color: dark ? "#475569" : "#9ca3af" }} />
          </div>
          {/* Messages */}
          <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 8 }}>
                {m.role === "ai" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: m.color, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={m.icon} style={{ color: "#fff", fontSize: 14 }} />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  fontSize: 12, lineHeight: 1.6,
                  background: m.role === "user"
                    ? (dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)")
                    : (dark ? "rgba(30,40,70,0.9)" : "#f8f8fc"),
                  color: m.role === "user" ? "#fff" : (dark ? "#e2e8f0" : "#111827"),
                }}>
                  {m.role === "ai" && <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.model}</div>}
                  {m.msg}
                </div>
              </div>
            ))}
          </div>
          {/* Input bar */}
          <div style={{
            margin: "0 18px 18px", padding: "10px 14px", borderRadius: 12,
            background: dark ? "rgba(255,255,255,0.04)" : "#f3f4f6",
            border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: dark ? "#334155" : "#9ca3af", flex: 1 }}>Ask your AI team something...</span>
            <Icon name="send" size="sm" style={{ color: dark ? "#3b5bdb" : "#e91e8c" }} />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection({ dark }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const features = [
    { icon: "forum", title: "Multi-Chat System", desc: "Run parallel chats per project. Switch context instantly, rename, and organize without losing thread.", tag: "Core" },
    { icon: "groups_3", title: "AI Team Mode", desc: "Assign roles to different models: one reasons, one executes, one reviews. Better than any solo model.", tag: "Unique" },
    { icon: "account_tree", title: "Message Versioning", desc: "Retry, edit, navigate branches. Like git—but for conversations. Never lose a great answer.", tag: "Unique" },
    { icon: "memory", title: "Project Memory", desc: "Long-form persistent context per project. Your AI knows your stack, goals, and prior decisions.", tag: "Core" },
    { icon: "diversity_3", title: "Team Collaboration", desc: "Invite teammates, set owner/editor/viewer roles. Share chats or keep them private per project.", tag: "Teams" },
    { icon: "vpn_key", title: "Bring Your Own Keys", desc: "Connect OpenAI, Anthropic, Gemini, Groq, OpenRouter. You own the data and the costs.", tag: "Flexibility" },
    { icon: "bar_chart", title: "Usage Analytics", desc: "Track token usage, provider breakdowns, and performance across all projects and team members.", tag: "Insights" },
    { icon: "bolt", title: "Real-Time Streaming", desc: "Sub-second latency. Watch your AI team think live. No waiting, no spinners, just flow.", tag: "Performance" },
  ];
  const tagColors = {
    Core: dark ? "#3b5bdb" : "#e91e8c",
    Unique: "#7c3aed",
    Teams: "#059669",
    Flexibility: "#d97706",
    Insights: "#0891b2",
    Performance: "#dc2626",
  };
  return (
    <Section id="features">
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <SectionHeader dark={dark} tag="EVERYTHING YOU NEED" tagIcon="auto_awesome"
          title="Built for serious AI work"
          subtitle="Every feature is designed to make your AI workflow faster, smarter, and more collaborative." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 }}>
          {features.map((f, i) => (
            <div key={i} className="card-hover" style={{
              borderRadius: 20, padding: "26px 24px",
              background: dark ? "rgba(15,23,42,0.6)" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`,
              boxShadow: dark ? "none" : "0 2px 16px rgba(0,0,0,0.04)",
              backdropFilter: "blur(10px)",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              cursor: "default",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: dark ? "rgba(59,91,219,0.12)" : "rgba(233,30,140,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={f.icon} style={{ color: accentColor, fontSize: 22 }} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  padding: "3px 8px", borderRadius: 6,
                  background: `${tagColors[f.tag]}18`,
                  color: tagColors[f.tag],
                }}>{f.tag.toUpperCase()}</span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: dark ? "#e2e8f0" : "#111827", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: dark ? "#64748b" : "#6b7280", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
function StatsSection({ dark }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const stats = [
    { icon: "folder_open", val: 12000, suffix: "+", label: "Active projects" },
    { icon: "chat_bubble", val: 99, suffix: "k", label: "AI messages sent" },
    { icon: "hub", val: 5, suffix: "", label: "Model providers" },
    { icon: "trending_up", val: 340, suffix: "%", label: "Faster than solo AI" },
  ];
  return (
    <Section>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{
          borderRadius: 28, padding: "56px 48px",
          background: dark
            ? "linear-gradient(135deg,rgba(15,23,50,0.9),rgba(20,15,50,0.85))"
            : "linear-gradient(135deg,#fff0f6,#fce7f3)",
          border: `1px solid ${dark ? "rgba(59,91,219,0.18)" : "rgba(233,30,140,0.15)"}`,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40,
          textAlign: "center",
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
                background: dark ? "rgba(59,91,219,0.15)" : "rgba(233,30,140,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={s.icon} style={{ color: accentColor, fontSize: 24 }} />
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, fontFamily: "'Playfair Display', serif", color: accentColor, lineHeight: 1 }}>
                <Counter to={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: dark ? "#64748b" : "#6b7280", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection({ dark }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const steps = [
    { n: "01", icon: "create_new_folder", title: "Create a Project", desc: "Set up a project with a name, instructions, and context. CoWork AI remembers everything scoped to it." },
    { n: "02", icon: "chat_bubble_outline", title: "Open Multiple Chats", desc: "Spawn as many chats as you need within the project. Each shares the same context, has its own history." },
    { n: "03", icon: "groups", title: "Activate AI Team Mode", desc: "Assign models to roles: Reasoner (deep thinking), Executor (tasks + code), Reviewer (quality check)." },
    { n: "04", icon: "people_alt", title: "Invite Your Team", desc: "Add teammates, set permissions, and collaborate in real time. Everything syncs instantly." },
  ];
  return (
    <Section id="how-it-works">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SectionHeader dark={dark} tag="HOW IT WORKS" tagIcon="timeline"
          title="From zero to AI team in minutes" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((s, i) => (
            <div key={i} className="step-hover" style={{
              display: "flex", gap: 24, alignItems: "flex-start",
              padding: "24px 28px", borderRadius: 20,
              background: dark ? "rgba(15,23,42,0.55)" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`,
              boxShadow: dark ? "none" : "0 2px 16px rgba(0,0,0,0.04)",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", cursor: "default",
            }}>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: dark ? "rgba(59,91,219,0.15)" : "rgba(233,30,140,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <Icon name={s.icon} style={{ color: accentColor, fontSize: 24 }} />
                  <span style={{
                    position: "absolute", top: -8, right: -8,
                    width: 20, height: 20, borderRadius: "50%",
                    background: accentColor, color: "#fff",
                    fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{s.n}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: 1, height: 16, background: `linear-gradient(to bottom, ${accentColor}44, transparent)` }} />}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: dark ? "#e2e8f0" : "#111827", marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: dark ? "#94a3b8" : "#6b7280", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection({ dark }) {
  const [annual, setAnnual] = useState(false);
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const plans = [
    {
      name: "Free", icon: "explore", price: 0, desc: "Perfect for solo exploration",
      features: ["3 Projects", "5 chats per project", "1 AI model at a time", "Basic memory", "Community support", "Bring your own API keys"],
      cta: "Start free", highlight: false,
    },
    {
      name: "Pro", icon: "star", price: annual ? 19 : 25, desc: "For power users & small teams",
      features: ["Unlimited projects", "Unlimited chats", "AI Team Mode (3 models)", "Message versioning", "Advanced memory & context", "Priority support", "Usage analytics", "Bring your own API keys"],
      cta: "Start Pro trial", highlight: true,
    },
    {
      name: "Team", icon: "corporate_fare", price: annual ? 49 : 59, desc: "For teams that build together",
      features: ["Everything in Pro", "Up to 20 seats", "Role-based permissions", "Shared & private chats", "Admin dashboard", "SSO / SAML", "SLA support"],
      cta: "Talk to us", highlight: false,
    },
  ];
  return (
    <Section id="pricing">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionHeader dark={dark} tag="PRICING" tagIcon="payments"
          title="Simple, transparent pricing"
          subtitle="No surprises. No hidden fees. Cancel anytime." />
        {/* Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 52 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: dark ? "#64748b" : "#6b7280" }}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} style={{
            position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
            background: annual ? accentColor : (dark ? "#1e293b" : "#e5e7eb"),
            transition: "background 0.3s",
          }}>
            <span style={{
              position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff",
              left: annual ? "calc(100% - 21px)" : 3,
              transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: dark ? "#64748b" : "#6b7280" }}>
            Annual <span style={{ color: accentColor, fontWeight: 700 }}>−20%</span>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, alignItems: "center" }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              borderRadius: 24, padding: "36px 32px",
              background: p.highlight
                ? (dark ? "linear-gradient(160deg,rgba(25,35,90,0.95),rgba(40,20,80,0.9))" : "linear-gradient(160deg,#fff0f5,#fce7f3)")
                : (dark ? "rgba(15,23,42,0.6)" : "#fff"),
              border: `${p.highlight ? "2px" : "1px"} solid ${p.highlight ? accentColor + "55" : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)")}`,
              boxShadow: p.highlight ? (dark ? "0 24px 60px rgba(59,91,219,0.2)" : "0 24px 60px rgba(233,30,140,0.14)") : (dark ? "none" : "0 2px 16px rgba(0,0,0,0.04)"),
              transform: p.highlight ? "scale(1.03)" : "scale(1)",
              position: "relative", display: "flex", flexDirection: "column",
              transition: "transform 0.3s", cursor: "default",
            }}>
              {p.highlight && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 14px", borderRadius: 100,
                  background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)",
                  fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Icon name="star" style={{ fontSize: 11 }} />
                  MOST POPULAR
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: p.highlight ? (dark ? "rgba(124,140,248,0.2)" : "rgba(233,30,140,0.12)") : (dark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={p.icon} style={{ color: p.highlight ? accentColor : (dark ? "#64748b" : "#9ca3af"), fontSize: 20 }} />
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: dark ? "#f1f5f9" : "#111827" }}>{p.name}</h3>
              </div>
              <p style={{ fontSize: 13, color: dark ? "#64748b" : "#6b7280", marginBottom: 20 }}>{p.desc}</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 28 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: dark ? "#f1f5f9" : "#111827", lineHeight: 1 }}>${p.price}</span>
                {p.price > 0 && <span style={{ fontSize: 14, color: dark ? "#64748b" : "#6b7280", marginBottom: 6 }}>/mo</span>}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: dark ? "#94a3b8" : "#374151" }}>
                    <Icon name="check_circle" size="sm" style={{ color: accentColor, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
              <a href="/auth/register" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                textDecoration: "none", cursor: "pointer",
                background: p.highlight ? (dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)") : "transparent",
                color: p.highlight ? "#fff" : accentColor,
                border: p.highlight ? "none" : `1.5px solid ${accentColor}44`,
                transition: "all 0.25s",
              }}
                onMouseEnter={e => !p.highlight && (e.currentTarget.style.background = dark ? "rgba(59,91,219,0.1)" : "rgba(233,30,140,0.06)")}
                onMouseLeave={e => !p.highlight && (e.currentTarget.style.background = "transparent")}
              >
                {p.cta}
                <Icon name="arrow_forward" size="sm" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────
function SecuritySection({ dark }) {
  const items = [
    { icon: "lock", title: "Encrypted API Keys", desc: "AES-256 encryption at rest. We never expose your keys in logs, errors, or responses.", color: "#3b5bdb" },
    { icon: "verified_user", title: "JWT Authentication", desc: "Secure, short-lived tokens with automatic expiry. No persistent cookie vulnerabilities.", color: "#7c3aed" },
    { icon: "admin_panel_settings", title: "Role-Based Access", desc: "Fine-grained permissions at project and chat level. Owners, editors, and viewers each have explicit scope.", color: "#059669" },
    { icon: "https", title: "TLS Everywhere", desc: "All data in transit encrypted via TLS 1.3. End-to-end encryption for sensitive contexts.", color: "#0891b2" },
  ];
  return (
    <Section id="security">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          borderRadius: 28, padding: "60px 52px",
          background: dark ? "rgba(10,15,35,0.7)" : "#fff",
          border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`,
          boxShadow: dark ? "none" : "0 4px 32px rgba(0,0,0,0.06)",
        }}>
          <SectionHeader dark={dark} tag="SECURITY" tagIcon="shield"
            title="Your data is yours. Always."
            subtitle="Enterprise-grade security baked in from day one. No compromises on your keys, context, or team data." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {items.map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: "0 auto 18px",
                  background: `${item.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={item.icon} style={{ color: item.color, fontSize: 28 }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: dark ? "#e2e8f0" : "#111827", marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: dark ? "#64748b" : "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection({ dark, stars }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  return (
    <Section>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          borderRadius: 32, padding: "80px 52px", position: "relative", overflow: "hidden",
          background: dark
            ? "linear-gradient(135deg,rgba(20,30,90,0.92),rgba(30,15,60,0.88))"
            : "linear-gradient(135deg,#fff0f6,#fce7f3)",
          border: `1px solid ${dark ? "rgba(124,140,248,0.2)" : "rgba(233,30,140,0.18)"}`,
          boxShadow: dark ? "0 40px 80px rgba(59,91,219,0.12)" : "0 24px 64px rgba(233,30,140,0.1)",
        }}>
          {dark && stars.slice(0, 40).map((s, i) => (
            <div key={i} style={{
              position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
              width: s.r * 1.5, height: s.r * 1.5, borderRadius: "50%",
              background: `rgba(180,200,255,${s.o * 0.4})`,
              animation: `twinkle ${s.speed}s ease-in-out infinite alternate`, pointerEvents: "none",
            }} />
          ))}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
              padding: "8px 20px", borderRadius: 100,
              background: dark ? "rgba(59,91,219,0.15)" : "rgba(233,30,140,0.1)",
              border: `1px solid ${dark ? "rgba(124,140,248,0.25)" : "rgba(233,30,140,0.25)"}`,
            }}>
              <Icon name="celebration" style={{ color: accentColor, fontSize: 18 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>Free to start. No credit card needed.</span>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 900, color: dark ? "#f1f5f9" : "#111827",
              lineHeight: 1.15, marginBottom: 18,
            }}>Ready to build smarter?</h2>
            <p style={{ fontSize: 17, color: dark ? "#94a3b8" : "#4b5563", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Join thousands of developers and teams shipping better products faster with CoWork AI.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
              <a href="/auth/register" className="hero-btn-primary" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 36px", borderRadius: 12, fontWeight: 700, fontSize: 16,
                color: "#fff", textDecoration: "none",
                background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#ec4899)",
                boxShadow: dark ? "0 10px 34px #3b5bdb44" : "0 10px 34px #e91e8c44",
                transition: "all 0.3s",
              }}>
                <Icon name="rocket_launch" style={{ fontSize: 18 }} />
                Start building free
              </a>
              <a href="/auth/login" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "15px 28px", borderRadius: 12, fontWeight: 600, fontSize: 15,
                color: dark ? "#94a3b8" : "#374151", textDecoration: "none",
                border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                onMouseLeave={e => (e.currentTarget.style.color = dark ? "#94a3b8" : "#374151")}
              >
                <Icon name="login" size="sm" />
                I already have an account
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ dark }) {
  const accentColor = dark ? "#7c8cf8" : "#e91e8c";
  const cols = [
    { title: "Product", links: [["Features","auto_awesome"], ["Pricing","payments"], ["Changelog","update"], ["Roadmap","map"]] },
    { title: "Integrations", links: [["OpenAI","hub"], ["Anthropic","psychology"], ["Google AI","smart_toy"], ["Groq","bolt"], ["OpenRouter","alt_route"]] },
    { title: "Company", links: [["About","info"], ["Blog","article"], ["Careers","work"], ["Press","campaign"]] },
    { title: "Legal", links: [["Privacy","privacy_tip"], ["Terms","gavel"], ["Security","shield"], ["GDPR","policy"]] },
  ];
  return (
    <footer style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)"}`, padding: "64px 28px 40px" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: dark ? "linear-gradient(135deg,#3b5bdb,#7c3aed)" : "linear-gradient(135deg,#e91e8c,#f06292)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="hub" style={{ color: "#fff", fontSize: 18 }} />
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: dark ? "#f1f5f9" : "#111827" }}>
                CoWork<span style={{ color: accentColor }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: dark ? "#475569" : "#9ca3af", lineHeight: 1.7, maxWidth: 200 }}>
              Multi-model collaborative AI workspace for teams and builders.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              {[["twitter","Twitter"],["github","GitHub"],["discord","Discord"]].map(([icon, label]) => (
                <a key={label} href="#" className="social-link" style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: dark ? "rgba(255,255,255,0.04)" : "#f3f4f6",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", color: dark ? "#475569" : "#9ca3af",
                  transition: "color 0.2s",
                  fontSize: 11, fontWeight: 700,
                }}>{label[0]}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: dark ? "#64748b" : "#9ca3af", marginBottom: 16, textTransform: "uppercase" }}>{col.title}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(([label, icon]) => (
                  <a key={label} href="#" className="footer-link" style={{
                    textDecoration: "none", fontSize: 13, fontWeight: 500,
                    color: dark ? "#475569" : "#6b7280",
                    display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s",
                  }}>
                    <Icon name={icon} size="sm" style={{ opacity: 0.5 }} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 24, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
        }}>
          <p style={{ fontSize: 13, color: dark ? "#334155" : "#9ca3af" }}>© 2025 CoWork AI. All rights reserved.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="favorite" style={{ color: accentColor, fontSize: 14 }} />
            <span style={{ fontSize: 12, color: dark ? "#334155" : "#9ca3af" }}>Built with care</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CoWorkAILanding() {
  const [dark, setDark] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const parallax = useParallax();
  const stars = useStars(200);

  const toggle = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => { setDark(d => !d); setTransitioning(false); }, 320);
  }, []);

  const bg = dark
    ? "linear-gradient(180deg,#020817 0%,#050d26 35%,#080f2e 65%,#030a1a 100%)"
    : "#ffffff";

  return (
    <>
      <GlobalStyles dark={dark} />

      {/* Flash overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
        background: dark ? "#fff" : "#020817",
        animation: transitioning ? "themeFlash 0.64s ease forwards" : "none",
        opacity: 0,
      }} />

      <div style={{ minHeight: "100vh", background: bg, transition: "background 0.65s ease" }}>
        <Nav dark={dark} toggle={toggle} />
        <Hero dark={dark} parallax={parallax} stars={stars} />
        <ProblemSection dark={dark} />
        <SolutionSection dark={dark} />
        <FeaturesSection dark={dark} />
        <StatsSection dark={dark} />
        <HowItWorksSection dark={dark} />
        <PricingSection dark={dark} />
        <SecuritySection dark={dark} />
        <CTASection dark={dark} stars={stars} />
        <Footer dark={dark} />
      </div>
    </>
  );
}