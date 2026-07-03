// src/context/LanguageContext.jsx — MR / HI / EN language selector
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({ lang: 'mr', setLang: () => {}, toggleLang: () => {} });

// Set or clear the googtrans cookie (Google Translate reads this on page load)
function setGoogTransCookie(targetLang) {
  const host   = window.location.hostname;
  const cleared = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  const future  = 'expires=Fri, 01 Jan 2100 00:00:00 UTC; path=/';

  // Build all domain variants to clear
  const domains = [host];
  const parts = host.split('.');
  for (let i = 0; i < parts.length; i++) {
    const d = parts.slice(i).join('.');
    if (d) { domains.push(d); domains.push('.' + d); }
  }

  // Clear all variants
  for (const d of domains) {
    document.cookie = `googtrans=; ${cleared}; domain=${d}`;
  }
  document.cookie = `googtrans=; ${cleared}`;

  if (targetLang !== 'mr') {
    const val = `/mr/${targetLang}`;
    document.cookie = `googtrans=${val}; ${future}`;
    for (const d of domains) {
      document.cookie = `googtrans=${val}; ${future}; domain=${d}`;
    }
  }
}

export function LanguageProvider({ children }) {
  // Use localStorage as single source of truth — cookie is only for Google Translate trigger
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('pojjari_lang') || 'mr';
  });

  // For non-Marathi: intercept React Router's pushState so every SPA navigation
  // triggers a full page reload — Google Translate needs this to re-translate new content
  useEffect(() => {
    if (lang === 'mr') return;

    const origPush    = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args) => {
      origPush(...args);
      window.location.reload();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      window.location.reload();
    };

    return () => {
      history.pushState    = origPush;
      history.replaceState = origReplace;
    };
  }, [lang]);

  const setLang = (targetLang) => {
    if (targetLang === lang) return;
    setGoogTransCookie(targetLang);
    localStorage.setItem('pojjari_lang', targetLang);
    setLangState(targetLang);
    window.location.reload();
  };

  // Keep legacy toggleLang (MR ↔ EN) for any code that still calls it
  const toggleLang = () => setLang(lang === 'mr' ? 'en' : 'mr');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
