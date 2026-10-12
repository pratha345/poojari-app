// Pricing layers: main price → franchise price → pujari price, under the super admin's policy.
// The database is faked so no real rows are touched.
const mockDb = {
  poojas: { 10: { id: 10, name_mr: 'सत्यनारायण पूजा', price: 2000, samagri_price: 500, is_active: 1 } },
  tenants: { 1: null, 2: null, 3: JSON.stringify({ tenant_pricing: false, pujari_pricing: false }) },
  tenantCfg: { '2:10': { custom_price: 2500, custom_samagri_price: 600, is_enabled: 1 },
               '3:10': { custom_price: 2500, custom_samagri_price: null, is_enabled: 1 },
               '4:10': { custom_price: 9999, custom_samagri_price: null, is_enabled: 1 } },
  pujaris: { 7: { id: 7, status: 'approved', tenant_id: 2 },   // franchise 2
             8: { id: 8, status: 'approved', tenant_id: 1 },   // main site
             9: { id: 9, status: 'approved', tenant_id: 2 } }, // franchise 2, no price list
  services: [{ pujari_id: 7, pooja_id: 10, custom_price: 3000 }, { pujari_id: 8, pooja_id: 99, custom_price: null }],
};

jest.mock('../src/config/db', () => ({
  query: jest.fn(async (sql, params = []) => {
    if (sql.includes('FROM poojas WHERE id')) return [[mockDb.poojas[params[0]]].filter(Boolean)];
    if (sql.includes('pricing_policy FROM tenants')) return [[{ pricing_policy: mockDb.tenants[params[0]] ?? null }]];
    if (sql.includes('FROM tenant_puja_config')) return [[mockDb.tenantCfg[`${params[0]}:${params[1]}`]].filter(Boolean)];
    if (sql.includes('FROM pujari_profiles pp')) return [[mockDb.pujaris[params[0]]].filter(Boolean)];
    if (sql.includes('FROM pujari_pooja_services WHERE pujari_id IN')) {
      const ids = params[0].map(Number);
      return [mockDb.services.filter((s) => ids.includes(s.pujari_id))];
    }
    if (sql.includes('FROM pujari_pooja_services WHERE pujari_id')) return [mockDb.services.filter((s) => s.pujari_id === Number(params[0]))];
    throw new Error('unexpected query: ' + sql);
  }),
}));

const { resolvePrice, pricesForPujaris } = require('../src/services/pricingService');

describe('pricing layers', () => {
  it('main site uses the main price and ignores any franchise price', async () => {
    const r = await resolvePrice({ tenantId: 1, poojaId: 10 });
    expect(r).toMatchObject({ ok: true, price: 2000, source: 'base', platform_fee: 100 });
  });

  it('franchise uses its own price only on its own site', async () => {
    const r = await resolvePrice({ tenantId: 2, poojaId: 10 });
    expect(r).toMatchObject({ ok: true, price: 2500, samagri_price: 600, source: 'tenant' });
  });

  it('a chosen pujari with his own price wins on his site', async () => {
    const r = await resolvePrice({ tenantId: 2, poojaId: 10, pujariId: 7 });
    expect(r).toMatchObject({ ok: true, price: 3000, source: 'pujari', platform_fee: 150, pujari_amount: 2850 });
  });

  it('a pujari without a price list charges the site price', async () => {
    const r = await resolvePrice({ tenantId: 2, poojaId: 10, pujariId: 9 });
    expect(r).toMatchObject({ ok: true, price: 2500, source: 'tenant' });
  });

  it("another site's pujari cannot be booked here", async () => {
    const r = await resolvePrice({ tenantId: 1, poojaId: 10, pujariId: 7 });
    expect(r.ok).toBe(false);
  });

  it('a pujari who lists other poojas does not do this one', async () => {
    const r = await resolvePrice({ tenantId: 1, poojaId: 10, pujariId: 8 });
    expect(r).toMatchObject({ ok: false, reason: 'हा पुजारी ही पूजा करत नाही.' });
  });

  it('super admin switching pricing off falls back to the main price', async () => {
    const r = await resolvePrice({ tenantId: 3, poojaId: 10 });
    expect(r).toMatchObject({ ok: true, price: 2000, source: 'base' });
  });

  it('a franchise price outside the allowed range is ignored', async () => {
    const r = await resolvePrice({ tenantId: 4, poojaId: 10 }); // 9999 > 300% of 2000
    expect(r).toMatchObject({ ok: true, price: 2000, source: 'base' });
  });

  it('pujari list shows each pujari price and hides those who do not offer the pooja', async () => {
    const m = await pricesForPujaris({ tenantId: 2, poojaId: 10, pujariIds: [7, 9] });
    expect(m.get(7)).toEqual({ offers: true, price: 3000, source: 'pujari' });
    expect(m.get(9)).toEqual({ offers: true, price: 2500, source: 'tenant' });
    const main = await pricesForPujaris({ tenantId: 1, poojaId: 10, pujariIds: [8] });
    expect(main.get(8)).toEqual({ offers: false });
  });
});
