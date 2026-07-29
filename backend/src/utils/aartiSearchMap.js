'use strict';
// aartiSearchMap.js — lets English/Hinglish typing find Marathi (Devanagari) aartis.
// All aarti titles/lyrics are pure Devanagari, so a plain SQL LIKE never matches
// an English query like "ganpati". This maps common English/Hinglish spellings
// (deity names, saint names, common alt-spellings) to their Marathi equivalents;
// the controller ORs in a LIKE per resolved term alongside the raw search.
// Self-maintaining: no per-aarti manual tagging needed, works for future aartis too.
const KEYWORD_MAP = {
  ganpati: ['गणपती', 'गणेश'], ganesh: ['गणेश', 'गणपती'], ganesha: ['गणेश', 'गणपती'],
  ganapati: ['गणपती', 'गणेश'], vinayak: ['विनायक', 'गणपती'], gajanan: ['गजानन'],

  shiv: ['शिव', 'शंकर', 'महादेव'], shiva: ['शिव', 'शंकर'], shankar: ['शंकर', 'शिव'],
  shankara: ['शंकर', 'शिव'], mahadev: ['महादेव', 'शिव'], mahesh: ['महेश', 'शिव'],
  trimbakeshwar: ['त्र्यंबकेश्वर'], lingashtak: ['लिंगाष्टक'],

  devi: ['देवी'], durga: ['दुर्गा', 'देवी'], amba: ['अंबा', 'देवी'], bhavani: ['भवानी', 'देवी'],
  lakshmi: ['लक्ष्मी'], mahalakshmi: ['महालक्ष्मी'], santoshi: ['संतोषी'], ganga: ['गंगा'],

  vishnu: ['विष्णु'], narayana: ['नारायण', 'विष्णु'], narayan: ['नारायण', 'विष्णु'],

  vitthal: ['विठ्ठल'], vithoba: ['विठ्ठल'], vitthala: ['विठ्ठल'], panduranga: ['पांडुरंग'],
  pandurang: ['पांडुरंग', 'विठ्ठल'], pandharinath: ['पंढरीनाथ', 'विठ्ठल'], pandhari: ['पंढरी'],
  pandharpur: ['पंढरी', 'विठ्ठल'], vithai: ['विठाई'], kakad: ['कांकड', 'काकड'],

  krishna: ['कृष्ण'], gopal: ['गोपाळ', 'कृष्ण'], gopala: ['गोपाळ', 'कृष्ण'],
  madangopal: ['मदनगोपाळ', 'कृष्ण'], gokul: ['गोकुळ'], gokulashtami: ['गोकुळाष्टमी'],

  ram: ['राम'], rama: ['राम'], ramchandra: ['रामचंद्र', 'राम'],
  ramnavami: ['रामनवमी'],

  satyanarayan: ['सत्यनारायण'], satyanarayana: ['सत्यनारायण'],
  parshuram: ['परशुराम'], parashuram: ['परशुराम'],
  anant: ['अनंत'], venkatesh: ['व्यंकटेश'], venkatesha: ['व्यंकटेश'], balaji: ['व्यंकटेश'],

  datta: ['दत्त'], dattatreya: ['दत्तात्रेय', 'दत्त'], guru: ['गुरु'],
  hanuman: ['हनुमान', 'मारुती'], maruti: ['मारुती', 'हनुमान'], hanumant: ['हनुमंत', 'हनुमान'],
  khandoba: ['खंडोबा'], tulsi: ['तुळशी'], tulasi: ['तुळशी'], tulshi: ['तुळशी'],

  dnyaneshwar: ['ज्ञानेश्वर'], dnyaneshwari: ['ज्ञानेश्वर'], jnaneshwar: ['ज्ञानेश्वर'],
  tukaram: ['तुकाराम'], eknath: ['एकनाथ'], ramdas: ['रामदास'], samarth: ['समर्थ', 'रामदास'],

  gita: ['गीता'], bhagwat: ['भागवत'], bhagavat: ['भागवत'], bhagavatam: ['भागवत'],
  atmaram: ['आत्माराम'], manobodh: ['मनोबोध'], pasaydan: ['पसायदान'],

  aarti: ['आरती'], arti: ['आरती'], aarati: ['आरती'], stotra: ['स्तोत्र'], stotram: ['स्तोत्र'],
};

const KEYS = Object.keys(KEYWORD_MAP);

// Standard edit-distance DP — small strings (<20 chars) and a ~80-key dictionary,
// so a full O(n*m) per key per query word is negligible per request.
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// Splits an English query into words, resolves each against KEYWORD_MAP, returns
// a deduped list of Marathi terms to also search for. Devanagari input passes
// through untouched by the caller (this function is only invoked for it too,
// but Devanagari words simply won't match any key so nothing extra is added).
// Three match tiers, cheapest first: exact key → prefix (truncated typing, e.g.
// "ganpat") → fuzzy edit-distance (real typos/misremembered spelling, e.g.
// "satyanaran" for "satyanarayan" — missing letters, not just a shorter word).
function resolveEnglishTerms(query) {
  const words = query.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const terms = new Set();
  for (const w of words) {
    if (w.length < 3) continue;   // too short to fuzzy-match safely

    if (KEYWORD_MAP[w]) { KEYWORD_MAP[w].forEach(t => terms.add(t)); continue; }

    const prefixHit = KEYS.find(k => (k.length >= 4 && w.startsWith(k)) || (w.length >= 4 && k.startsWith(w)));
    if (prefixHit) { KEYWORD_MAP[prefixHit].forEach(t => terms.add(t)); continue; }

    // maxDist scales with word length so short words don't fuzzy-match noise
    const maxDist = w.length <= 4 ? 1 : Math.min(2, Math.floor(w.length / 5) + 1);
    for (const k of KEYS) {
      if (Math.abs(k.length - w.length) > maxDist) continue;   // cheap skip
      if (levenshtein(w, k) <= maxDist) { KEYWORD_MAP[k].forEach(t => terms.add(t)); break; }
    }
  }
  return [...terms];
}

module.exports = { resolveEnglishTerms };
