// GET (public) -> { configured, fund: { total, count, donations[] } }
// Total de la cagnotte, alimenté uniquement par des paiements Stripe confirmés.

const { readPublicFund } = require('./_lib/fund');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const r = await readPublicFund();
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return res.status(200).json(r);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ configured: true, fund: { total: 0, count: 0, donations: [] }, error: 'read-failed' });
  }
};
