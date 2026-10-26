// src/themes/themes.js — Centralised theme definitions

export const PRESET_THEMES = [
  {
    id: 'saffron-divine',
    name: 'Saffron Divine',
    nameMarathi: 'केशरी दिव्य',
    emoji: '🔶',
    desc: 'उबदार केशरी, मंदिराचे वातावरण',
    colors: ['#E07B2A', '#8B2500', '#FDF6EC', '#2D1B00', '#D4AF37'],
    dark: false,
  },
  {
    id: 'royal-temple',
    name: 'Royal Temple',
    nameMarathi: 'राजेशाही मंदिर',
    emoji: '🏛️',
    desc: 'गडद लाल आणि सोनेरी, राजेशाही रूप',
    colors: ['#B22222', '#4A0E0E', '#FFF8F0', '#2A0808', '#CFB53B'],
    dark: false,
  },
  {
    id: 'nature-spiritual',
    name: 'Nature Spiritual',
    nameMarathi: 'निसर्ग आध्यात्मिक',
    emoji: '🌿',
    desc: 'हिरवा निसर्ग, शांत आणि ताजेतवाने',
    colors: ['#4A7C59', '#1A3D2B', '#F1F8F0', '#1A2D1F', '#7DAA5F'],
    dark: false,
  },
  {
    id: 'calm-blue-devotion',
    name: 'Calm Blue Devotion',
    nameMarathi: 'शांत निळी भक्ती',
    emoji: '🔵',
    desc: 'गडद निळा, एकाग्र आणि शांत',
    colors: ['#1565C0', '#0A2744', '#F0F4FF', '#0A1929', '#4FC3F7'],
    dark: false,
  },
  {
    id: 'mystic-purple',
    name: 'Mystic Purple',
    nameMarathi: 'रहस्यमय जांभळा',
    emoji: '🔮',
    desc: 'जांभळा रंग, आध्यात्मिक अनुभव',
    colors: ['#7B2D8B', '#3A0D4A', '#F8F0FF', '#200830', '#CE93D8'],
    dark: false,
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    nameMarathi: 'सुंदर गडद',
    emoji: '🌙',
    desc: 'रात्रीसारखा गडद, सोनेरी झळाळ',
    colors: ['#D4AF37', '#E8CC72', '#1A1A2E', '#E8DCC8', '#FF8C42'],
    dark: true,
  },
  {
    id: 'festive-bright',
    name: 'Festive Bright',
    nameMarathi: 'उत्सवी चमकदार',
    emoji: '🎉',
    desc: 'उत्साहपूर्ण, सण साजरा करण्यासाठी',
    colors: ['#FF6B35', '#C0392B', '#FFFDE7', '#1A0A00', '#FFD700'],
    dark: false,
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    nameMarathi: 'साधे पांढरे',
    emoji: '⬜',
    desc: 'स्वच्छ, साधे, आधुनिक रूप',
    colors: ['#555555', '#222222', '#FAFAFA', '#111111', '#888888'],
    dark: false,
  },
];

// Premium palettes (admin → थीम व्यवस्थापन). `swatches` are the three signature colours shown on
// the card; `preview` paints the miniature dashboard on the card (fixed colours, so every card
// shows its own theme whatever theme is active). The live colours are in styles/themes.css.
export const PREMIUM_THEMES = [
  {
    id: 'mocha-elegance',
    name: 'Mocha Elegance',
    nameMarathi: 'मोका एलिगन्स',
    tagline: 'Warm & Premium',
    emoji: '☕',
    desc: 'मोका तपकिरी, शॅम्पेन सोनेरी आणि जळक्या अंबराचे उबदार, राजस रूप.',
    swatches: [['Mocha Brown', '#5B4632'], ['Champagne Gold', '#F4D9A0'], ['Burnt Amber', '#C8792C']],
    colors: ['#5B4632', '#F4D9A0', '#C8792C', '#FAF6EF', '#30251D'],
    preview: { sidebar: '#F3E8D8', nav: '#EBD2AE', navText: '#5B4632', header: '#5B4632', headerText: '#F4D9A0', bg: '#FAF6EF', card: '#FFFFFF', border: '#E4D2B8', text: '#30251D', muted: '#796958', button: '#C8792C', buttonText: '#FFFFFF', accent: '#F4D9A0' },
    dark: false,
  },
  {
    id: 'creative-lemon',
    name: 'Creative Lemon',
    nameMarathi: 'क्रिएटिव्ह लेमन',
    tagline: 'Bold & Modern',
    emoji: '🍋',
    desc: 'कोळशासारखा काळा, लिंबू पिवळा आणि इलेक्ट्रिक लॅव्हेंडरचे ठळक, आधुनिक रूप.',
    swatches: [['Lemon', '#FFF21A'], ['Charcoal Black', '#171717'], ['Electric Lavender', '#7A45F5']],
    colors: ['#171717', '#FFF21A', '#7A45F5', '#F8F8F4', '#171717'],
    preview: { sidebar: '#F1F0E9', nav: '#FFF7A3', navText: '#171717', header: '#171717', headerText: '#FFF21A', bg: '#F8F8F4', card: '#FFFFFF', border: '#DEDDD3', text: '#171717', muted: '#626262', button: '#171717', buttonText: '#FFF21A', accent: '#7A45F5' },
    dark: false,
  },
  {
    id: 'forest-crimson',
    name: 'Forest Crimson',
    nameMarathi: 'फॉरेस्ट क्रिम्सन',
    tagline: 'Elegant & Sophisticated',
    emoji: '🌲',
    desc: 'गडद वनहिरवा, कोळशासारखा काळा आणि किरमिजी लालचे सुसंस्कृत, प्रीमियम रूप.',
    swatches: [['Charcoal Black', '#171717'], ['Forest Green', '#06110C'], ['Crimson Red', '#A31C1B']],
    colors: ['#06110C', '#171717', '#A31C1B', '#F5F7F5', '#17241D'],
    preview: { sidebar: '#EAF0EB', nav: '#DCE9DF', navText: '#06110C', header: '#06110C', headerText: '#FFFFFF', bg: '#F5F7F5', card: '#FFFFFF', border: '#D4DFD7', text: '#17241D', muted: '#64736A', button: '#A31C1B', buttonText: '#FFFFFF', accent: '#A31C1B' },
    dark: false,
  },
];

export const FESTIVAL_THEME_OPTIONS = [
  { id: 'ganpati',      name: 'Ganesh Chaturthi', nameMarathi: 'गणेश चतुर्थी', emoji: '🐘' },
  { id: 'diwali',       name: 'Diwali',            nameMarathi: 'दिवाळी',        emoji: '🪔' },
  { id: 'navratri',     name: 'Navratri',           nameMarathi: 'नवरात्री',      emoji: '🌸' },
  { id: 'pitru-paksha', name: 'Pitru Paksha',       nameMarathi: 'पितृपक्ष',     emoji: '🕯️' },
  { id: 'shravan',      name: 'Shravan',             nameMarathi: 'श्रावण',        emoji: '🍃' },
  // Allow premium and preset themes too
  ...[...PREMIUM_THEMES, ...PRESET_THEMES].map(t => ({ id: t.id, name: t.name, nameMarathi: t.nameMarathi, emoji: t.emoji })),
];

export const ALL_THEMES = [
  ...PREMIUM_THEMES,
  ...PRESET_THEMES,
  { id: 'ganpati',      name: 'Ganpati',      nameMarathi: 'गणेश चतुर्थी', emoji: '🐘', colors: ['#FF6B00', '#8B0000', '#FFF3E0', '#3D0000', '#FFD700'], dark: false },
  { id: 'diwali',       name: 'Diwali',       nameMarathi: 'दिवाळी',        emoji: '🪔', colors: ['#FFD700', '#FF6B00', '#1A0D00', '#FFE4B0', '#FF4500'], dark: true  },
  { id: 'navratri',     name: 'Navratri',     nameMarathi: 'नवरात्री',      emoji: '🌸', colors: ['#E91E8C', '#9C1A5A', '#FFF0F5', '#3D0020', '#FF8C00'], dark: false },
  { id: 'pitru-paksha', name: 'Pitru Paksha', nameMarathi: 'पितृपक्ष',     emoji: '🕯️', colors: ['#78909C', '#37474F', '#F5F5F5', '#263238', '#90A4AE'], dark: false },
  { id: 'shravan',      name: 'Shravan',      nameMarathi: 'श्रावण',        emoji: '🍃', colors: ['#388E3C', '#1B5E20', '#F1F8E9', '#0D3012', '#AED581'], dark: false },
];

export const THEME_MODE_OPTIONS = [
  {
    id: 'manual',
    label: 'Manual',
    labelMarathi: 'मॅन्युअल',
    emoji: '🎨',
    desc: 'आपण निवडलेली थीम नेहमी वापरली जाईल.',
  },
  {
    id: 'festival',
    label: 'Festival Auto',
    labelMarathi: 'सण-आधारित',
    emoji: '🎉',
    desc: 'सणाच्या दिवशी आपोआप सण थीम लागू होईल. इतर वेळी डिफॉल्ट.',
  },
  {
    id: 'auto',
    label: 'Smart Auto',
    labelMarathi: 'स्मार्ट ऑटो',
    emoji: '✨',
    desc: 'सण असल्यास सण थीम, नाहीतर निवडलेली थीम आपोआप लागू होईल.',
  },
];

export function getThemeById(id) {
  return ALL_THEMES.find(t => t.id === id) || PRESET_THEMES[0];
}
