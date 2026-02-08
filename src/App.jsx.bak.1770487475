import React, { useMemo, useState } from "react";
import Success from "./Success.jsx";
export default function ResellerLandingPage() { const [salons, setSalons] = useState(10); const [pricePerSalon, setPricePerSalon] = useState(249); const [tier, setTier] = useState("growth");

const tiers = useMemo( () => ({ starter: { name: "Starter", price: 297, locations: 3, tagline: "For testing and first clients", bullets: [ "Up to 3 client locations", "White-label dashboard", "Hosting included", "Email support", ], }, growth: { name: "Growth", price: 997, locations: 20, tagline: "Best for real recurring income", bullets: [ "Up to 20 client locations", "Custom domain + branding", "Priority support", "ROI reporting dashboards", ], featured: true, }, unlimited: { name: "Unlimited", price: 1997, locations: "Unlimited", tagline: "For agencies scaling hard", bullets: [ "Unlimited client locations", "API access", "Dedicated infrastructure", "Priority support", ], }, }), [] );

const selected = tiers[tier]; const resellerRevenue = salons * pricePerSalon; const resellerProfit = resellerRevenue - selected.price;
const API_BASE = "http://127.0.0.1:8787";

async function startCheckout(tier) {
  const email = window.prompt("Email to receive your login link:");
  if (!email) return;

  const orgName = window.prompt("Agency/brand name (optional):") || "";

  const r = await fetch(`${API_BASE}/api/checkout/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, email, orgName }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) return alert(`Checkout failed: ${data.error || r.status}`);
  if (data.url) window.location.assign(data.url);
  else alert("Checkout failed: missing Stripe URL");
}
if (window.location.pathname === "/success") return <Success />;return ( <div className="min-h-screen bg-slate-950 text-white"> {/* Top bar */} <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur"> <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"> <div className="flex items-center gap-3"> <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400" /> <div className="leading-tight"> <div className="text-sm font-semibold tracking-wide"> Revenue Recovery Engine </div> <div className="text-xs text-white/60">Reseller Program</div> </div> </div>

<div className="hidden items-center gap-6 md:flex">
        <a className="text-sm text-white/70 hover:text-white" href="#how">
          How it works
        </a>
        <a className="text-sm text-white/70 hover:text-white" href="#features">
          Features
        </a>
        <a className="text-sm text-white/70 hover:text-white" href="#pricing">
          Pricing
        </a>
        <a className="text-sm text-white/70 hover:text-white" href="#faq">
          FAQ
        </a>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="#pricing"
          className="hidden rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/30 hover:text-white md:inline-flex"
        >
          View pricing
        </a>
        <a
          href="#apply"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white/90"
        >
          Become a reseller
        </a>
      </div>
    </div>
  </header>

  {/* Hero */}
  <section className="relative overflow-hidden">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="absolute top-24 right-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-180px] left-[-140px] h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
    </div>

    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 md:grid-cols-12 md:py-20">
      <div className="relative md:col-span-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          White-label + multi-tenant • hosted on your infra
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">
          Sell automated revenue recovery.
          <span className="block bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
            Keep the profit every month.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/75">
          Agencies and consultants use this engine to recover missed revenue
          for salons, barbers, tattoo studios, and service businesses — with
          reminders, instant rebooking, and waitlist autofill running 24/7.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#apply"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 hover:bg-white/90"
          >
            Start reselling
          </a>
          <a
            href="#calculator"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white hover:border-white/30"
          >
            See profit calculator
          </a>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl">
          {[{ k: "15–40%", v: "Typical revenue leakage" }, { k: "24/7", v: "Autonomous recovery" }, { k: "< 24h", v: "Go-live time" }].map(
            (s) => (
              <div
                key={s.k}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="text-2xl font-bold">{s.k}</div>
                <div className="mt-1 text-sm text-white/70">{s.v}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right card */}
      <div className="relative md:col-span-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white/70">Typical reseller</div>
              <div className="mt-1 text-xl font-semibold">10 locations</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/30 via-indigo-500/30 to-cyan-400/30 px-3 py-2 text-xs text-white/80">
              ROI-focused
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {["Automated reminders (no-shows)", "Missed-call followups + booking redirector", "Instant rebooking (cancellations)", "Waitlist autofill (gaps)", "Broadcast slot-claim alerts (SMS/email list)", "ROI reporting (proof)"]
              .map((x) => (
                <div key={x} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <div className="text-sm text-white/80">{x}</div>
                </div>
              ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Example economics</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold">$2,490</div>
                <div className="text-xs text-white/60">
                  10 locations × $249/mo
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-emerald-300">$1,493</div>
                <div className="text-xs text-white/60">profit after Growth tier</div>
              </div>
            </div>
          </div>

          <a
            href="#pricing"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white/90"
          >
            View tiers & start
          </a>

          <div className="mt-3 text-center text-xs text-white/55">
            No paid APIs required • Runs on a single VPS • Multi-tenant ready
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Social proof / credibility */}
  <section className="border-y border-white/10 bg-slate-950">
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[{
          t: "What you sell",
          d: "A background engine that recovers lost revenue — measurable in dollars."
        }, {
          t: "Who it’s for",
          d: "Salons, barbers, tattoo studios, nail salons, pet grooming, services."
        }, {
          t: "Why it closes",
          d: "It pays for itself quickly: fewer no-shows, refilled gaps, faster rebooking."
        }].map((c) => (
          <div key={c.t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">{c.t}</div>
            <div className="mt-2 text-sm text-white/70">{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* How it works */}
  <section id="how" className="mx-auto max-w-6xl px-5 py-16">
    <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
      <div className="md:col-span-5">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-4 text-white/75">
          You resell the engine as your own service. We provide the
          infrastructure, multi-tenant hosting, and core automation.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Your offer to salons</div>
          <div className="mt-2 text-sm text-white/70">
            “We install an automated recovery system that reduces no-shows,
            refills cancellations, and increases rebooking — for a simple
            monthly fee.”
          </div>
        </div>
      </div>

      <div className="md:col-span-7">
        <div className="grid gap-4">
          {[{
            n: "01",
            t: "Add a client location",
            d: "Enter business details, hours, services, staff, and contact channels."
          }, {
            n: "02",
            t: "Recovery automations go live",
            d: "Reminders, rebooking, waitlist fill, and ROI tracking begin immediately."
          }, {
            n: "03",
            t: "Show ROI and retain",
            d: "Dashboards report recovered revenue — making the monthly fee easy to justify."
          }].map((s) => (
            <div key={s.n} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/4 p-6">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">Step {s.n}</div>
                <div className="h-8 w-8 rounded-2xl bg-white/10" />
              </div>
              <div className="mt-3 text-lg font-semibold">{s.t}</div>
              <div className="mt-2 text-sm text-white/70">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* Features */}
  <section id="features" className="bg-white/5 border-y border-white/10">
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">What’s included</h2>
          <p className="mt-3 max-w-2xl text-white/75">
            This is a recovery engine, not a generic CRM. It targets the
            biggest revenue leaks and fixes them automatically.
          </p>
        </div>
        <div className="text-sm text-white/60">
          Modular by design • Easy to add expansions
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[{ 
          t: "Smart reminders",
          d: "Reduce no-shows with timed confirmations and last-minute prompts."
        }, {
          t: "Missed-call followups",
          d: "When calls are missed, clients get an immediate text/email with a booking link or call-back option."
        }, {
          t: "Booking redirector",
          d: "After-hours or busy-line callers are routed to self-booking, waitlist, or instant quote flows."
        }, {
          t: "Instant rebooking",
          d: "When a cancellation happens, clients get rebook links immediately."
        }, {
          t: "Waitlist autofill",
          d: "Open slots trigger offers to the waitlist to refill gaps fast."
        }, {
          t: "Broadcast slot-claim alerts",
          d: "Send SMS/email blasts to a client list so they can claim cancelled slots first-come-first-served."
        }, {
          t: "ROI tracking",
          d: "Recovered revenue is measured and reported — your retention engine."
        }, {
          t: "Multi-tenant + white-label",
          d: "Each reseller and location is isolated with org-level scoping."
        }, {
          t: "Zero required paid services",
          d: "Email-first messaging with optional SMS upgrades later."
        }]
        .map((f) => (
          <div key={f.t} className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <div className="text-lg font-semibold">{f.t}</div>
            <div className="mt-2 text-sm text-white/70">{f.d}</div>
            <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-300" />
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* Profit calculator */}
  <section id="calculator" className="mx-auto max-w-6xl px-5 py-16">
    <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
      <div className="md:col-span-5">
        <h2 className="text-3xl font-bold tracking-tight">Profit calculator</h2>
        <p className="mt-4 text-white/75">
          You charge salons monthly. You pay us for the platform. The
          difference is your recurring profit.
        </p>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/70">Select your tier</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(tiers).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTier(key)}
                className={`rounded-2xl px-3 py-2 text-sm font-semibold border ${
                  tier === key
                    ? "border-white bg-white text-slate-950"
                    : "border-white/15 bg-slate-950/30 text-white/80 hover:border-white/30"
                }`}
                type="button"
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Number of client locations</span>
                <span className="font-semibold text-white">{salons}</span>
              </div>
              <input
                className="mt-2 w-full"
                type="range"
                min={1}
                max={50}
                value={salons}
                onChange={(e) => setSalons(parseInt(e.target.value, 10))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>What you charge per location (monthly)</span>
                <span className="font-semibold text-white">${pricePerSalon}</span>
              </div>
              <input
                className="mt-2 w-full"
                type="range"
                min={99}
                max={599}
                step={10}
                value={pricePerSalon}
                onChange={(e) => setPricePerSalon(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Your monthly revenue</div>
              <div className="text-lg font-bold">${resellerRevenue.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Platform cost</div>
              <div className="text-lg font-bold">${selected.price.toLocaleString()}</div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">Your profit</div>
              <div className={`text-xl font-extrabold ${resellerProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                ${resellerProfit.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/55">
            Note: This is reseller profit (you → us). Your clients also gain
            recovered revenue, making retention easier.
          </div>
        </div>
      </div>

      <div className="md:col-span-7">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-7">
          <div className="text-sm text-white/70">Why salons keep paying</div>
          <h3 className="mt-2 text-2xl font-bold">Recovered revenue is provable.</h3>
          <p className="mt-3 text-white/75">
            The engine tracks recovered bookings and shows monthly impact.
            That turns your service from “marketing” into “financial.”
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[{
              t: "No-show reduction",
              d: "Timed confirmations + reminders"
            }, {
              t: "Gap refill",
              d: "Waitlist offers fill cancellations"
            }, {
              t: "Rebooking",
              d: "Auto follow-ups after missed visits"
            }, {
              t: "Speed",
              d: "Always-on response layer"
            }].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-slate-950/30 p-5">
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="mt-1 text-sm text-white/70">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-5">
            <div className="text-sm text-white/70">Simple pitch</div>
            <div className="mt-2 text-sm text-white/80">
              “We install an autonomous recovery engine that reduces no-shows,
              refills cancellations, and increases rebooking. You pay a flat
              monthly fee; the engine recovers the cost and more.”
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Pricing */}
  <section id="pricing" className="bg-white/5 border-y border-white/10">
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Reseller pricing</h2>
        <p className="mt-3 text-white/75">
          Choose a tier based on how many client locations you want to manage.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {Object.entries(tiers).map(([key, t]) => (
          <div
            key={key}
            className={`relative rounded-3xl border bg-slate-950/40 p-7 ${
              t.featured
                ? "border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]"
                : "border-white/10"
            }`}
          >
            {t.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">
                Most chosen
              </div>
            )}

            <div className="text-lg font-semibold">{t.name}</div>
            <div className="mt-1 text-sm text-white/60">{t.tagline}</div>

            <div className="mt-5 flex items-baseline gap-2">
              <div className="text-4xl font-extrabold">${t.price}</div>
              <div className="text-sm text-white/60">/month</div>
            </div>

            <div className="mt-2 text-sm text-white/70">
              Includes <span className="font-semibold text-white">{t.locations}</span>{" "}
              locations
            </div>

            <ul className="mt-6 space-y-2 text-sm text-white/75">
              {t.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <button
  type="button"
  onClick={() => startCheckout(key)}
  className={
    "mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold " +
    (t.featured
      ? "bg-white text-slate-950 hover:bg-white/90"
      : "border border-white/15 bg-white/5 text-white hover:border-white/30")
  }
>
  Get started
</button>

            <div className="mt-4 text-xs text-white/55">
              Cancel anytime. White-label rights while active.
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* FAQ */}
  <section id="faq" className="mx-auto max-w-6xl px-5 py-16">
    <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
      <div className="md:col-span-4">
        <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
        <p className="mt-4 text-white/75">
          The program is designed to be simple: resell, onboard clients,
          show ROI.
        </p>
      </div>
      <div className="md:col-span-8">
        <div className="space-y-4">
          {[{
            q: "Do you handle missed-call followups and booking redirects?",
            a: "Yes. When a call is missed, the engine can trigger immediate follow-up (text/email) and route the client to self-booking or a callback flow so missed calls convert into bookings."
          }, {
            q: "Do you support SMS/email blast notifications for cancellations?",
            a: "Yes. When a slot opens, you can notify a client list (numbers and/or emails). Recipients get a claim link; the first to confirm gets the time slot."
          }, {
            q: "Do I need paid SMS providers?",
            a: "No. The engine is email-first by default. SMS can be added via a provider as an optional upgrade."
          }, {
            q: "How fast can a salon go live?",
            a: "Typically within 24 hours once business details are added."
          }, {
            q: "Can I use my branding and domain?",
            a: "Yes. Growth and Unlimited tiers support custom domains and full white-label branding."
          }, {
            q: "What makes this easy to sell?",
            a: "It targets measurable losses (no-shows, cancellations, missed rebooking, missed calls) and reports recovered revenue."
          }]
          .map((f) => (
            <div key={f.q} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-base font-semibold">{f.q}</div>
              <div className="mt-2 text-sm text-white/70">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>

  {/* Final CTA */}
  <section id="apply" className="relative overflow-hidden border-t border-white/10">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-[-140px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-[-120px] bottom-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
    </div>
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 md:p-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
          <div className="md:col-span-8">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ready to resell revenue recovery?
            </h2>
            <p className="mt-3 text-white/75">
              Start with Growth and close your first 3–10 locations fast.
              We’ll add your branding and keep the engine running.
            </p>
          </div>
          <div className="md:col-span-4">
            <a
              href="#pricing"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 hover:bg-white/90"
            >
              Choose a tier
            </a>
            <div className="mt-3 text-center text-xs text-white/60">
              Next step: connect checkout → auto-create reseller accounts
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-cyan-400" />
          <div className="text-sm font-semibold">Revenue Recovery Engine</div>
        </div>
        <div className="text-xs text-white/50">
          © {new Date().getFullYear()} • White-label reseller program
        </div>
      </footer>
    </div>
  </section>
</div>

); }
