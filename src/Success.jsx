import React, { useEffect, useState } from "react";

export default function Success() {
  const [msg, setMsg] = useState("Finalizing your account...");

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      setMsg("Missing session ID.");
      return;
    }

    (async () => {
      try {
        const r = await fetch("http://127.0.0.1:8787/api/provision/from-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const text = await r.text();
let data = {};
try { data = JSON.parse(text); } catch {}

if (r.ok && data.ok && data.loginUrl) {
  setMsg("Account created. Redirecting...");
  setTimeout(() => (window.location.href = data.loginUrl),
 800);
} else {
  setMsg(`Provisioning failed: HTTP ${r.status} :: ${data.error 
|| text || "unknown"}`);
}
      } catch (err) {
        setMsg("Network error while creating account.");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h2>{msg}</h2>
    </div>
  );
}
