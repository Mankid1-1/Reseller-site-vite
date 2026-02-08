import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

process.on("uncaughtException", (e) => console.error("UNCAUGHT:", e && (e.stack || e)));
process.on("unhandledRejection", (e) => console.error("UNHANDLED_REJECTION:", e && (e.stack || e)));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/webhooks/inbound-sms", async (req, res) => {
  try {
    const { from, body } = req.body || {};
    if (!from || !body) return res.status(400).json({ error: "from and body required" });

    const text = String(body).trim().toUpperCase();
    if (text !== "YES") return res.json({ ok: true, ignored: true });

    const client = await pool.connect();
    try {
      await client.query("begin");

      const q1 = `
        select w.id as waitlist_id, w.tenant_id, w.customer_id, w.status
        from waitlist_entries w
        join customers c on c.id = w.customer_id
        where c.phone = $1
        order by w.created_at desc
        limit 1
        for update
      `;
      const r1 = await client.query(q1, [from]);
      if (!r1.rows.length) { await client.query("rollback"); return res.json({ ok: true, no_match: true }); }

      const { waitlist_id, tenant_id, customer_id, status } = r1.rows[0];

      // If waitlist isn\x27t contacted, only block if a future appt already exists.
      if (status !== "contacted") {
        const ex = await client.query(`
          select id, status
          from appointments
          where tenant_id=$1
            and customer_id=$2
            and status in (\x27booked\x27,\x27confirmed\x27)
            and start_ts > now()
          order by start_ts asc
          limit 1
        `, [tenant_id, customer_id]);
        if (ex.rows.length) { await client.query("rollback"); return res.json({ ok:true, already:true, status: ex.rows[0].status, appointment_id: ex.rows[0].id }); }
        await client.query("update waitlist_entries set status=\x27contacted\x27 where id=$1", [waitlist_id]);
      }

      const upd = await client.query(
        "update waitlist_entries set status=\x27booked\x27 where id=$1 and status=\x27contacted\x27",
        [waitlist_id]
      );
      if (upd.rowCount !== 1) { await client.query("rollback"); return res.json({ ok: true, already: true }); }

      const q2 = `
        insert into appointments(tenant_id, customer_id, start_ts, end_ts, status)
        values ($1, $2, now(), now() + interval \x271 hour\x27, \x27booked\x27)
        returning id
      `;
      const r2 = await client.query(q2, [tenant_id, customer_id]);
      const appointment_id = r2.rows[0].id;

      const q3 = `
        insert into revenue_events(tenant_id, type, amount_cents, appointment_id)
        values ($1, 'recovered_booking', 5000, $2)
        on conflict do nothing
      `;
      await client.query(q3, [tenant_id, appointment_id]);

      await client.query(
        "insert into messages(tenant_id, channel, \"to\", body, status) values ($1, \x27sms\x27, $2, \x27Booked. See you soon!\x27, \x27queued\x27)",
        [tenant_id, from]
      );

      await client.query("commit");
      return res.json({ ok: true, appointment_id });
    } catch (e2) {
      try { await client.query("rollback"); } catch {}
      throw e2;
    } finally {
      client.release();
    }
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/roi/summary", async (req, res) => {
  try {
    const tenantId = req.query.tenant_id;
    if (!tenantId) return res.status(400).json({ error: "tenant_id required" });

    const q = `
      with
      recovered_today as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='recovered_booking'
          and created_at >= date_trunc('day', now())
      ),
      recovered_month as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='recovered_booking'
          and created_at >= date_trunc('month', now())
      ),
      prevented_today as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='prevented_no_show'
          and created_at >= date_trunc('day', now())
      ),
      prevented_month as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='prevented_no_show'
          and created_at >= date_trunc('month', now())
      ),
      appts_today as (
        select count(*)::bigint as n
        from appointments
        where tenant_id=$1
          and start_ts >= date_trunc('day', now())
          and start_ts < date_trunc('day', now()) + interval '1 day'
      ),
      appts_month as (
        select count(*)::bigint as n
        from appointments
        where tenant_id=$1
          and start_ts >= date_trunc('month', now())
          and start_ts < date_trunc('month', now()) + interval '1 month'
      )
      select
        (select cents from recovered_today) as recovered_today_cents,
        (select n from recovered_today) as recovered_today_count,
        (select cents from recovered_month) as recovered_month_cents,
        (select n from recovered_month) as recovered_month_count,
        (select cents from prevented_today) as prevented_today_cents,
        (select n from prevented_today) as prevented_today_count,
        (select cents from prevented_month) as prevented_month_cents,
        (select n from prevented_month) as prevented_month_count,
        (select n from appts_today) as appointments_today,
        (select n from appts_month) as appointments_month
    `;

    const { rows } = await pool.query(q, [tenantId]);
    const r = rows[0];

    const subscriptionCents = Number(process.env.SUBSCRIPTION_CENTS || 0);
    const roiMultiple =
      subscriptionCents > 0 ? Number(r.recovered_month_cents) / subscriptionCents : null;
    const roiMultipleRounded = (roiMultiple == null) ? null : Math.round(roiMultiple * 100) / 100;

    return res.json({
      tenant_id: tenantId,
      recovered_today: { cents: Number(r.recovered_today_cents), count: Number(r.recovered_today_count) },
      recovered_month: { cents: Number(r.recovered_month_cents), count: Number(r.recovered_month_count) },
      prevented_no_show_today: { cents: Number(r.prevented_today_cents), count: Number(r.prevented_today_count) },
      prevented_no_show_month: { cents: Number(r.prevented_month_cents), count: Number(r.prevented_month_count) },
      appointments_today: Number(r.appointments_today),
      appointments_month: Number(r.appointments_month),
      roi_multiple: roiMultipleRounded,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/roi/series", async (req, res) => {
  try {
    const tenantId = req.query.tenant_id;
    if (!tenantId) return res.status(400).json({ error: "tenant_id required" });

    const daysRaw = Number(req.query.days || 7);
    const days = Number.isFinite(daysRaw) ? Math.floor(daysRaw) : 7;
    const clampedDays = Math.max(1, Math.min(days, 90));

    const q = `
      with params as (
        select
          $1::uuid as tenant_id,
          $2::int  as days,
          (date_trunc('day', now()) - (($2::int - 1) * interval '1 day'))::timestamptz as start_day,
          date_trunc('day', now())::timestamptz as end_day
      ),
      days as (
        select generate_series(p.start_day, p.end_day, interval '1 day') as day
        from params p
      ),
      ev as (
        select
          date_trunc('day', re.created_at) as day,
          type,
          sum(amount_cents)::bigint as cents,
          count(*)::bigint as n
        from revenue_events re, params p
        where re.tenant_id = p.tenant_id
          and re.created_at >= p.start_day
          and re.created_at <  (p.end_day + interval '1 day')
          and type in ('recovered_booking','prevented_no_show')
        group by 1,2
      ),
      ap as (
        select
          date_trunc('day', a.start_ts) as day,
          count(*)::bigint as n
        from appointments a, params p
        where a.tenant_id = p.tenant_id
          and a.start_ts >= p.start_day
          and a.start_ts <  (p.end_day + interval '1 day')
        group by 1
      )
      select
        to_char(d.day::date, 'YYYY-MM-DD') as day,
        coalesce((select cents from ev where ev.day=d.day and ev.type='recovered_booking'),0)::bigint as recovered_cents,
        coalesce((select n     from ev where ev.day=d.day and ev.type='recovered_booking'),0)::bigint as recovered_count,
        coalesce((select cents from ev where ev.day=d.day and ev.type='prevented_no_show'),0)::bigint as prevented_cents,
        coalesce((select n     from ev where ev.day=d.day and ev.type='prevented_no_show'),0)::bigint as prevented_count,
        coalesce((select n     from ap where ap.day=d.day),0)::bigint as appointments
      from days d
      order by d.day asc
    `;

    const { rows } = await pool.query(q, [tenantId, clampedDays]);

    return res.json({
      tenant_id: tenantId,
      days: clampedDays,
      series: rows.map(r => ({
        day: String(r.day),
        recovered: { cents: Number(r.recovered_cents), count: Number(r.recovered_count) },
        prevented_no_show: { cents: Number(r.prevented_cents), count: Number(r.prevented_count) },
        appointments: Number(r.appointments),
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";

const srv = app.listen(PORT, HOST, () => console.log(`backend listening on ${HOST}:${PORT}`));
srv.on("error", (e) => {
  console.error("LISTEN_ERROR:", e && (e.stack || e));
  process.exit(1);
});
app.get("/api/roi/dashboard", async (req, res) => {
  try {
    const tenantId = req.query.tenant_id;
    if (!tenantId) return res.status(400).json({ error: "tenant_id required" });

    const daysRaw = Number(req.query.days || 30);
    const days = Number.isFinite(daysRaw) ? Math.floor(daysRaw) : 30;
    const clampedDays = Math.max(1, Math.min(days, 90));

    const subscriptionCents = Number(process.env.SUBSCRIPTION_CENTS || 0);

    // summary
    const qSummary = `
      with
      recovered_today as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='recovered_booking'
          and created_at >= date_trunc('day', now())
      ),
      recovered_month as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='recovered_booking'
          and created_at >= date_trunc('month', now())
      ),
      prevented_today as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='prevented_no_show'
          and created_at >= date_trunc('day', now())
      ),
      prevented_month as (
        select coalesce(sum(amount_cents),0)::bigint as cents, count(*)::bigint as n
        from revenue_events
        where tenant_id=$1 and type='prevented_no_show'
          and created_at >= date_trunc('month', now())
      ),
      appts_today as (
        select count(*)::bigint as n
        from appointments
        where tenant_id=$1
          and start_ts >= date_trunc('day', now())
          and start_ts < date_trunc('day', now()) + interval '1 day'
      ),
      appts_month as (
        select count(*)::bigint as n
        from appointments
        where tenant_id=$1
          and start_ts >= date_trunc('month', now())
          and start_ts < date_trunc('month', now()) + interval '1 month'
      )
      select
        (select cents from recovered_today) as recovered_today_cents,
        (select n from recovered_today) as recovered_today_count,
        (select cents from recovered_month) as recovered_month_cents,
        (select n from recovered_month) as recovered_month_count,
        (select cents from prevented_today) as prevented_today_cents,
        (select n from prevented_today) as prevented_today_count,
        (select cents from prevented_month) as prevented_month_cents,
        (select n from prevented_month) as prevented_month_count,
        (select n from appts_today) as appointments_today,
        (select n from appts_month) as appointments_month
    `;

    // series (same as /api/roi/series)
    const qSeries = `
      with params as (
        select
          $1::uuid as tenant_id,
          $2::int  as days,
          (date_trunc('day', now()) - (($2::int - 1) * interval '1 day'))::timestamptz as start_day,
          date_trunc('day', now())::timestamptz as end_day
      ),
      days as (
        select generate_series(p.start_day, p.end_day, interval '1 day') as day
        from params p
      ),
      ev as (
        select
          date_trunc('day', re.created_at) as day,
          re.type,
          sum(re.amount_cents)::bigint as cents,
          count(*)::bigint as n
        from revenue_events re, params p
        where re.tenant_id = p.tenant_id
          and re.created_at >= p.start_day
          and re.created_at <  (p.end_day + interval '1 day')
          and re.type in ('recovered_booking','prevented_no_show')
        group by 1,2
      ),
      ap as (
        select
          date_trunc('day', a.start_ts) as day,
          count(*)::bigint as n
        from appointments a, params p
        where a.tenant_id = p.tenant_id
          and a.start_ts >= p.start_day
          and a.start_ts <  (p.end_day + interval '1 day')
        group by 1
      )
      select
        to_char(d.day::date, 'YYYY-MM-DD') as day,
        coalesce((select cents from ev where ev.day=d.day and ev.type='recovered_booking'),0)::bigint as recovered_cents,
        coalesce((select n     from ev where ev.day=d.day and ev.type='recovered_booking'),0)::bigint as recovered_count,
        coalesce((select cents from ev where ev.day=d.day and ev.type='prevented_no_show'),0)::bigint as prevented_cents,
        coalesce((select n     from ev where ev.day=d.day and ev.type='prevented_no_show'),0)::bigint as prevented_count,
        coalesce((select n     from ap where ap.day=d.day),0)::bigint as appointments
      from days d
      order by d.day asc
    `;

    // drivers (last N days): revenue_events by type + evidence keys
    const qDrivers = `
      with params as (
        select
          $1::uuid as tenant_id,
          (now() - ($2::int * interval '1 day'))::timestamptz as since_ts
      ),
      by_type as (
        select
          re.type,
          count(*)::bigint as n,
          coalesce(sum(re.amount_cents),0)::bigint as cents
        from revenue_events re, params p
        where re.tenant_id=p.tenant_id
          and re.created_at >= p.since_ts
        group by 1
      ),
      evidence_keys as (
        select
          ek.key,
          count(*)::bigint as n
        from revenue_events re
        cross join params p
        cross join lateral jsonb_object_keys(re.evidence) as ek(key)
        where re.tenant_id=p.tenant_id
          and re.created_at >= p.since_ts
          and re.evidence <> '{}'::jsonb
        group by 1
        order by n desc
        limit 20
      )
      select
        (select jsonb_agg(jsonb_build_object('type', type, 'count', n, 'cents', cents) order by cents desc)
         from by_type) as by_type,
        (select jsonb_agg(jsonb_build_object('key', key, 'count', n))
         from evidence_keys) as evidence_keys
    `;

    const [s1, s2, s3] = await Promise.all([
      pool.query(qSummary, [tenantId]),
      pool.query(qSeries, [tenantId, clampedDays]),
      pool.query(qDrivers, [tenantId, clampedDays]),
    ]);

    const r = s1.rows[0];
    const roiMultiple =
      subscriptionCents > 0 ? Number(r.recovered_month_cents) / subscriptionCents : null;
    const roiMultipleRounded =
      roiMultiple == null ? null : Math.round(roiMultiple * 100) / 100;

    return res.json({
      tenant_id: tenantId,
      days: clampedDays,

      summary: {
        recovered_today: { cents: Number(r.recovered_today_cents), count: Number(r.recovered_today_count) },
        recovered_month: { cents: Number(r.recovered_month_cents), count: Number(r.recovered_month_count) },
        prevented_no_show_today: { cents: Number(r.prevented_today_cents), count: Number(r.prevented_today_count) },
        prevented_no_show_month: { cents: Number(r.prevented_month_cents), count: Number(r.prevented_month_count) },
        appointments_today: Number(r.appointments_today),
        appointments_month: Number(r.appointments_month),
        roi_multiple: roiMultipleRounded,
        roi_multiple_raw: roiMultiple,
        subscription_cents: subscriptionCents,
      },

      series: s2.rows.map(x => ({
        day: x.day,
        recovered: { cents: Number(x.recovered_cents), count: Number(x.recovered_count) },
        prevented_no_show: { cents: Number(x.prevented_cents), count: Number(x.prevented_count) },
        appointments: Number(x.appointments),
      })),

      drivers: s3.rows[0] || { by_type: [], evidence_keys: [] },
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});
app.post("/sms/send", async (req, res) => {
  try {
    const { to, body, tenant_id } = req.body || {};
    if (!to || !body) return res.status(400).json({ error: "to and body required" });

    // DEV stub: just log. Replace with Twilio later.
    console.log("[SMS_SEND]", { tenant_id: tenant_id || null, to, body });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});


