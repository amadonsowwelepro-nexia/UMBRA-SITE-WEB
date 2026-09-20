// Cagnotte "soutien créateur" — total public alimenté uniquement par des paiements Stripe confirmés.
// L'enregistrement est idempotent (par identifiant de session Stripe) : le webhook et la page de
// retour peuvent tous deux l'appeler sans jamais compter un don deux fois.

const { configured, readJson, writeJson } = require('./store');

const FUND_PATH = 'umbra/fund.json';

function cleanHandle(h) {
  const s = typeof h === 'string' ? h.replace(/[^A-Za-z0-9_@.\- ]/g, '').trim().slice(0, 40) : '';
  return s || 'Anonyme';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function recordDonation(opts) {
  if (!configured()) return { recorded: false, reason: 'not-configured' };
  for (let attempt = 0; attempt < 10; attempt++) {
    if (attempt > 0) await sleep(30 + Math.random() * 120);
    const r = await readJson(FUND_PATH);
    const fund = r.data || { total: 0, count: 0, donations: [], seen: [] };
    if (fund.seen.indexOf(opts.sessionId) >= 0) return { recorded: false, reason: 'duplicate' };
    const amount = Math.round(opts.amountCents) / 100;
    fund.total = Math.round((fund.total + amount) * 100) / 100;
    fund.count += 1;
    fund.donations.unshift({ author: cleanHandle(opts.handle), amount: amount, at: new Date().toISOString() });
    fund.donations = fund.donations.slice(0, 50);
    fund.seen.unshift(opts.sessionId);
    fund.seen = fund.seen.slice(0, 300);
    try {
      await writeJson(FUND_PATH, fund, r.etag ? { ifMatch: r.etag } : {});
      return { recorded: true };
    } catch (e) {
      if (e && e.name === 'BlobPreconditionFailedError') continue;
      throw e;
    }
  }
  return { recorded: false, reason: 'conflict' };
}

async function readPublicFund() {
  const r = await readJson(FUND_PATH);
  const f = r.data || { total: 0, count: 0, donations: [] };
  return { configured: r.configured, fund: { total: f.total, count: f.count, donations: f.donations } };
}

module.exports = { recordDonation, readPublicFund, cleanHandle };
