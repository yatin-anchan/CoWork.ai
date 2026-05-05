"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── DATA ─────────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 1, key: "welcome",  label: "Welcome",  icon: "👋" },
  { id: 2, key: "plan",     label: "Plan",      icon: "⚡" },
  { id: 3, key: "connect",  label: "Connect",   icon: "🔑" },
  { id: 4, key: "project",  label: "Project",   icon: "📁" },
  { id: 5, key: "roles",    label: "Roles",     icon: "🧠" },
  { id: 6, key: "ready",    label: "Ready",     icon: "🚀" },
];

const PROVIDERS = [
  { value: "google",      label: "Google Gemini",   icon: "✦", color: "#4285F4", hint: "gemini-1.5-pro · flash",           website: "https://aistudio.google.com/app/apikey",      websiteLabel: "aistudio.google.com",          steps: ["Go to Google AI Studio", 'Click "Create API key"', "Select/create a project", "Copy & paste the key"], note: "Free tier available. No credit card needed.",    faq: [{ q: "Is it free?", a: "Gemini Flash is free with generous limits. Pro requires billing." }, { q: "Which model?", a: "gemini-1.5-pro for reasoning, gemini-1.5-flash for speed." }] },
  { value: "openai",      label: "OpenAI",          icon: "◎", color: "#10a37f", hint: "gpt-4o · gpt-4-turbo",              website: "https://platform.openai.com/api-keys",         websiteLabel: "platform.openai.com",          steps: ['Go to platform.openai.com/api-keys', 'Click "Create new secret key"', "Name it (e.g. CoWork)", "Copy immediately — not shown again"], note: "Requires paid account. $5 goes a long way.", faq: [{ q: "Do I need to pay?", a: "Yes. OpenAI requires prepaid credits." }, { q: "Which model?", a: "gpt-4o by default." }] },
  { value: "anthropic",   label: "Claude",          icon: "◈", color: "#d97757", hint: "claude-3.5-sonnet · claude-3-opus",  website: "https://console.anthropic.com/settings/keys",  websiteLabel: "console.anthropic.com",        steps: ["Go to console.anthropic.com/settings/keys", 'Click "Create Key"', "Permissions → All", "Copy key starting with sk-ant-..."], note: "New accounts get $5 free credits.", faq: [{ q: "Free tier?", a: "$5 on signup, billing required after." }, { q: "Which model?", a: "claude-3-5-sonnet for speed + quality." }] },
  { value: "groq",        label: "Groq",            icon: "⚡", color: "#f55036", hint: "llama-3.1 · mixtral — ultra fast",   website: "https://console.groq.com/keys",                websiteLabel: "console.groq.com",             steps: ["Sign up at console.groq.com (free)", 'Click "API Keys"', 'Click "Create API Key"', "Copy & paste"], note: "Completely free. Best for fast tasks.", faq: [{ q: "Actually free?", a: "Yes. Generous free tier, no credit card." }, { q: "Why so fast?", a: "Custom LPU hardware. Llama-3.1 at ~800 tok/s." }] },
  { value: "perplexity",  label: "Perplexity",      icon: "◉", color: "#20b2aa", hint: "sonar-large · real-time web search",  website: "https://www.perplexity.ai/settings/api",       websiteLabel: "perplexity.ai",                steps: ["Go to perplexity.ai/settings/api", "Sign in or create account", 'Click "Generate" under API Keys', "Copy & paste"], note: "Best for research — has real-time web search.", faq: [{ q: "Why for research?", a: "Searches the web in real time and cites sources." }, { q: "Free?", a: "Requires Pro subscription ($20/mo) or pay-per-use." }] },
  { value: "openrouter",  label: "OpenRouter",      icon: "⊕", color: "#9061f9", hint: "100+ models via one key",             website: "https://openrouter.ai/keys",                   websiteLabel: "openrouter.ai",                steps: ["Sign up at openrouter.ai (free)", 'Avatar → "Keys"', 'Click "Create Key"', "Copy key starting sk-or-..."], note: "One key for 100+ models. Great flexibility.", faq: [{ q: "Benefit?", a: "GPT-4, Claude, Llama, Mistral — one key." }, { q: "Free?", a: "Many free models. Paid billed per token." }] },
];

const ROLES = [
  { key: "reasoning",  label: "Reasoning",  icon: "🧠", desc: "Deep analysis & planning",     recommended: "google",      color: "#6366f1" },
  { key: "research",   label: "Research",   icon: "🔍", desc: "Web search & fact-finding",    recommended: "perplexity",  color: "#20b2aa" },
  { key: "execution",  label: "Execution",  icon: "⚡", desc: "Code & fast tasks",            recommended: "groq",        color: "#f55036" },
  { key: "reviewing",  label: "Reviewing",  icon: "🛡️", desc: "QA & error checking",         recommended: "google",      color: "#10b981" },
];

const PLAN_FEATURES = [
  { label: "Projects",            free: "Up to 3",                      pro: "Unlimited",             proOnly: false },
  { label: "AI responses",        free: "Single model",                 pro: "Single + Team Mode",    proOnly: true  },
  { label: "Files per project",   free: "5 files",                      pro: "30 files",              proOnly: false },
  { label: "Private chats",       free: false,                          pro: true,                    proOnly: true  },
  { label: "Team Mode (multi-AI)",free: false,                          pro: true,                    proOnly: true  },
  { label: "Invite editors/owners",free: false,                         pro: true,                    proOnly: true  },
  { label: "Full analytics",      free: false,                          pro: true,                    proOnly: true  },
  { label: "Priority support",    free: false,                          pro: true,                    proOnly: true  },
  { label: "Export (TXT/PDF)",    free: true,                           pro: true,                    proOnly: false },
  { label: "Collaboration",       free: "Viewer only",                  pro: "Viewer + Editor + Owner", proOnly: false },
];

const XP_ACTIONS: Record<string, number> = {
  welcome: 50,
  plan_viewed: 25,
  key_saved: 150,
  project_created: 100,
  roles_saved: 75,
};

/* ─── COMPONENT ─────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]             = useState(1);
  const [animating, setAnimating]   = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [skipping, setSkipping]     = useState(false);

  // XP / gamification
  const [xp, setXp]                   = useState(0);
  const [xpDelta, setXpDelta]         = useState<number | null>(null);
  const [badges, setBadges]           = useState<string[]>([]);
  const [showBadge, setShowBadge]     = useState<string | null>(null);
  const [xpAnimating, setXpAnimating] = useState(false);
  const earnedRef                     = useRef<Set<string>>(new Set());

  // Plan
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free");
  const [planSaved, setPlanSaved]       = useState(false);
  const [planToggle, setPlanToggle]     = useState<"annual" | "monthly">("annual");

  // Provider / key
  const [selProvider, setSelProvider] = useState("");
  const [apiKey, setApiKey]           = useState("");
  const [keySaved, setKeySaved]       = useState(false);
  const [keyLoading, setKeyLoading]   = useState(false);
  const [showGuide, setShowGuide]     = useState(false);
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [showKey, setShowKey]         = useState(false);

  // Project
  const [projName, setProjName]   = useState("");
  const [projDesc, setProjDesc]   = useState("");
  const [projSaved, setProjSaved] = useState(false);
  const [projId, setProjId]       = useState<string | null>(null);

  // Roles
  const [roles, setRoles] = useState({ reasoning: "google", research: "perplexity", execution: "groq", reviewing: "google" });

  /* ── helpers ── */
  function earnXp(action: string, amount?: number) {
    if (earnedRef.current.has(action)) return;
    earnedRef.current.add(action);
    const pts = amount ?? XP_ACTIONS[action] ?? 25;
    setXp((x) => x + pts);
    setXpDelta(pts);
    setXpAnimating(true);
    setTimeout(() => { setXpDelta(null); setXpAnimating(false); }, 1800);
  }

  function awardBadge(badge: string, label: string) {
    if (badges.includes(badge)) return;
    setBadges((b) => [...b, badge]);
    setShowBadge(label);
    setTimeout(() => setShowBadge(null), 2800);
  }

  function goTo(next: number) {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); setError(""); }, 230);
  }

  useEffect(() => {
    if (step === 1) earnXp("welcome");
    if (step === 2) earnXp("plan_viewed");
  }, [step]);

  async function handleSkip() {
    setSkipping(true);
    try { await fetch("/api/onboarding/skip", { method: "POST", credentials: "include" }); } catch (_) {}
    router.push("/dashboard");
  }

  async function saveKey() {
    if (!selProvider || !apiKey.trim()) { setError("Select a provider and paste your API key."); return; }
    setKeyLoading(true); setError("");
    try {
      const res  = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ provider: selProvider, apiKey: apiKey.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to save key."); return; }
      setKeySaved(true);
      earnXp("key_saved");
      awardBadge("connected", "🔑 API Pioneer");
    } finally { setKeyLoading(false); }
  }

  async function createProject() {
    if (!projName.trim()) { setError("Give your project a name."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: projName.trim(), description: projDesc.trim() || null }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to create project."); return; }
      setProjId(data.project.id); setProjSaved(true);
      earnXp("project_created");
      awardBadge("builder", "📁 Project Builder");
    } finally { setLoading(false); }
  }

  async function saveRoles() {
    setLoading(true); setError("");
    try {
      await Promise.all(Object.entries(roles).map(([role, provider]) =>
        fetch("/api/models/roles", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ role, provider }) })
      ));
    } catch (_) {} finally { setLoading(false); }
    earnXp("roles_saved");
    awardBadge("orchestrator", "🧠 AI Orchestrator");
    goTo(6);
  }

  async function finish() {
    setLoading(true);
    try { await fetch("/api/onboarding/complete", { method: "POST", credentials: "include" }); } catch (_) {}
    router.push(projId ? `/projects/${projId}` : "/dashboard");
  }

  const maxXp    = 400;
  const xpPct    = Math.min((xp / maxXp) * 100, 100);
  const pct      = ((step - 1) / (STEPS.length - 1)) * 100;
  const provider = PROVIDERS.find((p) => p.value === selProvider);

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <main style={{ minHeight: "100vh", background: "#03050f", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Outfit', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:rgba(99,102,241,0.3)}

        /* ── bg ── */
        .bg-nebula{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 20% 10%,rgba(79,70,229,0.18) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 80% 85%,rgba(14,165,233,0.1) 0%,transparent 55%),radial-gradient(ellipse 40% 30% at 60% 40%,rgba(139,92,246,0.07) 0%,transparent 50%)}
        .bg-dots{position:absolute;inset:0;pointer-events:none;opacity:0.18;background-image:radial-gradient(circle,rgba(255,255,255,0.4) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,black 0%,transparent 90%)}
        .floating{position:absolute;border-radius:50%;pointer-events:none;animation:float 8s ease-in-out infinite}
        .f1{width:200px;height:200px;top:-80px;right:-60px;background:radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%);animation-delay:0s}
        .f2{width:150px;height:150px;bottom:10%;left:-50px;background:radial-gradient(circle,rgba(14,165,233,0.1),transparent 70%);animation-delay:-3s}
        .f3{width:100px;height:100px;top:40%;right:5%;background:radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%);animation-delay:-6s}
        @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.05)}}

        .ob-wrap{position:relative;z-index:10;width:100%;max-width:600px}

        /* ── logo ── */
        .ob-logo{display:flex;align-items:center;gap:10px;margin-bottom:22px;text-decoration:none}
        .ob-logo-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;box-shadow:0 0 20px rgba(79,70,229,0.4),0 0 60px rgba(79,70,229,0.1)}
        .ob-logo-text{font-family:'Outfit',sans-serif;font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.3px}
        .ob-logo-text span{color:#818cf8}

        /* ── xp bar ── */
        .xp-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
        .xp-label{font-size:10.5px;font-weight:700;color:#475569;letter-spacing:.5px;text-transform:uppercase}
        .xp-pts{font-size:11px;font-weight:700;color:#818cf8;margin-left:auto;transition:all .3s}
        .xp-pts.pop{color:#a5b4fc;transform:scale(1.15)}
        .xp-bar{height:4px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;margin-bottom:4px;position:relative}
        .xp-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#6366f1,#a78bfa,#38bdf8);transition:width .6s cubic-bezier(.16,1,.3,1);background-size:200% 100%;animation:xp-shine 2s linear infinite}
        @keyframes xp-shine{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .xp-delta{position:absolute;right:0;top:-20px;font-size:11px;font-weight:700;color:#a5b4fc;opacity:0;animation:xp-pop 1.8s ease forwards}
        @keyframes xp-pop{0%{opacity:0;transform:translateY(4px)}20%{opacity:1;transform:translateY(-8px)}80%{opacity:1;transform:translateY(-12px)}100%{opacity:0;transform:translateY(-20px)}}

        /* ── badges tray ── */
        .badges-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;min-height:20px}
        .badge-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);font-size:10.5px;color:#a5b4fc;font-weight:600;animation:badge-in .4s cubic-bezier(.34,1.56,.64,1)}
        @keyframes badge-in{from{opacity:0;transform:scale(0.7) translateY(4px)}to{opacity:1;transform:scale(1)}}

        /* ── badge toast ── */
        .badge-toast{position:fixed;top:24px;right:24px;z-index:999;padding:12px 18px;border-radius:14px;background:linear-gradient(135deg,rgba(30,40,70,0.97),rgba(20,30,55,0.97));border:1px solid rgba(99,102,241,0.35);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 0 1px rgba(99,102,241,0.1);color:#e2e8f0;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:8px;animation:toast-in .5s cubic-bezier(.34,1.56,.64,1)}
        @keyframes toast-in{from{opacity:0;transform:translateX(30px) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
        .badge-toast-pre{font-size:10px;color:#6366f1;text-transform:uppercase;letter-spacing:.6px;font-weight:700}

        /* ── step bar ── */
        .step-track{display:flex;align-items:center;gap:0;margin-bottom:22px}
        .step-node{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;cursor:default}
        .step-circle{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .3s;border:2px solid transparent}
        .step-circle.done{background:rgba(99,102,241,0.2);border-color:rgba(99,102,241,0.5);color:#818cf8;font-size:11px}
        .step-circle.active{background:linear-gradient(135deg,#4f46e5,#7c3aed);border-color:#6366f1;box-shadow:0 0 16px rgba(99,102,241,0.5);color:#fff;animation:pulse-node 2s ease-in-out infinite}
        .step-circle.future{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06);color:#334155;font-size:11px}
        @keyframes pulse-node{0%,100%{box-shadow:0 0 12px rgba(99,102,241,.4)}50%{box-shadow:0 0 24px rgba(99,102,241,.7)}}
        .step-lbl{font-size:9.5px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}
        .step-lbl.done{color:#6366f1}.step-lbl.active{color:#a5b4fc}.step-lbl.future{color:#1e293b}
        .step-line{flex:1;height:2px;background:rgba(255,255,255,0.05);border-radius:99px;margin-bottom:16px;transition:background .5s}
        .step-line.done{background:rgba(99,102,241,0.4)}

        /* ── card ── */
        .ob-card{background:rgba(8,15,30,0.85);border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:32px 32px 26px;backdrop-filter:blur(24px);box-shadow:0 32px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,0.04);transition:opacity .23s ease,transform .23s ease}
        .ob-card.fade-out{opacity:0;transform:translateY(10px) scale(.98)}

        .ob-h1{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-.5px;margin-bottom:4px}
        .ob-sub{font-size:13px;color:#475569;margin-bottom:22px;line-height:1.6}
        .ob-error{margin-bottom:14px;padding:10px 13px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;font-size:12.5px;color:#fca5a5}

        /* ── welcome features ── */
        .feature-list{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
        .feature-item{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:13px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.045);transition:all .2s;cursor:default}
        .feature-item:hover{background:rgba(99,102,241,0.06);border-color:rgba(99,102,241,0.18);transform:translateX(3px)}
        .fi-ico{width:32px;height:32px;border-radius:9px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
        .fi-title{font-size:13px;font-weight:600;color:#cbd5e1}
        .fi-sub{font-size:11.5px;color:#334155;margin-top:2px;line-height:1.4}

        /* ── plan cards ── */
        .plan-toggle{display:flex;align-items:center;gap:0;background:rgba(255,255,255,0.04);border-radius:99px;padding:3px;margin-bottom:18px;width:fit-content;border:1px solid rgba(255,255,255,0.06)}
        .plan-toggle-btn{padding:5px 16px;border-radius:99px;font-size:11.5px;font-weight:700;cursor:pointer;border:none;background:transparent;color:#475569;transition:all .2s;letter-spacing:.3px}
        .plan-toggle-btn.active{background:#fff;color:#0f172a;box-shadow:0 2px 8px rgba(0,0,0,.3)}
        .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
        .plan-card{padding:18px 16px;border-radius:16px;border:2px solid rgba(255,255,255,0.06);background:rgba(10,18,35,0.6);cursor:pointer;transition:all .22s;position:relative;overflow:hidden}
        .plan-card:hover{border-color:rgba(99,102,241,0.35)}
        .plan-card.selected-free{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.06)}
        .plan-card.selected-pro{border-color:rgba(168,85,247,0.6);background:rgba(139,92,246,0.08);box-shadow:0 0 30px rgba(139,92,246,0.12)}
        .plan-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:10.5px;font-weight:700;margin-bottom:10px}
        .plan-badge.free-badge{background:rgba(99,102,241,0.12);color:#818cf8}
        .plan-badge.pro-badge{background:linear-gradient(135deg,rgba(168,85,247,0.2),rgba(139,92,246,0.3));color:#c084fc;border:1px solid rgba(168,85,247,0.3)}
        .plan-price{font-size:26px;font-weight:800;color:#f1f5f9;letter-spacing:-.8px;line-height:1}
        .plan-price-sub{font-size:11px;color:#475569;margin-top:3px;margin-bottom:12px}
        .plan-feat{display:flex;flex-direction:column;gap:5px}
        .plan-feat-row{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#64748b}
        .plan-feat-row .check{color:#6366f1;font-size:10px}
        .plan-feat-row .xmark{color:#1e293b;font-size:10px}
        .pro-shimmer{position:absolute;inset:0;background:linear-gradient(135deg,transparent 40%,rgba(168,85,247,0.04) 60%,transparent 80%);pointer-events:none}
        .plan-full-table{border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;margin-bottom:14px}
        .plan-row{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background .15s}
        .plan-row:last-child{border-bottom:none}
        .plan-row:hover{background:rgba(255,255,255,0.02)}
        .plan-row-hdr{background:rgba(255,255,255,0.03);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#334155}
        .plan-row-feat{font-size:12px;color:#64748b}
        .plan-row-val{font-size:12px;text-align:center}
        .val-free{color:#6366f1}
        .val-pro{color:#c084fc;font-weight:600}
        .val-no{color:#1e293b}
        .tick{color:#6366f1;font-size:11px}
        .tick-pro{color:#c084fc;font-size:11px}
        .tick-no{color:#1e293b;font-size:11px}

        /* ── labels / inputs ── */
        .ob-lbl{display:block;font-size:10.5px;font-weight:700;color:#475569;letter-spacing:.5px;text-transform:uppercase;margin-bottom:7px}
        .ob-input{width:100%;background:rgba(8,15,30,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13px;color:#e2e8f0;outline:none;transition:border-color .2s,box-shadow .2s}
        .ob-input::placeholder{color:#1e293b}
        .ob-input:focus{border-color:rgba(99,102,241,.5);box-shadow:0 0 0 3px rgba(99,102,241,.1)}
        .ob-input-mono{font-family:'JetBrains Mono',monospace;font-size:12px}
        .ob-textarea{width:100%;background:rgba(8,15,30,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13px;color:#e2e8f0;outline:none;resize:none;transition:border-color .2s,box-shadow .2s}
        .ob-textarea::placeholder{color:#1e293b}
        .ob-textarea:focus{border-color:rgba(99,102,241,.5);box-shadow:0 0 0 3px rgba(99,102,241,.1)}

        /* ── provider grid ── */
        .ob-pg{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
        .ob-pc{padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(8,15,30,0.5);cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:9px;text-align:left}
        .ob-pc:hover{border-color:rgba(255,255,255,0.12);background:rgba(20,30,55,0.6);transform:translateY(-1px)}
        .ob-pc.sel{border-color:rgba(99,102,241,.5);background:rgba(99,102,241,.08);box-shadow:0 0 16px rgba(99,102,241,.1)}
        .ob-pc-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:rgba(255,255,255,.04)}
        .ob-pc-name{font-size:12px;font-weight:600;color:#e2e8f0}
        .ob-pc-hint{font-size:10px;color:#334155;margin-top:1px}

        /* ── guide ── */
        .ob-guide{background:rgba(99,102,241,.05);border:1px solid rgba(99,102,241,.15);border-radius:14px;padding:16px 18px;margin-bottom:14px}
        .ob-guide-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ob-guide-title{font-size:12px;font-weight:700;color:#818cf8}
        .ob-guide-link{font-size:11px;color:#6366f1;text-decoration:none;display:flex;align-items:center;gap:4px}
        .ob-guide-link:hover{color:#818cf8}
        .ob-steps-list{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
        .ob-steps-list li{display:flex;align-items:flex-start;gap:10px;font-size:12.5px;color:#64748b;line-height:1.5}
        .ob-step-num{width:20px;height:20px;border-radius:50%;background:rgba(99,102,241,.2);color:#818cf8;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
        .ob-guide-note{font-size:11.5px;color:#334155;padding:8px 11px;background:rgba(255,255,255,.02);border-radius:8px;border-left:2px solid rgba(99,102,241,.3)}
        .ob-faq{margin-top:12px;display:flex;flex-direction:column;gap:5px}
        .ob-faq-q{width:100%;text-align:left;padding:9px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:9px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .18s;display:flex;justify-content:space-between;align-items:center}
        .ob-faq-q:hover{background:rgba(255,255,255,.05);color:#94a3b8}
        .ob-faq-a{padding:8px 12px 10px;font-size:12px;color:#475569;line-height:1.55}
        .ob-key-row{position:relative;margin-bottom:10px}
        .ob-key-row .ob-input{padding-right:56px}
        .ob-key-show{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#475569;cursor:pointer;background:none;border:none;transition:color .15s}
        .ob-key-show:hover{color:#94a3b8}
        .ob-badge-ok{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:99px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.22);font-size:11.5px;font-weight:600;color:#34d399;margin-bottom:14px;animation:badge-in .4s cubic-bezier(.34,1.56,.64,1)}

        /* ── role grid ── */
        .ob-rg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
        .ob-rc{padding:13px 13px 11px;border-radius:13px;border:1px solid rgba(255,255,255,0.06);background:rgba(8,15,30,0.5);transition:border-color .2s}
        .ob-rc:hover{border-color:rgba(255,255,255,0.1)}
        .ob-rc-top{display:flex;align-items:center;gap:7px;margin-bottom:3px}
        .ob-rc-emoji{font-size:15px}
        .ob-rc-name{font-size:12.5px;font-weight:700;color:#e2e8f0}
        .ob-rc-desc{font-size:10.5px;color:#334155;margin-bottom:8px;line-height:1.4}
        .ob-rc-rec{font-size:10px;color:#6366f1;margin-bottom:5px;font-weight:600}
        .ob-rc-sel{width:100%;background:rgba(8,15,30,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 9px;font-size:11.5px;color:#94a3b8;outline:none;cursor:pointer;font-family:'Outfit',sans-serif}
        .ob-rc-sel:focus{border-color:rgba(99,102,241,.4)}

        /* ── summary ── */
        .ob-sg{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
        .ob-sc{padding:11px 13px;border-radius:12px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.12)}
        .ob-sc-lbl{font-size:10px;font-weight:700;color:#4f46e5;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px}
        .ob-sc-val{font-size:13px;color:#e2e8f0;font-weight:500}

        /* ── ready ── */
        .ob-ready-ico{width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;box-shadow:0 0 40px rgba(99,102,241,.4);animation:glow 3s ease-in-out infinite}
        @keyframes glow{0%,100%{box-shadow:0 0 24px rgba(99,102,241,.35)}50%{box-shadow:0 0 48px rgba(99,102,241,.6)}}

        /* ── buttons ── */
        .ob-btn-p{width:100%;padding:12.5px;border-radius:13px;border:none;background:#fff;color:#0f172a;font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;transition:all .22s}
        .ob-btn-p:hover:not(:disabled){background:#e2e8f0;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.2)}
        .ob-btn-p:disabled{opacity:.4;cursor:not-allowed}
        .ob-btn-s{width:100%;padding:10px;border-radius:13px;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#475569;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;margin-top:7px}
        .ob-btn-s:hover{color:#64748b;border-color:rgba(255,255,255,.12)}
        .ob-btn-i{padding:9px 16px;border-radius:9px;border:none;background:rgba(99,102,241,.14);color:#a5b4fc;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
        .ob-btn-i:hover:not(:disabled){background:rgba(99,102,241,.24)}
        .ob-btn-i:disabled{opacity:.4;cursor:not-allowed}
        .ob-btn-ghost{padding:8px 13px;border-radius:8px;border:1px solid rgba(99,102,241,.2);background:transparent;color:#6366f1;font-family:'Outfit',sans-serif;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .2s}
        .ob-btn-ghost:hover{background:rgba(99,102,241,.07)}
        .ob-row{display:flex;align-items:center;gap:8px;margin-top:8px}
        .ob-hr{border:none;border-top:1px solid rgba(255,255,255,0.05);margin:18px 0}
        .ob-info{padding:10px 13px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;font-size:11.5px;color:#334155;line-height:1.6;margin-bottom:14px}

        .ob-skip{display:block;text-align:center;margin-top:14px;font-size:11.5px;color:#1e293b;cursor:pointer;transition:color .2s;background:none;border:none;width:100%}
        .ob-skip:hover{color:#475569}
      `}</style>

      <div className="bg-nebula" />
      <div className="bg-dots" />
      <div className="floating f1" />
      <div className="floating f2" />
      <div className="floating f3" />

      {/* Badge toast */}
      {showBadge && (
        <div className="badge-toast">
          <div>
            <div className="badge-toast-pre">Badge unlocked</div>
            <div>{showBadge}</div>
          </div>
        </div>
      )}

      <div className="ob-wrap">
        {/* Logo */}
        <a href="/" className="ob-logo">
          <div className="ob-logo-icon">CW</div>
          <span className="ob-logo-text">CoWork<span>AI</span></span>
        </a>

        {/* XP bar */}
        <div className="xp-row">
          <span className="xp-label">XP</span>
          <div className="badges-row">
            {badges.map((b) => (
              <span key={b} className="badge-chip">
                {b === "connected" ? "🔑 API Pioneer" : b === "builder" ? "📁 Project Builder" : "🧠 AI Orchestrator"}
              </span>
            ))}
          </div>
          <span className={`xp-pts ${xpAnimating ? "pop" : ""}`}>{xp} / {maxXp} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
          {xpDelta && <div className="xp-delta">+{xpDelta}</div>}
        </div>

        {/* Step track */}
        <div className="step-track" style={{ marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div className="step-node" style={{ flex: "none" }}>
                <div className={`step-circle ${step > s.id ? "done" : step === s.id ? "active" : "future"}`}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <span className={`step-lbl ${step > s.id ? "done" : step === s.id ? "active" : "future"}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${step > s.id ? "done" : ""}`} style={{ margin: "0 2px 14px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className={`ob-card ${animating ? "fade-out" : ""}`}>
          {error && <div className="ob-error">{error}</div>}

          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <>
              <h1 className="ob-h1">Welcome to CoWork.ai 👋</h1>
              <p className="ob-sub">Your multi-AI workspace, powered by your own API keys. Let's get you set up in under 3 minutes.</p>
              <div className="feature-list">
                {[
                  { icon: "⚡", title: "Choose your plan", sub: "Free to start. Upgrade to Pro for Team Mode, unlimited projects, and full analytics." },
                  { icon: "🔑", title: "Connect an AI provider", sub: "Add your API key from Google, OpenAI, Groq, and more. You pay the provider directly — zero markup." },
                  { icon: "📁", title: "Create your first project", sub: "Projects hold all your chats, files, and AI memory in one organised workspace." },
                  { icon: "🧠", title: "Assign AI roles", sub: "Route Reasoning, Research, Execution & Reviewing to the best model for each job." },
                ].map((f) => (
                  <div key={f.title} className="feature-item">
                    <div className="fi-ico">{f.icon}</div>
                    <div><div className="fi-title">{f.title}</div><div className="fi-sub">{f.sub}</div></div>
                  </div>
                ))}
              </div>
              <hr className="ob-hr" />
              <button className="ob-btn-p" onClick={() => goTo(2)}>Let's go →</button>
            </>
          )}

          {/* ── STEP 2: Plan ── */}
          {step === 2 && (
            <>
              <h1 className="ob-h1">Choose your plan</h1>
              <p className="ob-sub">Start free and upgrade any time. No credit card required for the Free plan.</p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div className="plan-toggle">
                  <button className={`plan-toggle-btn ${planToggle === "annual" ? "active" : ""}`} onClick={() => setPlanToggle("annual")}>Annual  <span style={{ color: "#10b981", fontSize: 9, marginLeft: 4 }}>–20%</span></button>
                  <button className={`plan-toggle-btn ${planToggle === "monthly" ? "active" : ""}`} onClick={() => setPlanToggle("monthly")}>Monthly</button>
                </div>
              </div>

              <div className="plan-grid">
                {/* Free */}
                <div className={`plan-card ${selectedPlan === "free" ? "selected-free" : ""}`} onClick={() => setSelectedPlan("free")}>
                  <div className="plan-badge free-badge">✦ Free</div>
                  <div className="plan-price">$0</div>
                  <div className="plan-price-sub">forever</div>
                  <div className="plan-feat">
                    {["3 projects", "5 files / project", "Single-model AI", "TXT/PDF export", "Viewer sharing"].map((f) => (
                      <div key={f} className="plan-feat-row"><span className="check">✓</span>{f}</div>
                    ))}
                    {["Team Mode", "Private chats", "Full analytics"].map((f) => (
                      <div key={f} className="plan-feat-row" style={{ opacity: 0.35 }}><span className="xmark">✗</span>{f}</div>
                    ))}
                  </div>
                </div>
                {/* Pro */}
                <div className={`plan-card ${selectedPlan === "pro" ? "selected-pro" : ""}`} onClick={() => setSelectedPlan("pro")} style={{ position: "relative" }}>
                  <div className="pro-shimmer" />
                  <div className="plan-badge pro-badge">⚡ Pro</div>
                  <div className="plan-price" style={{ color: "#c084fc" }}>
                    ${planToggle === "annual" ? "12" : "15"}
                  </div>
                  <div className="plan-price-sub">per month{planToggle === "annual" ? ", billed annually" : ""}</div>
                  <div className="plan-feat">
                    {["Unlimited projects", "30 files / project", "Team Mode (multi-AI)", "Private chats", "Full analytics dashboard", "Priority support", "Editor/Owner invites"].map((f) => (
                      <div key={f} className="plan-feat-row"><span style={{ color: "#c084fc", fontSize: 10 }}>✓</span>{f}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature comparison table */}
              <div className="plan-full-table">
                <div className="plan-row plan-row-hdr">
                  <span>Feature</span>
                  <span style={{ textAlign: "center" }}>Free</span>
                  <span style={{ textAlign: "center" }}>Pro</span>
                </div>
                {PLAN_FEATURES.map((f) => (
                  <div key={f.label} className="plan-row">
                    <span className="plan-row-feat">{f.label}</span>
                    <span className="plan-row-val">
                      {f.free === true ? <span className="tick">✓</span> : f.free === false ? <span className="tick-no">✗</span> : <span className="val-free">{f.free}</span>}
                    </span>
                    <span className="plan-row-val">
                      {f.pro === true ? <span className="tick-pro">✓</span> : f.pro === false ? <span className="tick-no">✗</span> : <span className="val-pro">{f.pro}</span>}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="ob-hr" />
              <button className="ob-btn-p" onClick={() => { setPlanSaved(true); earnXp("plan_viewed", 50); goTo(3); }}>
                Continue with {selectedPlan === "pro" ? "Pro ⚡" : "Free"} →
              </button>
            </>
          )}

          {/* ── STEP 3: Connect provider ── */}
          {step === 3 && (
            <>
              <h1 className="ob-h1">Connect an AI provider</h1>
              <p className="ob-sub">CoWork.ai uses your own API keys — you pay the provider directly at their rates, no markup.</p>

              {keySaved && <div className="ob-badge-ok"><span>✓</span> Key saved — provider connected!</div>}

              <label className="ob-lbl">Choose a provider</label>
              <div className="ob-pg">
                {PROVIDERS.map((p) => (
                  <button key={p.value} type="button" className={`ob-pc ${selProvider === p.value ? "sel" : ""}`} onClick={() => setSelProvider(p.value)}>
                    <div className="ob-pc-ico" style={{ color: p.color }}>{p.icon}</div>
                    <div><div className="ob-pc-name">{p.label}</div><div className="ob-pc-hint">{p.hint}</div></div>
                  </button>
                ))}
              </div>

              {provider && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>How to get a {provider.label} key</span>
                    <button type="button" className="ob-btn-ghost" onClick={() => setShowGuide((v) => !v)}>{showGuide ? "Hide ↑" : "Show guide ↓"}</button>
                  </div>
                  {showGuide && (
                    <div className="ob-guide">
                      <div className="ob-guide-header">
                        <span className="ob-guide-title">📋 Step-by-step</span>
                        <a href={provider.website} target="_blank" rel="noreferrer" className="ob-guide-link">Open {provider.websiteLabel} ↗</a>
                      </div>
                      <ol className="ob-steps-list">
                        {provider.steps.map((s, i) => (
                          <li key={i}><span className="ob-step-num">{i + 1}</span><span>{s}</span></li>
                        ))}
                      </ol>
                      <div className="ob-guide-note">💡 {provider.note}</div>
                      <div className="ob-faq">
                        {provider.faq.map((f, i) => (
                          <div key={i}>
                            <button type="button" className="ob-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                              <span>{f.q}</span><span style={{ fontSize: 10 }}>{openFaq === i ? "▲" : "▼"}</span>
                            </button>
                            {openFaq === i && <div className="ob-faq-a">{f.a}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <label className="ob-lbl" style={{ marginTop: 14 }}>Paste your API key</label>
                  <div className="ob-key-row">
                    <input type={showKey ? "text" : "password"} placeholder={`Your ${provider.label} API key`} className="ob-input ob-input-mono" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setError(""); }} />
                    <button type="button" className="ob-key-show" onClick={() => setShowKey((v) => !v)}>{showKey ? "Hide" : "Show"}</button>
                  </div>
                  <div style={{ fontSize: 11, color: "#1e293b", marginBottom: 12 }}>🔒 Keys are encrypted at rest and never returned to the frontend.</div>
                  <div className="ob-row">
                    <button type="button" className="ob-btn-i" onClick={saveKey} disabled={keyLoading || !apiKey.trim() || keySaved}>
                      {keyLoading ? "Saving…" : keySaved ? "✓ Saved" : "Save key"}
                    </button>
                    {!showGuide && <button type="button" className="ob-btn-ghost" onClick={() => setShowGuide(true)}>How do I get a key?</button>}
                  </div>
                  <hr className="ob-hr" />
                </>
              )}

              <button className="ob-btn-p" style={{ marginTop: selProvider ? 0 : 4 }} onClick={() => {
                if (!keySaved && selProvider) { setError("Click 'Save key' first, or skip below."); return; }
                goTo(4);
              }}>Continue →</button>
              <button className="ob-btn-s" onClick={() => goTo(4)}>Skip — I'll add a key later in API Manager</button>
            </>
          )}

          {/* ── STEP 4: Project ── */}
          {step === 4 && (
            <>
              <h1 className="ob-h1">Create your first project</h1>
              <p className="ob-sub">A project holds all your chats, uploaded files, and AI memory. You can make more any time.</p>
              {projSaved && <div className="ob-badge-ok"><span>✓</span> Project "{projName}" created!</div>}
              <label className="ob-lbl" style={{ marginTop: 4 }}>Project name *</label>
              <input type="text" placeholder="e.g. My SaaS Startup, Client Work, Research Notes" className="ob-input" style={{ marginBottom: 14 }} value={projName} onChange={(e) => { setProjName(e.target.value); setError(""); }} disabled={projSaved} />
              <label className="ob-lbl">Description <span style={{ color: "#1e293b", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
              <textarea rows={3} placeholder="What is this project about? Used as context for AI conversations." className="ob-textarea" style={{ marginBottom: 14 }} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} disabled={projSaved} />
              <div className="ob-info">💡 <strong style={{ color: "#475569" }}>Pro tip:</strong> Add project <em>instructions</em> later in Project Settings — these tell the AI how to behave across all chats.</div>
              {!projSaved && (
                <div className="ob-row" style={{ marginBottom: 14 }}>
                  <button type="button" className="ob-btn-i" onClick={createProject} disabled={loading || !projName.trim()}>
                    {loading ? "Creating…" : "Create project"}
                  </button>
                </div>
              )}
              <hr className="ob-hr" />
              <button className="ob-btn-p" onClick={() => goTo(5)} disabled={loading}>
                {projSaved ? "Continue →" : "Skip — I'll create a project later"}
              </button>
            </>
          )}

          {/* ── STEP 5: Roles ── */}
          {step === 5 && (
            <>
              <h1 className="ob-h1">Assign AI roles</h1>
              <p className="ob-sub">CoWork.ai routes tasks to different models automatically based on role. You can change these any time.</p>
              <div className="ob-rg">
                {ROLES.map((r) => {
                  const rec = PROVIDERS.find((p) => p.value === r.recommended);
                  return (
                    <div key={r.key} className="ob-rc">
                      <div className="ob-rc-top"><span className="ob-rc-emoji">{r.icon}</span><span className="ob-rc-name">{r.label}</span></div>
                      <div className="ob-rc-desc">{r.desc}</div>
                      {rec && <div className="ob-rc-rec">★ Recommended: {rec.label}</div>}
                      <select className="ob-rc-sel" value={roles[r.key as keyof typeof roles]} onChange={(e) => setRoles((prev) => ({ ...prev, [r.key]: e.target.value }))}>
                        {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <div className="ob-info">💡 You can override these per-project in API Manager, or switch roles mid-conversation using the selector in the chat input.</div>
              <hr className="ob-hr" />
              <button className="ob-btn-p" onClick={saveRoles} disabled={loading}>{loading ? "Saving…" : "Save roles & continue →"}</button>
              <button className="ob-btn-s" onClick={() => goTo(6)}>Skip — use defaults</button>
            </>
          )}

          {/* ── STEP 6: Ready ── */}
          {step === 6 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div className="ob-ready-ico">🚀</div>
                <h1 className="ob-h1">You're all set!</h1>
                <p className="ob-sub" style={{ maxWidth: 360 }}>Your workspace is configured. Here's a summary of what was set up.</p>
              </div>

              {/* XP recap */}
              <div style={{ padding: "14px 16px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 30 }}>🏆</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 3 }}>Onboarding complete!</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>You earned {xp} XP</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>{badges.map((b) => <span key={b} className="badge-chip">{b === "connected" ? "🔑 API Pioneer" : b === "builder" ? "📁 Builder" : "🧠 Orchestrator"}</span>)}</div>
                </div>
              </div>

              <div className="ob-sg">
                <div className="ob-sc"><div className="ob-sc-lbl">Plan</div><div className="ob-sc-val">{selectedPlan === "pro" ? "⚡ Pro" : "✦ Free"}</div></div>
                <div className="ob-sc"><div className="ob-sc-lbl">Provider</div><div className="ob-sc-val">{keySaved ? PROVIDERS.find((p) => p.value === selProvider)?.label || "Connected" : "— add in API Manager"}</div></div>
                <div className="ob-sc"><div className="ob-sc-lbl">Project</div><div className="ob-sc-val">{projName || "— create from dashboard"}</div></div>
                <div className="ob-sc"><div className="ob-sc-lbl">Reasoning</div><div className="ob-sc-val">{PROVIDERS.find((p) => p.value === roles.reasoning)?.label}</div></div>
              </div>

              <div style={{ padding: "12px 14px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 12, margin: "12px 0" }}>
                <p style={{ fontSize: 12, color: "#2d6b55", lineHeight: 1.7 }}>
                  <strong style={{ color: "#34d399" }}>What's next?</strong><br />
                  {projId ? "→ Your project is ready — click below to open it and start your first chat." : "→ Head to the dashboard to create a project and start your first chat."}<br />
                  → Add more API keys any time in <strong style={{ color: "#34d399" }}>API Manager</strong>.<br />
                  → Invite teammates via the <strong style={{ color: "#34d399" }}>Invite</strong> button in any project.
                </p>
              </div>
              <hr className="ob-hr" />
              <button className="ob-btn-p" onClick={finish} disabled={loading}>{loading ? "Setting up…" : projId ? "Open my project →" : "Go to dashboard →"}</button>
            </>
          )}
        </div>

        {step < 6 && (
          <button className="ob-skip" onClick={handleSkip} disabled={skipping}>
            {skipping ? "Redirecting…" : "Skip onboarding — take me to the dashboard"}
          </button>
        )}
      </div>
    </main>
  );
}