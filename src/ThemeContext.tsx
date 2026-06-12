import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

/** All colour tokens a screen may reference. Every palette implements this shape. */
export interface ThemePalette {
  bg: string;
  bgAlt: string;
  card: string;
  cardAlt: string;
  border: string;
  track: string;
  text: string;
  textDim: string;
  muted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
}

// ── The 4 palettes from the founder's Stitch design kit ──────────────────────

const OBSIDIAN: ThemePalette = {
  bg: '#110E07', bgAlt: '#16130B', card: '#1F1B13', cardAlt: '#2A261C',
  border: '#332E22', track: '#2A261C', text: '#EDE6D6', textDim: '#D0C5AF', muted: '#99907C',
  primary: '#E8C24A', primaryDark: '#D4AF37', primarySoft: '#2A2310', onPrimary: '#2A1F00',
  accent: '#9FB4FF', accentSoft: '#1A1B26', success: '#34D399', warning: '#F5B544', danger: '#F2655C',
};

const ROYAL_NAVY: ThemePalette = {
  bg: '#0A0E1A', bgAlt: '#0E1424', card: '#131A2E', cardAlt: '#1A2238',
  border: '#243049', track: '#1E2740', text: '#F5F7FA', textDim: '#A6B0C3', muted: '#7A869E',
  primary: '#F4B740', primaryDark: '#E8A317', primarySoft: '#2A2410', onPrimary: '#0A0E1A',
  accent: '#2563EB', accentSoft: '#15203B', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
};

const EMERALD: ThemePalette = {
  bg: '#061410', bgAlt: '#0A1A14', card: '#14221E', cardAlt: '#1E2D28',
  border: '#2A3833', track: '#1E2D28', text: '#EAF5F0', textDim: '#BEC9C2', muted: '#89938C',
  primary: '#6FE3B0', primaryDark: '#4EDEA3', primarySoft: '#0E2A20', onPrimary: '#00251A',
  accent: '#A6F2CF', accentSoft: '#0E2A20', success: '#34D399', warning: '#F5B544', danger: '#FF7A70',
};

const AMETHYST: ThemePalette = {
  bg: '#100A1E', bgAlt: '#16102A', card: '#1B1430', cardAlt: '#251B40',
  border: '#332748', track: '#251B40', text: '#ECE4FA', textDim: '#CEC3D3', muted: '#978D9D',
  primary: '#C084FC', primaryDark: '#A855F7', primarySoft: '#241730', onPrimary: '#2C0051',
  accent: '#5DE6FF', accentSoft: '#07222B', success: '#34D399', warning: '#F5B544', danger: '#FF6B6B',
};

export type ThemeKey = 'obsidian' | 'navy' | 'emerald' | 'amethyst';

export const PALETTES: Record<ThemeKey, ThemePalette> = {
  obsidian: OBSIDIAN, navy: ROYAL_NAVY, emerald: EMERALD, amethyst: AMETHYST,
};

export const THEME_META: { key: ThemeKey; name: string; swatch: string; bg: string }[] = [
  { key: 'obsidian', name: 'Obsidian & Gold', swatch: OBSIDIAN.primary, bg: OBSIDIAN.bg },
  { key: 'navy', name: 'Royal Navy', swatch: ROYAL_NAVY.primary, bg: ROYAL_NAVY.bg },
  { key: 'emerald', name: 'Emerald Royale', swatch: EMERALD.primary, bg: EMERALD.bg },
  { key: 'amethyst', name: 'Midnight Amethyst', swatch: AMETHYST.primary, bg: AMETHYST.bg },
];

const THEME_KEY = 'samrat_theme';
const DEFAULT_THEME: ThemeKey = 'obsidian';

interface ThemeContextValue {
  colors: ThemePalette;
  themeKey: ThemeKey;
  setTheme: (k: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(DEFAULT_THEME);

  useEffect(() => {
    (async () => {
      try {
        const saved = (await SecureStore.getItemAsync(THEME_KEY)) as ThemeKey | null;
        if (saved && PALETTES[saved]) setThemeKey(saved);
      } catch { /* default */ }
    })();
  }, []);

  const setTheme = useCallback((k: ThemeKey) => {
    setThemeKey(k);
    SecureStore.setItemAsync(THEME_KEY, k).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ colors: PALETTES[themeKey] || OBSIDIAN, themeKey, setTheme }),
    [themeKey, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { colors: OBSIDIAN, themeKey: DEFAULT_THEME, setTheme: () => {} };
  return ctx;
}

/** One-liner for screens: `const { colors, styles } = useThemed(makeStyles)`. */
export function useThemed<T>(make: (c: ThemePalette) => T): { colors: ThemePalette; styles: T } {
  const { colors } = useTheme();
  const styles = useMemo(() => make(colors), [colors, make]);
  return { colors, styles };
}
