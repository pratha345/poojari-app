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

export const FESTIVAL_THEME_OPTIONS = [
  { id: 'ganpati',      name: 'Ganesh Chaturthi', nameMarathi: 'गणेश चतुर्थी', emoji: '🐘' },
  { id: 'diwali',       name: 'Diwali',            nameMarathi: 'दिवाळी',        emoji: '🪔' },
  { id: 'navratri',     name: 'Navratri',           nameMarathi: 'नवरात्री',      emoji: '🌸' },
  { id: 'pitru-paksha', name: 'Pitru Paksha',       nameMarathi: 'पितृपक्ष',     emoji: '🕯️' },
  { id: 'shravan',      name: 'Shravan',             nameMarathi: 'श्रावण',        emoji: '🍃' },
  // Allow preset themes too
  ...PRESET_THEMES.map(t => ({ id: t.id, name: t.name, nameMarathi: t.nameMarathi, emoji: t.emoji })),
];

export const ALL_THEMES = [
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
