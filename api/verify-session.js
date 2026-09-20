// Vercel Serverless Function — confirme qu'une session Checkout a réellement été payée
// avant que le site ne débloque quoi que ce soit (ou n'ajoute un don à la cagnotte).

const { recordDonation } = require('./_lib/fund');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY missing on server' });
  }

  const sessionId = req.query.session_id;
  if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'invalid session_id' });
  }

  try {
    const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const session = await stripeResp.json();
    if (!stripeResp.ok) {
      return res.status(502).json({ error: (session.error && session.error.message) || 'Stripe error' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false });
    }

    const meta = session.metadata || {};
    const kind = meta.kind === 'donation' ? 'donation' : 'purchase';

    if (kind === 'donation') {
      try {
        await recordDonation({ sessionId: session.id, amountCents: session.amount_total, handle: meta.handle });
      } catch (e) { /* le webhook prendra le relais */ }
      return res.status(200).json({ paid: true, kind: 'donation', amountTotal: session.amount_total });
    }

    let tomeIds = [];
    try { tomeIds = JSON.parse(meta.tomeIds || '[]'); } catch (e) {}
    return res.status(200).json({
      paid: true,
      kind: 'purchase',
      tomeIds,
      uid: meta.uid || session.client_reference_id || null,
      amountTotal: session.amount_total,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error verifying session' });
  }
};
