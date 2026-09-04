/**
 * Thème Signature "Comptoir Central" — Décliné de l'emblème Or Stellaire & Saphir Impérial
 * Harmonie prestigieuse entre l'Obsidienne Titane (#151821), l'Or Solaire (#D97706) et le Bleu Saphir (#2563EB).
 */

export const THEME = {
  brand: {
    blue: '#2563EB',         // Saphir Impérial / Action principale
    sapphire: '#1D4ED8',     // Saphir Profond
    gold: '#D97706',         // Or Impérial du Logo
    goldLight: '#F59E0B',    // Or Solaire
    goldChampagne: '#FDE68A',// Or Clair Ciselé
    amber: '#D97706',        // Ambre Royal
    terracotta: '#D97706',   // Or Ambré / Terracotta
    navy: '#0F172A',         // Ardoise Nuit
    obsidian: '#151821',     // Obsidienne Titane (Boîtier Logo)
    emerald: '#10B981',      // Émeraude Flux & Profits
    red: '#EF4444',          // Rubis Alertes & Dettes
    dark: '#0B0D12',         // Nuit Profonde
    slate: '#64748B',        // Ardoise Neutre
    grayLight: '#F8FAFC',    // Platine Clair
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
    gold: 'var(--color-accent-gold)',
    goldLight: 'var(--color-accent-goldLight)',
    green: 'var(--color-accent-emerald)',
    greenLight: 'var(--color-accent-greenLight)',
    danger: 'var(--color-accent-danger)',
    dangerSoft: 'var(--color-accent-dangerSoft)',
    purple: 'var(--color-accent-purple)',
  },
  chart: [
    'var(--color-chart-0)', // Émeraude (Profits & Encaissements)
    'var(--color-chart-1)', // Saphir (Fret & Transit)
    'var(--color-chart-2)', // Or Stellaire (Achats & Import Chine)
    'var(--color-chart-3)', // Cobalt Nuit (Charges & Taxes)
    'var(--color-chart-4)', // Ambre (Autres)
  ],
};

export const CHART_COLORS = THEME.chart;
