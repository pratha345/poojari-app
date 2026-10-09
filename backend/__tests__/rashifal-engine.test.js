// Rashifal is built from real gochar: check the facts it rests on, not the wording.
const engine = require('../src/services/rashifalEngine');
const g = require('../src/services/gocharService');

describe('gochar facts', () => {
  it('Makar Sankranti 2026 within 2 minutes of the published 14 Jan 15:13 IST', () => {
    const x = g.ingresses('Sun', new Date('2026-01-14T00:00:00+05:30'), new Date('2026-01-15T00:00:00+05:30'))[0];
    expect(g.RASHIS[x.to]).toBe('मकर');
    expect(Math.abs(x.at - new Date('2026-01-14T15:13:00+05:30'))).toBeLessThan(2 * 60000);
  });

  it('Guru enters Simha on 31 Oct 2026 and Shani enters Mesha on 3 Jun 2027', () => {
    const guru = g.ingresses('Jupiter', new Date('2026-10-01T00:00:00Z'), new Date('2026-11-30T00:00:00Z'));
    expect(guru.map((x) => [g.RASHIS[x.to], x.at.toISOString().slice(0, 10)])).toEqual([['सिंह', '2026-10-31']]);
    const shani = g.ingresses('Saturn', new Date('2027-05-01T00:00:00Z'), new Date('2027-07-01T00:00:00Z'));
    expect(shani.map((x) => [g.RASHIS[x.to], new Date(x.at.getTime() + 19800000).toISOString().slice(0, 10)])).toEqual([['मेष', '2027-06-03']]);
  });

  it('houses count from the Moon sign and sade sati covers 12th, 1st, 2nd', () => {
    expect(g.houseFrom(0, 0)).toBe(1);
    expect(g.houseFrom(0, 11)).toBe(12);
    expect(g.shaniStatus(0, 11)).toMatch('साडेसाती');
    expect(g.shaniStatus(1, 11)).toBe('');
    expect(g.shaniStatus(3, 10)).toMatch('अष्टम'); // Karka, Shani in Kumbha = 8th
  });
});

describe('rashifal engine', () => {
  const d = engine.daily(0, '2026-10-14');

  it('daily result is grounded in the Moon position and flags chandrashtama', () => {
    // 14 Oct 2026: Moon in Vrishchika = 8th from Mesha
    expect(d.chandrashtama).toBe(true);
    expect(d.score).toBeLessThanOrEqual(3);
    expect(d.general).toMatch('वृश्चिक');
    expect(d.basis).toHaveLength(9);
  });

  it('every phala table has 12 houses', () => {
    for (const k of Object.keys(engine.PHALA)) expect(engine.PHALA[k]).toHaveLength(12);
  });

  it('weekly has 7 days, monthly lists every planet, yearly covers Guru and Shani', () => {
    expect(engine.weekly(4, '2026-10-09').days).toHaveLength(7);
    const m = engine.monthly(4, '2026-10-09');
    expect(m.planets).toHaveLength(8);
    expect(m.goodDays.length + m.chandrashtamaDays.length).toBeLessThanOrEqual(31);
    const y = engine.yearly(4, 2026);
    expect(y.planets.map((p) => p.planet)).toEqual(['गुरू', 'शनी', 'राहू', 'केतू']);
    expect(y.events.some((e) => e.planet === 'गुरू' && e.to === 'सिंह')).toBe(true);
  });
});
