'use strict';
// utils/slugify.js — ASCII-safe slug for Devanagari/Marathi filenames & URLs

const DEVANAGARI_MAP = {
  'गणेश चतुर्थी':   'ganesh-chaturthi',
  'गणेश':            'ganesh',
  'चतुर्थी':         'chaturthi',
  'नवरात्री':         'navratri',
  'नवरात्र':          'navratr',
  'दिवाळी':          'diwali',
  'पितृपक्ष':         'pitrupaksha',
  'पितृ':             'pitru',
  'श्रावण मास':       'shravan-mas',
  'श्रावण':           'shravan',
  'महाशिवरात्री':     'mahashivratri',
  'शिवरात्री':        'shivratri',
  'राम नवमी':         'ram-navami',
  'रामनवमी':          'ram-navami',
  'हनुमान जयंती':    'hanuman-jayanti',
  'हनुमान':           'hanuman',
  'दत्त जयंती':      'datta-jayanti',
  'दत्त':             'datta',
  'गुरुपौर्णिमा':     'guru-purnima',
  'गुरू पौर्णिमा':    'guru-purnima',
  'गुरु':             'guru',
  'होळी':             'holi',
  'मकर संक्रांत':    'makar-sankranti',
  'मकर संक्रांती':   'makar-sankranti',
  'गुढीपाडवा':        'gudi-padwa',
  'गुढी पाडवा':       'gudi-padwa',
  'कृष्ण जन्माष्टमी':'krishna-janmashtami',
  'जन्माष्टमी':       'janmashtami',
  'अक्षय तृतीया':    'akshaya-tritiya',
  'रक्षाबंधन':        'rakshabandhan',
  'विजयादशमी':        'vijayadashami',
  'विजया दशमी':       'vijayadashami',
  'देव दिवाळी':       'dev-diwali',
  'गीता जयंती':      'geeta-jayanti',
  'महालक्ष्मी':       'mahalakshmi',
  'लक्ष्मी':          'lakshmi',
  'सरस्वती':          'saraswati',
  'दुर्गा':           'durga',
  'शिव':              'shiv',
  'कृष्ण':            'krishna',
  'राम':              'ram',
};

const THEME_TYPE_MAP = {
  'poster':           'poster',
  'banner':           'banner',
  'whatsapp':         'whatsapp',
  'whatsapp-status':  'whatsapp',
  'instagram':        'instagram',
  'invitation':       'invitation',
  'wallpaper':        'wallpaper',
  'mobile':           'mobile',
  'temple':           'temple',
  'luxury':           'luxury',
  'minimal':          'minimal',
  'devotional':       'devotional',
  'royal':            'royal',
};

/**
 * Convert any string (including Marathi/Devanagari) to ASCII-safe URL slug.
 * @param {string} text
 * @returns {string}  e.g. "ganesh-chaturthi"
 */
function slugify(text) {
  if (!text) return 'festival';

  const trimmed = text.trim();

  // Direct map lookup first
  if (DEVANAGARI_MAP[trimmed]) return DEVANAGARI_MAP[trimmed];

  // Try partial match
  for (const [key, val] of Object.entries(DEVANAGARI_MAP)) {
    if (trimmed.includes(key)) return val;
  }

  // Fallback: strip non-ASCII, lowercase, replace spaces/special with dash
  return trimmed
    .toLowerCase()
    .replace(/[ऀ-ॿ]+/g, '')     // strip Devanagari block
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || `festival-${Date.now()}`;
}

/**
 * Generate a safe ASCII filename for a festival poster.
 * @param {string} festivalName
 * @param {string} type         e.g. 'poster' | 'banner' | 'whatsapp'
 * @param {number} [variant]    1-3 for multi-image
 * @param {string} [ext]        'webp' | 'png'
 */
function festivalFilename(festivalName, type = 'poster', variant = null, ext = 'webp') {
  const slug    = slugify(festivalName);
  const safeType = THEME_TYPE_MAP[type?.toLowerCase()] || type || 'poster';
  const year    = new Date().getFullYear();
  const ts      = Date.now();
  const v       = variant ? `-v${variant}` : '';
  return `${slug}-${year}-${safeType}${v}-${ts}.${ext}`;
}

module.exports = { slugify, festivalFilename, DEVANAGARI_MAP };
