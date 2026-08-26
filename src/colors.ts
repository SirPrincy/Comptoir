/**
 * Palette de couleurs et constantes de style de Comptoir ERP
 */

export const THEME = {
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
    orange: 'var(--color-accent-orange)',
    green: 'var(--color-accent-green)',
    greenLight: 'var(--color-accent-greenLight)',
    danger: 'var(--color-accent-danger)',
    dangerSoft: 'var(--color-accent-dangerSoft)',
    purple: 'var(--color-accent-purple)',
  },
  chart: [
    'var(--color-chart-0)',
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
  ],
};

export const CHART_COLORS = THEME.chart;
