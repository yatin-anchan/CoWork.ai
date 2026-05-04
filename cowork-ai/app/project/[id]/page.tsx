"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RichMessage from "@/components/chat/RichMessage";

import {
  BarChart3,
  Bot,
  Brain,
  ChevronDown,
  Code2,
  FileSearch,
  FileText,
  LayoutDashboard,
  Menu,
  Paperclip,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  Trash2,
  User,
  X,
  UserPlus,
  Zap,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

type Chat = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
  creator_email?: string;
  creator_role?: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  memory_summary?: string | null;
  memory_updated_at?: string | null;
  my_role: "owner" | "editor" | "viewer";
  status: string;
  created_at: string;
  updated_at: string;
};

type ContextMessage = {
  id: string;
  parent_message_id: string | null;
  reply_to_message_id: string | null;
  version_number: number;
  active_version: boolean;
  role: "user" | "assistant";
  model: string | null;
  content: string;
  tokens_used: number;
  timestamp: string;
};

type ProjectFile = {
  id: string;
  chat_id: string | null;
  file_name: string;
  file_type: string;
  chat_title?: string | null;
  created_at: string;
};

type SelectedRole = "reasoning" | "research" | "execution" | "reviewing" | "auto";

type RoleProviderMap = {
  reasoning: string;
  research: string;
  execution: string;
  reviewing: string;
};

type ProjectMember = {
  id: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
};

type UsageData = {
  totalTokensToday: number;
  totalCostToday: number;
  mostUsedModel: string | null;
  teamModeUsage: number;
  usageByModel: { model: string; provider: string; tokens_used: number; cost: number }[];
  usageByDay: { date: string; tokens_used: number }[];
  connectedProviders: { provider: string; status: string }[];
  providerUsage: { provider: string; limit: number; usedToday: number; remaining: number; costToday: number }[];
};

// ─── Constants ──────────────────────────────────────────────────────────────

const providerOptions = [
  { value: "google", label: "Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Claude" },
  { value: "openai", label: "ChatGPT" },
  { value: "perplexity", label: "Perplexity" },
];

const roleButtons: { value: keyof RoleProviderMap; icon: React.ReactNode; label: string }[] = [
  { value: "reasoning", icon: <Brain size={14} />, label: "Reasoning" },
  { value: "research", icon: <FileSearch size={14} />, label: "Research" },
  { value: "execution", icon: <Code2 size={14} />, label: "Execution" },
  { value: "reviewing", icon: <ShieldCheck size={14} />, label: "Review" },
];

const roleAccent: Record<string, string> = {
  reasoning: "#818cf8",
  research:  "#34d399",
  execution: "#f59e0b",
  reviewing: "#f472b6",
  auto:      "#60a5fa",
};

const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.yaml,.yml";
const MAX_FILES = 5;

// ─── Theme CSS ───────────────────────────────────────────────────────────────

const themeStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --spring: cubic-bezier(0.34,1.56,0.64,1);
    --ease:   cubic-bezier(0.16,1,0.3,1);
  }

  .cw-dark {
    --bg:        #07071e;
    --bg-s:      rgba(39,39,87,0.42);
    --bg-g:      rgba(15,14,71,0.52);
    --bg-e:      rgba(80,80,129,0.2);
    --bg-i:      rgba(39,39,87,0.58);
    --b-soft:    rgba(134,134,172,0.14);
    --b-mid:     rgba(134,134,172,0.3);
    --b-glow:    rgba(77,159,255,0.42);
    --b-glow2:   rgba(77,159,255,0.16);
    --t1:        #FFFFE3;
    --t2:        #9292b8;
    --tm:        rgba(134,134,172,0.52);
    --btn-bg:    #FFFFE3;
    --btn-fg:    #0F0E47;
    --accent:    #4D9FFF;
    --ag:        rgba(77,159,255,0.16);
    --msg-u-bg:  rgba(255,255,227,0.07);
    --msg-u-b:   rgba(255,255,227,0.14);
    --msg-a-bg:  rgba(39,39,87,0.4);
    --msg-a-b:   rgba(134,134,172,0.16);
    --side-bg:   rgba(6,6,22,0.72);
    --modal-bg:  rgba(6,6,22,0.95);
    --scrollbar: rgba(80,80,129,0.4);
  }

  .cw-light {
    --bg:        #eef0fb;
    --bg-s:      rgba(255,255,255,0.72);
    --bg-g:      rgba(255,255,255,0.62);
    --bg-e:      rgba(255,255,255,0.86);
    --bg-i:      rgba(255,255,255,0.8);
    --b-soft:    rgba(80,80,129,0.1);
    --b-mid:     rgba(80,80,129,0.22);
    --b-glow:    rgba(77,159,255,0.52);
    --b-glow2:   rgba(77,159,255,0.14);
    --t1:        #1a1848;
    --t2:        #505081;
    --tm:        rgba(80,80,129,0.48);
    --btn-bg:    #272757;
    --btn-fg:    #FFFFE3;
    --accent:    #3d8fe8;
    --ag:        rgba(77,159,255,0.12);
    --msg-u-bg:  rgba(39,39,87,0.06);
    --msg-u-b:   rgba(39,39,87,0.13);
    --msg-a-bg:  rgba(255,255,255,0.88);
    --msg-a-b:   rgba(80,80,129,0.12);
    --side-bg:   rgba(230,232,248,0.8);
    --modal-bg:  rgba(235,237,252,0.97);
    --scrollbar: rgba(80,80,129,0.22);
  }

  .cw-root {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--t1);
    background: var(--bg);
    height: 100vh;
    overflow: hidden;
    transition: background 0.5s var(--ease), color 0.4s;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .cw-root *::-webkit-scrollbar { width: 3px; height: 3px; }
  .cw-root *::-webkit-scrollbar-track { background: transparent; }
  .cw-root *::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }

  .cw-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .cw-orb { position: absolute; border-radius: 50%; filter: blur(88px); animation: cwOrbF 20s ease-in-out infinite; will-change: transform; }
  .cw-orb1 { width: 560px; height: 560px; background: rgba(77,159,255,0.09); top: -140px; left: -100px; animation-delay: 0s; }
  .cw-orb2 { width: 420px; height: 420px; background: rgba(134,134,172,0.07); bottom: -120px; right: -80px; animation-delay: -8s; }
  .cw-orb3 { width: 300px; height: 300px; background: rgba(77,159,255,0.04); top: 42%; left: 52%; animation-delay: -14s; }
  @keyframes cwOrbF {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(28px,-34px) scale(1.04); }
    66%      { transform: translate(-18px,26px) scale(0.97); }
  }

  .cw-navbar {
    display: flex; align-items: center; justify-content: space-between;
    height: 56px; padding: 0 18px; flex-shrink: 0; z-index: 100;
    background: var(--bg-g);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border-bottom: 1px solid var(--b-soft);
    transition: background 0.5s;
    position: relative;
  }
  .cw-logo {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #505081, #4D9FFF);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px; color: #fff;
    box-shadow: 0 0 18px rgba(77,159,255,0.22);
    transition: box-shadow 0.3s, transform 0.3s var(--spring);
    flex-shrink: 0;
  }
  .cw-logo:hover { box-shadow: 0 0 30px rgba(77,159,255,0.44); transform: scale(1.08) rotate(-4deg); }
  .cw-brand-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--t1); letter-spacing: -0.3px; }
  .cw-brand-sub { font-size: 10px; color: var(--tm); letter-spacing: 0.5px; }

  .cw-nav-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 11px;
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 10px;
    color: var(--t2); font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: all 0.22s var(--ease);
  }
  .cw-nav-btn:hover { background: var(--bg-s); border-color: var(--b-mid); color: var(--t1); transform: translateY(-1px); }

  .cw-theme-toggle {
    position: relative; width: 50px; height: 26px;
    background: var(--bg-e); border: 1px solid var(--b-mid); border-radius: 99px;
    cursor: pointer; transition: background 0.4s, border-color 0.4s; flex-shrink: 0;
  }
  .cw-theme-toggle::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; background: var(--t1); border-radius: 50%;
    transition: transform 0.4s var(--spring), background 0.4s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .cw-light .cw-theme-toggle::after { transform: translateX(22px); }

  .cw-body { display: flex; flex: 1; min-height: 0; overflow: hidden; position: relative; z-index: 1; }

  .cw-icon-sidebar {
    width: 54px; flex-shrink: 0;
    background: var(--side-bg);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid var(--b-soft);
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 12px 0; z-index: 10; transition: background 0.5s;
  }
  .cw-icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px; border: none;
    background: transparent; color: var(--t2); cursor: pointer;
    transition: all 0.22s var(--ease);
  }
  .cw-icon-btn:hover { background: var(--bg-e); color: var(--t1); transform: scale(1.1); }
  .cw-icon-btn.active { background: var(--bg-e); color: var(--accent); box-shadow: 0 0 12px rgba(77,159,255,0.2); }

  .cw-sidebar {
    width: 252px; flex-shrink: 0;
    background: var(--side-bg);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-right: 1px solid var(--b-soft);
    padding: 16px 12px; display: flex; flex-direction: column; gap: 12px;
    overflow-y: auto;
    transition: width 0.35s var(--ease), opacity 0.28s, transform 0.35s var(--ease), background 0.5s;
    animation: cwSideIn 0.35s var(--ease);
  }
  .cw-sidebar.collapsed { width: 0; padding: 0; opacity: 0; overflow: hidden; pointer-events: none; transform: translateX(-10px); }
  @keyframes cwSideIn { from { transform: translateX(-16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .cw-proj-card {
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 14px;
    padding: 11px 13px; transition: border-color 0.2s;
  }
  .cw-proj-card:hover { border-color: var(--b-mid); }
  .cw-proj-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 12.5px; color: var(--t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cw-proj-desc { font-size: 11px; color: var(--tm); margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }

  .cw-sec-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.9px; text-transform: uppercase; color: var(--tm); padding: 0 4px; }

  .cw-side-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 10px;
    border-radius: 10px; border: 1px solid transparent;
    background: transparent; color: var(--t2);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: all 0.2s var(--ease); white-space: nowrap;
  }
  .cw-side-btn:hover { background: var(--bg-e); border-color: var(--b-soft); color: var(--t1); transform: translateX(3px); }
  .cw-side-btn.primary { background: var(--btn-bg); color: var(--btn-fg); font-weight: 600; border: none; box-shadow: 0 4px 16px rgba(0,0,0,0.14); }
  .cw-side-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
  .cw-side-btn.danger { color: #f87171; }
  .cw-side-btn.danger:hover { background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.2); }

  .cw-token-card {
    background: var(--bg-g); backdrop-filter: blur(12px);
    border: 1px solid var(--b-soft); border-radius: 14px;
    padding: 13px; margin-top: auto;
  }
  .cw-token-label { font-size: 10px; color: var(--tm); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500; }
  .cw-token-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: var(--t1); margin: 3px 0; }
  .cw-token-meta { font-size: 11px; color: var(--tm); line-height: 1.7; }
  .cw-active-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; background: var(--ag);
    border: 1px solid rgba(77,159,255,0.28); border-radius: 99px;
    font-size: 10.5px; color: var(--accent); margin-top: 6px;
  }
  .cw-pulse { width: 5px; height: 5px; background: var(--accent); border-radius: 50%; animation: cwPulse 2s ease-in-out infinite; }
  @keyframes cwPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }

  .cw-chat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  .cw-chat-header {
    padding: 13px 22px; border-bottom: 1px solid var(--b-soft); flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-g); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    transition: background 0.5s;
  }
  .cw-chat-title-btn {
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--t1);
    background: transparent; border: 1px solid transparent; border-radius: 7px;
    padding: 3px 7px; cursor: pointer;
    transition: all 0.2s;
  }
  .cw-chat-title-btn:hover { border-color: var(--b-mid); background: var(--bg-e); }
  .cw-chat-title-btn.inactive { cursor: default; }
  .cw-chat-title-btn.inactive:hover { border-color: transparent; background: transparent; }
  .cw-chat-title-input {
    font-family: 'Syne', sans-serif; font-size: 14.5px; font-weight: 600; color: var(--t1);
    background: var(--bg-e); border: 1px solid var(--b-glow); border-radius: 8px;
    padding: 3px 10px; outline: none;
    box-shadow: 0 0 0 3px var(--b-glow2);
  }
  .cw-title-hint { font-size: 10.5px; color: var(--tm); padding-left: 7px; margin-top: 2px; }

  .cw-vis-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 99px;
    font-size: 10.5px; color: var(--t2);
  }

  .cw-messages { flex: 1; overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 14px; }

  .cw-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; gap: 14px;
    animation: cwFadeUp 0.6s var(--ease);
  }
  @keyframes cwFadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .cw-empty-icon {
    width: 54px; height: 54px;
    background: linear-gradient(135deg, #505081, #4D9FFF);
    border-radius: 16px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 28px rgba(77,159,255,0.28);
    animation: cwGlow 3s ease-in-out infinite;
  }
  @keyframes cwGlow { 0%,100% { box-shadow: 0 0 20px rgba(77,159,255,0.24); } 50% { box-shadow: 0 0 42px rgba(77,159,255,0.44); } }
  .cw-empty-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--t1); }
  .cw-empty-sub { font-size: 12.5px; color: var(--t2); max-width: 280px; line-height: 1.6; }

  .cw-msg-group { display: flex; flex-direction: column; animation: cwMsgIn 0.38s var(--ease); }
  @keyframes cwMsgIn { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }

  .cw-bubble {
    border-radius: 16px; padding: 11px 15px;
    line-height: 1.65; font-size: 13.5px; position: relative;
    transition: transform 0.2s var(--ease), box-shadow 0.2s;
  }
  .cw-bubble:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(0,0,0,0.1); }
  .cw-bubble-user { margin-left: auto; max-width: 78%; background: var(--msg-u-bg); border: 1px solid var(--msg-u-b); color: var(--t1); }
  .cw-bubble-ai { margin-right: auto; max-width: 78%; background: var(--msg-a-bg); border: 1px solid var(--msg-a-b); color: var(--t1); backdrop-filter: blur(12px); }

  .cw-model-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 99px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--t2);
    margin-top: 6px; margin-left: 2px;
  }

  .cw-msg-actions { display: flex; gap: 5px; margin-top: 7px; opacity: 0; transition: opacity 0.2s; }
  .cw-msg-group:hover .cw-msg-actions { opacity: 1; }
  .cw-action-btn {
    padding: 3px 9px; border-radius: 6px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2);
    font-size: 10.5px; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.18s;
  }
  .cw-action-btn:hover { background: var(--bg-s); border-color: var(--b-mid); color: var(--t1); }

  .cw-ver-nav { display: flex; align-items: center; gap: 7px; margin-top: 7px; font-size: 10.5px; color: var(--tm); }
  .cw-ver-btn {
    width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2); font-size: 14px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .cw-ver-btn:hover { background: var(--bg-s); color: var(--t1); }
  .cw-ver-btn:disabled { opacity: 0.3; cursor: default; }

  .cw-dots { display: inline-flex; gap: 3px; padding: 4px 0; }
  .cw-dots span { width: 5px; height: 5px; background: var(--accent); border-radius: 50%; animation: cwBounce 1.2s ease-in-out infinite; }
  .cw-dots span:nth-child(2) { animation-delay: 0.2s; }
  .cw-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cwBounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }

  .cw-edit-area {
    width: 100%; min-height: 80px; padding: 9px 12px;
    background: var(--bg-i); border: 1px solid var(--b-glow); border-radius: 10px;
    color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 13px;
    resize: vertical; outline: none; box-shadow: 0 0 0 3px var(--b-glow2);
  }
  .cw-edit-actions { display: flex; gap: 7px; margin-top: 7px; }

  .cw-input-area {
    flex-shrink: 0; border-top: 1px solid var(--b-soft);
    background: var(--bg-g); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    padding: 14px 22px 18px; transition: background 0.5s;
  }
  .cw-input-max { max-width: 900px; margin: 0 auto; }

  .cw-input-shell {
    display: flex; align-items: center; gap: 9px;
    background: var(--bg-i); border: 1px solid var(--b-mid); border-radius: 20px;
    padding: 9px 11px 9px 15px;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .cw-input-shell:focus-within { border-color: var(--b-glow); box-shadow: 0 0 0 4px var(--b-glow2); }

  .cw-attach-btn {
    width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: all 0.2s; position: relative;
  }
  .cw-attach-btn:hover { background: var(--bg-s); color: var(--accent); border-color: var(--b-glow); transform: scale(1.08); }
  .cw-attach-btn.has-files { color: var(--accent); border-color: rgba(77,159,255,0.4); background: var(--ag); }
  .cw-attach-btn.uploading { opacity: 0.6; cursor: not-allowed; }
  .cw-attach-count {
    position: absolute; top: -5px; right: -5px;
    width: 15px; height: 15px; border-radius: 50%;
    background: var(--accent); color: var(--btn-fg);
    font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
  }

  .cw-file-strip {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;
    padding: 8px 12px;
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 12px;
    animation: cwFadeUp 0.2s var(--ease);
  }
  .cw-file-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 8px; background: var(--bg-s); border: 1px solid var(--b-mid); border-radius: 8px;
    font-size: 11px; color: var(--t2); max-width: 180px;
  }
  .cw-file-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .cw-file-chip-del {
    width: 14px; height: 14px; border-radius: 4px; border: none;
    background: transparent; color: var(--tm); cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; padding: 0;
  }
  .cw-file-chip-del:hover { background: rgba(248,113,113,0.15); color: #f87171; }

  .cw-text-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--t1);
    resize: none; line-height: 1.5;
  }
  .cw-text-input::placeholder { color: var(--tm); }
  .cw-text-input:disabled { cursor: not-allowed; color: var(--tm); }

  .cw-send-btn {
    width: 34px; height: 34px; border-radius: 10px; border: none;
    background: var(--btn-bg); color: var(--btn-fg);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: all 0.25s var(--spring);
  }
  .cw-send-btn:hover { transform: scale(1.08) rotate(-5deg); }
  .cw-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .cw-mode-row {
    margin-top: 9px; display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 12px; padding: 5px 12px 5px 5px;
  }
  .cw-mode-tabs { display: flex; background: var(--bg-s); border-radius: 9px; padding: 3px; gap: 2px; }
  .cw-mode-tab {
    padding: 6px 14px; border-radius: 7px; border: none; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--t2);
    cursor: pointer; transition: all 0.2s;
  }
  .cw-mode-tab.active { background: var(--btn-bg); color: var(--btn-fg); }
  .cw-mode-hint { font-size: 11px; color: var(--tm); }

  .cw-role-row { margin-top: 9px; display: grid; grid-template-columns: repeat(5,1fr); gap: 7px; }

  .cw-role-card {
    position: relative; display: flex; align-items: center;
    border-radius: 11px; border: 1px solid var(--b-soft); background: var(--bg-e);
    overflow: hidden; transition: all 0.25s var(--ease); cursor: pointer;
  }
  .cw-role-card:hover { border-color: var(--b-mid); transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
  .cw-role-card.active { border-color: var(--b-glow); background: var(--ag); box-shadow: 0 0 14px var(--b-glow2); }
  .cw-role-inner { flex: 1; display: flex; align-items: center; gap: 5px; padding: 8px 9px; border: none; background: transparent; cursor: pointer; }
  .cw-role-icon { color: var(--t2); flex-shrink: 0; transition: color 0.2s; }
  .cw-role-card.active .cw-role-icon { color: var(--accent); }
  .cw-role-name { font-size: 11.5px; font-weight: 500; color: var(--t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.2s; }
  .cw-role-card.active .cw-role-name { color: var(--accent); }
  .cw-role-chevron { padding: 0 7px 0 0; color: var(--tm); position: relative; }
  .cw-role-select { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }

  .cw-warn {
    margin-top: 9px; padding: 9px 13px; border-radius: 10px;
    border: 1px solid rgba(251,191,36,0.28); background: rgba(251,191,36,0.07);
    color: #fbbf24; font-size: 12px; line-height: 1.5;
  }

  .cw-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(4,4,18,0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: cwFade 0.2s ease;
  }
  @keyframes cwFade { from { opacity:0; } to { opacity:1; } }

  .cw-modal {
    background: var(--modal-bg); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
    border: 1px solid var(--b-mid); border-radius: 24px;
    width: 100%; max-width: 550px; max-height: 90vh; overflow-y: auto;
    padding: 26px; box-shadow: 0 24px 64px rgba(0,0,0,0.3);
    animation: cwModalIn 0.3s var(--spring);
  }
  .cw-modal-xl { max-width: 700px; }
  @keyframes cwModalIn { from { opacity:0; transform:scale(0.95) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .cw-modal-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
  .cw-modal-title { font-family: 'Syne', sans-serif; font-size: 16.5px; font-weight: 700; color: var(--t1); }
  .cw-modal-sub { font-size: 12px; color: var(--t2); margin-top: 3px; }

  .cw-modal-close {
    width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2); display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .cw-modal-close:hover { background: var(--bg-s); color: var(--t1); transform: rotate(90deg); }

  .cw-modal-section { background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 14px; padding: 15px; margin-bottom: 12px; }
  .cw-modal-label { font-size: 11.5px; font-weight: 600; color: var(--t2); letter-spacing: 0.3px; margin-bottom: 9px; }

  .cw-modal-input {
    width: 100%; padding: 8px 11px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 9px;
    color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; margin-bottom: 7px;
  }
  .cw-modal-input:focus { border-color: var(--b-glow); box-shadow: 0 0 0 3px var(--b-glow2); }

  .cw-modal-textarea {
    width: 100%; padding: 8px 11px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 9px;
    color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none;
    resize: none; transition: border-color 0.2s, box-shadow 0.2s; margin-bottom: 7px;
  }
  .cw-modal-textarea:focus { border-color: var(--b-glow); box-shadow: 0 0 0 3px var(--b-glow2); }

  .cw-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 18px; }

  .cw-btn-cancel {
    padding: 8px 16px; border-radius: 9px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .cw-btn-cancel:hover { background: var(--bg-s); color: var(--t1); }

  .cw-btn-save {
    padding: 8px 18px; border-radius: 9px; border: none;
    background: var(--btn-bg); color: var(--btn-fg); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all 0.25s var(--spring);
  }
  .cw-btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.18); }

  .cw-usage-panel {
    position: fixed; top: 0; right: 0; bottom: 0; width: 420px; z-index: 200;
    background: var(--modal-bg); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
    border-left: 1px solid var(--b-mid); overflow-y: auto; padding: 26px 22px;
    box-shadow: -16px 0 48px rgba(0,0,0,0.2);
    animation: cwSlideRight 0.35s var(--ease);
  }
  @keyframes cwSlideRight { from { transform:translateX(60px); opacity:0; } to { transform:translateX(0); opacity:1; } }

  .cw-usage-stat { background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 14px; padding: 15px; margin-bottom: 11px; }
  .cw-usage-val { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 700; color: var(--t1); }
  .cw-usage-meta { font-size: 11.5px; color: var(--t2); margin-top: 2px; }

  .cw-prog-row { margin-bottom: 12px; }
  .cw-prog-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); margin-bottom: 5px; }
  .cw-prog-bar { height: 5px; background: var(--bg-e); border-radius: 99px; overflow: hidden; }
  .cw-prog-fill { height: 100%; background: linear-gradient(90deg, #505081, #4D9FFF); border-radius: 99px; transition: width 0.8s var(--ease); }

  .cw-model-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 11px; border-radius: 9px; border: 1px solid var(--b-soft); background: var(--bg-e); margin-bottom: 7px; font-size: 12px;
  }
  .cw-model-row-name { color: var(--t1); font-weight: 500; }
  .cw-model-row-val { color: var(--t2); font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }

  .cw-chat-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 13px; border-radius: 13px; border: 1px solid var(--b-soft); background: var(--bg-e);
    cursor: pointer; transition: all 0.2s; margin-bottom: 7px;
  }
  .cw-chat-item:hover { border-color: var(--b-mid); transform: translateX(3px); }
  .cw-chat-item.active { border-color: var(--b-glow); background: var(--ag); }
  .cw-chat-item-title { font-weight: 500; font-size: 13px; color: var(--t1); }
  .cw-chat-item-meta { font-size: 10.5px; color: var(--tm); margin-top: 2px; }
  .cw-creator-info { font-size: 10.5px; color: var(--tm); margin-top: 1px; }
  .cw-creator-badge { display: inline-flex; align-items: center; margin-left: 5px; padding: 1px 6px; border: 1px solid var(--b-soft); border-radius: 99px; font-size: 9.5px; color: var(--t2); }

  .cw-member-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 13px; border-radius: 13px; border: 1px solid var(--b-soft); background: var(--bg-e); margin-bottom: 7px;
  }
  .cw-avatar {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, #505081, #4D9FFF);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .cw-member-email { font-size: 12.5px; font-weight: 500; color: var(--t1); }
  .cw-member-role { font-size: 10.5px; color: var(--t2); text-transform: capitalize; }

  .cw-role-badge { padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; text-transform: capitalize; }
  .cw-role-badge.owner  { background: rgba(77,159,255,0.14); color: #60a5fa; border: 1px solid rgba(77,159,255,0.24); }
  .cw-role-badge.editor { background: rgba(80,80,129,0.14); color: #a5b4fc; border: 1px solid rgba(80,80,129,0.24); }
  .cw-role-badge.viewer { background: var(--bg-e); color: var(--t2); border: 1px solid var(--b-soft); }

  .cw-btn-remove {
    padding: 4px 10px; border-radius: 7px; border: 1px solid rgba(248,113,113,0.24);
    background: rgba(248,113,113,0.07); color: #f87171; font-size: 11px; cursor: pointer; transition: all 0.2s;
  }
  .cw-btn-remove:hover { background: rgba(248,113,113,0.14); }

  .cw-invite-row { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 9px; }
  .cw-invite-input {
    flex: 1; min-width: 170px; padding: 7px 11px;
    background: var(--bg-i); border: 1px solid var(--b-soft); border-radius: 9px;
    color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 12.5px; outline: none;
    transition: border-color 0.2s;
  }
  .cw-invite-input:focus { border-color: var(--b-glow); }
  .cw-invite-select {
    padding: 7px 11px; background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 9px;
    color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 12.5px; outline: none; cursor: pointer;
  }
  .cw-invite-btn {
    padding: 7px 15px; border-radius: 9px; border: none;
    background: var(--btn-bg); color: var(--btn-fg); font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .cw-invite-btn:hover { transform: translateY(-1px); }

  .cw-viewer-notice {
    background: var(--bg-e); border: 1px solid var(--b-soft); border-radius: 13px;
    padding: 13px 15px; font-size: 12.5px; color: var(--t2); margin-top: 12px;
  }

  .cw-fmt-btn {
    padding: 4px 9px; border-radius: 6px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t2); font-size: 12px;
    cursor: pointer; transition: all 0.18s;
  }
  .cw-fmt-btn:hover { background: var(--bg-s); color: var(--t1); }

  .cw-vis-select {
    padding: 4px 9px; border-radius: 8px; border: 1px solid var(--b-soft);
    background: var(--bg-e); color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 11.5px; outline: none; cursor: pointer;
  }

  .cw-loading {
    display: flex; height: 100vh; align-items: center; justify-content: center;
    background: #07071e; color: #9292b8;
    font-family: 'Syne', sans-serif; font-size: 15px; gap: 10px;
  }
  .cw-loading-dot { width: 6px; height: 6px; background: #4D9FFF; border-radius: 50%; animation: cwPulse 1.4s ease-in-out infinite; }
  .cw-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cw-loading-dot:nth-child(3) { animation-delay: 0.4s; }

  .cw-files-drop {
    border: 2px dashed var(--b-mid); border-radius: 14px;
    padding: 28px; text-align: center; cursor: pointer;
    transition: all 0.2s; margin-bottom: 14px;
  }
  .cw-files-drop:hover, .cw-files-drop.drag-over { border-color: var(--accent); background: var(--ag); }
  .cw-files-drop-icon { color: var(--t2); margin-bottom: 8px; }
  .cw-files-drop-text { font-size: 13px; color: var(--t2); line-height: 1.5; }
  .cw-files-drop-hint { font-size: 11px; color: var(--tm); margin-top: 4px; }
  .cw-file-list-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 11px; border: 1px solid var(--b-soft); background: var(--bg-e); margin-bottom: 7px;
  }
  .cw-file-list-name { font-size: 12.5px; font-weight: 500; color: var(--t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .cw-file-list-meta { font-size: 10.5px; color: var(--tm); margin-top: 2px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupMessageVersions(messages: ContextMessage[]) {
  const groups = new Map<string, ContextMessage[]>();
  for (const message of messages) {
    const groupId = message.parent_message_id || message.id;
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId)!.push(message);
  }
  return Array.from(groups.entries()).map(([groupId, versions]) => {
    const sortedVersions = versions.sort((a, b) => a.version_number - b.version_number);
    const activeIndex = Math.max(sortedVersions.findIndex((m) => m.active_version), 0);
    return { groupId, versions: sortedVersions, activeIndex, activeMessage: sortedVersions[activeIndex] };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProjectChatPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ContextMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("reasoning");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [messageMode, setMessageMode] = useState<"single" | "team">("single");
  const [isStreaming, setIsStreaming] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [myProjectRole, setMyProjectRole] = useState<"owner" | "editor" | "viewer" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatListOpen, setChatListOpen] = useState(false);
  const [selectedVersionByGroup, setSelectedVersionByGroup] = useState<Record<string, number>>({});
  const activeChatIdRef = useRef<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [chatTitleDraft, setChatTitleDraft] = useState("");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportIncludeQuestions, setExportIncludeQuestions] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [roleProviders, setRoleProviders] = useState<RoleProviderMap>({
    reasoning: "google",
    research: "perplexity",
    execution: "groq",
    reviewing: "google",
  });

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const canEditProject = project?.my_role === "owner" || project?.my_role === "editor";
  const canManageProject = project?.my_role === "owner";
  const canSendMessages = project?.my_role === "owner" || project?.my_role === "editor";

  // ─── Utility ──────────────────────────────────────────────────────────────

  function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  function getProviderLabel(provider: string) {
    return providerOptions.find((item) => item.value === provider)?.label || provider;
  }

  function toggleSelectedMessage(messageId: string) {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  }

  function getConnectedProviderOptions() {
    if (!usage?.connectedProviders?.length) return [];
    return providerOptions.filter((provider) =>
      usage.connectedProviders.some((connected) => connected.provider === provider.value)
    );
  }

  // ─── File upload handlers ─────────────────────────────────────────────────

  async function fetchProjectFiles() {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        credentials: "include",
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) return;
      const data = await res.json();
      setProjectFiles(data.files || []);
    } catch (e) {
      console.error("[files] fetch failed:", e);
    }
  }

  async function renameProjectFile(fileId: string) {
    if (!renamingFileName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fileName: renamingFileName.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to rename file."); return; }
    setProjectFiles((prev) =>
      prev.map((file) => file.id === fileId ? { ...file, file_name: data.file.file_name } : file)
    );
    setRenamingFileId(null);
    setRenamingFileName("");
  }

  async function uploadFile(file: File) {
    if (projectFiles.length >= MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed. Remove a file first.`);
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
formData.append("file", file);
if (activeChatId) {
  formData.append("chatId", activeChatId);
}
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Upload failed."); return; }
      await fetchProjectFiles();
    } catch (e) {
      console.error("[files] upload failed:", e);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteProjectFile(fileId: string) {
    if (!confirm("Remove this file from the project?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) { alert("Failed to delete file."); return; }
      await fetchProjectFiles();
    } catch (e) {
      console.error("[files] delete failed:", e);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  async function exportChat(format: "pdf" | "txt" | "docx") {
    if (!activeChatId) return;
    if (selectMode && selectedMessageIds.length === 0) {
      alert("Select at least one message to export.");
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/chats/${activeChatId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        includeQuestions: exportIncludeQuestions,
        format,
        messageIds: selectMode && selectedMessageIds.length > 0 ? selectedMessageIds : null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "pdf" ? "chat-export.pdf" : format === "docx" ? "chat-export.docx" : "chat-export.txt";
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  async function copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); }
    catch { alert("Failed to copy."); }
  }

  // ─── Message actions ──────────────────────────────────────────────────────

  async function saveEditedMessage(messageId: string) {
    if (!activeChatId) return;
    const res = await fetch(`/api/projects/${projectId}/chats/${activeChatId}/messages/${messageId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: editingDraft }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) { alert(data.error || "Failed to edit message."); return; }
    setEditingMessageId(null);
    setEditingDraft("");
    await fetchChatMessages(activeChatId);
  }

  async function retryAssistantMessage(assistantMessageId: string) {
    if (!activeChatId) { alert("Select a chat first."); return; }
    setIsStreaming(true);
    setMessages((prev) => prev.map((m) =>
      m.id === assistantMessageId
        ? { ...m, content: "", model: selectedRole === "auto" ? "streaming" : getProviderLabel(roleProviders[selectedRole as keyof RoleProviderMap]) }
        : m
    ));
    try {
      const res = await fetch(`/api/projects/${projectId}/chats/${activeChatId}/messages/${assistantMessageId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ selectedRole }),
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || "Failed to retry."); await fetchChatMessages(activeChatId); return; }
      if (!res.body) { alert("Empty response."); await fetchChatMessages(activeChatId); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => m.id === assistantMessageId ? { ...m, content: text } : m));
      }
      await fetchChatMessages(activeChatId);
    } catch (e) { console.error(e); alert("Failed to retry."); await fetchChatMessages(activeChatId); }
    finally { setIsStreaming(false); await fetchUsage(); }
  }

  // ─── Fetchers ─────────────────────────────────────────────────────────────

  async function fetchUsage() {
    const res = await fetch("/api/usage", { credentials: "include" });
    if (!res.ok) return;
    setUsage(await res.json());
  }

  async function fetchMembers() {
    const res = await fetch(`/api/projects/${projectId}/members`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members || []);
    setMyProjectRole(data.myRole || null);
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) { alert("Enter an email address."); return; }
    const res = await fetch(`/api/projects/${projectId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) { alert(data.error || "Failed to send invite."); return; }
    alert(`Invite sent to ${inviteEmail.trim()}`);
    setInviteEmail("");
    setInviteRole("viewer");
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the project?")) return;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) { alert(data.error || "Failed to remove."); return; }
    await fetchMembers();
  }

  async function fetchRoleAssignments() {
    const [globalRes, projectRes] = await Promise.all([
      fetch("/api/models/roles", { credentials: "include" }),
      fetch(`/api/projects/${projectId}/roles`, { credentials: "include" }),
    ]);
    const next: RoleProviderMap = { reasoning: "google", research: "perplexity", execution: "groq", reviewing: "google" };
    if (globalRes.ok) { const d = await globalRes.json(); d.roles?.forEach((i: { role: string; provider: string }) => { if (i.role in next) next[i.role as keyof RoleProviderMap] = i.provider; }); }
    if (projectRes.ok) { const d = await projectRes.json(); d.roles?.forEach((i: { role: string; provider: string }) => { if (i.role in next) next[i.role as keyof RoleProviderMap] = i.provider; }); }
    setRoleProviders(next);
  }

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (res.status === 404) { router.push("/dashboard"); return; }
      if (!res.ok) { setLoading(false); return; }
      const text = await res.text();
      if (!text) { setLoading(false); return; }
      const data = JSON.parse(text);
      setProject(data.project);
      await fetchRoleAssignments();
      await fetchUsage();
      await fetchProjectFiles();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchChats(currentActiveChatId?: string | null) {
    const activeId = currentActiveChatId ?? activeChatIdRef.current ?? null;
    const url = activeId
      ? `/api/projects/${projectId}/chats?activeChatId=${activeId}`
      : `/api/projects/${projectId}/chats`;
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) return;
    const data = await res.json();
    const nextChats: Chat[] = data.chats || [];
    setChats(nextChats);
    setActiveChatId((prev) => { if (!prev && nextChats.length > 0) return nextChats[0].id; return prev; });
    return nextChats;
  }

  async function fetchChatMessages(chatId: string) {
    const res = await fetch(`/api/projects/${projectId}/chats/${chatId}`, { credentials: "include" });
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.contexts || []);
    setSelectedVersionByGroup({});
  }

  async function createNewChat() {
    const res = await fetch(`/api/projects/${projectId}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility: "public" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) { alert(data.error || "Failed to create chat."); return; }
    const newChat: Chat = data.chat;
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    activeChatIdRef.current = newChat.id;
    setChatTitleDraft(newChat.title);
    setMessages([]);
    setSelectedVersionByGroup({});
    await fetchChats(newChat.id);
  }

  async function updateChatVisibility(chatId: string, visibility: "public" | "private") {
    const res = await fetch(`/api/projects/${projectId}/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to update."); return; }
    await fetchChats();
  }

  async function updateChatTitle(chatId?: string) {
    const targetId = chatId ?? activeChatIdRef.current;
    if (!targetId || !chatTitleDraft.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/chats/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: chatTitleDraft.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Failed to rename."); return; }
    setChats((prev) => prev.map((c) => c.id === targetId ? { ...c, title: data.chat.title } : c));
    setEditingChatTitle(false);
  }

  async function deleteChat() {
    if (!activeChatId) return;
    if (!confirm("Delete this chat and all its messages?")) return;
    const res = await fetch(`/api/projects/${projectId}/chats/${activeChatId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) { alert("Failed to delete chat."); return; }
    setMessages([]); setActiveChatId(null); activeChatIdRef.current = null;
    setSelectedVersionByGroup({});
    await fetchChats(null);
  }

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchProject(); fetchChats(); }, [projectId]);
  useEffect(() => { if (activeChatId) { fetchChatMessages(activeChatId); setEditingChatTitle(false); } }, [activeChatId]);
  useEffect(() => { const c = chats.find((c) => c.id === activeChatId); if (c) setChatTitleDraft(c.title); }, [activeChatId, chats]);
  useEffect(() => { if (project) { setEditName(project.name || ""); setEditDescription(project.description || ""); setEditInstructions(project.instructions || ""); } }, [project]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function updateRoleProvider(role: keyof RoleProviderMap, provider: string) {
    setRoleProviders((prev) => ({ ...prev, [role]: provider }));
    const res = await fetch(`/api/projects/${projectId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role, provider }),
    });
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (!res.ok) { alert("Failed to update model."); return; }
    await fetchRoleAssignments();
  }

  async function saveProjectSettings() {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: editName, description: editDescription, instructions: editInstructions.slice(0, 4000) }),
    });
    if (!res.ok) { alert("Failed to update project."); return; }
    await fetchProject();
    setShowSettings(false);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!canSendMessages) { alert("Viewer access cannot send messages."); return; }
    if (!activeChatId) { alert("Create or select a chat first."); return; }
    if (!input.trim()) return;
    const messageText = input;
    setInput("");
    setIsStreaming(true);
    const tempUser: ContextMessage = {
      id: `user-${Date.now()}`, parent_message_id: null, reply_to_message_id: null,
      version_number: 1, active_version: true, role: "user", model: null,
      content: messageText, tokens_used: Math.ceil(messageText.length / 4), timestamp: new Date().toISOString(),
    };
    const tempAI: ContextMessage = {
      id: `assistant-${Date.now()}`, parent_message_id: null, reply_to_message_id: null,
      version_number: 1, active_version: true, role: "assistant",
      model: messageMode === "team" ? "team-mode" : selectedRole === "auto" ? "streaming" : getProviderLabel(roleProviders[selectedRole as keyof RoleProviderMap]),
      content: "", tokens_used: 0, timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUser, tempAI]);
    try {
      const endpoint = messageMode === "team"
        ? `/api/projects/${projectId}/message/team`
        : `/api/projects/${projectId}/message/stream`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: messageText, selectedRole, chatId: activeChatId }),
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Failed to send.");
        setMessages((prev) => prev.filter((m) => m.id !== tempUser.id && m.id !== tempAI.id));
        return;
      }
      if (messageMode === "team") {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => m.id === tempAI.id ? { ...m, model: "team-mode", content: data.assistantMessage?.content || "" } : m));
        await fetchProject();
        return;
      }
      if (!res.body) {
        alert("Streaming response was empty.");
        setMessages((prev) => prev.filter((m) => m.id !== tempUser.id && m.id !== tempAI.id));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamed = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamed += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => m.id === tempAI.id ? { ...m, content: streamed } : m));
      }
      await fetchProject();
    } catch (e) {
      console.error(e);
      alert("Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempUser.id && m.id !== tempAI.id));
    } finally {
      setIsStreaming(false);
      await fetchUsage();
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="cw-loading">
        <style>{themeStyles}</style>
        <div className="cw-loading-dot" /><div className="cw-loading-dot" /><div className="cw-loading-dot" />
        <span style={{ marginLeft: 8 }}>Loading project...</span>
      </div>
    );
  }

  const connectedOptions = getConnectedProviderOptions();
  const messageGroups = groupMessageVersions(messages);
  const themeClass = isDark ? "cw-dark" : "cw-light";
  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className={`cw-root ${themeClass}`}>
      <style>{themeStyles}</style>

      <div className="cw-ambient">
        <div className="cw-orb cw-orb1" /><div className="cw-orb cw-orb2" /><div className="cw-orb cw-orb3" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="cw-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          <div className="cw-logo">CW</div>
          <div className="cw-brand-text">
            <div className="cw-brand-title">CoWork.ai</div>
            <div className="cw-brand-sub">Multi-AI workspace</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, zIndex: 1 }}>
          <button onClick={async () => { setMembersOpen(true); await fetchMembers(); }} className="cw-nav-btn">
            <UserPlus size={13} /><span>{canManageProject ? "Invite" : "Members"}</span>
          </button>
          <button onClick={() => setExportOpen(true)} className="cw-nav-btn">Export</button>
          <button
            onClick={() => { setSelectMode((prev) => !prev); setSelectedMessageIds([]); }}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            {selectMode ? "Cancel Select" : "Select"}
          </button>
          <button onClick={() => setUsageOpen(true)} className="cw-nav-btn"><BarChart3 size={13} /><span>Usage</span></button>
          <button onClick={() => router.push("/dashboard")} className="cw-nav-btn"><LayoutDashboard size={13} /><span>Dashboard</span></button>
          <button className="cw-theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle theme" style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5px", pointerEvents: "none" }}>
              <Sun size={11} style={{ color: isDark ? "rgba(134,134,172,0.4)" : "#f59e0b", transition: "color 0.3s" }} />
              <Moon size={11} style={{ color: isDark ? "#9292b8" : "rgba(80,80,129,0.35)", transition: "color 0.3s" }} />
            </div>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="cw-body">

        {/* Icon sidebar */}
        <aside className="cw-icon-sidebar">
          <button onClick={() => setSidebarOpen((v) => !v)} className={`cw-icon-btn ${sidebarOpen ? "active" : ""}`}>
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <button onClick={() => router.push("/settings")} className="cw-icon-btn" title="Profile"><User size={17} /></button>
            <button onClick={() => router.push("/settings")} className="cw-icon-btn" title="Settings"><Settings size={17} /></button>
          </div>
        </aside>

        {/* Expanded sidebar */}
        <aside className={`cw-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="cw-proj-card">
            <div className="cw-proj-name">{project?.name}</div>
            <div className="cw-proj-desc">{project?.description || "No description"}</div>
          </div>
          <div>
            <div className="cw-sec-label" style={{ marginBottom: 8 }}>Workspace</div>
            <button onClick={createNewChat} className="cw-side-btn primary" style={{ marginBottom: 4 }}><Plus size={14} /> New Chat</button>
            <button onClick={() => router.push("/dashboard")} className="cw-side-btn"><LayoutDashboard size={14} /> New Project</button>
            <button onClick={() => setChatListOpen(true)} className="cw-side-btn"><Menu size={14} /> Chat List</button>
            <button onClick={() => { setFilesOpen(true); fetchProjectFiles(); }} className="cw-side-btn">
              <Paperclip size={14} />
              Project Files
              {projectFiles.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--accent)", background: "var(--ag)", border: "1px solid rgba(77,159,255,0.28)", borderRadius: 99, padding: "1px 7px" }}>
                  {projectFiles.length}/{MAX_FILES}
                </span>
              )}
            </button>
            <button onClick={deleteChat} className="cw-side-btn danger"><X size={14} /> Delete Chat</button>
            <button onClick={() => router.push("/api-manager")} className="cw-side-btn"><Zap size={14} /> API Manager</button>
            {canEditProject && (
              <button onClick={() => setShowSettings(true)} className="cw-side-btn"><Settings size={14} /> Project Settings</button>
            )}
          </div>
          <div className="cw-token-card" style={{ marginTop: "auto" }}>
            <div className="cw-token-label">Token Usage</div>
            <div className="cw-token-value">{(usage?.totalTokensToday ?? 0).toLocaleString()}</div>
            <div className="cw-token-meta">
              Cost today: ${usage?.totalCostToday?.toFixed(4) || "0.0000"}<br />
              Most used: {usage?.mostUsedModel || "None"}<br />
              Team Mode: {usage?.teamModeUsage ?? 0}×
            </div>
            <div className="cw-active-badge">
              <div className="cw-pulse" />
              {selectedRole === "auto" ? "Auto" : getProviderLabel(roleProviders[selectedRole as keyof RoleProviderMap])}
            </div>
          </div>
        </aside>

        {/* ── MAIN CHAT ── */}
        <section className="cw-chat-main">
          <div className="cw-chat-header">
            <div>
              {editingChatTitle ? (
                <input
                  value={chatTitleDraft}
                  onChange={(e) => setChatTitleDraft(e.target.value)}
                  onBlur={() => updateChatTitle()}
                  onKeyDown={(e) => { if (e.key === "Enter") updateChatTitle(); if (e.key === "Escape") setEditingChatTitle(false); }}
                  autoFocus className="cw-chat-title-input"
                />
              ) : (
                <button type="button" onClick={() => activeChatIdRef.current && setEditingChatTitle(true)} className={`cw-chat-title-btn ${activeChatIdRef.current ? "" : "inactive"}`}>
                  {activeChat?.title || project?.name || "New Chat"}
                </button>
              )}
              {activeChatId && !editingChatTitle && <div className="cw-title-hint">Click title to rename</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="cw-vis-chip"><Bot size={10} />{activeChat?.visibility || "public"}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messageGroups.length === 0 ? (
              <div className="cw-empty">
                <div className="cw-empty-icon"><Bot size={24} color="#fff" /></div>
                <div className="cw-empty-title">Select a model and start building</div>
                <div className="cw-empty-sub">Choose a role below — Reasoning, Research, Execution, or Reviewing — then send your first message.</div>
              </div>
            ) : (
              <div style={{ maxWidth: 880, margin: "0 auto", width: "100%" }}>
                {messageGroups.map((group) => {
                  const selectedIndex = selectedVersionByGroup[group.groupId] ?? group.activeIndex;
                  const message = group.versions[selectedIndex];
                  const isUser = message.role === "user";
                  return (
                    <div key={group.groupId} className="cw-msg-group" style={{ marginBottom: 14 }}>
                      <div className={`cw-bubble ${isUser ? "cw-bubble-user" : "cw-bubble-ai"}`}>
                        {selectMode && isUuid(message.id) && (
                          <input type="checkbox" checked={selectedMessageIds.includes(message.id)} onChange={() => toggleSelectedMessage(message.id)} className="mt-2" />
                        )}
                        {editingMessageId === message.id ? (
                          <div>
                            <textarea value={editingDraft} onChange={(e) => setEditingDraft(e.target.value)} className="cw-edit-area" />
                            <div className="cw-edit-actions">
                              <button type="button" onClick={() => saveEditedMessage(message.id)} className="cw-btn-save" style={{ padding: "5px 14px", fontSize: 12 }}>Save</button>
                              <button type="button" onClick={() => { setEditingMessageId(null); setEditingDraft(""); }} className="cw-btn-cancel" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <RichMessage content={message.content} />
                        )}
                        <div className="cw-msg-actions">
                          <button type="button" onClick={() => copyToClipboard(message.content)} className="cw-action-btn">Copy</button>
                          {message.role === "assistant" && isUuid(message.id) && (
                            <button type="button" onClick={() => retryAssistantMessage(message.id)} className="cw-action-btn">Retry</button>
                          )}
                          {canSendMessages && message.role === "user" && (
                            <button type="button" onClick={() => { setEditingMessageId(message.id); setEditingDraft(message.content); }} className="cw-action-btn">Edit</button>
                          )}
                        </div>
                      </div>
                      {group.versions.length > 1 && (
                        <div className="cw-ver-nav" style={{ paddingLeft: isUser ? 0 : 4, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                          <button type="button" className="cw-ver-btn" onClick={() => setSelectedVersionByGroup((prev) => ({ ...prev, [group.groupId]: Math.max(selectedIndex - 1, 0) }))} disabled={selectedIndex === 0}>‹</button>
                          <span>{selectedIndex + 1}/{group.versions.length}</span>
                          <button type="button" className="cw-ver-btn" onClick={() => setSelectedVersionByGroup((prev) => ({ ...prev, [group.groupId]: Math.min(selectedIndex + 1, group.versions.length - 1) }))} disabled={selectedIndex === group.versions.length - 1}>›</button>
                        </div>
                      )}
                      {message.model && (
                        <div style={{ paddingLeft: isUser ? 0 : 4, display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                          <span className="cw-model-chip"><Bot size={9} />{message.model}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── INPUT FORM ── */}
          <form onSubmit={handleSendMessage} className="cw-input-area">
            <div className="cw-input-max">
              <div className="cw-input-shell">
                <button
                  type="button"
                  className={`cw-attach-btn ${projectFiles.length > 0 ? "has-files" : ""} ${isUploading ? "uploading" : ""}`}
                  onClick={() => {
                    if (projectFiles.length >= MAX_FILES) { setFilesOpen(true); fetchProjectFiles(); }
                    else { fileInputRef.current?.click(); }
                  }}
                  title={projectFiles.length >= MAX_FILES ? `${MAX_FILES} files attached — click to manage` : isUploading ? "Uploading…" : "Attach file to project context"}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div style={{ width: 13, height: 13, border: "2px solid var(--b-mid)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <Paperclip size={14} />
                  )}
                  {projectFiles.length > 0 && <span className="cw-attach-count">{projectFiles.length}</span>}
                </button>

                <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE_TYPES} style={{ display: "none" }} onChange={handleFileInputChange} />

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!canSendMessages}
                  placeholder={
                    projectFiles.length > 0
                      ? `Message CoWork.ai… (${projectFiles.length} file${projectFiles.length > 1 ? "s" : ""} in context)`
                      : canSendMessages ? "Message CoWork.ai…" : "Viewer access: messaging is disabled"
                  }
                  className="cw-text-input"
                />
                <button type="submit" disabled={isStreaming || !input.trim() || !canSendMessages} className="cw-send-btn">
                  <Send size={15} />
                </button>
              </div>

              <div className="cw-mode-row">
                <div className="cw-mode-tabs">
                  <button type="button" onClick={() => setMessageMode("single")} className={`cw-mode-tab ${messageMode === "single" ? "active" : ""}`}>Single Model</button>
                  <button type="button" onClick={() => setMessageMode("team")} className={`cw-mode-tab ${messageMode === "team" ? "active" : ""}`}>Team Mode Pro</button>
                </div>
                <span className="cw-mode-hint">reasoning → execution → review</span>
              </div>

              {usage?.connectedProviders?.length === 0 && (
                <div className="cw-warn">No API keys connected. Go to API Manager to connect at least one model provider.</div>
              )}

              <div className="cw-role-row">
                {roleButtons.map((role) => {
                  const active = selectedRole === role.value;
                  const providerLabel = getProviderLabel(roleProviders[role.value]);
                  return (
                    <div key={role.value} className={`cw-role-card ${active ? "active" : ""}`} style={active ? { borderColor: roleAccent[role.value], boxShadow: `0 0 14px ${roleAccent[role.value]}30` } : {}}>
                      <button type="button" onClick={() => { if (!canEditProject) return; setSelectedRole(role.value); }} className="cw-role-inner">
                        <span className="cw-role-icon" style={active ? { color: roleAccent[role.value] } : {}}>{role.icon}</span>
                        <span className="cw-role-name" style={active ? { color: roleAccent[role.value] } : {}}>{providerLabel}</span>
                      </button>
                      <div className="cw-role-chevron">
                        <ChevronDown size={11} style={{ color: active ? roleAccent[role.value] : "var(--tm)" }} />
                        <select value={roleProviders[role.value]} onChange={(e) => updateRoleProvider(role.value, e.target.value)} disabled={connectedOptions.length === 0 || !canEditProject} className="cw-role-select" title={`Change ${role.value} model`}>
                          {connectedOptions.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                <div className={`cw-role-card ${selectedRole === "auto" ? "active" : ""}`} style={selectedRole === "auto" ? { borderColor: roleAccent.auto, boxShadow: `0 0 14px ${roleAccent.auto}30` } : {}}>
                  <button type="button" onClick={() => { if (!canEditProject) return; setSelectedRole("auto"); }} className="cw-role-inner" style={{ justifyContent: "center" }}>
                    <span className="cw-role-icon" style={selectedRole === "auto" ? { color: roleAccent.auto } : {}}><Bot size={14} /></span>
                    <span className="cw-role-name" style={selectedRole === "auto" ? { color: roleAccent.auto } : {}}>Auto</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* ── FILES MODAL ── */}
      {filesOpen && (
        <div className="cw-backdrop" onClick={(e) => e.target === e.currentTarget && setFilesOpen(false)}>
          <div className="cw-modal">
            <div className="cw-modal-header">
              <div>
                <div className="cw-modal-title">Project Files</div>
                <div className="cw-modal-sub">{projectFiles.length}/{MAX_FILES} files · Added to AI context automatically</div>
              </div>
              <button className="cw-modal-close" onClick={() => setFilesOpen(false)}><X size={14} /></button>
            </div>

            {projectFiles.length < MAX_FILES && (
              <div
                className={`cw-files-drop ${isDragOver ? "drag-over" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="cw-files-drop-icon" style={{ display: "flex", justifyContent: "center" }}><Paperclip size={22} /></div>
                <div className="cw-files-drop-text">{isUploading ? "Uploading…" : "Click or drag & drop a file"}</div>
                <div className="cw-files-drop-hint">Supported: .txt, .md, .pdf, .csv, .json, .js, .ts, .tsx, .py, .html, .css, .xml, .yaml</div>
              </div>
            )}

            {projectFiles.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--tm)", textAlign: "center", padding: "12px 0" }}>No files yet. Upload one above.</p>
            ) : (
              projectFiles.map((f) => (
                <div key={f.id} className="cw-file-list-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <FileText size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      {renamingFileId === f.id ? (
                        <input
                          value={renamingFileName}
                          onChange={(e) => setRenamingFileName(e.target.value)}
                          onBlur={() => renameProjectFile(f.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameProjectFile(f.id);
                            if (e.key === "Escape") { setRenamingFileId(null); setRenamingFileName(""); }
                          }}
                          autoFocus
                          className="cw-modal-input"
                          style={{ marginBottom: 0, padding: "4px 8px", fontSize: 12 }}
                        />
                      ) : (
                        <div
                          className="cw-file-list-name"
                          onDoubleClick={() => { setRenamingFileId(f.id); setRenamingFileName(f.file_name); }}
                          title="Double-click to rename"
                        >
                          {f.file_name}
                        </div>
                      )}
                      <span className="text-[10px] text-[var(--tm)]">
  Used in: {f.chat_title || "All project chats"}
</span>
                      <div className="cw-file-list-meta">{f.file_type} · {new Date(f.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setRenamingFileId(f.id); setRenamingFileName(f.file_name); }}
                      className="cw-btn-remove"
                      style={{ borderColor: "rgba(134,134,172,0.24)", color: "var(--t2)", background: "var(--bg-e)", display: "flex", alignItems: "center", gap: 4 }}
                      title="Rename file"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProjectFile(f.id)}
                      className="cw-btn-remove"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}

            {projectFiles.length >= MAX_FILES && (
              <div className="cw-warn" style={{ marginTop: 8 }}>Max {MAX_FILES} files reached. Remove a file to upload a new one.</div>
            )}
          </div>
        </div>
      )}

      {/* ── CHAT LIST MODAL ── */}
      {chatListOpen && (
        <div className="cw-backdrop" onClick={(e) => e.target === e.currentTarget && setChatListOpen(false)}>
          <div className="cw-modal">
            <div className="cw-modal-header">
              <div><div className="cw-modal-title">Chats</div><div className="cw-modal-sub">Select or manage your project conversations</div></div>
              <button className="cw-modal-close" onClick={() => setChatListOpen(false)}><X size={14} /></button>
            </div>
            {chats.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--tm)" }}>No chats yet. Create one to get started.</p>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className={`cw-chat-item ${activeChatId === chat.id ? "active" : ""}`} onClick={() => { setActiveChatId(chat.id); setChatListOpen(false); }}>
                  <div>
                    <div className="cw-chat-item-title">{chat.title}</div>
                    <div className="cw-chat-item-meta">{new Date(chat.updated_at).toLocaleString()}</div>
                    {chat.creator_email && (
                      <div className="cw-creator-info">{chat.creator_email}{chat.creator_role && <span className="cw-creator-badge">{chat.creator_role}</span>}</div>
                    )}
                  </div>
                  {project?.my_role === "owner" ? (
                    <select value={chat.visibility} onClick={(e) => e.stopPropagation()} onChange={(e) => updateChatVisibility(chat.id, e.target.value as "public" | "private")} className="cw-vis-select">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  ) : (
                    <span className="cw-vis-chip">{chat.visibility}</span>
                  )}
                </div>
              ))
            )}
            <div style={{ marginTop: 14 }}>
              <button className="cw-btn-save" style={{ width: "100%" }} onClick={() => { createNewChat(); setChatListOpen(false); }}>+ New Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── USAGE PANEL ── */}
      {usageOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,4,18,0.5)", backdropFilter: "blur(6px)" }}>
          <aside className="cw-usage-panel">
            <div className="cw-modal-header">
              <div><div className="cw-modal-title">Usage Analysis</div><div className="cw-modal-sub">Token usage across connected models</div></div>
              <button className="cw-modal-close" onClick={() => setUsageOpen(false)}><X size={14} /></button>
            </div>
            <div className="cw-usage-stat">
              <div className="cw-usage-val">{(usage?.totalTokensToday ?? 0).toLocaleString()}</div>
              <div className="cw-usage-meta">Cost today: ${usage?.totalCostToday?.toFixed(4) || "0.0000"} · Most used: {usage?.mostUsedModel || "None"}</div>
            </div>
            <div className="cw-modal-label" style={{ marginTop: 14 }}>Connected Model Limits</div>
            {!usage?.providerUsage?.length ? (
              <p style={{ fontSize: 12.5, color: "#fbbf24", marginBottom: 12 }}>No connected API keys. Connect providers in API Manager.</p>
            ) : (
              usage.providerUsage.map((item) => {
                const pct = item.limit > 0 ? Math.min((item.usedToday / item.limit) * 100, 100) : 0;
                return (
                  <div key={item.provider} className="cw-prog-row">
                    <div className="cw-prog-header"><span style={{ textTransform: "capitalize" }}>{item.provider}</span><span>{item.usedToday} / {item.limit}</span></div>
                    <div className="cw-prog-bar"><div className="cw-prog-fill" style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: 10.5, color: "var(--tm)", marginTop: 3 }}>Remaining: {item.remaining} · ${item.costToday?.toFixed(4)}</div>
                  </div>
                );
              })
            )}
            <div className="cw-modal-label" style={{ marginTop: 14 }}>Usage by Model Today</div>
            {!usage?.usageByModel?.length ? (
              <p style={{ fontSize: 12.5, color: "var(--tm)" }}>No usage yet.</p>
            ) : (
              usage.usageByModel.map((item) => (
                <div key={item.model} className="cw-model-row">
                  <span className="cw-model-row-name">{item.model}</span>
                  <span className="cw-model-row-val">{item.tokens_used} tokens</span>
                </div>
              ))
            )}
            <div className="cw-modal-label" style={{ marginTop: 14 }}>Usage Trend</div>
            {usage?.usageByDay?.length ? (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={usage.usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--b-soft)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <Tooltip contentStyle={{ background: "var(--modal-bg)", border: "1px solid var(--b-mid)", borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="tokens_used" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <p style={{ fontSize: 12.5, color: "var(--tm)" }}>No data yet</p>}
            <div className="cw-modal-label" style={{ marginTop: 14 }}>Usage by Provider</div>
            {usage?.providerUsage?.length ? (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={usage.providerUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--b-soft)" />
                    <XAxis dataKey="provider" tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--tm)" }} />
                    <Tooltip contentStyle={{ background: "var(--modal-bg)", border: "1px solid var(--b-mid)", borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="usedToday" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p style={{ fontSize: 12.5, color: "var(--tm)" }}>No provider usage yet</p>}
          </aside>
        </div>
      )}

      {/* ── EXPORT MODAL ── */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Export Chat</h2>
              <button onClick={() => setExportOpen(false)} className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-900">Close</button>
            </div>
            {selectMode && <p className="mt-3 text-xs text-neutral-500">{selectedMessageIds.length} selected message(s) will be exported.</p>}
            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-800 bg-black p-4">
                <input type="radio" checked={exportIncludeQuestions} onChange={() => setExportIncludeQuestions(true)} />
                <div><p className="text-sm font-medium">Export with questions</p><p className="text-xs text-neutral-500">Includes user prompts and assistant responses.</p></div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-800 bg-black p-4">
                <input type="radio" checked={!exportIncludeQuestions} onChange={() => setExportIncludeQuestions(false)} />
                <div><p className="text-sm font-medium">Export responses only</p><p className="text-xs text-neutral-500">Includes only assistant responses.</p></div>
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => exportChat("pdf")} className="w-full rounded-xl bg-white px-4 py-2.5 text-sm text-black">Download PDF</button>
              <button onClick={() => exportChat("txt")} className="w-full rounded-xl border border-neutral-700 px-4 py-2.5 text-sm text-neutral-300">TXT</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROJECT SETTINGS MODAL ── */}
      {showSettings && (
        <div className="cw-backdrop" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="cw-modal cw-modal-xl">
            <div className="cw-modal-header">
              <div><div className="cw-modal-title">Project Settings</div><div className="cw-modal-sub">Configure your project workspace</div></div>
              <button className="cw-modal-close" onClick={() => setShowSettings(false)}><X size={14} /></button>
            </div>
            <div className="cw-modal-section">
              <div className="cw-modal-label">Project Name</div>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="cw-modal-input" placeholder="Project name" />
              <div className="cw-modal-label">Description</div>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="cw-modal-textarea" rows={2} placeholder="Description" />
            </div>
            <div className="cw-modal-section">
              <div className="cw-modal-label">Instructions</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {[{ label: "B", insert: "**bold** " }, { label: "I", insert: "*italic* " }, { label: "•", insert: "- item\n" }, { label: "H", insert: "## Heading\n" }, { label: "❝", insert: "> quote\n" }, { label: "</>", insert: "`code` " }].map(({ label, insert }) => (
                  <button key={label} type="button" onClick={() => setEditInstructions((prev) => prev + insert)} className="cw-fmt-btn">{label}</button>
                ))}
              </div>
              <textarea value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} className="cw-modal-textarea" rows={7} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="Project instructions (max 4000 chars)" />
              <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 2 }}>{editInstructions.length}/4000</div>
            </div>
            <div className="cw-modal-footer">
              <button type="button" onClick={() => setShowSettings(false)} className="cw-btn-cancel">Cancel</button>
              <button type="button" onClick={saveProjectSettings} className="cw-btn-save">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBERS MODAL ── */}
      {membersOpen && (
        <div className="cw-backdrop" onClick={(e) => e.target === e.currentTarget && setMembersOpen(false)}>
          <div className="cw-modal">
            <div className="cw-modal-header">
              <div><div className="cw-modal-title">Project Members</div><div className="cw-modal-sub">Invite teammates and manage access</div></div>
              <button className="cw-modal-close" onClick={() => setMembersOpen(false)}><X size={14} /></button>
            </div>
            {myProjectRole === "owner" && (
              <div className="cw-modal-section">
                <div className="cw-modal-label">Invite teammate</div>
                <div className="cw-invite-row">
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@example.com" className="cw-invite-input" />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")} className="cw-invite-select">
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button onClick={inviteMember} className="cw-invite-btn">Invite</button>
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 7 }}>The user must already have a CoWork.ai account.</div>
              </div>
            )}
            {myProjectRole !== "owner" && <div className="cw-viewer-notice">You can view members, but only the project owner can invite or remove teammates.</div>}
            <div style={{ marginTop: 12 }}>
              {members.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--tm)" }}>No members found.</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="cw-member-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="cw-avatar">{member.email.slice(0, 2).toUpperCase()}</div>
                      <div><div className="cw-member-email">{member.email}</div><div className="cw-member-role">{member.role}</div></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`cw-role-badge ${member.role}`}>{member.role}</span>
                      {myProjectRole === "owner" && member.role !== "owner" && (
                        <button onClick={() => removeMember(member.id)} className="cw-btn-remove">Remove</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}