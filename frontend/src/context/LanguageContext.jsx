// src/context/LanguageContext.jsx — MR / HI / EN language selector
// MR and EN use the built-in T[] dictionary; HI uses Google Translate cookie
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ lang: 'mr', setLang: () => {}, toggleLang: () => {} });

// Read current translation language from googtrans cookie
function getCookieLang() {
  const m = document.cookie.match(/googtrans=\/(?:mr|auto)\/([a-z]+)/);
  if (m && m[1] !== 'mr') return m[1];
  return null;
}

// Set or clear the googtrans cookie (Google Translate reads this on page load)
function setGoogTransCookie(targetLang) {
  const host    = window.location.hostname;
  const cleared = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  const future  = 'expires=Fri, 01 Jan 2100 00:00:00 UTC; path=/';

  if (targetLang === 'mr') {
    document.cookie = `googtrans=; ${cleared}`;
    document.cookie = `googtrans=; ${cleared}; domain=${host}`;
    document.cookie = `googtrans=; ${cleared}; domain=.${host}`;
  } else {
    const val = `/mr/${targetLang}`;
    document.cookie = `googtrans=${val}; ${future}`;
    document.cookie = `googtrans=${val}; ${future}; domain=${host}`;
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    // Cookie takes priority — reflects what Google Translate actually loaded
    const cookieLang = getCookieLang();
    if (cookieLang) return cookieLang;
    return localStorage.getItem('pojjari_lang') || 'mr';
  });

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
