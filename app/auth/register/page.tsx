"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import { useRouter } from "next/navigation";

const TOTAL_STEPS = 3;

// ── Country data ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial: "+93" },
  { name: "Albania", code: "AL", dial: "+355" },
  { name: "Algeria", code: "DZ", dial: "+213" },
  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Czech Republic", code: "CZ", dial: "+420" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "Ethiopia", code: "ET", dial: "+251" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Ghana", code: "GH", dial: "+233" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Hungary", code: "HU", dial: "+36" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Iran", code: "IR", dial: "+98" },
  { name: "Iraq", code: "IQ", dial: "+964" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Morocco", code: "MA", dial: "+212" },
  { name: "Myanmar", code: "MM", dial: "+95" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Peru", code: "PE", dial: "+51" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Romania", code: "RO", dial: "+40" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Taiwan", code: "TW", dial: "+886" },
  { name: "Tanzania", code: "TZ", dial: "+255" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "Uganda", code: "UG", dial: "+256" },
  { name: "Ukraine", code: "UA", dial: "+380" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Zimbabwe", code: "ZW", dial: "+263" },
];

type FormData = {
  name: string;
  email: string;
  password: string;
  dob: string;
  gender: string;
  dialCode: string;
  mobileNumber: string;
  country: string;
  occupation: string;
  describesYou: string;
  intentions: string[];
  useCase: string;
};

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

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Searchable dropdown ───────────────────────────────────────────────────────
function SearchableDropdown({
  value,
  onChange,
  placeholder,
  options,
  renderOption,
  renderSelected,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: { value: string; label: string; sublabel?: string }[];
  renderOption?: (opt: { value: string; label: string; sublabel?: string }) => React.ReactNode;
  renderSelected?: (val: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel || "").toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-left transition focus:border-indigo-400/60 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 flex items-center justify-between"
      >
        <span className={selected ? "text-white" : "text-slate-600"}>
          {selected ? (renderSelected ? renderSelected(value) : selected.label) : placeholder}
        </span>
        <span className="text-slate-500 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/5 flex items-center justify-between ${
                    value === opt.value ? "text-indigo-300 bg-indigo-500/10" : "text-slate-300"
                  }`}
                >
                  {renderOption ? renderOption(opt) : (
                    <span>{opt.label}{opt.sublabel && <span className="ml-2 text-xs text-slate-500">{opt.sublabel}</span>}</span>
                  )}
                  {value === opt.value && <span className="text-indigo-400 text-xs">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "",
    dob: "", gender: "", dialCode: "+91", mobileNumber: "", country: "",
    occupation: "", describesYou: "", intentions: [], useCase: "",
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function toggleIntention(opt: string) {
    setForm((prev) => ({
      ...prev,
      intentions: prev.intentions.includes(opt)
        ? prev.intentions.filter((i) => i !== opt)
        : [...prev.intentions, opt],
    }));
  }

  const computedAge = calculateAge(form.dob);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => { if (res.ok) router.replace("/dashboard"); })
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Auto-set dial code when country changes
  useEffect(() => {
    if (form.country) {
      const found = COUNTRIES.find((c) => c.name === form.country);
      if (found) set("dialCode", found.dial);
    }
  }, [form.country]);

  function validateStep1() {
    if (!form.name.trim()) { setError("Full name is required."); return false; }
    if (!form.email.trim()) { setError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email."); return false; }
    if (!form.password) { setError("Password is required."); return false; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    return true;
  }

  function validateStep2() {
    if (!form.dob) { setError("Date of birth is required."); return false; }
    const age = calculateAge(form.dob);
    if (!age || age < 13) { setError("You must be at least 13 years old."); return false; }
    if (age > 120) { setError("Enter a valid date of birth."); return false; }
    if (!form.gender) { setError("Please select your gender."); return false; }
    if (!form.mobileNumber.trim()) { setError("Mobile number is required."); return false; }
    if (!/^\d{6,15}$/.test(form.mobileNumber.replace(/\s/g, ""))) {
      setError("Enter a valid mobile number (digits only, 6–15 digits)."); return false;
    }
    if (!form.country) { setError("Please select your country."); return false; }
    return true;
  }

  function handleNext() {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const age = computedAge;
      const fullMobile = `${form.dialCode} ${form.mobileNumber.trim()}`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          age: age && age >= 13 && age <= 120 ? age : null,
          dob: form.dob || null,
          gender: form.gender || null,
          mobileNumber: fullMobile,
          country: form.country || null,
          occupation: form.occupation.trim() || null,
          describesYou: form.describesYou || null,
          intention: form.intentions.length > 0 ? form.intentions : null,
          useCase: form.useCase.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
      </main>
    );
  }

  const progressPct = (step / TOTAL_STEPS) * 100;

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.name,
    label: c.name,
    sublabel: c.dial,
  }));

  const dialOptions = COUNTRIES.map((c) => ({
    value: c.dial + "|" + c.code,
    label: c.dial,
    sublabel: c.name,
  }));

  // ── Particle keyframe styles ─────────────────────────────────────────────────
  const particleStyles = `
    @keyframes floatParticle {
      0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(-120vh) translateX(40px); opacity: 0; }
    }
    .animate-floatParticle {
      animation-name: floatParticle;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
  `;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 text-white">
      <style>{particleStyles}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(79,70,229,0.26),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_46%,#020617_100%)]" />

      {/* Interactive cursor lighting */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(
            600px circle at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(99,102,241,0.16),
            transparent 40%
          )`,
        }}
      />

      {/* Depth particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(28)].map((_, i) => {
          const size = Math.random() * 6 + 2;
          const left = Math.random() * 100;
          const delay = Math.random() * 20;
          const duration = Math.random() * 20 + 25;
          const opacity = Math.random() * 0.35 + 0.08;

          return (
            <span
              key={i}
              className="absolute rounded-full bg-indigo-300/40 blur-[1px] animate-floatParticle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${Math.random() * 100}%`,
                opacity,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl md:grid-cols-[1fr_0.9fr]">

        {/* Left panel */}
        <div className="hidden border-r border-white/10 bg-white/[0.025] p-10 md:flex md:flex-col">
          <a href="/" className="mb-12 flex items-center gap-3 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <span className="text-lg font-black">C</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              CoWork<span className="text-violet-300">AI</span>
            </span>
          </a>

          <div className="mb-10 space-y-5">
            {[
              { n: 1, title: "Create account", sub: "Name, email and password" },
              { n: 2, title: "About you", sub: "Basic personal details" },
              { n: 3, title: "Your intentions", sub: "How you'll use CoWork AI" },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-4">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black transition-all duration-300 ${
                  step > n ? "bg-indigo-500 text-white" :
                  step === n ? "bg-white text-slate-950" :
                  "border border-white/10 text-slate-500"
                }`}>
                  {step > n ? "✓" : n}
                </div>
                <div>
                  <div className={`text-sm font-bold ${step >= n ? "text-white" : "text-slate-500"}`}>{title}</div>
                  <div className="text-xs text-slate-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <p className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-200">
              Free forever
            </p>
            <p className="text-sm leading-7 text-slate-400">
              No credit card required. Bring your own API keys and start building with your AI team today.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col p-7 sm:p-10">

          {/* Mobile logo */}
          <div className="mb-6 md:hidden">
            <a href="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
                <span className="text-base font-black">C</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight">
                CoWork<span className="text-violet-300">AI</span>
              </span>
            </a>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-xs text-slate-500">{Math.round(progressPct)}% complete</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black tracking-tight">Create your account</h2>
              <p className="mb-6 mt-1 text-sm text-slate-400">Free forever. No credit card required.</p>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Full Name <span className="text-red-400">*</span></span>
                  <input
                    type="text" autoFocus placeholder="Your full name"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                    value={form.name} onChange={(e) => set("name", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Email Address <span className="text-red-400">*</span></span>
                  <input
                    type="email" placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                    value={form.email} onChange={(e) => set("email", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Password <span className="text-red-400">*</span></span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-16 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                      value={form.password} onChange={(e) => set("password", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white">
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          form.password.length >= i * 3
                            ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-yellow-500" : i <= 3 ? "bg-blue-500" : "bg-green-500"
                            : "bg-white/10"
                        }`} />
                      ))}
                      <span className="ml-2 text-xs text-slate-500">
                        {form.password.length < 4 ? "Weak" : form.password.length < 7 ? "Fair" : form.password.length < 10 ? "Good" : "Strong"}
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black tracking-tight">About you</h2>
              <p className="mb-6 mt-1 text-sm text-slate-400">Help us personalise your experience.</p>
              <div className="space-y-4">

                {/* DOB */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">
                    Date of Birth <span className="text-red-400">*</span>
                  </span>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:dark]"
                    value={form.dob} onChange={(e) => set("dob", e.target.value)}
                  />
                  {computedAge !== null && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Age: <span className="font-semibold text-indigo-300">{computedAge} years old</span>
                    </p>
                  )}
                </label>

                {/* Gender */}
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Gender <span className="text-red-400">*</span></span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                      { label: "Prefer not to say", value: "prefer_not_to_say" },
                    ].map((g) => (
                      <button
                        key={g.value} type="button"
                        onClick={() => set("gender", g.value)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                          form.gender === g.value
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                            : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </label>

                {/* Country dropdown with search */}
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Country <span className="text-red-400">*</span></span>
                  <SearchableDropdown
                    value={form.country}
                    onChange={(val) => set("country", val)}
                    placeholder="Select your country"
                    options={countryOptions}
                    renderOption={(opt) => (
                      <span className="flex items-center justify-between w-full">
                        <span>{opt.label}</span>
                        <span className="text-xs text-slate-500">{opt.sublabel}</span>
                      </span>
                    )}
                  />
                </div>

                {/* Phone with dial code */}
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Mobile Number <span className="text-red-400">*</span></span>
                  <div className="flex gap-2">
                    {/* Dial code dropdown */}
                    <div className="w-32 flex-shrink-0">
                      <SearchableDropdown
                        value={form.dialCode + "|" + (COUNTRIES.find(c => c.dial === form.dialCode)?.code || "")}
                        onChange={(val) => set("dialCode", val.split("|")[0])}
                        placeholder="+91"
                        options={dialOptions}
                        renderSelected={(val) => val.split("|")[0]}
                        renderOption={(opt) => (
                          <span className="flex items-center justify-between w-full">
                            <span className="font-mono">{opt.label}</span>
                            <span className="text-xs text-slate-500 truncate ml-2">{opt.sublabel}</span>
                          </span>
                        )}
                      />
                    </div>
                    {/* Number input — digits only, max 10 */}
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                      value={form.mobileNumber}
                      onChange={(e) => {
                        // only digits and spaces
                        const cleaned = e.target.value.replace(/[^\d\s]/g, "").slice(0, 10);
                        set("mobileNumber", cleaned);
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{form.mobileNumber.replace(/\s/g, "").length}/10 digits</p>
                </div>

              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Your intentions</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400">Optional</span>
              </div>
              <p className="mb-6 mt-1 text-sm text-slate-400">Help us tailor your AI workspace. You can skip this.</p>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Occupation</span>
                  <input
                    type="text" placeholder="e.g. Software Engineer, Designer..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                    value={form.occupation} onChange={(e) => set("occupation", e.target.value)}
                  />
                </label>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-300">What best describes you?</span>
                  <div className="flex flex-wrap gap-2">
                    {describesYouOptions.map((opt) => (
                      <button
                        key={opt} type="button"
                        onClick={() => set("describesYou", form.describesYou === opt ? "" : opt)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          form.describesYou === opt
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300"
                            : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">What's your main intention?</span>
                    {form.intentions.length > 0 && (
                      <span className="text-xs font-semibold text-indigo-300">{form.intentions.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {intentionOptions.map((opt) => {
                      const selected = form.intentions.includes(opt);
                      return (
                        <button
                          key={opt} type="button"
                          onClick={() => toggleIntention(opt)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                              : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {selected && <span className="mr-1">✓</span>}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Select all that apply</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">Describe your use case</span>
                  <textarea
                    placeholder="e.g. I want to build an AI-powered customer support tool for my startup..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10"
                    value={form.useCase} onChange={(e) => set("useCase", e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-7 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep((s) => s - 1); setError(""); }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                ← Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button" onClick={handleNext}
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
              >
                Continue →
              </button>
            ) : (
              <div className="flex flex-1 flex-col gap-2">
                <button
                  type="button" onClick={handleSubmit} disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
                {!loading && (
                  <button
                    type="button" onClick={handleSubmit}
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-xs font-semibold text-slate-400 transition hover:text-white"
                  >
                    Skip & create account
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <a href="/auth/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}