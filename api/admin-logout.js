// POST (créateur) -> ferme TOUTES les sessions créateur, sur tous les appareils.
// Tout jeton émis avant cet instant devient invalide côté serveur, même s'il a été copié.

const auth = require('./_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await auth.requireAdmin(req, res))) return;
  try {
    const revoked = await auth.revokeAll();
    return res.status(200).json({ ok: true, revoked: revoked });
  } catch (e) {
    return res.status(502).json({ error: 'Révocation impossible : ' + ((e && e.message) || 'erreur stockage') });
  }
};
