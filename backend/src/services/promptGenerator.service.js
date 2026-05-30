'use strict';
// services/promptGenerator.service.js
// Intelligent AI festival prompt engine for Marathi Hindu festival poster/banner generation

const { slugify } = require('../utils/slugify');

// ── Quality suffix added to ALL prompts ───────────────────────
const QUALITY = 'ultra realistic, cinematic lighting, 4K detailed artwork, divine spiritual atmosphere, premium composition, realistic shadows, professional poster quality, masterpiece, highly detailed, sharp focus, vibrant rich colors';

// ── Negative prompt (used globally) ──────────────────────────
const NEGATIVE_PROMPT = 'blurry, low quality, distorted face, cropped, watermark, duplicate, extra hands, deformed, bad anatomy, ugly, noisy image, pixelated, out of frame, poorly drawn, amateur, text overlay, signature, low resolution, grainy, overexposed';

// ── Festival prompt database ──────────────────────────────────
const FESTIVAL_PROMPTS = {
  'ganesh-chaturthi': {
    base: 'Lord Ganesha idol with royal Maharashtrian pandal decoration, marigold flower garlands, glowing oil diyas, saffron golden atmosphere, traditional Maharashtra temple art, elephant god divine presence',
    colors: ['#FF6B00', '#FFD700', '#FF4500', '#8B0000'],
    mood: 'divine devotional festive',
    season: 'monsoon-end',
    elements: ['Ganpati idol', 'marigold flowers', 'diyas', 'modak', 'saffron flags'],
    variations: [
      'Lord Ganesha large idol golden crown royal throne, marigold garland decorations, glowing temple lamps, saffron orange atmosphere, devotional Maharashtrian festival',
      'Ganesh Chaturthi celebration procession, vibrant orange marigold flowers, traditional dhol tasha music, festive crowd, golden divine light from above',
      'Beautiful Ganpati decoration pandal, intricate floral artwork, glowing diya lights, lotus flowers, spiritual divine atmosphere, golden bokeh background',
    ],
  },

  'navratri': {
    base: 'Goddess Durga Maa, nine nights Navratri festival, traditional garba dance celebration, glowing temple lamps, red golden festive atmosphere, divine feminine power',
    colors: ['#DC143C', '#FFD700', '#800080', '#FF6347'],
    mood: 'powerful divine festive',
    season: 'autumn',
    elements: ['Durga idol', 'garba sticks', 'colorful garba costumes', 'temple lamps', 'red flowers'],
    variations: [
      'Goddess Durga divine idol, nine forms of goddess, glowing temple, marigold red flowers, golden light rays, devotional spiritual atmosphere',
      'Navratri garba celebration, colorful traditional costumes dancers, glowing circular garba arena, festive night lighting, vibrant celebration',
      'Maa Ambika golden throne, sacred kalash, holy fire, red hibiscus flowers, divine goddess energy, temple bells, saffron atmosphere',
    ],
  },

  'diwali': {
    base: 'Diwali festival of lights, thousands of oil diyas glowing beautifully, vibrant rangoli art, golden bokeh lights, traditional Indian home decoration, lakshmi puja atmosphere',
    colors: ['#FFD700', '#FF8C00', '#DC143C', '#8B008B'],
    mood: 'joyful luxury festive',
    season: 'autumn',
    elements: ['diyas', 'rangoli', 'firecrackers bokeh', 'Lakshmi idol', 'golden lights'],
    variations: [
      'Luxury Diwali festival poster, intricate rangoli design, hundreds of oil diyas, golden glowing lights, traditional home entrance, warm amber atmosphere',
      'Goddess Lakshmi Diwali puja, golden ornamental decoration, flower petals, glowing diyas circle, divine prosperous atmosphere',
      'Diwali night celebration, fireworks golden sky, lamp-lit streets, traditional Indian home, rich golden bokeh lights, festive warm atmosphere',
    ],
  },

  'pitrupaksha': {
    base: 'Hindu Pitrupaksha ancestral ritual, sacred havan fire, peaceful spiritual riverside ceremony, soft golden morning light, traditional priest performing shradh puja',
    colors: ['#8B4513', '#DEB887', '#F5DEB3', '#D2B48C'],
    mood: 'peaceful reverent spiritual',
    season: 'monsoon-end',
    elements: ['havan fire', 'sacred grass', 'water rituals', 'incense', 'priest'],
    variations: [
      'Pitrupaksha shradh ritual, sacred fire havan, offering to ancestors, holy river bank, white flowers, morning mist, spiritual reverence',
      'Hindu ancestor worship ceremony, traditional priest with puja thali, holy water pot, sesame seeds, peaceful spiritual atmosphere',
      'Pitru paksha pind daan ceremony, sacred Ganga river, lotus flowers, morning golden light, devotional prayer, peaceful ambience',
    ],
  },

  'shravan-mas': {
    base: 'Shravan month Lord Shiva worship, sacred Shiva lingam adorned with flowers and bel leaves, monsoon green lush nature background, holy river, devotional calm atmosphere',
    colors: ['#228B22', '#00CED1', '#1E90FF', '#FFD700'],
    mood: 'serene devotional monsoon',
    season: 'monsoon',
    elements: ['Shiva lingam', 'bel leaves', 'holy water', 'monsoon rain', 'green nature'],
    variations: [
      'Lord Shiva Shravan worship, sacred lingam adorned with bel patra and flowers, monsoon rains, green lush nature, divine blue light',
      'Shravan Somvar fasting ritual, white flowers milk abhishek on shiva lingam, sacred river flowing, peaceful temple, morning light',
      'Maha Shiva devotion Shravan month, golden trishul, moon crescent, sacred Ganga, monsoon nature, spiritual divine atmosphere',
    ],
  },

  'mahashivratri': {
    base: 'Maha Shivratri Lord Shiva cosmic energy, divine temple at night, sacred bel leaves and flowers, glowing oil lamps, mystical spiritual atmosphere, blue cosmic light',
    colors: ['#191970', '#6A0DAD', '#C0C0C0', '#FFD700'],
    mood: 'mystical cosmic divine',
    season: 'winter-end',
    elements: ['Shiva lingam', 'trishul', 'moon', 'damaru', 'bel leaves', 'midnight lamps'],
    variations: [
      'Shiva Nataraja cosmic dance, mystical blue energy, divine temple night, sacred lingam, glowing lamps circle, spiritual ecstasy',
      'Mahashivratri vigil, devotees offering milk Gangajal, glowing temple, Lord Shiva third eye, sacred blue light, midnight ritual',
      'Lord Shiva meditation Kailash mountain, crescent moon, Ganga flowing from hair, divine cosmic atmosphere, mystical night sky',
    ],
  },

  'ram-navami': {
    base: 'Ram Navami Lord Ram divine avatar, golden temple decoration, saffron flags waving, Ayodhya temple, devotional atmosphere, traditional puja flowers',
    colors: ['#FF8C00', '#FFD700', '#006400', '#8B0000'],
    mood: 'divine majestic devotional',
    season: 'spring',
    elements: ['Rama idol', 'bow arrow', 'saffron flags', 'lotus flowers', 'Ayodhya temple'],
    variations: [
      'Lord Ram holding bow arrow, Sita Lakshmana Hanuman, golden divine light, Ayodhya temple background, saffron orange atmosphere',
      'Ram Navami celebration, traditional puja thali flowers, glowing temple lamps, divine Lord Ram birth celebration, festive atmosphere',
      'Shri Ram divine portrait, sacred blue skin golden ornaments, lotus flowers, temple bells, devotional spiritual artwork',
    ],
  },

  'hanuman-jayanti': {
    base: 'Hanuman Jayanti divine Lord Hanuman, sacred orange vermillion, Hanuman temple glowing, red hibiscus flowers, devotional strength atmosphere, saffron flag',
    colors: ['#FF4500', '#FFD700', '#DC143C', '#FF8C00'],
    mood: 'powerful devotional strength',
    season: 'spring',
    elements: ['Hanuman idol', 'gada mace', 'red flowers', 'saffron flag', 'sunrise'],
    variations: [
      'Lord Hanuman flying with sanjeevani mountain, divine strength, golden sunset sky, saffron orange atmosphere, devotional energy',
      'Hanuman idol sacred temple, red orange flowers garland, glowing diyas, devotional morning light, powerful divine presence',
      'Sankat Mochan Hanuman, lotus hands, sacred chant atmosphere, temple bells, vibrant orange red celebration',
    ],
  },

  'datta-jayanti': {
    base: 'Datta Jayanti Lord Dattatreya, three faces divine, sacred cow and four dogs, glowing temple, golden spiritual light, traditional Maharashtra devotion',
    colors: ['#FFD700', '#FF8C00', '#8B0000', '#DEB887'],
    mood: 'sacred divine devotional',
    season: 'winter',
    elements: ['Dattatreya idol', 'three heads', 'sacred cow', 'glowing lamps', 'holy river'],
    variations: [
      'Lord Dattatreya three-headed divine form, sacred Ashwattha tree, cow four dogs devotees, golden light, Ganagapur temple atmosphere',
      'Datta Jayanti celebration, traditional Maharashtra devotion, glowing oil lamps, marigold flowers, guru worship, sacred atmosphere',
      'Swami Dattatreya meditation, divine trimurti, golden aura, sacred river Godavari, lotus flowers, spiritual bliss',
    ],
  },

  'guru-purnima': {
    base: 'Guru Purnima full moon night celebration, spiritual guru and devoted disciples, white lotus flowers, divine glowing silver light, traditional ceremony, peaceful sacred atmosphere',
    colors: ['#F5F5DC', '#FFD700', '#4B0082', '#87CEEB'],
    mood: 'peaceful reverent sacred',
    season: 'monsoon',
    elements: ['full moon', 'guru sitting', 'disciples', 'lotus flowers', 'sacred light'],
    variations: [
      'Guru Purnima full moon sacred night, guru sitting lotus position, devoted students, white flowers, divine silver light, peaceful temple',
      'Guru Purnima celebration, traditional guru dakshina ritual, garland offering, glowing lamps, moonlit garden, devotional atmosphere',
      'Vyasa Purnima sacred guru festival, ancient teacher wisdom light, lotus blooming, full moon reflection, spiritual knowledge',
    ],
  },

  'holi': {
    base: 'Holi festival colorful powder clouds celebration, joyful vibrant colors explosion in air, traditional Hindu festival spring celebration, bright sunny day happiness',
    colors: ['#FF69B4', '#7B68EE', '#00FF7F', '#FF4500'],
    mood: 'joyful playful vibrant',
    season: 'spring',
    elements: ['color powder', 'water guns', 'flowers', 'drums', 'bonfire'],
    variations: [
      'Holi celebration colorful powder explosion, happy people throwing gulal, vibrant pink green blue colors, festive spring energy',
      'Holika Dahan sacred bonfire, traditional ritual night before holi, glowing fire, devotional celebration, colorful flowers',
      'Holi colors abstract art, flowing color powder red green yellow blue, divine joy celebration, traditional India festival',
    ],
  },

  'makar-sankranti': {
    base: 'Makar Sankranti festival, colorful kites flying in bright blue winter sky, sesame jaggery tilgul sweets, celebration in Maharashtra, warm golden winter sunlight',
    colors: ['#87CEEB', '#FFD700', '#FF8C00', '#32CD32'],
    mood: 'joyful festive harvest',
    season: 'winter',
    elements: ['kites', 'tilgul sweets', 'sugarcane', 'bonfire', 'harvest'],
    variations: [
      'Makar Sankranti colorful kites sky festival, hundreds of kites blue sky, warm winter golden sunlight, festive Maharashtra celebration',
      'Sankranti tilgul sesame jaggery laddoo, traditional puja thali, harvest celebration, orange marigold flowers, auspicious atmosphere',
      'Uttarayan kite festival, diverse colorful kites field, families celebrating, warm golden afternoon light, joyful harvest festival',
    ],
  },

  'gudi-padwa': {
    base: 'Gudi Padwa Marathi Hindu New Year, traditional gudi flag with silk cloth and neem leaves, marigold garland, traditional Maharashtra celebration, auspicious new beginning',
    colors: ['#FF8C00', '#FFD700', '#008000', '#DC143C'],
    mood: 'auspicious festive new beginning',
    season: 'spring',
    elements: ['gudi flag', 'silk cloth', 'neem leaves', 'marigold', 'rangoli'],
    variations: [
      'Gudi Padwa Marathi New Year, beautiful gudi flag silk cloth sugar garland, marigold flowers, traditional home entrance, auspicious morning',
      'Gudi Padwa celebration Maharashtra, traditional rangoli entrance, new clothes family, gudi hoisted, auspicious golden morning',
      'Gudi Padwa festival, spring season flowers, sacred gudi with kalash, traditional puja, golden sunlight, festive Maharashtrian culture',
    ],
  },

  'krishna-janmashtami': {
    base: 'Krishna Janmashtami Lord Krishna birth celebration, midnight divine baby Krishna, dahi handi celebration, flute music, Mathura Vrindavan atmosphere, golden divine light',
    colors: ['#000080', '#FFD700', '#FF69B4', '#00CED1'],
    mood: 'divine playful devotional',
    season: 'monsoon',
    elements: ['baby Krishna', 'dahi handi', 'flute', 'peacock feather', 'lotus'],
    variations: [
      'Baby Lord Krishna divine cradle midnight, glowing divine light, devotees celebrating, flowers rain, Mathura temple atmosphere',
      'Dahi Handi Janmashtami celebration, human pyramid youth, clay pot butter, festive Maharashtra celebration, rain monsoon joy',
      'Lord Krishna flute player, Vrindavan forest moonlight, peacock feathers, Radha devotion, golden divine aura, lotus flowers',
    ],
  },

  'vijayadashami': {
    base: 'Vijayadashami Dussehra victory celebration, traditional Maharashtra, Ravana effigy fireworks, golden divine triumph atmosphere, festive decorations',
    colors: ['#FF8C00', '#FFD700', '#DC143C', '#228B22'],
    mood: 'triumphant festive victorious',
    season: 'autumn',
    elements: ['Ravana effigy', 'fireworks', 'traditional celebration', 'victory'],
    variations: [
      'Dussehra victory of good over evil, Rama defeating Ravana, golden divine light, festive crowd, triumph celebration atmosphere',
      'Vijayadashami traditional Maharashtra celebration, Simollaghan crossing border ceremony, golden festive atmosphere, traditional dress',
      'Dussehra Ravana dahan fireworks night sky, glowing fire victory, festive crowd celebration, divine triumph energy',
    ],
  },
};

// ── Theme type modifiers ──────────────────────────────────────
const THEME_MODIFIERS = {
  'poster':          'vertical portrait composition, 2:3 ratio, traditional Indian poster design',
  'banner':          'wide horizontal panoramic composition, 16:9 ratio, banner style',
  'whatsapp':        'square composition, 1:1 ratio, mobile-optimized, vibrant eye-catching',
  'whatsapp-status': 'vertical 9:16 ratio, mobile story format, bold visuals',
  'instagram':       'square 1:1 ratio, Instagram-optimized, high contrast vibrant colors',
  'invitation':      'elegant invitation card design, ornamental border, traditional motifs',
  'wallpaper':       'desktop wallpaper format, 16:9 ratio, immersive scenic background',
  'mobile':          'mobile wallpaper 9:16 portrait, immersive, vibrant colors',
  'temple':          'sacred temple architecture, pillar decorations, divine sanctum',
  'luxury':          'luxury gold foil style, premium ornamental design, rich textures',
  'minimal':         'clean minimal design, white space, elegant simple composition',
  'devotional':      'devotional spiritual artwork, sacred symbols, prayer atmosphere',
  'royal':           'royal Maharashtrian style, ornate gold border, regal composition',
};

// ── Style variation suffixes ──────────────────────────────────
const STYLE_SUFFIXES = {
  'realistic':          'ultra realistic photography style',
  'ultra-realistic':    'ultra realistic 8K photography, photorealistic rendering',
  'digital-painting':   'stunning digital painting, artstation quality',
  'luxury-gold':        'luxury gold ornamental style, rich textures, golden foil',
  'cinematic':          'cinematic color grading, dramatic lighting, film look',
  'temple-art':         'traditional Indian temple art style, intricate patterns',
  'devotional':         'devotional Hindu artwork style, traditional sacred art',
  'modern-minimal':     'modern minimalist design, clean lines, contemporary',
  '3d-render':          '3D render, volumetric lighting, ray tracing, CGI quality',
  'spiritual-artwork':  'spiritual artwork, ethereal glow, sacred geometry',
  'festive-royal':      'festive royal style, ornate decorations, royal grandeur',
};

/**
 * Generate AI prompt for a festival poster.
 * @param {object} options
 * @param {string} options.festivalName   - Marathi or English festival name
 * @param {string} [options.themeType]    - 'poster'|'banner'|'whatsapp'|'instagram'|...
 * @param {string} [options.style]        - 'realistic'|'luxury-gold'|'cinematic'|...
 * @param {number} [options.variant]      - 1|2|3 for different variations
 */
function generatePrompt({ festivalName, themeType = 'poster', style = 'realistic', variant = 1 }) {
  const slug    = slugify(festivalName);
  const data    = FESTIVAL_PROMPTS[slug] || FESTIVAL_PROMPTS['ganesh-chaturthi'];
  const varIdx  = Math.max(0, Math.min((variant || 1) - 1, data.variations.length - 1));
  const varText = data.variations[varIdx] || data.base;

  const typeModifier  = THEME_MODIFIERS[themeType?.toLowerCase()] || THEME_MODIFIERS['poster'];
  const styleSuffix   = STYLE_SUFFIXES[style?.toLowerCase()]      || STYLE_SUFFIXES['realistic'];

  const positivePrompt = `${varText}, ${typeModifier}, ${styleSuffix}, ${QUALITY}`;

  return {
    positivePrompt,
    negativePrompt: NEGATIVE_PROMPT,
    style,
    colors:    data.colors,
    mood:      data.mood,
    season:    data.season,
    elements:  data.elements,
    filename:  null, // set by caller
    themeType,
    festivalSlug: slug,
  };
}

/**
 * Generate 3 variations of prompts for a festival/type/style combination.
 */
function generateMultiPrompts({ festivalName, themeType = 'poster', style = 'realistic' }) {
  return [1, 2, 3].map(v => generatePrompt({ festivalName, themeType, style, variant: v }));
}

/**
 * Get aspect ratio for Stability AI based on theme type.
 */
function getAspectRatio(themeType) {
  const map = {
    'poster':           '2:3',
    'banner':           '16:9',
    'whatsapp':         '1:1',
    'whatsapp-status':  '9:16',
    'instagram':        '1:1',
    'invitation':       '3:4',
    'wallpaper':        '16:9',
    'mobile':           '9:16',
    'temple':           '1:1',
    'luxury':           '2:3',
    'minimal':          '1:1',
    'devotional':       '2:3',
    'royal':            '2:3',
  };
  return map[themeType?.toLowerCase()] || '1:1';
}

module.exports = { generatePrompt, generateMultiPrompts, getAspectRatio, NEGATIVE_PROMPT, FESTIVAL_PROMPTS };
