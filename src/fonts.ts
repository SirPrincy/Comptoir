/**
 * Configuration et constantes typographiques de Comptoir ERP
 */

export const FONTS = {
  display: "'Space Grotesk', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export const TYPOGRAPHY = {
  fontFamily: FONTS.body,
  displayFont: FONTS.display,
  
  // Styles typographiques réutilisables
  appTitle: {
    fontFamily: FONTS.display,
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 12.5,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 19,
    fontWeight: 700,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    fontWeight: 500,
  },
  badge: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    fontWeight: 600,
  },
  number: {
    fontFamily: FONTS.display,
    fontWeight: 700,
  },
};
