'use strict';
// services/whatsappCaption.service.js — Marathi WhatsApp caption generator

const { slugify } = require('../utils/slugify');

// ── Caption templates per festival ───────────────────────────
const CAPTIONS = {
  'ganesh-chaturthi': {
    morning: [
      '🙏 गणेश चतुर्थीच्या हार्दिक शुभेच्छा! 🐘\n\nगणपती बाप्पा मोरया! मंगलमूर्ती मोरया! 🌸\n\nबाप्पाच्या आशीर्वादाने तुमचे सर्व मनोरथ पूर्ण होवोत.',
      '🌺 गणेश चतुर्थीच्या आनंदाच्या शुभेच्छा! 🙏\n\nगणराजांचे आगमन झाले आहे. घरोघरी बाप्पाचा जयजयकार!\n\nगणपती बाप्पा मोरया 🐘',
    ],
    festival: [
      '🐘 गणपती बाप्पा मोरया! 🙏\n\nदहा दिवस बाप्पाची भक्ती करा, आनंद साजरा करा!\nसर्वांना गणेशोत्सवाच्या हार्दिक शुभेच्छा 🌸',
    ],
    closing: [
      '🙏 गणपती बाप्पा मोरया! पुढच्या वर्षी लवकर या! 🐘\n\nगणेशोत्सव २०२६ च्या सुखद आठवणी घेऊन बाप्पा निरोप घेत आहेत.\nगणपती बाप्पा मोरया!',
    ],
  },
  'navratri': {
    morning: [
      '🌺 नवरात्रीच्या हार्दिक शुभेच्छा! 🙏\n\nनऊ दिवस माँ दुर्गाची उपासना करा.\nजय माँ दुर्गा! जय आदिशक्ती! 🔱',
      '🔱 नवरात्री उत्सवाच्या शुभेच्छा! 🌸\n\nशक्तीची देवी दुर्गा माँची कृपा तुमच्यावर सदैव राहो.',
    ],
    festival: [
      '💃 गरबा खेळा! नाचा! उत्सव साजरा करा! 🎵\n\nनवरात्रीच्या या पवित्र दिवसांत माँचे स्मरण करा.\nजय माँ अंबे! 🙏',
    ],
  },
  'diwali': {
    morning: [
      '🪔 दीपावलीच्या हार्दिक शुभेच्छा! ✨\n\nदिव्यांचा उत्सव आला आहे. आपल्या जीवनात सुख, समृद्धी आणि प्रकाश येवो.\nशुभ दीपावली! 🌸',
      '✨ शुभ दीपावली! 🪔\n\nलक्ष्मी माँची कृपा तुमच्यावर राहो.\nतुमचे घर आनंदाने भरून जावो! 🙏',
    ],
    festival: [
      '🪔 दिव्यांनी उजळलेल्या रात्री... 🌟\n\nरांगोळी, फटाके, मिठाई... दिवाळीचा आनंद अवर्णनीय!\nसर्वांना शुभ दीपावली! 🙏✨',
    ],
  },
  'pitrupaksha': {
    morning: [
      '🙏 पितृपक्षाच्या या पवित्र दिवसांत पूर्वजांचे स्मरण करा.\n\nपिंडदान, श्राद्ध विधी करा. पितृचरणी नमन! 🌸',
    ],
  },
  'shravan-mas': {
    morning: [
      '🌿 श्रावण मासाच्या शुभेच्छा! 🙏\n\nश्रावणात शिवाची भक्ती करा. सोमवारी उपवास करा.\nहर हर महादेव! 🔱',
    ],
  },
  'mahashivratri': {
    morning: [
      '🔱 महाशिवरात्रीच्या हार्दिक शुभेच्छा! 🙏\n\nॐ नमः शिवाय!\nशंकराचे दर्शन घ्या, उपवास करा, रात्री जागरण करा.\nहर हर महादेव! 🌙',
    ],
  },
  'ram-navami': {
    morning: [
      '🙏 रामनवमीच्या हार्दिक शुभेच्छा! 🌸\n\nभगवान श्रीरामाचा जन्मदिवस!\nजय श्री राम! श्री रामचंद्र की जय! 🏹',
    ],
  },
  'hanuman-jayanti': {
    morning: [
      '🙏 हनुमान जयंतीच्या हार्दिक शुभेच्छा! 💪\n\nसंकट मोचन हनुमानाची कृपा तुमच्यावर राहो.\nजय हनुमान! जय बजरंगबली! 🔴',
    ],
  },
  'holi': {
    morning: [
      '🌈 होळीच्या रंगीत शुभेच्छा! 🎨\n\nरंग उधळा! आनंद साजरा करा!\nशुभ होळी! 🙏',
    ],
  },
  'makar-sankranti': {
    morning: [
      '🪁 मकर संक्रांतीच्या हार्दिक शुभेच्छा! ✨\n\nतिळगूळ घ्या, गोड बोला!\nशुभ संक्रांत! 🌞',
    ],
  },
  'gudi-padwa': {
    morning: [
      '🎏 गुढी पाडव्याच्या हार्दिक शुभेच्छा! 🌸\n\nमराठी नवीन वर्षाचे स्वागत!\nनव वर्ष सुखाचे जावो! 🙏',
    ],
  },
  'krishna-janmashtami': {
    morning: [
      '🦚 जन्माष्टमीच्या हार्दिक शुभेच्छा! 🙏\n\nभगवान श्रीकृष्णाचा जन्मदिवस!\nजय श्री कृष्ण! राधे राधे! 🌸',
    ],
  },
};

const DEFAULT_CAPTION = (festivalName) => `🙏 ${festivalName}च्या हार्दिक शुभेच्छा!\n\nपरमेश्वराची कृपा तुमच्यावर सदैव राहो. 🌸\n\nपूजारी सेवा — आपली पूजा आमची जबाबदारी.`;

/**
 * Generate a WhatsApp caption for a festival.
 * @param {string} festivalName - Marathi festival name
 * @param {string} [occasion]   - 'morning'|'festival'|'closing'
 * @returns {string}
 */
function generateWhatsAppCaption(festivalName, occasion = 'morning') {
  const slug     = slugify(festivalName);
  const captions = CAPTIONS[slug];

  if (!captions) return DEFAULT_CAPTION(festivalName);

  const list = captions[occasion] || captions['morning'] || captions[Object.keys(captions)[0]];
  if (!list || !list.length) return DEFAULT_CAPTION(festivalName);

  // Return a random caption from the list
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate all 3 caption variants for a festival.
 */
function generateAllCaptions(festivalName) {
  return {
    morning:  generateWhatsAppCaption(festivalName, 'morning'),
    festival: generateWhatsAppCaption(festivalName, 'festival'),
    closing:  generateWhatsAppCaption(festivalName, 'closing'),
  };
}

module.exports = { generateWhatsAppCaption, generateAllCaptions };
