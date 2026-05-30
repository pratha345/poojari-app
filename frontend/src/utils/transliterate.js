// Devanagari → Roman phonetic map (covers Marathi)
const D2R = {
  // Independent vowels
  'अ':'a','आ':'aa','इ':'i','ई':'i','उ':'u','ऊ':'u',
  'ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऋ':'ru',
  // Consonants
  'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ng',
  'च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'ny',
  'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n',
  'त':'t','थ':'th','द':'d','ध':'dh','न':'n',
  'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m',
  'य':'y','र':'r','ल':'l','व':'v','ळ':'l',
  'श':'sh','ष':'sh','स':'s','ह':'h',
  // Matras (dependent vowels)
  'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u',
  'े':'e','ै':'ai','ो':'o','ौ':'au',
  '्':'',   // halant/virama
  'ं':'n','ः':'h','ँ':'',
  // Devanagari digits
  '०':'0','१':'1','२':'2','३':'3','४':'4',
  '५':'5','६':'6','७':'7','८':'8','९':'9',
};

// Convert Devanagari string to approximate Roman phonetics
export function devaToRoman(str) {
  if (!str) return '';
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (Object.prototype.hasOwnProperty.call(D2R, ch)) {
      out += D2R[ch];
    } else if (ch.charCodeAt(0) >= 0x0900 && ch.charCodeAt(0) <= 0x097F) {
      // Unrecognised Devanagari — skip
    } else {
      out += ch.toLowerCase();
    }
  }
  return out;
}

// Match query (English or Marathi) against a label (Marathi)
export function phoneticSearch(query, label) {
  if (!query || !label) return false;
  const q  = query.toLowerCase().trim();
  const l  = label.toLowerCase();
  const r  = devaToRoman(label);
  // Direct substring match (Marathi query)
  if (l.includes(q)) return true;
  // Romanized phonetic match (English query like "halad", "satya")
  if (r.includes(q)) return true;
  // Partial: ignore trailing 'a' endings common in Roman Marathi (e.g. "sakar" vs "sakhar")
  const qTrimmed = q.replace(/a+$/, '');
  if (qTrimmed.length >= 2 && r.includes(qTrimmed)) return true;
  return false;
}
