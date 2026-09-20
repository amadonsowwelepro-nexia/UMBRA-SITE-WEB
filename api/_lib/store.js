// Petite couche au-dessus de Vercel Blob (fichiers + documents JSON).
// Le store Blob doit être créé en mode "Public" dans le dashboard Vercel.

const blob = require('@vercel/blob');

function configured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function readJson(pathname) {
  if (!configured()) return { configured: false, data: null, etag: null };
  try {
    const r = await blob.get(pathname, { access: 'public', useCache: false });
    if (!r || r.statusCode !== 200) return { configured: true, data: null, etag: null };
    const text = await new Response(r.stream).text();
    return { configured: true, data: JSON.parse(text), etag: r.blob.etag || null };
  } catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not found/i.test(e.message || ''))) {
      return { configured: true, data: null, etag: null };
    }
    throw e;
  }
}

function writeJson(pathname, obj, extra) {
  return blob.put(pathname, JSON.stringify(obj), Object.assign({
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60
  }, extra || {}));
}

function putFile(pathname, buffer, contentType) {
  return blob.put(pathname, buffer, {
    access: 'public',
    contentType: contentType,
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000
  });
}

module.exports = { configured, readJson, writeJson, putFile };
