"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Save,
  ArrowLeft,
  BarChart3,
  Sun,
  Moon,
  Bot,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const themeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

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

  .cw-root {
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: var(--t1); background: var(--bg);
    min-height: 100vh; overflow-x: hidden;
    transition: background 0.5s, color 0.4s;
  }
  .cw-root *::-webkit-scrollbar { width: 3px; }
  .cw-root *::-webkit-scrollbar-track { background: transparent; }
  .cw-root *::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }

  .cw-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .cw-orb { position: absolute; border-radius: 50%; filter: blur(88px); animation: cwOrbF 20s ease-in-out infinite; }
  .cw-orb1 { width: 560px; height: 560px; background: rgba(77,159,255,0.09); top: -140px; left: -100px; }
  .cw-orb2 { width: 420px; height: 420px; background: rgba(134,134,172,0.07); bottom: -120px; right: -80px; animation-delay: -8s; }
  @keyframes cwOrbF {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(28px,-34px) scale(1.04); }
    66% { transform: translate(-18px,26px) scale(0.97); }
  }

  .cw-navbar {
    display: flex; align-items: center; justify-content: space-between;
    height: 56px; padding: 0 24px; position: sticky; top: 0; z-index: 100;
    background: var(--bg-g); backdrop-filter: blur(28px) saturate(180%);
    border-bottom: 1px solid var(--b-soft); transition: background 0.5s;
  }
  .cw-logo {
    width: 32px; height: 32px; background: linear-gradient(135deg,#505081,#4D9FFF);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-weight: 800; font-size: 12px; color: #fff;
    box-shadow: 0 0 18px rgba(77,159,255,0.22); transition: box-shadow 0.3s, transform 0.3s var(--spring);
  }
  .cw-logo:hover { box-shadow: 0 0 30px rgba(77,159,255,0.44); transform: scale(1.08) rotate(-4deg); }
  .cw-brand-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 15px; color: var(--t1); letter-spacing: -0.3px; }
  .cw-brand-sub { font-size: 10px; color: var(--tm); letter-spacing: 0.5px; }

  .cw-nav-btn {
    display: flex; align-items: center; gap: 5px; padding: 6px 11px;
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 10px;
    color: var(--t2); font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.22s var(--ease);
  }
  .cw-nav-btn:hover { background: var(--bg-s); border-color: var(--b-mid); color: var(--t1); transform: translateY(-1px); }

  .cw-theme-toggle {
    position: relative; width: 50px; height: 26px;
    background: var(--bg-e); border: 1px solid var(--b-mid); border-radius: 99px;
    cursor: pointer; transition: background 0.4s, border-color 0.4s;
  }
  .cw-theme-toggle::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; background: var(--t1); border-radius: 50%;
    transition: transform 0.4s var(--spring); box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .cw-light .cw-theme-toggle::after { transform: translateX(22px); }

  .cw-page { max-width: 860px; margin: 0 auto; padding: 36px 24px 80px; position: relative; z-index: 1; }

  .cw-page-header { margin-bottom: 32px; }
  .cw-page-title { font-family: 'Syne',sans-serif; font-size: 26px; font-weight: 800; color: var(--t1); letter-spacing: -0.04em; }
  .cw-page-sub { font-size: 13px; color: var(--t2); margin-top: 4px; }

  .cw-tabs { display: flex; gap: 4px; background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 13px; padding: 4px; margin-bottom: 28px; }
  .cw-tab {
    flex: 1; padding: 8px 14px; border-radius: 10px; border: none;
    background: transparent; color: var(--t2);
    font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .cw-tab.active { background: var(--btn-bg); color: var(--btn-fg); }

  .cw-card {
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 18px;
    padding: 22px; margin-bottom: 14px; transition: border-color 0.2s;
  }
  .cw-card:hover { border-color: var(--b-mid); }
  .cw-card-title { font-family: 'Syne',sans-serif; font-size: 14px; font-weight: 700; color: var(--t1); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .cw-card-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--ag); border: 1px solid var(--b-glow2); display: flex; align-items: center; justify-content: center; color: var(--accent); }

  .cw-field { margin-bottom: 14px; }
  .cw-label { font-size: 11.5px; font-weight: 600; color: var(--t2); letter-spacing: 0.3px; margin-bottom: 7px; display: block; }
  .cw-input {
    width: 100%; padding: 10px 13px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 10px;
    color: var(--t1); font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
  }
  .cw-input:focus { border-color: var(--b-glow); box-shadow: 0 0 0 3px var(--b-glow2); }
  .cw-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .cw-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 10px; border: none;
    background: var(--btn-bg); color: var(--btn-fg);
    font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.25s var(--spring);
  }
  .cw-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  .cw-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .cw-btn-secondary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 10px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2);
    font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .cw-btn-secondary:hover { background: var(--bg-s); border-color: var(--b-mid); color: var(--t1); }

  .cw-success { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(52,211,153,0.28); background: rgba(52,211,153,0.09); color: #34d399; font-size: 12.5px; margin-bottom: 14px; }
  .cw-error { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(248,113,113,0.28); background: rgba(248,113,113,0.09); color: #f87171; font-size: 12.5px; margin-bottom: 14px; }

  .cw-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 12px; margin-bottom: 14px; }
  .cw-stat-card { background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 14px; padding: 16px; }
  .cw-stat-val { font-family: 'Syne',sans-serif; font-size: 26px; font-weight: 700; color: var(--t1); }
  .cw-stat-label { font-size: 11px; color: var(--tm); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

  .cw-model-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--b-soft); background: var(--bg-i); margin-bottom: 7px; }
  .cw-model-name { font-size: 12.5px; font-weight: 500; color: var(--t1); }
  .cw-model-val { font-size: 11px; color: var(--t2); font-family: 'JetBrains Mono',monospace; }

  .cw-avatar-circle {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(135deg,#505081,#4D9FFF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-size: 22px; font-weight: 800; color: #fff;
    box-shadow: 0 0 28px rgba(77,159,255,0.28); margin-bottom: 14px;
  }

  .cw-plan-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
  }
  .cw-plan-badge.free { background: var(--bg-e); border: 1px solid var(--b-soft); color: var(--t2); }
  .cw-plan-badge.pro { background: rgba(77,159,255,0.14); border: 1px solid rgba(77,159,255,0.28); color: var(--accent); }

  .cw-prog-bar { height: 5px; background: var(--bg-e); border-radius: 99px; overflow: hidden; margin-top: 5px; }
  .cw-prog-fill { height: 100%; background: linear-gradient(90deg,#505081,#4D9FFF); border-radius: 99px; transition: width 0.8s var(--ease); }

  .cw-loading { display: flex; height: 100vh; align-items: center; justify-content: center; background: #07071e; color: #9292b8; font-family: 'Syne',sans-serif; font-size: 15px; gap: 10px; }
  .cw-loading-dot { width: 6px; height: 6px; background: #4D9FFF; border-radius: 50%; animation: cwPulse 1.4s ease-in-out infinite; }
  .cw-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cw-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cwPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
  @keyframes cwFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .cw-fade-up { animation: cwFadeUp 0.5s var(--ease) both; }
`;

type UsageData = {
  totalTokensToday: number;
  totalCostToday: number;
  mostUsedModel: string | null;
  teamModeUsage: number;
  usageByModel: { model: string; tokens_used: number; cost: number }[];
  usageByDay: { date: string; tokens_used: number }[];
  providerUsage: { provider: string; usedToday: number; limit: number; remaining: number; costToday: number }[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "analytics">("profile");
  const [loading, setLoading] = useState(true);

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Analytics
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, usageRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/usage", { credentials: "include" }),
        ]);
        if (!meRes.ok) { router.replace("/auth/login"); return; }
        const meData = await meRes.json();
        setName(meData.user?.name || "");
        setEmail(meData.user?.email || "");
        setPlan(meData.user?.plan || "free");
        if (usageRes.ok) setUsage(await usageRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function saveProfile() {
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setProfileMsg({ type: "error", text: data.error || "Failed to update." }); return; }
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: "error", text: "All fields are required." }); return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." }); return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters." }); return;
    }
    setChangingPw(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPwMsg({ type: "error", text: data.error || "Failed to change password." }); return; }
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } finally {
      setChangingPw(false);
    }
  }

  if (loading) {
    return (
      <div className="cw-loading">
        <style>{themeStyles}</style>
        <div className="cw-loading-dot" /><div className="cw-loading-dot" /><div className="cw-loading-dot" />
        <span style={{ marginLeft: 8 }}>Loading profile...</span>
      </div>
    );
  }

  const themeClass = isDark ? "cw-dark" : "cw-light";

  return (
    <div className={`cw-root ${themeClass}`}>
      <style>{themeStyles}</style>
      <div className="cw-ambient">
        <div className="cw-orb cw-orb1" /><div className="cw-orb cw-orb2" />
      </div>

      {/* Navbar */}
      <header className="cw-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="cw-logo">CW</div>
          <div>
            <div className="cw-brand-title">CoWork.ai</div>
            <div className="cw-brand-sub">Profile</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => router.back()} className="cw-nav-btn"><ArrowLeft size={13} /><span>Back</span></button>
          <button className="cw-theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle theme">
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5px", pointerEvents: "none" }}>
              <Sun size={11} style={{ color: isDark ? "rgba(134,134,172,0.4)" : "#f59e0b" }} />
              <Moon size={11} style={{ color: isDark ? "#9292b8" : "rgba(80,80,129,0.35)" }} />
            </div>
          </button>
        </div>
      </header>

      <div className="cw-page">
        {/* Header */}
        <div className="cw-page-header cw-fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div className="cw-avatar-circle">{name ? name.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="cw-page-title">{name || "Your Profile"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <span className="cw-page-sub">{email}</span>
                <span className={`cw-plan-badge ${plan}`}>{plan === "pro" ? "⚡ Pro" : "Free"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="cw-tabs cw-fade-up" style={{ animationDelay: "0.05s" }}>
          <button onClick={() => setActiveTab("profile")} className={`cw-tab ${activeTab === "profile" ? "active" : ""}`}>
            <User size={14} /> Profile
          </button>
          <button onClick={() => setActiveTab("security")} className={`cw-tab ${activeTab === "security" ? "active" : ""}`}>
            <Lock size={14} /> Security
          </button>
          <button onClick={() => setActiveTab("analytics")} className={`cw-tab ${activeTab === "analytics" ? "active" : ""}`}>
            <BarChart3 size={14} /> Analytics
          </button>
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="cw-fade-up">
            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><User size={14} /></div>
                Personal Information
              </div>
              {profileMsg && <div className={profileMsg.type === "success" ? "cw-success" : "cw-error"}>{profileMsg.text}</div>}
              <div className="cw-field">
                <label className="cw-label">Full Name</label>
                <input className="cw-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="cw-field">
                <label className="cw-label">Email Address</label>
                <input className="cw-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button onClick={saveProfile} disabled={saving} className="cw-btn-primary">
                  <Save size={14} />{saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><Mail size={14} /></div>
                Plan & Billing
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
                    {plan === "pro" ? "CoWork AI Pro" : "CoWork AI Free"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t2)" }}>
                    {plan === "pro" ? "All features unlocked — Team Mode, Analytics, Private Chats." : "Upgrade to Pro for Team Mode, full analytics, and more."}
                  </div>
                </div>
                {plan !== "pro" && (
                  <button className="cw-btn-primary" style={{ whiteSpace: "nowrap" }}>⚡ Upgrade</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div className="cw-fade-up">
            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><Lock size={14} /></div>
                Change Password
              </div>
              {pwMsg && <div className={pwMsg.type === "success" ? "cw-success" : "cw-error"}>{pwMsg.text}</div>}
              <div className="cw-field">
                <label className="cw-label">Current Password</label>
                <input className="cw-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="cw-field">
                <label className="cw-label">New Password</label>
                <input className="cw-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div className="cw-field">
                <label className="cw-label">Confirm New Password</label>
                <input className="cw-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button onClick={changePassword} disabled={changingPw} className="cw-btn-primary">
                  <Lock size={14} />{changingPw ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>

            <div className="cw-card">
              <div className="cw-card-title" style={{ color: "#f87171" }}>
                <div className="cw-card-icon" style={{ background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)" }}>
                  <Lock size={14} style={{ color: "#f87171" }} />
                </div>
                Danger Zone
              </div>
              <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 14 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </div>
              <button
                className="cw-btn-secondary"
                style={{ borderColor: "rgba(248,113,113,0.24)", color: "#f87171" }}
                onClick={() => { if (confirm("Are you sure? This will permanently delete your account.")) alert("Contact support to delete your account."); }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === "analytics" && (
          <div className="cw-fade-up">
            {plan !== "pro" && (
              <div style={{ padding: "18px", borderRadius: 14, border: "1px solid rgba(251,191,36,0.28)", background: "rgba(251,191,36,0.07)", color: "#fbbf24", fontSize: 13, marginBottom: 16 }}>
                ⚡ Full analytics are a Pro feature. Showing limited data. <button className="cw-btn-primary" style={{ marginLeft: 12, padding: "5px 12px", fontSize: 12 }}>Upgrade</button>
              </div>
            )}

            {/* Stats */}
            <div className="cw-stat-grid">
              {[
                { label: "Tokens Today", val: (usage?.totalTokensToday ?? 0).toLocaleString() },
                { label: "Cost Today", val: `$${usage?.totalCostToday?.toFixed(4) || "0.0000"}` },
                { label: "Team Mode Uses", val: String(usage?.teamModeUsage ?? 0) },
                { label: "Top Model", val: usage?.mostUsedModel || "None" },
              ].map(({ label, val }) => (
                <div key={label} className="cw-stat-card">
                  <div className="cw-stat-val">{val}</div>
                  <div className="cw-stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Usage by Day */}
            <div className="cw-card">
              <div className="cw-card-title"><div className="cw-card-icon"><BarChart3 size={14} /></div>Token Usage Over Time</div>
              {usage?.usageByDay?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={usage.usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--b-soft)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <Tooltip contentStyle={{ background: "var(--modal-bg)", border: "1px solid var(--b-mid)", borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="tokens_used" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p style={{ color: "var(--tm)", fontSize: 12.5 }}>No usage data yet.</p>}
            </div>

            {/* Usage by Model */}
            <div className="cw-card">
              <div className="cw-card-title"><div className="cw-card-icon"><Bot size={14} /></div>Usage by Model</div>
              {usage?.usageByModel?.length ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={usage.usageByModel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--b-soft)" />
                      <XAxis dataKey="model" tick={{ fontSize: 10, fill: "var(--tm)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--tm)" }} />
                      <Tooltip contentStyle={{ background: "var(--modal-bg)", border: "1px solid var(--b-mid)", borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="tokens_used" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {usage.usageByModel.map((m) => (
                      <div key={m.model} className="cw-model-row">
                        <span className="cw-model-name">{m.model}</span>
                        <span className="cw-model-val">{m.tokens_used} tokens · ${m.cost?.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p style={{ color: "var(--tm)", fontSize: 12.5 }}>No model usage yet.</p>}
            </div>

            {/* Provider limits */}
            {usage?.providerUsage?.length ? (
              <div className="cw-card">
                <div className="cw-card-title"><div className="cw-card-icon"><BarChart3 size={14} /></div>Provider Limits</div>
                {usage.providerUsage.map((p) => {
                  const pct = p.limit > 0 ? Math.min((p.usedToday / p.limit) * 100, 100) : 0;
                  return (
                    <div key={p.provider} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--t2)", marginBottom: 4 }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--t1)" }}>{p.provider}</span>
                        <span>{p.usedToday} / {p.limit}</span>
                      </div>
                      <div className="cw-prog-bar"><div className="cw-prog-fill" style={{ width: `${pct}%` }} /></div>
                      <div style={{ fontSize: 10.5, color: "var(--tm)", marginTop: 3 }}>Remaining: {p.remaining} · ${p.costToday?.toFixed(4)}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}