// src/components/common/FestivalBanner.jsx
import { useTheme } from '../../context/ThemeContext';
import { FESTIVAL_THEME_OPTIONS } from '../../themes/themes';

const FESTIVAL_MESSAGES = {
  'ganpati':      { text: 'गणपती बाप्पा मोरया! 🐘 गणेश चतुर्थीच्या हार्दिक शुभेच्छा!', emoji: '🐘' },
  'diwali':       { text: 'दीपावलीच्या हार्दिक शुभेच्छा! 🪔 आपल्या जीवनात प्रकाश येवो!', emoji: '🪔' },
  'navratri':     { text: 'नवरात्रीच्या हार्दिक शुभेच्छा! 🌸 जय माता दी!', emoji: '🌸' },
  'pitru-paksha': { text: 'पितृपक्षात पितरांना श्रद्धांजली अर्पण करा. 🙏', emoji: '🕯️' },
  'shravan':      { text: 'श्रावण मासाच्या हार्दिक शुभेच्छा! 🍃 ॐ नमः शिवाय!', emoji: '🍃' },
};

const FESTIVAL_IDS = new Set(Object.keys(FESTIVAL_MESSAGES));

export default function FestivalBanner() {
  const { theme, festival_name } = useTheme();

  if (!FESTIVAL_IDS.has(theme)) return null;

  const msg   = FESTIVAL_MESSAGES[theme];
  const label = festival_name || FESTIVAL_THEME_OPTIONS.find(f => f.id === theme)?.nameMarathi || '';

  return (
    <div
      className="festival-banner"
      data-emoji={msg.emoji}
      title={label}
      role="banner"
      aria-label={`${label} थीम सक्रिय आहे`}
    >
      {msg.text}
    </div>
  );
}
