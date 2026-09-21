// Envoi de musiques (jusqu'à 25 Mo) en morceaux, car une requête Vercel ne peut pas dépasser ~4,5 Mo.
//   1) POST ?action=chunk&id=<idEnvoi>&i=<n>            corps = octets bruts du morceau (≤ 4 Mo)
//   2) POST ?action=finish&id=<idEnvoi>&n=<nb>&name=x   le serveur recolle les morceaux, vérifie que
//                                                        c'est bien de l'audio, l'héberge et renvoie { url }
// Réservé au créateur (jeton requis).

const auth = require('./_lib/auth');
const store = require('./_lib/store');

const MAX_CHUNK = 4000000;
const MAX_TOTAL = 25 * 1024 * 1024;
const MAX_PARTS = 8;
const ID_RE = /^[a-z0-9]{8,32}$/;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_CHUNK) { reject(new Error('too-large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function detectAudio(b) {
  if (b.length < 16) return null;
  if (b.slice(0, 3).toString('ascii') === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { type: 'audio/mpeg', ext: 'mp3' };
  if (b.slice(4, 8).toString('ascii') === 'ftyp') return { type: 'audio/mp4', ext: 'm4a' };
  if (b.slice(0, 4).toString('ascii') === 'OggS') return { type: 'audio/ogg', ext: 'ogg' };
  if (b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WAVE') return { type: 'audio/wav', ext: 'wav' };
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!(await auth.requireAdmin(req, res))) return;
  if (!store.configured()) return res.status(503).json({ error: 'Stockage non configuré (Vercel Blob manquant)' });

  const q = req.query || {};
  const id = String(q.id || '');
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Identifiant d\'envoi invalide' });

  if (q.action === 'chunk') {
    const i = parseInt(q.i, 10);
    if (!(i >= 0 && i < MAX_PARTS)) return res.status(400).json({ error: 'Morceau invalide' });
    let buf;
    try { buf = await readBody(req); }
    catch (e) { return res.status(413).json({ error: 'Morceau trop gros' }); }
    if (!buf.length) return res.status(400).json({ error: 'Morceau vide' });
    try {
      await store.putRaw('umbra/tmp/' + id + '/' + i, buf, 'application/octet-stream');
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(502).json({ error: 'Envoi impossible : ' + ((e && e.message) || 'erreur stockage') });
    }
  }

  if (q.action === 'finish') {
    const n = parseInt(q.n, 10);
    if (!(n >= 1 && n <= MAX_PARTS)) return res.status(400).json({ error: 'Nombre de morceaux invalide' });
    const paths = [];
    for (let i = 0; i < n; i++) paths.push('umbra/tmp/' + id + '/' + i);
    try {
      const parts = [];
      let total = 0;
      for (let i = 0; i < n; i++) {
        const b = await store.readBuffer(paths[i]);
        if (!b) return res.status(400).json({ error: 'Morceau ' + (i + 1) + ' manquant — relance l\'envoi' });
        total += b.length;
        if (total > MAX_TOTAL) return res.status(413).json({ error: 'Musique trop lourde (25 Mo max)' });
        parts.push(b);
      }
      const whole = Buffer.concat(parts);
      const kind = detectAudio(whole);
      if (!kind) return res.status(400).json({ error: 'Ce fichier n\'est pas une musique valide (MP3, M4A, OGG ou WAV)' });
      const base = String(q.name || 'musique').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'musique';
      const r = await store.putFile('umbra/audio/' + Date.now().toString(36) + '-' + base + '.' + kind.ext, whole, kind.type);
      await store.del(paths);
      return res.status(200).json({ url: r.url, bytes: whole.length });
    } catch (e) {
      return res.status(502).json({ error: 'Assemblage impossible : ' + ((e && e.message) || 'erreur stockage') });
    }
  }

  return res.status(400).json({ error: 'Action inconnue' });
};

module.exports.config = { api: { bodyParser: false } };
