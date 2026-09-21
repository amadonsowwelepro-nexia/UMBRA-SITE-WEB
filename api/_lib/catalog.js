// Validation stricte du catalogue (réglages + tomes + chapitres + pages) envoyé par le panneau créateur.
// Tout ce qui n'est pas explicitement autorisé est écarté : seules des images hébergées sur
// Vercel Blob ou dans les dossiers du site (pages/, covers/) sont acceptées.

// Origine de test locale : ignorée sur Vercel (la variable VERCEL y est toujours définie).
const TEST_ORIGIN = !process.env.VERCEL && process.env.UMBRA_TEST_BLOB_ORIGIN
  ? process.env.UMBRA_TEST_BLOB_ORIGIN.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '\\/[^"\\s<>()\\\\]{1,400}'
  : null;
const BLOB_HOST = '(?:https:\\/\\/[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com\\/[^"\\s<>()\\\\]{1,400}' + (TEST_ORIGIN ? '|' + TEST_ORIGIN : '') + ')';
const LOCAL_IMG = '(?:pages|covers)\\/[A-Za-z0-9._\\-\\/]{1,120}';
const IMG_URL_RE = new RegExp('^(?:' + BLOB_HOST + '|' + LOCAL_IMG + ')$');
const COVER_RE = new RegExp('^(?:linear-gradient\\([#0-9a-fA-F,%\\s.()a-z-]{5,200}\\)|url\\("(?:' + BLOB_HOST + '|' + LOCAL_IMG + ')"\\) center\\/cover no-repeat)$');
const AUDIO_URL_RE = new RegExp('^(?:' + BLOB_HOST + '|uploads\\/[^"\\s<>()\\\\]{1,150}\\.(?:mp3|m4a|ogg|wav))$');
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const HTTPS_RE = /^https:\/\/[^\s"'<>]{1,300}$/;
const ADSENSE_RE = /^ca-pub-\d{10,20}$/;

const LIMITS = { tomes: 60, chapters: 300, pages: 500, bytes: 1500000 };
const DEFAULT_COVER = 'linear-gradient(150deg,#2E3C4A,#141A20)';

function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
function music(m, withEnabled) {
  const ok = m && typeof m === 'object' && typeof m.url === 'string' && AUDIO_URL_RE.test(m.url);
  if (!withEnabled && !ok) return null;
  const out = { url: ok ? m.url : '', name: m && typeof m === 'object' ? str(m.name, 80) : '', loop: !!(m && m.loop) };
  if (withEnabled) out.enabled = !(m && typeof m === 'object' && m.enabled === false);
  return out;
}
function num(v, min, max, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function int(v, min, max, fallback) { return Math.round(num(v, min, max, fallback)); }

function sanitize(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Données invalides' };
  const s = input.site && typeof input.site === 'object' ? input.site : {};
  const site = {
    author: str(s.author, 120),
    synopsis: str(s.synopsis, 4000),
    videoUrl: HTTPS_RE.test(str(s.videoUrl, 300)) ? s.videoUrl : '',
    adsense: ADSENSE_RE.test(str(s.adsense, 40)) ? s.adsense : '',
    defaultPageCount: int(s.defaultPageCount, 0, 500, 0),
    packPrice: Math.round(num(s.packPrice, 0, 500, 6.99) * 100) / 100,
    hideAdmin: !!s.hideAdmin,
    music: music(s.music, true),
    twitter: HTTPS_RE.test(str(s.twitter, 300)) ? s.twitter : '',
    tiktok: HTTPS_RE.test(str(s.tiktok, 300)) ? s.tiktok : ''
  };

  if (!Array.isArray(input.tomes)) return { ok: false, error: 'Liste de tomes manquante' };
  if (input.tomes.length > LIMITS.tomes) return { ok: false, error: 'Trop de tomes' };

  const tomeIds = {};
  const tomes = [];
  for (let i = 0; i < input.tomes.length; i++) {
    const t = input.tomes[i];
    if (!t || typeof t !== 'object' || !ID_RE.test(String(t.id))) return { ok: false, error: 'Identifiant de tome invalide' };
    if (tomeIds[t.id]) return { ok: false, error: 'Identifiant de tome en double' };
    tomeIds[t.id] = true;
    if (!Array.isArray(t.chapters) || t.chapters.length < 1 || t.chapters.length > LIMITS.chapters) return { ok: false, error: 'Chapitres invalides pour ' + t.id };

    const chapIds = {};
    const chapters = [];
    for (let j = 0; j < t.chapters.length; j++) {
      const c = t.chapters[j];
      if (!c || typeof c !== 'object' || !ID_RE.test(String(c.id))) return { ok: false, error: 'Identifiant de chapitre invalide' };
      if (chapIds[c.id]) return { ok: false, error: 'Identifiant de chapitre en double' };
      chapIds[c.id] = true;
      const rawPages = Array.isArray(c.pages) ? c.pages.slice(0, LIMITS.pages) : [];
      chapters.push({
        id: c.id,
        num: int(c.num, 1, 9999, j + 1),
        title: str(c.title, 120) || ('Chapitre ' + (j + 1)),
        pages: rawPages.filter(function (p) { return typeof p === 'string' && IMG_URL_RE.test(p); }),
        music: music(c.music, false)
      });
    }

    const price = Math.round(num(t.price, 0, 500, 0) * 100) / 100;
    tomes.push({
      id: t.id,
      num: int(t.num, 1, 9999, i + 1),
      title: str(t.title, 120) || ('Tome ' + (i + 1)),
      price: price,
      paid: !!t.paid,
      released: !!t.released,
      cover: typeof t.cover === 'string' && COVER_RE.test(t.cover) ? t.cover : DEFAULT_COVER,
      chapters: chapters
    });
  }

  const catalog = { version: 1, updatedAt: new Date().toISOString(), site: site, tomes: tomes };
  if (JSON.stringify(catalog).length > LIMITS.bytes) return { ok: false, error: 'Catalogue trop volumineux' };
  return { ok: true, catalog: catalog };
}

module.exports = { sanitize, IMG_URL_RE, COVER_RE };
