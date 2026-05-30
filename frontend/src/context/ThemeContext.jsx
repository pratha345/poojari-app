// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const ThemeContext = createContext(null);

const CACHE_KEY  = 'pojjari_theme';
const POLL_MS    = 5 * 60 * 1000; // re-fetch every 5 min

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName || 'saffron-divine');
}

export function ThemeProvider({ children }) {
  const [themeData, setThemeData] = useState(() => {
    // Instant load from cache to avoid flash
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached?.theme) { applyTheme(cached.theme); return cached; }
    } catch {}
    return { theme: 'saffron-divine', mode: 'auto', festival_name: null };
  });

  const fetchTheme = useCallback(async () => {
    try {
      const slug   = sessionStorage.getItem('tenant_slug');
      const params = slug ? `?tenant_slug=${slug}` : '';
      const { data } = await api.get(`/theme${params}`);
      const td = data.data || data;
      setThemeData(td);
      applyTheme(td.theme);
      localStorage.setItem(CACHE_KEY, JSON.stringify(td));
    } catch {}
  }, []);

  // Initial fetch
  useEffect(() => { fetchTheme(); }, [fetchTheme]);

  // Poll for festival auto-switching
  useEffect(() => {
    const id = setInterval(fetchTheme, POLL_MS);
    return () => clearInterval(id);
  }, [fetchTheme]);

  const setThemeManually = useCallback((themeName) => {
    applyTheme(themeName);
    setThemeData(prev => ({ ...prev, theme: themeName }));
  }, []);

  return (
    <ThemeContext.Provider value={{ ...themeData, setThemeManually, refreshTheme: fetchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
