import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function fmtMoney(cents) {
  const n = Number(cents || 0) / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function fmtInt(n) {
  return Number(n || 0).toLocaleString();
}

export default function RoiDashboard() {
  const [tenantId, setTenantId] = useState(() => localStorage.getItem("tenant_id") || "");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const qs = useMemo(() => {
    const t = encodeURIComponent(tenantId || "");
    const d = encodeURIComponent(String(days));
    return `tenant_id=${t}&days=${d}`;
  }, [tenantId, days]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      if (!tenantId) throw new Error("tenant_id is required");
      localStorage.setItem("tenant_id", tenantId);

      const r = await fetch(`${API_BASE}/api/roi/dashboard?${qs}`, {
        headers: { "cache-control": "no-cache" },
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j);
    } catch (e) {
      setErr(String(e?.message || e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tenantId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary;
  const series = data?.series || [];

  return (
<>
<button
  onClick={() => (window.location.href = "/")}
  style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff" }}
>
  ← Back to home
</button>

    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>ROI Dashboard</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>tenant_id</label>
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="uuid"
            style={{ padding: "8px 10px", width: 360, border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>days</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
          >
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: loading ? "#f5f5f5" : "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>

        {err ? <div style={{ color: "#b00020", fontSize: 12 }}>Error: {err}</div> : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginTop: 16 }}>
        <Card title="Recovered Today" big={fmtMoney(summary?.recovered_today?.cents)} small={`${fmtInt(summary?.recovered_today?.count)} bookings`} />
        <Card title="Recovered Month" big={fmtMoney(summary?.recovered_month?.cents)} small={`${fmtInt(summary?.recovered_month?.count)} bookings`} />
        <Card title="Prevented No-Show Today" big={fmtMoney(summary?.prevented_no_show_today?.cents)} small={`${fmtInt(summary?.prevented_no_show_today?.count)} saves`} />
        <Card title="Prevented No-Show Month" big={fmtMoney(summary?.prevented_no_show_month?.cents)} small={`${fmtInt(summary?.prevented_no_show_month?.count)} saves`} />
        <Card
          title="ROI Multiple (Month)"
          big={summary?.roi_multiple == null ? "—" : `${Number(summary.roi_multiple).toFixed(2)}x`}
          small={`Subscription: ${fmtMoney(summary?.subscription_cents || 0)}`}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "10px 0" }}>Daily series</h3>
        <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <Th>Day</Th>
                <Th align="right">Recovered</Th>
                <Th align="right">Recovered Count</Th>
                <Th align="right">Prevented</Th>
                <Th align="right">Prevented Count</Th>
                <Th align="right">Appointments</Th>
              </tr>
            </thead>
            <tbody>
              {series.map((r) => (
                <tr key={r.day} style={{ borderTop: "1px solid #eee" }}>
                  <Td>{r.day}</Td>
                  <Td align="right">{fmtMoney(r.recovered?.cents)}</Td>
                  <Td align="right">{fmtInt(r.recovered?.count)}</Td>
                  <Td align="right">{fmtMoney(r.prevented_no_show?.cents)}</Td>
                  <Td align="right">{fmtInt(r.prevented_no_show?.count)}</Td>
                  <Td align="right">{fmtInt(r.appointments)}</Td>
                </tr>
              ))}
              {!series.length ? (
                <tr>
                  <Td colSpan={6} style={{ padding: 14, opacity: 0.7 }}>
                    No data
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
  );
}

function Card({ title, big, small }) {
  return (
    <>
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "white" }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{big}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{small}</div>
    </div>
  </>
  );
}
function Th({ children, align }) {
  return <th style={{ textAlign: align || "left", padding: "10px 12px", fontSize: 12, opacity: 0.8 }}>{children}</th>;
}
function Td({ children, align, colSpan, style }) {
  return <td colSpan={colSpan} style={{ textAlign: align || "left", padding: "10px 12px", fontSize: 13, ...style }}>{children}</td>;
}
