// Vercel Serverless Function — Node.js runtime, CommonJS, no npm deps.
// Creates a Stripe Checkout Session (hosted payment page) server-side,
// keeping the secret key off the client entirely.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY missing on server' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { title, amountCents, tomeIds, uid } = body || {};

  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    return res.status(400).json({ error: 'invalid title' });
  }
  if (!Number.isInteger(amountCents) || amountCents < 50 || amountCents > 100000) {
    return res.status(400).json({ error: 'invalid amount' });
  }
  if (!Array.isArray(tomeIds) || tomeIds.length === 0 || tomeIds.some((t) => typeof t !== 'string')) {
    return res.status(400).json({ error: 'invalid tomeIds' });
  }
  if (typeof uid !== 'string' || !/^UMB-[A-Za-z0-9]{1,20}$/.test(uid)) {
    return res.status(400).json({ error: 'invalid uid' });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/?checkout=cancel`);
  params.set('client_reference_id', uid);
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][price_data][product_data][name]', title.slice(0, 120));
  params.set('line_items[0][quantity]', '1');
  params.set('metadata[uid]', uid);
  params.set('metadata[tomeIds]', JSON.stringify(tomeIds).slice(0, 490));

  try {
    const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await stripeResp.json();
    if (!stripeResp.ok) {
      return res.status(502).json({ error: (session.error && session.error.message) || 'Stripe error' });
    }
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: 'Server error creating checkout session' });
  }
};
