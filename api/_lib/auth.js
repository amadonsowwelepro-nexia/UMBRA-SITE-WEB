// Authentification créateur — 100 % côté serveur.
// Le mot de passe vit uniquement dans la variable d'environnement ADMIN_PASSWORD (Vercel).
// Après un login réussi, le serveur émet un jeton signé (HMAC-SHA256) valable 7 jours.
// « Verrouiller » révoque côté serveur TOUS les jetons émis avant cet instant (voir revokeAll).
// Changer ADMIN_PASSWORD invalide automatiquement tous les jetons existants.

const crypto = require('crypto');
const store = require('./store');

const STATE_PATH = 'umbra/admin-state.json';

const SESSION_HOURS = 24 * 7;
const MIN_PASSWORD_LENGTH = 10;

const failures = new Map(); // ip -> { count, first } (meilleur effort, par instance serverless)
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 6;

function sessionKey() {
  return crypto.createHmac('sha256', 'umbra-admin-session-v1').update(process.env.ADMIN_PASSWORD || '').digest();
}

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64u(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function passwordStatus() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return { ok: false, error: 'Accès créateur non configuré (ADMIN_PASSWORD manquant sur le serveur)' };
  if (pw.length < MIN_PASSWORD_LENGTH) return { ok: false, error: 'ADMIN_PASSWORD trop court côté serveur (' + MIN_PASSWORD_LENGTH + ' caractères minimum)' };
  return { ok: true };
}

function issueToken() {
  const iat = Date.now();
  const exp = iat + SESSION_HOURS * 3600 * 1000;
  const payload = b64u(JSON.stringify({ iat: iat, exp: exp, n: crypto.randomBytes(8).toString('hex') }));
  const sig = b64u(crypto.createHmac('sha256', sessionKey()).update(payload).digest());
  return { token: payload + '.' + sig, expiresAt: exp };
}

// Vérifie signature + expiration. Renvoie les données du jeton, ou null.
function parseToken(token) {
  if (!passwordStatus().ok || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', sessionKey()).update(parts[0]).digest();
  let given;
  try { given = fromB64u(parts[1]); } catch (e) { return null; }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let data;
  try { data = JSON.parse(fromB64u(parts[0]).toString('utf8')); } catch (e) { return null; }
  if (!data || typeof data.exp !== 'number' || data.exp <= Date.now()) return null;
  return data;
}

// Un jeton émis avant la dernière révocation (« Verrouiller ») n'est plus valable.
async function isRevoked(data) {
  if (!store.configured()) return false;
  try {
    const r = await store.readJson(STATE_PATH);
    const before = r.data && typeof r.data.revokedBefore === 'number' ? r.data.revokedBefore : 0;
    return (data.iat || 0) < before;
  } catch (e) {
    return false;
  }
}

async function verifyToken(token) {
  const data = parseToken(token);
  if (!data) return false;
  return !(await isRevoked(data));
}

async function revokeAll() {
  if (!store.configured()) return false;
  await store.writeJson(STATE_PATH, { revokedBefore: Date.now() });
  return true;
}

function bearer(req) {
  const h = (req.headers && req.headers['authorization']) || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : '';
}

async function requireAdmin(req, res) {
  const st = passwordStatus();
  if (!st.ok) { res.status(503).json({ error: st.error }); return false; }
  if (!(await verifyToken(bearer(req)))) { res.status(401).json({ error: 'Non autorisé' }); return false; }
  return true;
}

function clientIp(req) {
  const xf = (req.headers && req.headers['x-forwarded-for']) || '';
  return (String(xf).split(',')[0] || (req.socket && req.socket.remoteAddress) || 'unknown').trim();
}

function isLockedOut(ip) {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(ip); return false; }
  return f.count >= MAX_FAILURES;
}

function registerFailure(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() });
  else f.count += 1;
}

function clearFailures(ip) { failures.delete(ip); }

module.exports = {
  safeEqual, passwordStatus, issueToken, parseToken, verifyToken, revokeAll, bearer, requireAdmin,
  clientIp, isLockedOut, registerFailure, clearFailures, SESSION_HOURS
};
