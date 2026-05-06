"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  ArrowLeft,
  Sun,
  Moon,
  Bell,
  Shield,
  Palette,
  Zap,
  Globe,
  Save,
  Check,
  Loader2,
  Lock,
} from "lucide-react";

// ─── Styles ──────────────────────────────────────────────────────────────────
const themeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  :root { --spring: cubic-bezier(0.34,1.56,0.64,1); --ease: cubic-bezier(0.16,1,0.3,1); }

  .cw-dark {
    --bg: #07071e; --bg-s: rgba(39,39,87,0.42); --bg-g: rgba(15,14,71,0.52);
    --bg-e: rgba(80,80,129,0.2); --bg-i: rgba(39,39,87,0.58);
    --b-soft: rgba(134,134,172,0.14); --b-mid: rgba(134,134,172,0.3);
    --b-glow: rgba(77,159,255,0.42); --b-glow2: rgba(77,159,255,0.16);
    --t1: #FFFFE3; --t2: #9292b8; --tm: rgba(134,134,172,0.52);
    --btn-bg: #FFFFE3; --btn-fg: #0F0E47; --accent: #4D9FFF; --ag: rgba(77,159,255,0.16);
    --side-bg: rgba(6,6,22,0.72); --modal-bg: rgba(6,6,22,0.95); --scrollbar: rgba(80,80,129,0.4);
  }
  .cw-light {
    --bg: #eef0fb; --bg-s: rgba(255,255,255,0.72); --bg-g: rgba(255,255,255,0.62);
    --bg-e: rgba(255,255,255,0.86); --bg-i: rgba(255,255,255,0.8);
    --b-soft: rgba(80,80,129,0.1); --b-mid: rgba(80,80,129,0.22);
    --b-glow: rgba(77,159,255,0.52); --b-glow2: rgba(77,159,255,0.14);
    --t1: #1a1848; --t2: #505081; --tm: rgba(80,80,129,0.48);
    --btn-bg: #272757; --btn-fg: #FFFFE3; --accent: #3d8fe8; --ag: rgba(77,159,255,0.12);
    --side-bg: rgba(230,232,248,0.8); --modal-bg: rgba(235,237,252,0.97); --scrollbar: rgba(80,80,129,0.22);
  }

  .cw-root { font-family: 'DM Sans',sans-serif; font-size: 14px; color: var(--t1); background: var(--bg); min-height: 100vh; transition: background 0.5s, color 0.4s; }
  .cw-root *::-webkit-scrollbar { width: 3px; }
  .cw-root *::-webkit-scrollbar-track { background: transparent; }
  .cw-root *::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }

  .cw-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .cw-orb { position: absolute; border-radius: 50%; filter: blur(88px); animation: cwOrbF 20s ease-in-out infinite; }
  .cw-orb1 { width: 560px; height: 560px; background: rgba(77,159,255,0.09); top: -140px; left: -100px; }
  .cw-orb2 { width: 420px; height: 420px; background: rgba(134,134,172,0.07); bottom: -120px; right: -80px; animation-delay: -8s; }
  @keyframes cwOrbF { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(28px,-34px) scale(1.04); } 66% { transform:translate(-18px,26px) scale(0.97); } }

  .cw-navbar { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 24px; position: sticky; top: 0; z-index: 100; background: var(--bg-g); backdrop-filter: blur(28px) saturate(180%); border-bottom: 1px solid var(--b-soft); transition: background 0.5s; }
  .cw-logo { width: 32px; height: 32px; background: linear-gradient(135deg,#505081,#4D9FFF); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: 'Syne',sans-serif; font-weight: 800; font-size: 12px; color: #fff; box-shadow: 0 0 18px rgba(77,159,255,0.22); transition: box-shadow 0.3s, transform 0.3s var(--spring); }
  .cw-logo:hover { box-shadow: 0 0 30px rgba(77,159,255,0.44); transform: scale(1.08) rotate(-4deg); }
  .cw-brand-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 15px; color: var(--t1); letter-spacing: -0.3px; }
  .cw-brand-sub { font-size: 10px; color: var(--tm); letter-spacing: 0.5px; }
  .cw-nav-btn { display: flex; align-items: center; gap: 5px; padding: 6px 11px; background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 10px; color: var(--t2); font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.22s var(--ease); }
  .cw-nav-btn:hover { background: var(--bg-s); border-color: var(--b-mid); color: var(--t1); transform: translateY(-1px); }
  .cw-theme-toggle { position: relative; width: 50px; height: 26px; background: var(--bg-e); border: 1px solid var(--b-mid); border-radius: 99px; cursor: pointer; transition: background 0.4s; }
  .cw-theme-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: var(--t1); border-radius: 50%; transition: transform 0.4s var(--spring); }
  .cw-light .cw-theme-toggle::after { transform: translateX(22px); }

  .cw-layout { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 56px); position: relative; z-index: 1; }

  .cw-settings-nav { background: var(--side-bg); border-right: 1px solid var(--b-soft); padding: 20px 12px; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; backdrop-filter: blur(20px); }
  .cw-settings-nav-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 11px; border-radius: 11px; border: 1px solid transparent; background: transparent; color: var(--t2); font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.2s var(--ease); white-space: nowrap; margin-bottom: 3px; }
  .cw-settings-nav-item:hover { background: var(--bg-e); border-color: var(--b-soft); color: var(--t1); transform: translateX(3px); }
  .cw-settings-nav-item.active { background: var(--ag); border-color: var(--b-glow2); color: var(--accent); }
  .cw-nav-section-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.9px; text-transform: uppercase; color: var(--tm); padding: 12px 11px 6px; }

  .cw-content { padding: 36px 36px 80px; }
  .cw-section-title { font-family: 'Syne',sans-serif; font-size: 20px; font-weight: 800; color: var(--t1); letter-spacing: -0.04em; margin-bottom: 4px; }
  .cw-section-sub { font-size: 13px; color: var(--t2); margin-bottom: 28px; }

  .cw-card { background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 18px; padding: 22px; margin-bottom: 14px; transition: border-color 0.2s; }
  .cw-card:hover { border-color: var(--b-mid); }
  .cw-card-title { font-family: 'Syne',sans-serif; font-size: 13.5px; font-weight: 700; color: var(--t1); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .cw-card-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--ag); border: 1px solid var(--b-glow2); display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0; }

  .cw-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--b-soft); }
  .cw-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .cw-toggle-label { font-size: 13px; font-weight: 500; color: var(--t1); }
  .cw-toggle-sub { font-size: 11.5px; color: var(--t2); margin-top: 2px; }
  .cw-toggle {
    position: relative; width: 42px; height: 23px;
    background: var(--bg-i); border: 1px solid var(--b-mid); border-radius: 99px;
    cursor: pointer; transition: background 0.3s, border-color 0.3s; flex-shrink: 0;
  }
  .cw-toggle.on { background: var(--accent); border-color: var(--accent); }
  .cw-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; background: #fff; border-radius: 50%; transition: transform 0.3s var(--spring); }
  .cw-toggle.on::after { transform: translateX(19px); }

  /* Locked "Always On" badge */
  .cw-badge-on {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
    background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3);
    color: #34d399; white-space: nowrap;
  }
  .cw-locked-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid var(--b-soft);
  }
  .cw-locked-row:last-child { border-bottom: none; padding-bottom: 0; }
  .cw-locked-note {
    margin-top: 14px; padding: 12px 14px;
    background: rgba(77,159,255,0.06); border: 1px solid var(--b-glow2);
    border-radius: 10px; font-size: 12px; color: var(--t2);
    display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;
  }

  .cw-select { width: 100%; padding: 9px 12px; background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 10px; color: var(--t1); font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none; cursor: pointer; transition: border-color 0.2s; margin-top: 7px; }
  .cw-select:focus { border-color: var(--b-glow); }

  .cw-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; border: none; background: var(--btn-bg); color: var(--btn-fg); font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s var(--spring); }
  .cw-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  .cw-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .cw-theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .cw-theme-option { padding: 14px; border-radius: 13px; border: 2px solid var(--b-soft); cursor: pointer; transition: all 0.2s; text-align: center; }
  .cw-theme-option:hover { border-color: var(--b-mid); transform: translateY(-2px); }
  .cw-theme-option.selected { border-color: var(--accent); background: var(--ag); }
  .cw-theme-preview { width: 100%; height: 52px; border-radius: 8px; margin-bottom: 8px; }
  .cw-theme-name { font-size: 12px; font-weight: 600; color: var(--t1); }

  .cw-color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; }
  .cw-color-swatch { width: 100%; aspect-ratio: 1; border-radius: 10px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
  .cw-color-swatch:hover { transform: scale(1.12); }
  .cw-color-swatch.selected { border-color: var(--t1); transform: scale(1.12); }

  .cw-toast { display: flex; align-items: center; gap: 7px; padding: 10px 14px; border-radius: 10px; font-size: 12.5px; margin-bottom: 14px; }
  .cw-toast.success { border: 1px solid rgba(52,211,153,0.28); background: rgba(52,211,153,0.09); color: #34d399; }
  .cw-toast.error { border: 1px solid rgba(239,68,68,0.28); background: rgba(239,68,68,0.09); color: #f87171; }

  .cw-skeleton { background: var(--bg-i); border-radius: 8px; animation: cwSkeleton 1.4s ease-in-out infinite; }
  @keyframes cwSkeleton { 0%,100% { opacity:0.5; } 50% { opacity:1; } }

  @keyframes cwFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .cw-fade-up { animation: cwFadeUp 0.5s var(--ease) both; }

  @media (max-width: 700px) {
    .cw-layout { grid-template-columns: 1fr; }
    .cw-settings-nav { display: flex; overflow-x: auto; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--b-soft); padding: 10px; gap: 4px; }
    .cw-nav-section-label { display: none; }
    .cw-content { padding: 20px 16px 60px; }
  }
`;

type Section = "appearance" | "notifications" | "integrations";

const navItems: { id: Section; icon: React.ReactNode; label: string; group: string }[] = [
  { id: "appearance",    icon: <Palette size={14} />, label: "Appearance",    group: "General"  },
  { id: "notifications", icon: <Bell size={14} />,    label: "Notifications", group: "General"  },
  { id: "integrations",  icon: <Zap size={14} />,     label: "Integrations",  group: "Advanced" },
];

const accentColors = ["#4D9FFF", "#8b5cf6", "#34d399", "#f59e0b", "#f472b6", "#60a5fa"];

const SETTINGS_CHANNEL = "cw-settings-sync";

export default function SettingsPage() {
  const router = useRouter();

  const [isDark, setIsDark]               = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("appearance");
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Only the 3 real DB columns ──────────────────────────────────────────────
  const [theme, setTheme]               = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor]   = useState("#4D9FFF");
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function applyTheme(t: string) {
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
  }

  function applyAccent(color: string) {
    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--ag",     color + "28");
    document.documentElement.style.setProperty("--b-glow", color + "6a");
    document.documentElement.style.setProperty("--b-glow2",color + "28");
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2800);
  }

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        if (res.status === 401) { router.replace("/auth/login"); return; }
        if (!res.ok) throw new Error();

        const { settings: s } = await res.json();
        setTheme(s.theme ?? "dark");
        setAccentColor(s.accent_color ?? "#4D9FFF");
        setWeeklyDigest(s.weekly_digest ?? false);
        applyTheme(s.theme ?? "dark");
        applyAccent(s.accent_color ?? "#4D9FFF");
      } catch {
        showToast("error", "Could not load your settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // ── Cross-tab sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(SETTINGS_CHANNEL);
    channel.onmessage = (e) => {
      const s = e.data;
      if (!s) return;
      setTheme(s.theme);
      setAccentColor(s.accent_color);
      setWeeklyDigest(s.weekly_digest);
      applyTheme(s.theme);
      applyAccent(s.accent_color);
    };
    return () => channel.close();
  }, []);

  // ── Live previews ───────────────────────────────────────────────────────────
  useEffect(() => { applyAccent(accentColor); }, [accentColor]);
  useEffect(() => { applyTheme(theme); },       [theme]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const saveSettings = useCallback(async () => {
    setSaving(true);
    const payload = { theme, accent_color: accentColor, weekly_digest: weeklyDigest };
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Settings saved successfully.");
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const ch = new BroadcastChannel(SETTINGS_CHANNEL);
        ch.postMessage(payload);
        ch.close();
      }
    } catch {
      showToast("error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [theme, accentColor, weeklyDigest]);

  const themeClass = isDark ? "cw-dark" : "cw-light";
  const groups = ["General", "Advanced"];

  const SaveBtn = ({ label }: { label: string }) => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <button onClick={saveSettings} disabled={saving} className="cw-btn-primary">
        {saving
          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          : <Save size={14} />}
        {saving ? "Saving…" : label}
      </button>
    </div>
  );

  return (
    <div className={`cw-root ${themeClass}`}>
      <style>{`${themeStyles}
        @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="cw-ambient">
        <div className="cw-orb cw-orb1" /><div className="cw-orb cw-orb2" />
      </div>

      {/* Navbar */}
      <header className="cw-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="cw-logo">CW</div>
          <div>
            <div className="cw-brand-title">CoWork.ai</div>
            <div className="cw-brand-sub">Settings</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => router.back()} className="cw-nav-btn">
            <ArrowLeft size={13} /><span>Back</span>
          </button>
          <button
            className="cw-theme-toggle"
            onClick={() => {
              const next = isDark ? "light" : "dark";
              setTheme(next);
              setIsDark(!isDark);
            }}
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5px", pointerEvents: "none" }}>
              <Sun  size={11} style={{ color: isDark ? "rgba(134,134,172,0.4)" : "#f59e0b" }} />
              <Moon size={11} style={{ color: isDark ? "#9292b8" : "rgba(80,80,129,0.35)" }} />
            </div>
          </button>
        </div>
      </header>

      <div className="cw-layout">
        {/* Sidebar nav */}
        <nav className="cw-settings-nav">
          {groups.map((group) => (
            <div key={group}>
              <div className="cw-nav-section-label">{group}</div>
              {navItems.filter((i) => i.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`cw-settings-nav-item ${activeSection === item.id ? "active" : ""}`}
                >
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="cw-content">
          {toast && (
            <div className={`cw-toast ${toast.type} cw-fade-up`}>
              {toast.type === "success" ? <Check size={14} /> : <span>⚠</span>}
              {toast.msg}
            </div>
          )}

          {loading && (
            <div className="cw-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="cw-skeleton" style={{ height: 24, width: 180 }} />
              <div className="cw-skeleton" style={{ height: 160, borderRadius: 18 }} />
              <div className="cw-skeleton" style={{ height: 120, borderRadius: 18 }} />
            </div>
          )}

          {/* ── Appearance ── */}
          {!loading && activeSection === "appearance" && (
            <div className="cw-fade-up">
              <div className="cw-section-title">Appearance</div>
              <div className="cw-section-sub">Changes apply instantly — save to persist across sessions.</div>

              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Palette size={14} /></div>Theme
                </div>
                <div className="cw-theme-grid">
                  {[
                    { id: "dark",   label: "Dark",   bg: "linear-gradient(135deg,#07071e,#1a1848)" },
                    { id: "light",  label: "Light",  bg: "linear-gradient(135deg,#eef0fb,#fff)" },
                    { id: "system", label: "System", bg: "linear-gradient(135deg,#07071e 50%,#eef0fb 50%)" },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id as typeof theme)}
                      className={`cw-theme-option ${theme === t.id ? "selected" : ""}`}
                    >
                      <div className="cw-theme-preview" style={{ background: t.bg }} />
                      <div className="cw-theme-name">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Palette size={14} /></div>Accent Color
                </div>
                <div className="cw-color-grid">
                  {accentColors.map((color) => (
                    <div
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`cw-color-swatch ${accentColor === color ? "selected" : ""}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <SaveBtn label="Save Appearance" />
            </div>
          )}

          {/* ── Notifications ── */}
          {!loading && activeSection === "notifications" && (
            <div className="cw-fade-up">
              <div className="cw-section-title">Notifications</div>
              <div className="cw-section-sub">Manage your email and digest preferences.</div>

              {/* Mandatory email notifications — locked */}
              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Bell size={14} /></div>Email Notifications
                </div>

                <div className="cw-locked-row">
                  <div>
                    <div className="cw-toggle-label">All email notifications</div>
                    <div className="cw-toggle-sub">Account alerts, security, and important updates</div>
                  </div>
                  <span className="cw-badge-on">
                    <Check size={10} /> Always On
                  </span>
                </div>

                <div className="cw-locked-row">
                  <div>
                    <div className="cw-toggle-label">Project invites</div>
                    <div className="cw-toggle-sub">Notified when someone invites you to a project</div>
                  </div>
                  <span className="cw-badge-on">
                    <Check size={10} /> Always On
                  </span>
                </div>

                <div className="cw-locked-row">
                  <div>
                    <div className="cw-toggle-label">Security alerts</div>
                    <div className="cw-toggle-sub">Login activity and account protection notices</div>
                  </div>
                  <span className="cw-badge-on">
                    <Check size={10} /> Always On
                  </span>
                </div>

                <div className="cw-locked-note">
                  <Lock size={13} style={{ flexShrink: 0, marginTop: 1, color: "var(--accent)" }} />
                  <span>
                    Email notifications are required for account security and cannot be disabled.
                    They ensure you receive critical alerts, invites, and platform updates.
                  </span>
                </div>
              </div>

              {/* Weekly digest — the one real DB toggle */}
              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Bell size={14} /></div>Weekly Digest
                </div>
                <div className="cw-toggle-row">
                  <div>
                    <div className="cw-toggle-label">Weekly activity digest</div>
                    <div className="cw-toggle-sub">A summary of your workspace activity every Monday</div>
                  </div>
                  <div
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`cw-toggle ${weeklyDigest ? "on" : ""}`}
                  />
                </div>
              </div>

              <SaveBtn label="Save Notifications" />
            </div>
          )}

          {/* ── Integrations ── */}
          {!loading && activeSection === "integrations" && (
            <div className="cw-fade-up">
              <div className="cw-section-title">Integrations</div>
              <div className="cw-section-sub">Manage connected services and API providers.</div>
              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Zap size={14} /></div>API Providers
                </div>
                <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 14 }}>
                  Connect your API keys to unlock model providers. Manage them in the API Manager.
                </div>
                <button onClick={() => router.push("/api-manager")} className="cw-btn-primary">
                  <Zap size={14} />Open API Manager
                </button>
              </div>
              <div className="cw-card">
                <div className="cw-card-title">
                  <div className="cw-card-icon"><Globe size={14} /></div>Coming Soon
                </div>
                {["Slack notifications", "GitHub integration", "Notion export", "Zapier webhook"].map((item) => (
                  <div key={item} className="cw-toggle-row">
                    <div>
                      <div className="cw-toggle-label">{item}</div>
                      <div className="cw-toggle-sub">Coming in a future update</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--tm)", padding: "3px 9px", border: "1px solid var(--b-soft)", borderRadius: 99 }}>
                      Soon
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}