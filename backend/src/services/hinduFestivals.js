// src/services/hinduFestivals.js
// Kalnirnay-style Hindu festival dates for 2025-2030
// theme_name values must match FESTIVAL_THEME_OPTIONS in themes.js:
//   Festival themes : ganpati | diwali | navratri | pitru-paksha | shravan
//   Preset themes   : saffron-divine | royal-temple | nature-spiritual |
//                     calm-blue-devotion | mystic-purple | elegant-dark |
//                     festive-bright | minimal-light

const FESTIVALS = {
  2025: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2025-01-14', end_date: '2025-01-14', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2025-02-26', end_date: '2025-02-26', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2025-03-13', end_date: '2025-03-14', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2025-03-30', end_date: '2025-03-30', is_active: true },
    { festival_name: 'रामनवमी',        theme_name: 'saffron-divine',  start_date: '2025-04-06', end_date: '2025-04-06', is_active: true },
    { festival_name: 'अक्षय तृतीया',  theme_name: 'saffron-divine',  start_date: '2025-04-30', end_date: '2025-04-30', is_active: true },
    { festival_name: 'गुरू पौर्णिमा',  theme_name: 'saffron-divine',  start_date: '2025-07-10', end_date: '2025-07-10', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2025-07-10', end_date: '2025-08-08', is_active: true },
    { festival_name: 'रक्षाबंधन',      theme_name: 'saffron-divine',  start_date: '2025-08-09', end_date: '2025-08-09', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2025-08-27', end_date: '2025-09-07', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2025-09-08', end_date: '2025-09-22', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2025-09-23', end_date: '2025-10-01', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2025-10-02', end_date: '2025-10-02', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2025-10-20', end_date: '2025-10-24', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2025-11-05', end_date: '2025-11-05', is_active: true },
    { festival_name: 'गीता जयंती',     theme_name: 'saffron-divine',  start_date: '2025-12-01', end_date: '2025-12-01', is_active: true },
  ],

  2026: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2026-01-14', end_date: '2026-01-14', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2026-02-17', end_date: '2026-02-17', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2026-03-02', end_date: '2026-03-03', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2026-03-19', end_date: '2026-03-19', is_active: true },
    { festival_name: 'रामनवमी',        theme_name: 'saffron-divine',  start_date: '2026-03-27', end_date: '2026-03-27', is_active: true },
    { festival_name: 'अक्षय तृतीया',  theme_name: 'saffron-divine',  start_date: '2026-04-19', end_date: '2026-04-19', is_active: true },
    { festival_name: 'गुरू पौर्णिमा',  theme_name: 'saffron-divine',  start_date: '2026-07-11', end_date: '2026-07-11', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2026-07-29', end_date: '2026-08-27', is_active: true },
    { festival_name: 'रक्षाबंधन',      theme_name: 'saffron-divine',  start_date: '2026-08-28', end_date: '2026-08-28', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2026-09-14', end_date: '2026-09-24', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2026-09-25', end_date: '2026-10-09', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2026-10-10', end_date: '2026-10-18', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2026-10-19', end_date: '2026-10-19', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2026-11-08', end_date: '2026-11-12', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2026-11-24', end_date: '2026-11-24', is_active: true },
    { festival_name: 'गीता जयंती',     theme_name: 'saffron-divine',  start_date: '2026-12-20', end_date: '2026-12-20', is_active: true },
  ],

  2027: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2027-01-14', end_date: '2027-01-14', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2027-03-08', end_date: '2027-03-08', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2027-03-21', end_date: '2027-03-22', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2027-04-07', end_date: '2027-04-07', is_active: true },
    { festival_name: 'रामनवमी',        theme_name: 'saffron-divine',  start_date: '2027-04-15', end_date: '2027-04-15', is_active: true },
    { festival_name: 'अक्षय तृतीया',  theme_name: 'saffron-divine',  start_date: '2027-05-08', end_date: '2027-05-08', is_active: true },
    { festival_name: 'गुरू पौर्णिमा',  theme_name: 'saffron-divine',  start_date: '2027-07-30', end_date: '2027-07-30', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2027-08-18', end_date: '2027-09-15', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2027-09-03', end_date: '2027-09-13', is_active: true },
    { festival_name: 'रक्षाबंधन',      theme_name: 'saffron-divine',  start_date: '2027-09-16', end_date: '2027-09-16', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2027-09-17', end_date: '2027-10-01', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2027-10-02', end_date: '2027-10-10', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2027-10-11', end_date: '2027-10-11', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2027-10-29', end_date: '2027-11-02', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2027-11-14', end_date: '2027-11-14', is_active: true },
  ],

  2028: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2028-01-15', end_date: '2028-01-15', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2028-02-26', end_date: '2028-02-26', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2028-03-10', end_date: '2028-03-11', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2028-03-26', end_date: '2028-03-26', is_active: true },
    { festival_name: 'रामनवमी',        theme_name: 'saffron-divine',  start_date: '2028-04-04', end_date: '2028-04-04', is_active: true },
    { festival_name: 'अक्षय तृतीया',  theme_name: 'saffron-divine',  start_date: '2028-04-27', end_date: '2028-04-27', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2028-08-07', end_date: '2028-09-05', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2028-09-23', end_date: '2028-10-03', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2028-10-04', end_date: '2028-10-18', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2028-10-19', end_date: '2028-10-27', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2028-10-28', end_date: '2028-10-28', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2028-11-16', end_date: '2028-11-20', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2028-12-02', end_date: '2028-12-02', is_active: true },
  ],

  2029: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2029-01-14', end_date: '2029-01-14', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2029-02-14', end_date: '2029-02-14', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2029-03-01', end_date: '2029-03-02', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2029-03-16', end_date: '2029-03-16', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2029-07-26', end_date: '2029-08-24', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2029-09-11', end_date: '2029-09-22', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2029-09-23', end_date: '2029-10-07', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2029-10-08', end_date: '2029-10-16', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2029-10-17', end_date: '2029-10-17', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2029-11-05', end_date: '2029-11-09', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2029-11-21', end_date: '2029-11-21', is_active: true },
  ],

  2030: [
    { festival_name: 'मकर संक्रांती',  theme_name: 'saffron-divine', start_date: '2030-01-14', end_date: '2030-01-14', is_active: true },
    { festival_name: 'महाशिवरात्री',   theme_name: 'royal-temple',   start_date: '2030-03-05', end_date: '2030-03-05', is_active: true },
    { festival_name: 'होळी',           theme_name: 'festive-bright',  start_date: '2030-03-19', end_date: '2030-03-20', is_active: true },
    { festival_name: 'गुढी पाडवा',     theme_name: 'festive-bright',  start_date: '2030-04-04', end_date: '2030-04-04', is_active: true },
    { festival_name: 'श्रावण मास',     theme_name: 'shravan',         start_date: '2030-08-14', end_date: '2030-09-12', is_active: true },
    { festival_name: 'गणेश चतुर्थी',  theme_name: 'ganpati',         start_date: '2030-08-30', end_date: '2030-09-09', is_active: true },
    { festival_name: 'पितृपक्ष',       theme_name: 'pitru-paksha',    start_date: '2030-09-10', end_date: '2030-09-24', is_active: true },
    { festival_name: 'नवरात्री',        theme_name: 'navratri',        start_date: '2030-09-25', end_date: '2030-10-03', is_active: true },
    { festival_name: 'विजयादशमी',      theme_name: 'saffron-divine',  start_date: '2030-10-04', end_date: '2030-10-04', is_active: true },
    { festival_name: 'दिवाळी',         theme_name: 'diwali',          start_date: '2030-10-23', end_date: '2030-10-27', is_active: true },
    { festival_name: 'देव दिवाळी',     theme_name: 'diwali',          start_date: '2030-11-08', end_date: '2030-11-08', is_active: true },
  ],
};

function getFestivalsForYear(year) {
  const y = parseInt(year);
  if (FESTIVALS[y]) return FESTIVALS[y];
  const years = Object.keys(FESTIVALS).map(Number).sort();
  const nearest = years.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);
  return FESTIVALS[nearest] || [];
}

module.exports = { getFestivalsForYear, FESTIVALS };
