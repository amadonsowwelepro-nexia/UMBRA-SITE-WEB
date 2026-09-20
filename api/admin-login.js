// POST { password } -> { token, expiresAt }
// Le mot de passe n'est jamais présent dans le code du site : il est comparé côté serveur
// à la variable d'environnement ADMIN_PASSWORD.

const auth = require('./_lib/auth');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const st = auth.passwordStatus();
  if (!st.ok) return res.status(503).json({ error: st.error });

  const ip = auth.clientIp(req);
  if (auth.isLockedOut(ip)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const password = body && typeof body.password === 'string' ? body.password : '';

  if (!password || !auth.safeEqual(password, process.env.ADMIN_PASSWORD)) {
    auth.registerFailure(ip);
    await sleep(800);
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  auth.clearFailures(ip);
  const t = auth.issueToken();
  return res.status(200).json({ token: t.token, expiresAt: t.expiresAt });
};
