// Festival days and amanta months for 2026 (Pune), checked against published Maharashtra calendars.
// Covers: कृष्ण पक्ष numbering (16–30), Diwali in अमांत आश्विन, timed festivals (प्रदोष / मध्यान्ह /
// अपराह्ण / निशीथ / अरुणोदय), क्षय tithis kept on the day they begin, and the अधिक month name.
const { getPanchang } = require('../src/services/panchangService');

const PUNE = [18.5204, 73.8567];
const names = async (date) => (await getPanchang(date, ...PUNE, 330, null)).festivals.map(f => f.name).join(' | ');
const maas = async (date) => (await getPanchang(date, ...PUNE, 330, null)).maas;

describe('2026 festival days (Pune)', () => {
  test.each([
    ['2026-01-14', 'मकर संक्रांती'],
    ['2026-02-15', 'महाशिवरात्री'],
    ['2026-03-19', 'गुढी पाडवा'],          // प्रतिपदा is क्षय: kept the day it begins
    ['2026-03-26', 'रामनवमी'],
    ['2026-09-04', 'कृष्ण जन्माष्टमी'],     // अष्टमी misses both midnights: day of sunrise अष्टमी
    ['2026-09-14', 'गणेश चतुर्थी'],
    ['2026-10-20', 'दसरा'],                // दशमी at अपराह्ण (sunrise tithi is still नवमी)
    ['2026-10-25', 'कोजागिरी पौर्णिमा'],
    ['2026-11-06', 'धनत्रयोदशी'],
    ['2026-11-08', 'नरक चतुर्दशी'],
    ['2026-11-08', 'लक्ष्मीपूजन'],
    ['2026-11-10', 'बलिप्रतिपदा'],
    ['2026-11-11', 'भाऊबीज'],
  ])('%s has %s', async (date, festival) => {
    expect(await names(date)).toContain(festival);
  });

  test('Diwali is not shown a month late (कार्तिक अमावस्या)', async () => {
    expect(await names('2026-12-08')).not.toContain('लक्ष्मीपूजन');
  });

  test('festivals belong to the day, not to the chosen minute', async () => {
    const morning = (await getPanchang('2026-11-08', ...PUNE, 330, '07:00')).festivals.map(f => f.name);
    const night   = (await getPanchang('2026-11-08', ...PUNE, 330, '21:00')).festivals.map(f => f.name);
    expect(night).toEqual(morning);
  });
});

describe('2026 amanta months', () => {
  test.each([
    ['2026-05-20', 'अधिक ज्येष्ठ'],
    ['2026-06-02', 'अधिक ज्येष्ठ'],
    ['2026-06-20', 'ज्येष्ठ'],
    ['2026-07-04', 'ज्येष्ठ'],
    ['2026-07-20', 'आषाढ'],
    ['2026-11-08', 'आश्विन'],
  ])('%s is %s', async (date, m) => {
    expect(await maas(date)).toBe(m);
  });
});
