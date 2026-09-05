// Vercel Serverless Function — Stripe webhook receiver.
// Safety net: even if the buyer closes the tab before returning to the
// success page, this durably records the purchase (in Vercel KV, if linked)
// so it can be restored later via /api/check-purchases.
//
// Signature is verified manually (HMAC-SHA256) — no Stripe SDK needed.

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send('STRIPE_WEBHOOK_SECRET missing on server');
  }

  const rawBody = await getRawBody(req);
  const sigHeader = req.headers['stripe-signature'];

  let valid = false;
  try { valid = verifyStripeSignature(rawBody, sigHeader, webhookSecret); } catch (e) { valid = false; }
  if (!valid) return res.status(400).send('Invalid signature');

  let event;
  try { event = JSON.parse(rawBody); } catch (e) { return res.status(400).send('Invalid payload'); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      const uid = (session.metadata && session.metadata.uid) || session.client_reference_id;
      let tomeIds = [];
      try { tomeIds = JSON.parse((session.metadata && session.metadata.tomeIds) || '[]'); } catch (e) {}
      if (uid && tomeIds.length) {
        await recordPurchase(uid, tomeIds).catch(() => {});
      }
    }
  }

  return res.status(200).json({ received: true });
};

module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false;
  const parts = {};
  sigHeader.split(',').forEach((p) => {
    const idx = p.indexOf('=');
    if (idx > 0) parts[p.slice(0, idx)] = p.slice(idx + 1);
  });
  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(parts.v1, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function recordPurchase(uid, tomeIds) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return; // KV not linked yet — safe no-op, nothing to persist server-side.
  const key = `purchases:${uid}`;
  await Promise.all(
    tomeIds.map((tomeId) =>
      fetch(`${kvUrl}/sadd/${encodeURIComponent(key)}/${encodeURIComponent(tomeId)}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      })
    )
  );
}
