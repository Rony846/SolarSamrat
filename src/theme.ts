/**
 * "Royal Dark" — Solar Samrat's command-center theme. Deep navy-black with
 * royal gold (the Samrat crown) and an electric-blue energy accent.
 */
export const colors = {
  bg: '#0A0E1A',
  bgAlt: '#0E1424',
  card: '#131A2E',
  cardAlt: '#1A2238',
  border: '#243049',
  track: '#1E2740',

  text: '#F5F7FA',
  textDim: '#A6B0C3',
  muted: '#7A869E',

  primary: '#F4B740',      // royal gold
  primaryDark: '#E8A317',
  primarySoft: '#2A2410',
  onPrimary: '#0A0E1A',

  accent: '#2563EB',       // electric blue
  accentSoft: '#15203B',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 22, pill: 999,
} as const;

export const font = {
  size: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, hero: 32 },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    heavy: '700' as const,
    black: '800' as const,
  },
} as const;

export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

// Rank → colour, used by the crown/status chips across the app.
export const RANK_COLOR: Record<string, string> = {
  Sipahi: '#7A869E',
  Sardar: '#B45309',
  Raja: '#F4B740',
  Maharaja: '#C026D3',
  Samrat: '#FACC15',
};
