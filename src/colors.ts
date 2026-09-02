/**
 * Palette de couleurs raffinée inspirée du design Apple (Human Interface Guidelines)
 * Design épuré, contrastes doux, finitions précises et lisibilité maximale.
 */

export const THEME = {
  brand: {
    blue: '#0071E3',         // Apple Signature Blue / Action principale
    navy: '#1E3A5F',         // Apple Space Navy
    emerald: '#34C759',      // Apple Mint / Bénéfices, marges & succès
    terracotta: '#FF9500',   // Apple Tangerine / Alertes modérées & stocks
    amber: '#FF9500',        // Apple Orange
    indigo: '#5856D6',       // Apple Indigo
    purple: '#AF52DE',       // Apple Purple
    red: '#FF3B30',          // Apple Coral Red / Dettes & pertes
    dark: '#1D1D1F',         // Apple Charcoal / Encre principale
    slate: '#86868B',        // Apple Secondary Gray
    grayLight: '#F5F5F7',    // Apple System Canvas
  },
  bg: {
    base: 'var(--color-bg-base)',
    card: 'var(--color-bg-card)',
    surface: 'var(--color-bg-surface)',
    soft: 'var(--color-bg-soft)',
    inputDisabled: 'var(--color-bg-inputDisabled)',
    alert: 'var(--color-bg-alert)',
    chip: 'var(--color-bg-chip)',
  },
  border: {
    base: 'var(--color-border-base)',
    strong: 'var(--color-border-strong)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
    light: 'var(--color-text-light)',
  },
  accent: {
    primary: 'var(--color-accent-primary)',
    terracotta: 'var(--color-accent-terracotta)',
    emerald: 'var(--color-accent-emerald)',
    navy: 'var(--color-accent-navy)',
    amber: 'var(--color-accent-amber)',
    orange: 'var(--color-accent-amber)',
    green: 'var(--color-accent-emerald)',
    greenLight: 'var(--color-accent-greenLight)',
    danger: 'var(--color-accent-danger)',
    dangerSoft: 'var(--color-accent-dangerSoft)',
    purple: 'var(--color-accent-purple)',
  },
  chart: [
    'var(--color-chart-0)', // Apple Emerald (CA / Profits)
    'var(--color-chart-1)', // Apple Blue (Fret & Transit)
    'var(--color-chart-2)', // Apple Orange (Achats Chine)
    'var(--color-chart-3)', // Apple Indigo (Charges & Taxes)
    'var(--color-chart-4)', // Apple Purple (Autres)
  ],
};

export const CHART_COLORS = THEME.chart;

