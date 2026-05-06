"use client";

import { useEffect, useRef, useState } from "react";
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
  Phone,
  Globe,
  Briefcase,
  Calendar,
  Zap,
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

// ── Country data (mirrored from registration) ─────────────────────────────────
const COUNTRIES = [
  { name: "Afghanistan", dial: "+93" }, { name: "Albania", dial: "+355" },
  { name: "Algeria", dial: "+213" }, { name: "Argentina", dial: "+54" },
  { name: "Australia", dial: "+61" }, { name: "Austria", dial: "+43" },
  { name: "Bangladesh", dial: "+880" }, { name: "Belgium", dial: "+32" },
  { name: "Brazil", dial: "+55" }, { name: "Canada", dial: "+1" },
  { name: "Chile", dial: "+56" }, { name: "China", dial: "+86" },
  { name: "Colombia", dial: "+57" }, { name: "Croatia", dial: "+385" },
  { name: "Czech Republic", dial: "+420" }, { name: "Denmark", dial: "+45" },
  { name: "Egypt", dial: "+20" }, { name: "Ethiopia", dial: "+251" },
  { name: "Finland", dial: "+358" }, { name: "France", dial: "+33" },
  { name: "Germany", dial: "+49" }, { name: "Ghana", dial: "+233" },
  { name: "Greece", dial: "+30" }, { name: "Hungary", dial: "+36" },
  { name: "India", dial: "+91" }, { name: "Indonesia", dial: "+62" },
  { name: "Iran", dial: "+98" }, { name: "Iraq", dial: "+964" },
  { name: "Ireland", dial: "+353" }, { name: "Israel", dial: "+972" },
  { name: "Italy", dial: "+39" }, { name: "Japan", dial: "+81" },
  { name: "Jordan", dial: "+962" }, { name: "Kenya", dial: "+254" },
  { name: "Malaysia", dial: "+60" }, { name: "Mexico", dial: "+52" },
  { name: "Morocco", dial: "+212" }, { name: "Myanmar", dial: "+95" },
  { name: "Nepal", dial: "+977" }, { name: "Netherlands", dial: "+31" },
  { name: "New Zealand", dial: "+64" }, { name: "Nigeria", dial: "+234" },
  { name: "Norway", dial: "+47" }, { name: "Pakistan", dial: "+92" },
  { name: "Peru", dial: "+51" }, { name: "Philippines", dial: "+63" },
  { name: "Poland", dial: "+48" }, { name: "Portugal", dial: "+351" },
  { name: "Romania", dial: "+40" }, { name: "Russia", dial: "+7" },
  { name: "Saudi Arabia", dial: "+966" }, { name: "Singapore", dial: "+65" },
  { name: "South Africa", dial: "+27" }, { name: "South Korea", dial: "+82" },
  { name: "Spain", dial: "+34" }, { name: "Sri Lanka", dial: "+94" },
  { name: "Sweden", dial: "+46" }, { name: "Switzerland", dial: "+41" },
  { name: "Taiwan", dial: "+886" }, { name: "Tanzania", dial: "+255" },
  { name: "Thailand", dial: "+66" }, { name: "Turkey", dial: "+90" },
  { name: "Uganda", dial: "+256" }, { name: "Ukraine", dial: "+380" },
  { name: "United Arab Emirates", dial: "+971" }, { name: "United Kingdom", dial: "+44" },
  { name: "United States", dial: "+1" }, { name: "Vietnam", dial: "+84" },
  { name: "Zimbabwe", dial: "+263" },
];

const describesYouOptions = [
  "Solo developer", "Team lead", "Founder / entrepreneur",
  "Student", "Researcher", "Designer",
  "Product manager", "Freelancer", "Other",
];

const intentionOptions = [
  "Build AI-powered products", "Research & experimentation",
  "Personal productivity", "Team collaboration",
  "Learning AI tools", "Client work / agency", "Other",
];

// ── Theme styles ──────────────────────────────────────────────────────────────
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
  .cw-tab.locked { opacity: 0.7; cursor: pointer; }

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
  .cw-select {
    width: 100%; padding: 10px 13px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 10px;
    color: var(--t1); font-family: 'DM Sans',sans-serif; font-size: 13px; outline: none;
    cursor: pointer; transition: border-color 0.2s; box-sizing: border-box;
  }
  .cw-select:focus { border-color: var(--b-glow); box-shadow: 0 0 0 3px var(--b-glow2); }

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
    box-shadow: 0 0 28px rgba(77,159,255,0.28); margin-bottom: 14px; flex-shrink: 0;
  }

  .cw-plan-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
  }
  .cw-plan-badge.free { background: var(--bg-e); border: 1px solid var(--b-soft); color: var(--t2); }
  .cw-plan-badge.pro { background: rgba(77,159,255,0.14); border: 1px solid rgba(77,159,255,0.28); color: var(--accent); }

  .cw-prog-bar { height: 5px; background: var(--bg-e); border-radius: 99px; overflow: hidden; margin-top: 5px; }
  .cw-prog-fill { height: 100%; background: linear-gradient(90deg,#505081,#4D9FFF); border-radius: 99px; transition: width 0.8s var(--ease); }

  .cw-tag-grid { display: flex; flex-wrap: wrap; gap: 7px; }
  .cw-tag {
    padding: 6px 13px; border-radius: 99px; border: 1px solid var(--b-soft);
    background: var(--bg-i); color: var(--t2); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .cw-tag.active { border-color: rgba(77,159,255,0.5); background: var(--ag); color: var(--accent); }
  .cw-tag:hover:not(.active) { border-color: var(--b-mid); color: var(--t1); }

  .cw-tag-violet {
    padding: 6px 13px; border-radius: 99px; border: 1px solid var(--b-soft);
    background: var(--bg-i); color: var(--t2); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .cw-tag-violet.active { border-color: rgba(167,139,250,0.5); background: rgba(167,139,250,0.1); color: #a78bfa; }
  .cw-tag-violet:hover:not(.active) { border-color: var(--b-mid); color: var(--t1); }

  .cw-gender-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cw-gender-btn {
    padding: 10px; border-radius: 10px; border: 1px solid var(--b-soft);
    background: var(--bg-i); color: var(--t2); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .cw-gender-btn.active { border-color: rgba(77,159,255,0.5); background: var(--ag); color: var(--accent); }
  .cw-gender-btn:hover:not(.active) { border-color: var(--b-mid); color: var(--t1); }

  .cw-phone-row { display: flex; gap: 8px; }
  .cw-phone-prefix {
    width: 90px; flex-shrink: 0; padding: 10px 10px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 10px;
    color: var(--t1); font-family: 'JetBrains Mono',monospace; font-size: 12px; outline: none;
    cursor: pointer; transition: border-color 0.2s;
  }
  .cw-phone-prefix:focus { border-color: var(--b-glow); box-shadow: 0 0 0 3px var(--b-glow2); }

  /* Pro lock overlay */
  .cw-pro-gate {
    position: relative; min-height: 420px; border-radius: 18px; overflow: hidden;
  }
  .cw-pro-blur { filter: blur(4px); pointer-events: none; user-select: none; opacity: 0.4; }
  .cw-pro-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    background: rgba(7,7,30,0.72); backdrop-filter: blur(6px);
    border-radius: 18px; border: 1px solid rgba(251,191,36,0.28);
    z-index: 10;
  }
  .cw-pro-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3);
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    animation: cwGlow 3s ease-in-out infinite;
  }
  @keyframes cwGlow { 0%,100% { box-shadow: 0 0 20px rgba(251,191,36,0.2); } 50% { box-shadow: 0 0 40px rgba(251,191,36,0.4); } }
  .cw-pro-title { font-family: 'Syne',sans-serif; font-size: 18px; font-weight: 800; color: #FFFFE3; }
  .cw-pro-sub { font-size: 13px; color: #9292b8; max-width: 280px; text-align: center; line-height: 1.6; }

  /* Peek banner — shown while free user is watching */
  .cw-peek-banner {
    position: sticky; top: 66px; z-index: 50; margin-bottom: 14px;
    padding: 11px 16px; border-radius: 13px;
    border: 1px solid rgba(251,191,36,0.32);
    background: rgba(251,191,36,0.08);
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    animation: cwFadeUp 0.3s var(--ease);
  }
  .cw-peek-left { display: flex; align-items: center; gap: 10px; }
  .cw-peek-ring {
    position: relative; width: 38px; height: 38px; flex-shrink: 0;
  }
  .cw-peek-ring svg { transform: rotate(-90deg); }
  .cw-peek-ring-num {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: 'Syne',sans-serif; font-size: 11px; font-weight: 800; color: #fbbf24;
  }
  .cw-peek-text { font-size: 12.5px; color: #fbbf24; font-weight: 600; line-height: 1.5; }
  .cw-peek-sub { font-size: 11px; color: rgba(251,191,36,0.6); font-weight: 400; }
  .cw-peek-upgrade {
    padding: 7px 15px; border-radius: 9px; border: 1px solid rgba(251,191,36,0.4);
    background: rgba(251,191,36,0.12); color: #fbbf24;
    font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .cw-peek-upgrade:hover { background: rgba(251,191,36,0.22); transform: translateY(-1px); }

  /* Expired gate — shown after timer runs out */
  .cw-expired-gate {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 18px; padding: 60px 24px; text-align: center;
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 18px;
  }
  .cw-expired-icon {
    width: 60px; height: 60px; border-radius: 18px;
    background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.28);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
  }
  .cw-expired-title { font-family: 'Syne',sans-serif; font-size: 20px; font-weight: 800; color: var(--t1); }
  .cw-expired-sub { font-size: 13px; color: var(--t2); max-width: 320px; line-height: 1.7; }
  .cw-expired-badges { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 4px; }
  .cw-expired-badge {
    padding: 5px 13px; border-radius: 99px; font-size: 11.5px; font-weight: 600;
    border: 1px solid rgba(77,159,255,0.28); background: rgba(77,159,255,0.08); color: var(--accent);
  }

  /* "Peek once" initial gate */
  .cw-peek-gate {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 20px; padding: 64px 24px; text-align: center;
    border-radius: 18px; border: 1px solid rgba(251,191,36,0.2);
    background: linear-gradient(160deg, rgba(251,191,36,0.04) 0%, var(--bg-e) 100%);
    position: relative; overflow: hidden;
  }
  .cw-peek-gate-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.09) 0%, transparent 70%);
  }
  .cw-peek-gate-icon {
    width: 66px; height: 66px; border-radius: 20px;
    background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    box-shadow: 0 0 32px rgba(251,191,36,0.18);
    animation: cwGlow 3s ease-in-out infinite;
  }
  .cw-peek-gate-title { font-family: 'Syne',sans-serif; font-size: 20px; font-weight: 800; color: var(--t1); }
  .cw-peek-gate-sub { font-size: 13px; color: var(--t2); max-width: 320px; line-height: 1.7; }
  .cw-peek-gate-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 99px;
    border: 1px solid rgba(251,191,36,0.3); background: rgba(251,191,36,0.07);
    font-size: 11.5px; color: #fbbf24; font-weight: 600;
  }
  .cw-peek-btn {
    padding: 12px 28px; border-radius: 12px; border: 1px solid rgba(251,191,36,0.4);
    background: rgba(251,191,36,0.12); color: #fbbf24;
    font-family: 'Syne',sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.25s var(--spring);
    display: flex; align-items: center; gap: 8px;
  }
  .cw-peek-btn:hover { background: rgba(251,191,36,0.22); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(251,191,36,0.18); }
  .cw-peek-warning { font-size: 11px; color: var(--tm); }

  .cw-loading { display: flex; height: 100vh; align-items: center; justify-content: center; background: #07071e; color: #9292b8; font-family: 'Syne',sans-serif; font-size: 15px; gap: 10px; }
  .cw-loading-dot { width: 6px; height: 6px; background: #4D9FFF; border-radius: 50%; animation: cwPulse 1.4s ease-in-out infinite; }
  .cw-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cw-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cwPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
  @keyframes cwFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .cw-fade-up { animation: cwFadeUp 0.5s var(--ease) both; }

  .cw-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 600px) { .cw-two-col { grid-template-columns: 1fr; } .cw-gender-grid { grid-template-columns: 1fr 1fr; } }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type UsageData = {
  totalTokensToday: number;
  totalCostToday: number;
  mostUsedModel: string | null;
  teamModeUsage: number;
  usageByModel: { model: string; tokens_used: number; cost: number }[];
  usageByDay: { date: string; tokens_used: number }[];
  providerUsage: { provider: string; usedToday: number; limit: number; remaining: number; costToday: number }[];
};

type ProfileData = {
  name: string;
  email: string;
  plan: "free" | "pro";
  // Extended fields from registration
  dob?: string;
  gender?: string;
  mobileNumber?: string;
  country?: string;
  occupation?: string;
  describesYou?: string;
  intentions?: string[];
  useCase?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "personal" | "security" | "analytics">("profile");
  const [loading, setLoading] = useState(true);

  // Core profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Extended profile fields (from registration)
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("");
  const [occupation, setOccupation] = useState("");
  const [describesYou, setDescribesYou] = useState("");
  const [intentions, setIntentions] = useState<string[]>([]);
  const [useCase, setUseCase] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMsg, setPersonalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Analytics
  const [usage, setUsage] = useState<UsageData | null>(null);

  // "Peek once" demo for free users
  // States: "gate" | "peeking" | "expired"
  const PEEK_KEY = "cw_analytics_peeked";
  const PEEK_DURATION = 30; // seconds visible
  const [peekState, setPeekState] = useState<"gate" | "peeking" | "expired">("gate");
  const [peekSecondsLeft, setPeekSecondsLeft] = useState(PEEK_DURATION);
  const peekTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute age from dob
  function computeAge(dobStr: string): number | null {
    if (!dobStr) return null;
    const birth = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
  const age = computeAge(dob);

  function toggleIntention(opt: string) {
    setIntentions((prev) =>
      prev.includes(opt) ? prev.filter((i) => i !== opt) : [...prev, opt]
    );
  }

  useEffect(() => {
    async function load() {
      try {
        const [meRes, usageRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/usage", { credentials: "include" }),
        ]);
        if (!meRes.ok) { router.replace("/auth/login"); return; }
        const meData = await meRes.json();
        const u = meData.user || {};
        setName(u.name || "");
        setEmail(u.email || "");
        setPlan(u.plan || "free");
        // Extended fields
        setDob(u.dob ? u.dob.slice(0, 10) : "");
        setGender(u.gender || "");
        setCountry(u.country || "");
        setOccupation(u.occupation || "");
        setDescribesYou(u.describes_you || "");
        setIntentions(Array.isArray(u.intention) ? u.intention : []);
        setUseCase(u.use_case || "");
        // Parse mobile number (stored as "+91 9876543210")
        if (u.mobile_number) {
          const parts = u.mobile_number.split(" ");
          if (parts.length >= 2) {
            setDialCode(parts[0]);
            setMobileNumber(parts.slice(1).join(""));
          } else {
            setMobileNumber(u.mobile_number);
          }
        }
        if (usageRes.ok) setUsage(await usageRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Auto-set dial code when country changes
  useEffect(() => {
    if (country) {
      const found = COUNTRIES.find((c) => c.name === country);
      if (found && !mobileNumber) setDialCode(found.dial);
    }
  }, [country]);

  // Init peek state from localStorage once loading is done
  useEffect(() => {
    if (!loading && plan !== "pro") {
      const peeked = localStorage.getItem(PEEK_KEY);
      setPeekState(peeked === "1" ? "expired" : "gate");
    }
  }, [loading, plan]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (peekTimerRef.current) clearInterval(peekTimerRef.current);
    };
  }, []);

  function startPeek() {
    // Mark as used in localStorage (persists forever)
    localStorage.setItem(PEEK_KEY, "1");
    setPeekState("peeking");
    setPeekSecondsLeft(PEEK_DURATION);
    peekTimerRef.current = setInterval(() => {
      setPeekSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(peekTimerRef.current!);
          peekTimerRef.current = null;
          setPeekState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

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

  async function savePersonalInfo() {
    setSavingPersonal(true);
    setPersonalMsg(null);
    try {
      const fullMobile = mobileNumber ? `${dialCode} ${mobileNumber.trim()}` : "";
      const res = await fetch("/api/user/personal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dob: dob || null,
          gender: gender || null,
          mobileNumber: fullMobile || null,
          country: country || null,
          occupation: occupation.trim() || null,
          describesYou: describesYou || null,
          intentions: intentions.length > 0 ? intentions : null,
          useCase: useCase.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPersonalMsg({ type: "error", text: data.error || "Failed to update." }); return; }
      setPersonalMsg({ type: "success", text: "Personal info updated." });
    } finally {
      setSavingPersonal(false);
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
  const initials = name ? name.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase();

  // Password strength
  function pwStrength(pw: string) {
    if (!pw) return { level: 0, label: "" };
    if (pw.length < 4) return { level: 1, label: "Weak" };
    if (pw.length < 7) return { level: 2, label: "Fair" };
    if (pw.length < 10) return { level: 3, label: "Good" };
    return { level: 4, label: "Strong" };
  }
  const strength = pwStrength(newPassword);

  return (
    <div className={`cw-root ${themeClass}`}>
      <style>{themeStyles}</style>
      <div className="cw-ambient">
        <div className="cw-orb cw-orb1" /><div className="cw-orb cw-orb2" />
      </div>

      {/* ── Navbar ── */}
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
            <div className="cw-avatar-circle">{initials}</div>
            <div>
              <div className="cw-page-title">{name || "Your Profile"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                <span className="cw-page-sub">{email}</span>
                <span className={`cw-plan-badge ${plan}`}>{plan === "pro" ? "⚡ Pro" : "Free"}</span>
                {age !== null && (
                  <span style={{ fontSize: 12, color: "var(--tm)" }}>· {age} yrs</span>
                )}
                {country && (
                  <span style={{ fontSize: 12, color: "var(--tm)" }}>· {country}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="cw-tabs cw-fade-up" style={{ animationDelay: "0.05s" }}>
          <button onClick={() => setActiveTab("profile")} className={`cw-tab ${activeTab === "profile" ? "active" : ""}`}>
            <User size={14} /> Account
          </button>
          <button onClick={() => setActiveTab("personal")} className={`cw-tab ${activeTab === "personal" ? "active" : ""}`}>
            <Globe size={14} /> Personal
          </button>
          <button onClick={() => setActiveTab("security")} className={`cw-tab ${activeTab === "security" ? "active" : ""}`}>
            <Lock size={14} /> Security
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`cw-tab ${activeTab === "analytics" ? "active" : ""}`}
          >
            <BarChart3 size={14} />
            Analytics
            {plan !== "pro" && <span style={{ fontSize: 10, marginLeft: 2 }}>⚡</span>}
          </button>
        </div>

        {/* ── Account Tab ── */}
        {activeTab === "profile" && (
          <div className="cw-fade-up">
            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><User size={14} /></div>
                Account Information
              </div>
              {profileMsg && <div className={profileMsg.type === "success" ? "cw-success" : "cw-error"}>{profileMsg.text}</div>}
              <div className="cw-two-col">
                <div className="cw-field">
                  <label className="cw-label">Full Name</label>
                  <input className="cw-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="cw-field">
                  <label className="cw-label">Email Address</label>
                  <input className="cw-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
                    {plan === "pro" ? "CoWork AI Pro" : "CoWork AI Free"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t2)" }}>
                    {plan === "pro"
                      ? "All features unlocked — Team Mode, Analytics, Private Chats."
                      : "Upgrade to Pro for Team Mode, full analytics, and more."}
                  </div>
                </div>
                {plan !== "pro" && (
                  <button className="cw-btn-primary" style={{ whiteSpace: "nowrap" }}>
                    <Zap size={13} /> Upgrade to Pro
                  </button>
                )}
              </div>
              {plan === "free" && (
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)" }}>
                  <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 4 }}>Free plan limits</div>
                  <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.7 }}>
                    5 project files · Single model only · Public chats only · No usage analytics
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Personal Tab ── */}
        {activeTab === "personal" && (
          <div className="cw-fade-up">
            {/* Basic Details */}
            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><Calendar size={14} /></div>
                Basic Details
              </div>
              {personalMsg && <div className={personalMsg.type === "success" ? "cw-success" : "cw-error"}>{personalMsg.text}</div>}

              <div className="cw-two-col">
                <div className="cw-field">
                  <label className="cw-label">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    className="cw-input"
                    style={{ colorScheme: isDark ? "dark" : "light" }}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  {age !== null && (
                    <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 5 }}>
                      Age: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{age} years old</span>
                    </div>
                  )}
                </div>
                <div className="cw-field">
                  <label className="cw-label">Country</label>
                  <select className="cw-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name} ({c.dial})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cw-field">
                <label className="cw-label">Gender</label>
                <div className="cw-gender-grid">
                  {[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Prefer not to say", value: "prefer_not_to_say" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(gender === g.value ? "" : g.value)}
                      className={`cw-gender-btn ${gender === g.value ? "active" : ""}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cw-field">
                <label className="cw-label">Mobile Number</label>
                <div className="cw-phone-row">
                  <select
                    className="cw-phone-prefix"
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.name} value={c.dial}>{c.dial} {c.name}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    className="cw-input"
                    style={{ flex: 1 }}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d\s]/g, "").slice(0, 10))}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 4 }}>
                  {mobileNumber.replace(/\s/g, "").length}/10 digits
                </div>
              </div>
            </div>

            {/* Professional */}
            <div className="cw-card">
              <div className="cw-card-title">
                <div className="cw-card-icon"><Briefcase size={14} /></div>
                Professional Info
              </div>

              <div className="cw-field">
                <label className="cw-label">Occupation</label>
                <input
                  className="cw-input"
                  placeholder="e.g. Software Engineer, Designer..."
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>

              <div className="cw-field">
                <label className="cw-label">What best describes you?</label>
                <div className="cw-tag-grid">
                  {describesYouOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDescribesYou(describesYou === opt ? "" : opt)}
                      className={`cw-tag ${describesYou === opt ? "active" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cw-field">
                <label className="cw-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Main Intentions</span>
                  {intentions.length > 0 && (
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>{intentions.length} selected</span>
                  )}
                </label>
                <div className="cw-tag-grid">
                  {intentionOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleIntention(opt)}
                      className={`cw-tag-violet ${intentions.includes(opt) ? "active" : ""}`}
                    >
                      {intentions.includes(opt) && <span style={{ marginRight: 4 }}>✓</span>}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cw-field">
                <label className="cw-label">Describe your use case</label>
                <textarea
                  rows={3}
                  className="cw-input"
                  style={{ resize: "vertical", lineHeight: 1.6 }}
                  placeholder="e.g. I want to build an AI-powered customer support tool..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button onClick={savePersonalInfo} disabled={savingPersonal} className="cw-btn-primary">
                  <Save size={14} />{savingPersonal ? "Saving..." : "Save Personal Info"}
                </button>
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
                <div style={{ position: "relative" }}>
                  <input
                    className="cw-input"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ paddingRight: 60 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    {showCurrentPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="cw-field">
                <label className="cw-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="cw-input"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    style={{ paddingRight: 60 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    style={{ position: "absolute", right: 12, top: newPassword ? "38%" : "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    {showNewPw ? "Hide" : "Show"}
                  </button>
                </div>
                {newPassword && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1, height: 4, borderRadius: 99,
                            background: strength.level >= i
                              ? i <= 1 ? "#ef4444" : i <= 2 ? "#f59e0b" : i <= 3 ? "#3b82f6" : "#22c55e"
                              : "var(--b-soft)",
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--tm)", width: 40 }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="cw-field">
                <label className="cw-label">Confirm New Password</label>
                <input
                  className="cw-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>Passwords do not match</div>
                )}
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
                onClick={() => {
                  if (confirm("Are you sure? This will permanently delete your account."))
                    alert("Contact support to delete your account.");
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === "analytics" && (
          <div className="cw-fade-up">
            {plan === "pro" ? (
              /* ── Full analytics for Pro ── */
              <>
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
              </>
            ) : peekState === "gate" ? (
              /* ── First-time gate: offer one-time peek ── */
              <div className="cw-peek-gate">
                <div className="cw-peek-gate-bg" />
                <div className="cw-peek-gate-icon">📊</div>
                <div className="cw-peek-gate-pill">
                  <span>⚡</span> Pro Feature
                </div>
                <div className="cw-peek-gate-title">See your analytics once</div>
                <div className="cw-peek-gate-sub">
                  Analytics is a Pro feature. As a free user, you get <strong style={{ color: "#fbbf24" }}>one 30-second peek</strong> — ever. After that, upgrade to keep access.
                </div>
                <div className="cw-expired-badges">
                  {["Token usage", "Cost tracking", "Model breakdown", "Provider limits"].map((f) => (
                    <span key={f} className="cw-expired-badge">{f}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <button className="cw-peek-btn" onClick={startPeek}>
                    <span>👁</span> Use my one-time peek
                  </button>
                  <div className="cw-peek-warning">This cannot be undone — you only get one peek, ever.</div>
                </div>
                <button className="cw-btn-primary" style={{ marginTop: 4 }}>
                  <Zap size={13} /> Upgrade for unlimited access
                </button>
              </div>
            ) : peekState === "peeking" ? (
              /* ── Active peek: show real data with countdown banner ── */
              <>
                {/* Sticky countdown banner */}
                <div className="cw-peek-banner">
                  <div className="cw-peek-left">
                    {/* SVG ring timer */}
                    <div className="cw-peek-ring">
                      <svg width="38" height="38" viewBox="0 0 38 38">
                        <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="3" />
                        <circle
                          cx="19" cy="19" r="15" fill="none"
                          stroke="#fbbf24" strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 15}`}
                          strokeDashoffset={`${2 * Math.PI * 15 * (1 - peekSecondsLeft / PEEK_DURATION)}`}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 1s linear" }}
                        />
                      </svg>
                      <div className="cw-peek-ring-num">{peekSecondsLeft}</div>
                    </div>
                    <div>
                      <div className="cw-peek-text">One-time preview active</div>
                      <div className="cw-peek-sub">
                        {peekSecondsLeft}s remaining · blurs when timer ends
                      </div>
                    </div>
                  </div>
                  <button className="cw-peek-upgrade">
                    <Zap size={12} style={{ display: "inline", marginRight: 5 }} />
                    Upgrade to keep access
                  </button>
                </div>

                {/* Real analytics content */}
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
              </>
            ) : (
              /* ── Expired: peek already used ── */
              <div className="cw-expired-gate">
                <div className="cw-expired-icon">🔒</div>
                <div className="cw-expired-title">Preview used</div>
                <div className="cw-expired-sub">
                  You've already used your one-time analytics preview. Upgrade to Pro to unlock persistent, full access to all your usage insights.
                </div>
                <div className="cw-expired-badges">
                  {["Token usage", "Cost tracking", "Model breakdown", "Provider limits", "Usage trends"].map((f) => (
                    <span key={f} className="cw-expired-badge">{f}</span>
                  ))}
                </div>
                <button className="cw-btn-primary" style={{ marginTop: 8 }}>
                  <Zap size={14} /> Upgrade to Pro
                </button>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>
                  All your data is still being tracked — you just need Pro to see it.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}