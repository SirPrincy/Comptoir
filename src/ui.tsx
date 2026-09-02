import React from 'react';
import { THEME } from './colors';
import { FONTS, TYPOGRAPHY } from './fonts';
import { ComptoirMonogram, ComptoirLogo, ComptoirSceau, BrandIcon } from './components/ComptoirLogo';

export { ComptoirMonogram, ComptoirLogo, ComptoirSceau, BrandIcon };

/**
 * Système d'élévation et de rayons continus style Apple (Human Interface Guidelines)
 */
export const RADIUS = {
  micro: 6,       // micro-indicateurs, pastilles de statut
  tag: 8,         // étiquettes techniques, badges de comptabilité
  control: 10,    // boutons, champs de saisie, sélecteurs, onglets
  item: 12,       // lignes de listes isolées, sous-blocs imbriqués
  card: 16,       // panneaux de contenu, cartes statistiques, graphiques
  container: 18,  // barres de filtres principales, récapitulatifs
  modal: 22,      // fenêtres modales, dialogues centrés
  drawer: 24,     // tiroir de navigation latérale
  pill: 9999,     // badges arrondis, pastilles complètes
};

export const SHADOWS = {
  none: 'none',
  inset: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
  subtle: '0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
  card: '0 2px 12px -2px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
  raised: '0 4px 16px -2px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.03)',
  floating: '0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
  modal: '0 24px 64px -12px rgba(0, 0, 0, 0.18), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
  drawer: '12px 0 40px -4px rgba(0, 0, 0, 0.12)',
};

export const Card = ({ children, style }: any) => (
  <div style={{
    background: THEME.bg.card,
    border: `1px solid ${THEME.border.base}`,
    borderRadius: RADIUS.card,
    padding: '20px 22px',
    boxSizing: 'border-box',
    boxShadow: SHADOWS.card,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    ...style
  }}>{children}</div>
);

export const cardTitle = {
  ...TYPOGRAPHY.cardTitle,
  color: THEME.text.secondary,
  marginBottom: 14,
  letterSpacing: '-0.01em'
};

export const Label = ({ children }: any) => (
  <div style={{
    fontFamily: FONTS.body,
    fontSize: 12,
    letterSpacing: '-0.01em',
    color: THEME.text.secondary,
    marginBottom: 6,
    fontWeight: 500
  }}>
    {children}
  </div>
);

export const Field = ({ label, children, style }: any) => (
  <div style={{ minWidth: 0, boxSizing: 'border-box', ...style }}>
    <Label>{label}</Label>
    {children}
  </div>
);

export const Empty = ({ text, title = "Aucun élément", action, actionLabel }: any) => (
  <div style={{
    padding: '44px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: THEME.bg.card,
    borderRadius: RADIUS.card,
    border: `1px solid ${THEME.border.base}`,
    boxShadow: SHADOWS.subtle,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ width: 48, height: 48, borderRadius: RADIUS.pill, background: THEME.bg.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      <ComptoirMonogram size={26} variant="outline" />
    </div>
    <div style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: THEME.text.primary, position: 'relative', zIndex: 1 }}>
      {title}
    </div>
    <p style={{ fontSize: 13, color: THEME.text.muted, margin: 0, maxWidth: 420, lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
      {text}
    </p>
    {action && actionLabel && (
      <button onClick={action} style={{ ...primaryBtn, marginTop: 8, position: 'relative', zIndex: 1 }}>
        {actionLabel}
      </button>
    )}
  </div>
);

export const Stat = ({ label, value, subvalue, icon: Icon, accent = THEME.accent.primary, color }: any) => {
  const finalAccent = color || accent || THEME.accent.primary;
  return (
    <div style={{
      background: THEME.bg.card,
      border: `1px solid ${THEME.border.base}`,
      borderRadius: RADIUS.card,
      padding: '18px 20px',
      minWidth: 0,
      boxSizing: 'border-box',
      boxShadow: SHADOWS.card,
      transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: FONTS.body,
          fontSize: 12,
          fontWeight: 500,
          color: THEME.text.secondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{label}</span>
        {Icon && (
          <div style={{
            width: 26,
            height: 26,
            borderRadius: RADIUS.micro,
            background: `${finalAccent}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: finalAccent,
            flexShrink: 0
          }}>
            <Icon size={14} strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div style={{
        fontFamily: FONTS.display,
        color: THEME.text.primary,
        fontSize: 'clamp(22px, 3vw, 26px)',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.15,
        wordBreak: 'break-word'
      }}>
        {value}
      </div>
      {subvalue && (
        <div style={{
          fontFamily: FONTS.body,
          fontSize: 12,
          color: THEME.text.muted,
          marginTop: 6,
          fontWeight: 500,
          letterSpacing: '-0.01em'
        }}>
          {subvalue}
        </div>
      )}
    </div>
  );
};

export const SectionHeader = ({ title, action, actionLabel }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 18px', gap: 12, flexWrap: 'wrap' }}>
    <div style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, fontSize: 19 }}>{title}</div>
    {actionLabel && <button onClick={action} style={ghostBtn as any}>{actionLabel}</button>}
  </div>
);

export const Modal = ({ title, onClose, children }: any) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  }}>
    <div className="modal-container" style={{
      background: THEME.bg.card,
      borderRadius: RADIUS.modal,
      padding: '24px 28px',
      width: '100%',
      maxWidth: 580,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: SHADOWS.modal,
      border: `1px solid ${THEME.border.strong}`,
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        paddingBottom: 14,
        borderBottom: `1px solid ${THEME.border.base}`
      }}>
        <div style={{
          fontFamily: FONTS.display,
          color: THEME.text.primary,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.02em'
        }}>
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            background: THEME.bg.surface,
            border: 'none',
            cursor: 'pointer',
            width: 28,
            height: 28,
            borderRadius: RADIUS.pill,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.body,
            fontSize: 16,
            color: THEME.text.secondary,
            lineHeight: 1,
            transition: 'background-color 0.15s ease'
          }}
          title="Fermer"
        >
          &times;
        </button>
      </div>
      <div style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: 2, margin: '0 -2px' }}>
        {children}
      </div>
    </div>
  </div>
);

export const inputStyle = {
  width: '100%',
  height: 38,
  padding: '0 14px',
  borderRadius: RADIUS.control,
  border: `1px solid ${THEME.border.strong}`,
  fontSize: 13.5,
  fontFamily: FONTS.body,
  background: THEME.bg.card,
  color: THEME.text.primary,
  boxSizing: 'border-box' as const,
  outline: 'none',
  boxShadow: SHADOWS.inset,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

export const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  boxShadow: SHADOWS.subtle
};

export const brandBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  background: THEME.brand.blue,
  color: '#FFFFFF',
  border: '1px solid transparent',
  borderRadius: RADIUS.control,
  padding: '0 18px',
  fontFamily: FONTS.body,
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '-0.01em',
  cursor: 'pointer',
  height: 38,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 1px 3px rgba(0, 113, 227, 0.25)',
};

export const terracottaBtn = {
  ...brandBtn,
  background: THEME.brand.amber,
  boxShadow: '0 1px 3px rgba(255, 149, 0, 0.25)',
};

export const emeraldBtn = {
  ...brandBtn,
  background: THEME.brand.emerald,
  boxShadow: '0 1px 3px rgba(52, 199, 89, 0.25)',
};

export const navyBtn = {
  ...brandBtn,
  background: THEME.brand.navy,
  boxShadow: '0 1px 3px rgba(30, 58, 95, 0.25)',
};

export const primaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  background: THEME.text.primary,
  color: THEME.bg.card,
  border: '1px solid transparent',
  borderRadius: RADIUS.control,
  padding: '0 18px',
  fontFamily: FONTS.body,
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '-0.01em',
  cursor: 'pointer',
  height: 38,
  whiteSpace: 'nowrap' as const,
  boxShadow: SHADOWS.subtle,
};

export const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: THEME.bg.surface,
  border: `1px solid ${THEME.border.base}`,
  borderRadius: RADIUS.control,
  padding: '0 14px',
  fontFamily: FONTS.body,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  color: THEME.text.primary,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  height: 36,
  boxShadow: 'none',
};

export const iconBtn = {
  background: 'transparent',
  border: `1px solid transparent`,
  color: THEME.accent.danger,
  cursor: 'pointer',
  padding: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: RADIUS.control,
};

export const rowCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: THEME.bg.card,
  border: `1px solid ${THEME.border.base}`,
  borderRadius: RADIUS.item,
  padding: '14px 18px',
  gap: 12,
  flexWrap: 'wrap' as const,
  boxSizing: 'border-box' as const,
  boxShadow: SHADOWS.subtle,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
};

export const tooltipStyle = {
  background: THEME.text.primary,
  border: 'none',
  borderRadius: RADIUS.tag,
  fontFamily: FONTS.body,
  fontSize: 12,
  color: THEME.text.light,
  boxShadow: SHADOWS.floating,
};




