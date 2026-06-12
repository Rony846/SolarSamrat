/**
 * "Obsidian & Gold Elite" — Solar Samrat's premium theme (from the founder's
 * Stitch design kit). Warm obsidian-black surfaces + champagne/polished gold,
 * Playfair Display serif for brand/display headings, Inter-style sans for UI.
 * Quiet-luxury "private club" aesthetic for the top tier of the solar trade.
 */
export const colors = {
  bg: '#110E07',          // obsidian (surface-container-lowest)
  bgAlt: '#16130B',       // surface
  card: '#1F1B13',        // surface-container-low
  cardAlt: '#2A261C',     // surface-container-high
  border: '#332E22',      // subtle warm outline
  track: '#2A261C',

  text: '#EDE6D6',        // warm white (on-surface)
  textDim: '#D0C5AF',     // champagne grey (on-surface-variant)
  muted: '#99907C',       // outline

  primary: '#E8C24A',     // polished gold
  primaryDark: '#D4AF37', // champagne gold
  primarySoft: '#2A2310', // gold-tinted surface (active chips)
  onPrimary: '#2A1F00',   // dark brown text on gold

  accent: '#9FB4FF',      // cool tertiary — RFQ/info accents
  accentSoft: '#1A1B26',

  success: '#34D399',
  warning: '#F5B544',
  danger: '#F2655C',
} as const;

// Brand / display serif (loaded in app/_layout). Used for wordmarks + heroes.
export const serif = 'PlayfairDisplay_700Bold';
export const serifSemi = 'PlayfairDisplay_600SemiBold';

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
  shadowOpacity: 0.45,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
} as const;

// Rank → colour (warm gold ladder), used by crown/status chips.
export const RANK_COLOR: Record<string, string> = {
  Sipahi: '#99907C',
  Sardar: '#C0892E',
  Raja: '#E8C24A',
  Maharaja: '#F0CC74',
  Samrat: '#FFE08A',
};
