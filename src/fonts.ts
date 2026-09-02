/**
 * Configuration et constantes typographiques de Comptoir ERP (Variation 7 - Refined Architectural Craft)
 */

export const FONTS = {
  display: "'Oswald', sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const TYPOGRAPHY = {
  fontFamily: FONTS.body,
  displayFont: FONTS.display,
  monoFont: FONTS.mono,
  
  // Styles typographiques réutilisables
  appTitle: {
    fontFamily: FONTS.display,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.15,
  },
  heroTitle: {
    fontFamily: FONTS.display,
    fontWeight: 600,
    fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
    letterSpacing: '-0.01em',
    lineHeight: 0.95,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 15,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: '0.01em',
    lineHeight: 1.1,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: 500,
  },
  sidebarLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.18em',
    opacity: 0.7,
  },
  badge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  number: {
    fontFamily: FONTS.display,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
};

