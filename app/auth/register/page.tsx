"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {useEffect } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
const [age, setAge] = useState("");
const [dob, setDob] = useState("");
const [gender, setGender] = useState("");
const [mobileNumber, setMobileNumber] = useState("");
const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
  fetch("/api/auth/me")
    .then((res) => {
      if (res.ok) router.replace("/dashboard");
    })
    .finally(() => setChecking(false));
}, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name,
  email,
  password,
  age: age ? Number(age) : null,
  dob: dob || null,
  gender: gender || null,
  mobileNumber: mobileNumber || null,
  country: country || null,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("token", data.token);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-4 border p-6 rounded-xl"
      >
        <h1 className="text-2xl font-bold">Register</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
<input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" type="number" />
<input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />
<select value={gender} onChange={(e) => setGender(e.target.value)}>
  <option value="">Gender</option>
  <option value="female">Female</option>
  <option value="male">Male</option>
  <option value="prefer_not_to_say">Prefer not to say</option>
</select>
<input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Mobile number" />
<input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm">
          Already have an account?{" "}
          <a href="/auth/login" className="underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}