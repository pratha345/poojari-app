'use strict';
jest.mock('../src/utils/redis', () => ({ getCache: async () => null, setCache: async () => {} }));
const { getSeasonContext, seasonOrderSql } = require('../src/services/blogSeasonService');

const names = async d => (await getSeasonContext(d)).seasons.map(s => s.name);

describe('blogSeasonService', () => {
  test('Pitrupaksha 2026: ongoing on Sep 28, upcoming while Ganeshotsav still runs', async () => {
    expect((await names('2026-09-28'))[0]).toBe('पितृपक्ष');
    const sep24 = await getSeasonContext('2026-09-24');
    expect(sep24.seasons[0].name).toBe('गणेशोत्सव');
    expect(sep24.seasons.find(s => s.name === 'पितृपक्ष').daysAway).toBe(2);
  });

  test('works for the next five years without a hand-kept calendar', async () => {
    expect(await names('2027-09-25')).toContain('पितृपक्ष');
    expect(await names('2028-10-05')).toContain('दिवाळी');
    expect(await names('2029-09-10')).toContain('गणेशोत्सव');
    expect(await names('2030-10-20')).toContain('दिवाळी');
    expect(await names('2031-01-12')).toContain('मकर संक्रांती');
  }, 60000);

  test('ongoing festival outranks upcoming, then current month', async () => {
    const ctx = await getSeasonContext('2026-09-28');
    const so = seasonOrderSql(ctx);
    const weights = so.params.filter((_, i) => i % 2 === 1);
    expect(weights[0]).toBe(1000);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    expect(weights[weights.length - 1]).toBe(100);   // भाद्रपद month keyword
  });
});
