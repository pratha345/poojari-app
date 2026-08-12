'use strict';
// aartiSearchMap.js — lets English/Hinglish typing AND natural Marathi typing
// find Devanagari aartis. Two distinct gaps this closes:
//  1. English/Hinglish query ("ganpati") never substring-matches Devanagari
//     content at all.
//  2. Even a Marathi query can miss — Sanskrit-origin words change STEM (not
//     just suffix) in vocative/oblique case, which devotional titles use
//     constantly: हनुमान (nom.) vs हनुमंताची (title's genitive), दुर्गा (nom.)
//     vs दुर्गे (title's vocative "दुर्गे दुर्घट भारी"), गीता vs गीते. A plain
//     substring LIKE cannot bridge a stem change, only a suffix addition —
//     confirmed empirically: सर्च "हनुमान"/"महादेव"/"दुर्गा"/"गीता" all
//     returned ZERO results despite matching aartis existing.
// The controller ORs in a LIKE per resolved term alongside the raw search.
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

// Marathi (Devanagari) query word → other Devanagari forms actually found in
// aarti titles/lyrics. Covers Sanskrit tatsama stem-changes in vocative/
// genitive case (हनुमान→हनुमंत, दुर्गा→दुर्गे, गीता→गीते) and common colloquial
// deity aliases (बाप्पा, शंभू, आई) that devotees search by but that don't
// literally appear as the formal name in the text.
const MARATHI_SYNONYM_MAP = {
  हनुमान: ['हनुमंत', 'मारुती'], मारुती: ['हनुमंत', 'हनुमान'], हनुमंत: ['हनुमान', 'मारुती'],
  बाप्पा: ['गणपती', 'गणेश'], गणपती: ['गणेश', 'बाप्पा'], गणेश: ['गणपती'],
  महादेव: ['शिव', 'शंकर'], शंभू: ['शिव', 'शंकर'], शिव: ['शंकर', 'महादेव'], शंकर: ['शिव', 'महादेव'],
  दुर्गा: ['दुर्गे', 'देवी'], दुर्गे: ['दुर्गा', 'देवी'], अंबा: ['अंबे', 'देवी'], अंबे: ['अंबा', 'देवी'],
  नवरात्र: ['देवी', 'दुर्गे'], नवरात्रोत्सव: ['देवी', 'दुर्गे'], नवरात्री: ['देवी', 'दुर्गे'],
  आई: ['देवी', 'माते'], माते: ['देवी', 'आई'],
  गीता: ['गीते', 'भगवद्गीता'], गीते: ['गीता'],
  विठोबा: ['विठ्ठल', 'पांडुरंग'], विठ्ठल: ['विठोबा', 'पांडुरंग'], पांडुरंग: ['विठ्ठल', 'विठोबा'],
  पंढरीनाथ: ['विठ्ठल', 'पांडुरंग'], विठाई: ['विठ्ठल'],
  दत्तगुरू: ['दत्त', 'दत्तात्रेय'], दत्तात्रय: ['दत्तात्रेय', 'दत्त'],
  ज्ञानदेव: ['ज्ञानेश्वर'], माऊली: ['ज्ञानेश्वर', 'विठ्ठल'],
  भगवती: ['देवी'], जगदंबा: ['देवी', 'अंबा'],
};

const KEYS = Object.keys(KEYWORD_MAP);
const DEVANAGARI_RE = /[ऀ-ॿ]/;

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

// Splits a query into words (Devanagari-preserving — the old version's
// `[^a-z\s]` strip silently reduced any Marathi query to nothing before it
// reached the matching logic, which is why Devanagari search terms never
// got resolved at all). Each word is resolved against the English keyword
// map (for Latin-script words) or the Marathi synonym map (for Devanagari
// words), returning a deduped list of extra Devanagari terms to also search.
// Three match tiers for English words, cheapest first: exact key → prefix
// (truncated typing, e.g. "ganpat") → fuzzy edit-distance (real typos, e.g.
// "satyanaran" for "satyanarayan"). Marathi words use exact-match only
// (fuzzy edit-distance on Devanagari conjuncts is unreliable — a single
// matra difference isn't "close" the way a dropped Latin letter is).
function resolveEnglishTerms(query) {
  const words = query.split(/\s+/).map(w => w.trim()).filter(Boolean);
  const terms = new Set();
  for (const raw of words) {
    if (DEVANAGARI_RE.test(raw)) {
      const hit = MARATHI_SYNONYM_MAP[raw];
      if (hit) hit.forEach(t => terms.add(t));
      continue;
    }

    const w = raw.toLowerCase().replace(/[^a-z]/g, '');
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
