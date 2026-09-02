/**
 * Configuration et constantes typographiques de Comptoir ERP
 * Système typographique inspiré d'Apple Human Interface Guidelines :
 * SF Pro Display / SF Pro Text (-apple-system, BlinkMacSystemFont) pour une clarté absolue + SF Mono pour les montants et devises.
 */

export const FONTS = {
  primary: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif",
  display: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
};

export const TYPOGRAPHY = {
  fontFamily: FONTS.body,
  displayFont: FONTS.display,
  monoFont: FONTS.mono,
  
  // Hiérarchie typographique fluide et épurée style Apple
  heroTitle: {
    fontFamily: FONTS.display,
    fontWeight: 700,
    fontSize: 'clamp(26px, 3.8vw, 34px)',
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  pageTitle: {
    fontFamily: FONTS.display,
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    lineHeight: 1.25,
  },
  cardTitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  appTitle: {
    fontFamily: FONTS.display,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  kpiLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '-0.01em',
  },
  statValueMega: {
    fontFamily: FONTS.display,
    fontSize: 'clamp(24px, 2.8vw, 30px)',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodyDense: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    fontWeight: 500,
    lineHeight: 1.45,
  },
  sidebarLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  badge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  monoValue: {
    fontFamily: FONTS.mono,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
};


