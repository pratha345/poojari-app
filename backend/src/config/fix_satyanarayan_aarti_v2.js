'use strict';
// fix_satyanarayan_aarti_v2.js — replaces id=7's lyrics with the complete,
// authentic 7-verse text the user supplied directly (matches the composer
// signature "मोरेश्वरसुत वासुदेव" already noted in memory as the correct
// attribution). Previous DB text was explicitly flagged in memory as "my
// best-faithful reconstruction... not a scraped-verbatim copy" — this
// replaces it with the real thing. Same slug/id kept (URL stable).
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

const LYRICS = `जय जय दीनदयाळ सत्यनारायण देवा ।
पंचारति ओवाळू श्रीपति तुज भक्तिभावा ।। धृ ।।

विधियुक्त पूजुनी करिती पुराण श्रवण
परिमळद्रव्यांसहित पुष्पमाळा अर्पून ।।
घृतयुक्त शर्करामिश्रित गोधूमचूर्ण प्रसाद
भक्षण करितां प्रसन्न तूं नारायण ॥ जय ॥ १ ॥

शतानंद विप्रें पूर्वी व्रत है आचरिलें ।
दरिद्र दवडुनि अंर्ती त्यातें मोक्षपदा नेलें ।
त्यापासुनि हें व्रत या कलियुगि सकळां श्रुत झालें
भावार्थे पूजितां सर्वा इच्छित लाधलें ॥ जय || २ ||

साधुवैश्यें संततिसाठीं तुजला प्रार्थियलें ।
इच्छित पुरतां मदांध होऊनि व्रत न आचरिलें ।।
त्या पापानें संकटिं पडुनी दुःखहि भोगिलें ।
स्मृति होऊनि आचरितां व्रत त्या तुवांचि उद्धरिलें ॥ जय ।। ३ ।।

प्रसाद विसरुनि पतिभेटीला कलावती गेली ।
क्षोभ तुझा होतांचि तयाची नौका बुडाली ।।
अंगध्वजरायाची यापरि दुःखस्थिति आली ।
मृतवार्ता शतपुत्रांची सत्वर कर्णी परिसली ॥ जय ॥ ४ ॥

पुनरपि पूजुनि प्रसाद ग्रहण करितां तत्क्षणीं ।
पतिची नौका तरली देखे कलावती नयनीं ।।
अंगध्वजरायासी पुत्र भेटति येऊनि ।
ऐसा भक्तां संकटिं पावसि तूं चक्रपाणी ॥ जय ॥ ५॥

अनन्यभावें पूजुनि हें व्रत जे जन आचरति ।
इच्छित पुरविसी त्यांतें देउनि संतति संपत्ती ।।
संहरती भवदुरितें सर्वहि बन्धनें तुटती।
राजा रंका समान मानुनि पावसी श्रीपती ॥ जय ॥ ६ ॥

ऐसा तब व्रतमहिमा अपार वर्णू मी कैसा ।
भक्तिपुरस्सर आचरती त्यां पावसि जगदीशा ।।
भक्तांचा कनवाळू कल्पद्रुम तूं सर्वेशा ।
मोरेश्वरसुत वासुदेव तुज विनवी भवनाशा ।। जय ।। ७ ।।`;

(async () => {
  const [r] = await pool.query(
    `UPDATE aartis SET lyrics = ? WHERE slug = 'om-jai-lakshmi-ramana-satyanarayan-aarti'`,
    [LYRICS]
  );
  console.log('affectedRows:', r.affectedRows);
  const [[row]] = await pool.query(`SELECT id, title, lyrics FROM aartis WHERE slug='om-jai-lakshmi-ramana-satyanarayan-aarti'`);
  console.log('id:', row.id, '| lyrics length:', row.lyrics.length);
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
