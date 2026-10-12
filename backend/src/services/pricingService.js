// src/services/pricingService.js — one place that decides what a pooja costs
//
// Price layers, most specific wins:
//   1. base price      poojas.price             — main catalogue, edited only on the main site
//   2. tenant price    tenant_puja_config        — a franchise's own price, used only on that franchise
//   3. pujari price    pujari_pooja_services     — a pujari's own price, used when the customer picks him
//
// Each tenant has a pricing policy that the super admin controls (tenants.pricing_policy):
//   tenant_pricing  may the franchise set its own prices
//   pujari_pricing  may its pujaris set their own prices
//   min_pct/max_pct allowed range, as % of the price one layer below
//   commission_pct  platform fee taken from each booking
// The main site (tenant 1) never reads tenant prices, so franchises can't change it.

const pool = require('../config/db');

const MAIN_TENANT = 1;
const DEFAULT_POLICY = { tenant_pricing: true, pujari_pricing: true, min_pct: 50, max_pct: 300, commission_pct: 5 };

function cleanPolicy(raw) {
  let p = raw;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = null; } }
  const out = { ...DEFAULT_POLICY, ...(p || {}) };
  out.tenant_pricing = !!out.tenant_pricing;
  out.pujari_pricing = !!out.pujari_pricing;
  out.min_pct = Math.min(100, Math.max(0, Number(out.min_pct) || 0));
  out.max_pct = Math.max(100, Number(out.max_pct) || 100);
  out.commission_pct = Math.min(50, Math.max(0, Number(out.commission_pct) || 0));
  return out;
}

async function getPolicy(tenantId) {
  const [[row]] = await pool.query('SELECT pricing_policy FROM tenants WHERE id = ?', [tenantId || MAIN_TENANT]);
  return cleanPolicy(row?.pricing_policy);
}

// allowed [min, max] for a price that overrides `reference`
function bounds(reference, policy) {
  return {
    min: Math.ceil((reference * policy.min_pct) / 100),
    max: Math.floor((reference * policy.max_pct) / 100),
  };
}

const inRange = (v, b) => v != null && v >= b.min && v <= b.max;

// Tenant a pujari works for: active franchise assignment, else his profile's tenant.
async function pujariTenant(pujariId) {
  const [[row]] = await pool.query(
    `SELECT pp.id, pp.status, COALESCE(tpa.tenant_id, pp.tenant_id, ${MAIN_TENANT}) AS tenant_id
       FROM pujari_profiles pp
       LEFT JOIN tenant_pujari_assignments tpa ON tpa.pujari_id = pp.id AND tpa.is_active = 1
      WHERE pp.id = ?`, [pujariId]);
  return row || null;
}

/**
 * Final price of a pooja for a tenant, optionally with a chosen pujari.
 * Returns { ok, reason?, pooja, base_price, tenant_price, pujari_price, price, samagri_price,
 *           source: 'base'|'tenant'|'pujari', platform_fee, pujari_amount, commission_pct }
 */
async function resolvePrice({ tenantId, poojaId, pujariId = null }) {
  const tid = Number(tenantId) || MAIN_TENANT;
  const [[pooja]] = await pool.query('SELECT * FROM poojas WHERE id = ? AND is_active = TRUE', [poojaId]);
  if (!pooja) return { ok: false, status: 404, reason: 'पूजा सापडली नाही.' };

  const policy = await getPolicy(tid);
  const base = Number(pooja.price);
  let price = base, samagri = Number(pooja.samagri_price || 0), source = 'base';
  let tenantPrice = null, pujariPrice = null;

  // 2. franchise price (never on the main site)
  if (tid !== MAIN_TENANT) {
    const [[cfg]] = await pool.query(
      'SELECT custom_price, custom_samagri_price, is_enabled FROM tenant_puja_config WHERE tenant_id = ? AND pooja_id = ?',
      [tid, poojaId]);
    if (cfg?.is_enabled === 0) return { ok: false, reason: 'ही पूजा या ठिकाणी उपलब्ध नाही.' };
    if (policy.tenant_pricing && cfg?.custom_price != null) {
      const v = Number(cfg.custom_price);
      if (inRange(v, bounds(base, policy))) { price = tenantPrice = v; source = 'tenant'; }
    }
    if (policy.tenant_pricing && cfg?.custom_samagri_price != null) samagri = Number(cfg.custom_samagri_price);
  }

  // 3. chosen pujari
  if (pujariId) {
    const pj = await pujariTenant(pujariId);
    if (!pj || pj.status !== 'approved') return { ok: false, reason: 'निवडलेला पुजारी उपलब्ध नाही.' };
    if (Number(pj.tenant_id) !== tid) return { ok: false, reason: 'हा पुजारी या साइटवर सेवा देत नाही.' };
    const [svc] = await pool.query('SELECT pooja_id, custom_price FROM pujari_pooja_services WHERE pujari_id = ?', [pujariId]);
    if (svc.length) {
      const mine = svc.find((s) => Number(s.pooja_id) === Number(poojaId));
      if (!mine) return { ok: false, reason: 'हा पुजारी ही पूजा करत नाही.' };
      if (policy.pujari_pricing && mine.custom_price != null) {
        const v = Number(mine.custom_price);
        if (inRange(v, bounds(price, policy))) { price = pujariPrice = v; source = 'pujari'; }
      }
    }
    // no service list = the pujari offers every pooja at the site's price
  }

  const platform_fee = Math.round((price * policy.commission_pct) / 100);
  return {
    ok: true, pooja, base_price: base, tenant_price: tenantPrice, pujari_price: pujariPrice,
    price, samagri_price: samagri, source, commission_pct: policy.commission_pct,
    platform_fee, pujari_amount: price - platform_fee,
  };
}

/**
 * Prices of one pooja for many pujaris at once (pujari list on the pooja page).
 * Returns Map pujariId → { offers, price, source }
 */
async function pricesForPujaris({ tenantId, poojaId, pujariIds }) {
  const out = new Map();
  if (!pujariIds.length) return out;
  const site = await resolvePrice({ tenantId, poojaId });
  if (!site.ok) return out;
  const policy = await getPolicy(tenantId);
  const b = bounds(site.price, policy);
  const [svc] = await pool.query(
    'SELECT pujari_id, pooja_id, custom_price FROM pujari_pooja_services WHERE pujari_id IN (?)', [pujariIds]);
  for (const id of pujariIds) {
    const rows = svc.filter((s) => Number(s.pujari_id) === Number(id));
    const mine = rows.find((s) => Number(s.pooja_id) === Number(poojaId));
    if (rows.length && !mine) { out.set(Number(id), { offers: false }); continue; }
    const v = mine?.custom_price != null ? Number(mine.custom_price) : null;
    const usePujari = policy.pujari_pricing && inRange(v, b);
    out.set(Number(id), { offers: true, price: usePujari ? v : site.price, source: usePujari ? 'pujari' : site.source });
  }
  return out;
}

module.exports = { MAIN_TENANT, DEFAULT_POLICY, cleanPolicy, getPolicy, bounds, inRange, pujariTenant, resolvePrice, pricesForPujaris };
