// Vercel Serverless Function — reads back the durable purchase record
// written by the webhook. Not required for the main unlock flow (which
// uses /api/verify-session on return from Stripe), but useful later for
// a "restore my purchases" feature if the visitor clears localStorage.

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = req.query.uid;
  if (typeof uid !== 'string' || !/^UMB-[A-Za-z0-9]{1,20}$/.test(uid)) {
    return res.status(400).json({ error: 'invalid uid' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return res.status(200).json({ tomeIds: [], kvLinked: false });
  }

  try {
    const key = `purchases:${uid}`;
    const resp = await fetch(`${kvUrl}/smembers/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    const data = await resp.json();
    return res.status(200).json({ tomeIds: data.result || [], kvLinked: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error reading purchases' });
  }
};
