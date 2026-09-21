// GET  (public)  -> { configured, catalog }   catalogue publié (réglages, tomes, chapitres, pages)
// PUT  (créateur) -> enregistre le catalogue ; refusé sans jeton valide.

const auth = require('./_lib/auth');
const store = require('./_lib/store');
const { sanitize } = require('./_lib/catalog');

const PATH = 'umbra/site-data.json';

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const r = await store.readJson(PATH);
      res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
      return res.status(200).json({ configured: r.configured, catalog: r.data || null });
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ configured: true, catalog: null, error: 'read-failed' });
    }
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    res.setHeader('Cache-Control', 'no-store');
    if (!(await auth.requireAdmin(req, res))) return;
    if (!store.configured()) return res.status(503).json({ error: 'Stockage non configuré (Vercel Blob manquant)' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
    const v = sanitize(body);
    if (!v.ok) return res.status(400).json({ error: v.error });

    try {
      await store.writeJson(PATH, v.catalog);
      return res.status(200).json({ ok: true, updatedAt: v.catalog.updatedAt });
    } catch (e) {
      return res.status(502).json({ error: 'Écriture impossible : ' + ((e && e.message) || 'erreur stockage') });
    }
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
