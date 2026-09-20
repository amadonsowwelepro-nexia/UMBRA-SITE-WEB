// POST ?kind=cover|page&name=fichier.jpg  (corps = image binaire, jeton créateur requis)
// -> { url }  URL publique de l'image hébergée sur Vercel Blob.
// Le navigateur redimensionne/compresse avant l'envoi (limite de corps Vercel : 4,5 Mo).

const auth = require('./_lib/auth');
const store = require('./_lib/store');

const MAX_BYTES = 4200000;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) { reject(new Error('too-large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function looksLikeImage(buf, type) {
  if (buf.length < 16) return false;
  if (type === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (type === 'image/webp') return buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!auth.requireAdmin(req, res)) return;
  if (!store.configured()) return res.status(503).json({ error: 'Stockage non configuré (Vercel Blob manquant)' });

  const kind = req.query && req.query.kind === 'cover' ? 'cover' : 'page';
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!TYPES[type]) return res.status(415).json({ error: 'Format non supporté (JPEG, PNG ou WebP)' });

  let buf;
  try { buf = await readBody(req); }
  catch (e) { return res.status(413).json({ error: 'Image trop lourde (4 Mo max après compression)' }); }
  if (!looksLikeImage(buf, type)) return res.status(400).json({ error: 'Fichier image invalide' });

  const base = String((req.query && req.query.name) || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
  const pathname = 'umbra/' + kind + '/' + Date.now().toString(36) + '-' + base + '.' + TYPES[type];

  try {
    const r = await store.putFile(pathname, buf, type);
    return res.status(200).json({ url: r.url });
  } catch (e) {
    return res.status(502).json({ error: 'Envoi impossible : ' + ((e && e.message) || 'erreur stockage') });
  }
};

module.exports.config = { api: { bodyParser: false } };
