import React, { createContext, useContext, useEffect } from 'react';

/* ─── BUILT-IN THEME DEFINITION ─────────────────────────── */
export const VYRAION_COMMAND_THEME = {
  id: 'vyraion-command',
  name: 'Vyraion Command',
  emoji: '🌌',
  vars: {
    '--th-bg':          '#070B14',
    '--th-surface':     '#0F1629',
    '--th-card':        'rgba(15,22,41,0.82)',
    '--th-panel':       'rgba(17,24,39,0.82)',
    '--th-border':      'rgba(255,255,255,0.08)',
    '--th-border-glow': 'rgba(51,200,255,0.35)',
    '--th-primary':     '#33C8FF',
    '--th-accent':      '#7C5CFF',
    '--th-text':        '#F1F5F9',
    '--th-muted':       '#64748B',
    '--th-sidebar':     '#0B101D',
    '--th-header':      'rgba(11,16,29,0.85)',
    '--th-grid':        'rgba(255,255,255,0.015)',
    '--th-glow1':       'rgba(51,200,255,0.08)',
    '--th-glow2':       'rgba(124,92,255,0.07)',
  }
};

export const THEMES = {
  'vyraion-command': VYRAION_COMMAND_THEME,
  midnight: VYRAION_COMMAND_THEME
};

/* ─── CONTEXT ───────────────────────────────────────────── */
const ThemeContext = createContext({
  themeId: 'vyraion-command',
  theme: VYRAION_COMMAND_THEME,
  setThemeId: () => {}
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(VYRAION_COMMAND_THEME.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', 'vyraion-command');
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId: 'vyraion-command', theme: VYRAION_COMMAND_THEME, setThemeId: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

