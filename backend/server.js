import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import pg from "pg";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
const app = express();
const PORT = Number(process.env.PORT || 8787);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

app.use(cors({
  origin: process.env.APP_URL,
  credentials: true
}));
app.use(cookieParser());

// Use JSON for normal routes, but NOT for Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook/stripe") return next();
  return express.json()(req, res, next);
});

function priceForTier(tier) {
  if (tier === "starter") return process.env.PRICE_STARTER;
  if (tier === "growth") return process.env.PRICE_GROWTH;
  if (tier === "unlimited") return process.env.PRICE_UNLIMITED;
  return null;
}

function signSessionJwt({ userId, orgId, jwtId }) {
  return jwt.sign(
    { sub: String(userId), orgId, jti: jwtId },
    process.env.JWT_SECRET,
    { expiresIn: `${process.env.JWT_EXPIRES_DAYS || 14}d` }
  );
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "not_authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const s = await pool.query(
      `SELECT revoked_at FROM sessions WHERE jwt_id=$1`,
      [payload.jti]
    );

    if (s.rowCount === 0 || s.rows[0].revoked_at)
      return res.status(401).json({ error: "session_invalid" });

    req.auth = { userId: Number(payload.sub), orgId: payload.orgId, jwtId: payload.jti };
    next();
  } catch {
    return res.status(401).json({ error: "invalid_session" });
  }
}
app.get("/health", (_, res) => res.json({ ok: true }));

// Create Stripe checkout session
app.post("/api/checkout/create-session", async (req, res) => {
  try {
    const { tier, email, orgName } = req.body || {};
    if (!tier || !email) return res.status(400).json({ error: "tier+email required" });

    const priceId = priceForTier(tier);
    if (!priceId) return res.status(400).json({ error: "invalid tier" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/?canceled=1`,
      metadata: { tier, orgName: orgName || "" },
      subscription_data: { metadata: { tier, orgName: orgName || "" } },
    });

    return res.json({ url: session.url });
  } catch (e) {
  console.error("create-session error:", e?.message || e);
  return res.status(500).json({ error: e?.message || "create_session_failed" });
}
});

// Stripe webhook placeholder (we’ll complete provisioning after this runs)
app.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // For now: just acknowledge
  console.log("Stripe event:", event.type);
  return res.json({ received: true });
});
app.post("/api/provision/from-session", async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (!session) return res.status(404).json({ error: "session not found" });
    if (session.mode !== "subscription") return res.status(400).json({ error: "not subscription" });
    if (session.payment_status !== "paid") return res.status(402).json({ error: "not paid" });

    const email = session.customer_details?.email || session.customer_email;
    if (!email) return res.status(400).json({ error: "missing email" });

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    const existingSub = await pool.query(
      `SELECT org_id FROM subscriptions WHERE stripe_subscription_id=$1`,
      [subscriptionId]
    );

    if (existingSub.rowCount > 0) {
      return res.json({
        ok: true,
        alreadyProvisioned: true,
        loginUrl: `${process.env.APP_URL}/?logged=1`,
      });
    }

    const sub =
      typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] })
        : session.subscription;

    const priceId = sub.items.data[0].price.id;
    const status = sub.status;
    const periodEnd = sub.current_period_end;

    const orgName =
      (session.metadata?.orgName || "").trim() ||
      email.split("@")[0];

    const org = await pool.query(
      `INSERT INTO orgs (name) VALUES ($1) RETURNING id`,
      [orgName]
    );
    const orgId = org.rows[0].id;

    const user = await pool.query(
      `INSERT INTO users (org_id, email, role)
       VALUES ($1, $2, 'owner') RETURNING id`,
      [orgId, email]
    );

    if (customerId) {
      await pool.query(
        `INSERT INTO stripe_customers (org_id, stripe_customer_id)
         VALUES ($1, $2)`,
        [orgId, customerId]
      );
    }

    await pool.query(
  `INSERT INTO subscriptions
   (org_id, stripe_subscription_id, stripe_price_id, status, current_period_end)
   VALUES ($1, $2, $3, $4, to_timestamp($5))
   ON CONFLICT (stripe_subscription_id)
   DO UPDATE SET
     stripe_price_id = EXCLUDED.stripe_price_id,
     status = EXCLUDED.status,
     current_period_end = EXCLUDED.current_period_end`,
  [orgId, subscriptionId, priceId, status, periodEnd]
);

    // Create one-time login token
const rawLoginToken = crypto.randomBytes(32).toString("hex");

await pool.query(
  `INSERT INTO auth_login_tokens (user_id, token_hash, expires_at)
   VALUES ($1, $2, NOW() + interval '30 minutes')`,
  [userId, sha256(rawLoginToken)]
);

return res.json({ ok: true, loginToken: rawLoginToken });
} catch (e) {
    console.error("provision error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "provision_failed" });
  }
});

app.listen(PORT, () => {
  console.log(`backend listening on :${PORT}`);
});
