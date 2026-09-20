// Vercel Serverless Function — Node.js runtime, CommonJS.
// Crée une session Stripe Checkout (page de paiement hébergée par Stripe) côté serveur :
// la clé secrète ne touche jamais le navigateur.
//   - achat de tome(s) : { title, amountCents, tomeIds[], uid }
//   - don à la cagnotte : { kind: 'donation', title, amountCents, uid, handle }

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
  const { title, amountCents, tomeIds, uid, kind, handle } = body || {};
  const isDonation = kind === 'donation';

  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    return res.status(400).json({ error: 'invalid title' });
  }
  const minCents = isDonation ? 100 : 50;
  const maxCents = isDonation ? 50000 : 100000;
  if (!Number.isInteger(amountCents) || amountCents < minCents || amountCents > maxCents) {
    return res.status(400).json({ error: 'invalid amount' });
  }
  if (!isDonation && (!Array.isArray(tomeIds) || tomeIds.length === 0 || tomeIds.some((t) => typeof t !== 'string'))) {
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
  params.set('metadata[kind]', isDonation ? 'donation' : 'purchase');
  if (isDonation) {
    const cleanHandle = typeof handle === 'string' ? handle.replace(/[^A-Za-z0-9_@.\- ]/g, '').trim().slice(0, 40) : '';
    params.set('metadata[handle]', cleanHandle || 'Anonyme');
    params.set('metadata[tomeIds]', '[]');
  } else {
    params.set('metadata[tomeIds]', JSON.stringify(tomeIds).slice(0, 490));
  }

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
