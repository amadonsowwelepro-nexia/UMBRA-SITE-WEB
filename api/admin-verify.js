// GET (Authorization: Bearer <jeton>) -> { ok: true, storage: boolean }
// Sert au site à confirmer qu'une session créateur enregistrée est encore valable.

const auth = require('./_lib/auth');
const store = require('./_lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!auth.requireAdmin(req, res)) return;
  return res.status(200).json({ ok: true, storage: store.configured() });
};
