"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function acceptInvite() {
      const stored = localStorage.getItem("token");
      if (!stored) {
        localStorage.setItem("redirectAfterLogin", `/invites/${token}`);
        router.push("/auth/login");
        return;
      }
      try {
        const res = await fetch(`/api/invites/${token}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${stored}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to accept invite");
        setStatus("success");
        setTimeout(() => router.push(`/project/${data.projectId}`), 1500);
      } catch (err: any) {
        setError(err.message);
        setStatus("error");
      }
    }
    if (token) acceptInvite();
  }, [token]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#07071e", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        {status === "loading" && <p style={{ color: "#9292b8" }}>Joining project...</p>}
        {status === "success" && <p style={{ color: "#34d399" }}>✓ Joined! Redirecting...</p>}
        {status === "error" && <p style={{ color: "#f87171" }}>✗ {error}</p>}
      </div>
    </div>
  );
}