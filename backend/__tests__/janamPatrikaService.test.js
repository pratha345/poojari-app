'use strict';
const { generateJanamPatrika } = require('../src/services/janamPatrikaService');

const gen = (dob, tob, lat = 18.52, lon = 73.86) =>
  generateJanamPatrika({ name: 't', dob, tob, place: 'x', lat, lon }).panchang;

describe('janamPatrikaService panchang', () => {
  // Reference: verified Hindu-calendar kundali, Amravati 1 May 2001 22:10
  test('matches reference kundali for Amravati 2001-05-01 22:10', () => {
    const r = generateJanamPatrika({ name: 't', dob: '2001-05-01', tob: '22:10', place: 'Amravati', lat: 20.93, lon: 77.75 });
    expect(r.panchang).toMatchObject({
      vara: 'मंगळवार', mas: 'वैशाख', shaka: 1923, paksha: 'शुक्ल',
      tithi: 'नवमी (9)', nakshatra: 'मघा (1. चरण)', rashi: 'सिंह',
      yoga: 'वृद्धि', karana: 'कौलव',
    });
    expect(r.panchang.lagna).toMatch(/^धनु 4°/);
    expect(r.dasha.balance.lord).toBe('केतू');
    expect(r.dasha.balance.years).toBeCloseTo(6.77, 1);
  });

  test('Gudi Padwa starts Chaitra and the new Shaka year', () => {
    expect(gen('2024-04-08', '12:00')).toMatchObject({ mas: 'फाल्गुन', shaka: 1945, tithi: 'अमावस्या (30)' });
    expect(gen('2024-04-09', '12:00')).toMatchObject({ mas: 'चैत्र', shaka: 1946, tithi: 'प्रतिपदा (1)' });
  });

  test('detects adhik maas (Adhik Shravan 2023)', () => {
    expect(gen('2023-07-25', '12:00').mas).toBe('अधिक श्रावण');
    expect(gen('2023-08-20', '12:00').mas).toBe('श्रावण');
  });

  test('vara changes at sunrise, not midnight', () => {
    expect(gen('2024-11-06', '05:00').vara).toBe('मंगळवार');
    expect(gen('2024-11-06', '07:00').vara).toBe('बुधवार');
  });

  test('fixed karanas at month end', () => {
    expect(gen('2024-11-01', '12:00').karana).toBe('नाग');
  });
});

describe('janamPatrikaService birth details', () => {
  test('matches the reference kundali details', () => {
    const r = generateJanamPatrika({ name: 't', dob: '2001-05-01', tob: '22:10', place: 'Amravati', lat: 20.93, lon: 77.75 });
    expect(r.details).toMatchObject({
      naamAkshar: 'मा', nakshatraPad: 'मघा 1 (मा)', sunrise: '05:50',
      dashaBhogya: 'केतू 6 वर्षे 9 महिने 6 दिवस', mangalDosh: true,
      varMasShaka: 'मंगळवार, वैशाख, 1923 शक संवत',
      rashiSwami: 'सूर्य', nakshatraSwami: 'केतू', paya: 'रजत', yoni: 'मूषक',
      gana: 'राक्षस', nadi: 'अन्त्य (कफ)', varna: 'क्षत्रिय',
    });
    expect(r.details.ishtakal).toMatch(/^40:(49|50):/);
  });
});
