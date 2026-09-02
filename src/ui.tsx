import React from 'react';
import { THEME } from './colors';
import { FONTS, TYPOGRAPHY } from './fonts';

export const Card = ({ children, style }: any) => (
  <div style={{
    background: THEME.bg.card,
    border: `1px solid ${THEME.border.base}`,
    borderRadius: 8,
    padding: '20px 22px',
    boxSizing: 'border-box',
    boxShadow: '0 2px 8px -2px rgba(29, 26, 22, 0.04)',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    ...style
  }}>{children}</div>
);

export const cardTitle = {
  ...TYPOGRAPHY.cardTitle,
  color: THEME.text.muted,
  marginBottom: 14,
  letterSpacing: '0.14em'
};

export const Label = ({ children }: any) => (
  <div style={{
    fontFamily: FONTS.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: THEME.text.secondary,
    marginBottom: 6,
    fontWeight: 600
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

export const Empty = ({ text, title = "Journal vide", action, actionLabel }: any) => (
  <div style={{
    padding: '40px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: THEME.bg.soft,
    borderRadius: 8,
    border: `2px dashed ${THEME.border.strong}`
  }}>
    <div style={{ fontFamily: FONTS.display, fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.04em', color: THEME.text.primary }}>
      {title}
    </div>
    <p style={{ fontSize: 13, color: THEME.text.muted, margin: 0, maxWidth: 420 }}>
      {text}
    </p>
    {action && actionLabel && (
      <button onClick={action} style={{ ...primaryBtn, marginTop: 6 }}>
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
      borderTop: `3px solid ${finalAccent}`,
      borderRadius: 8,
      padding: '16px 18px',
      minWidth: 0,
      boxSizing: 'border-box',
      boxShadow: '0 2px 6px -1px rgba(29, 26, 22, 0.04)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: FONTS.mono,
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: THEME.text.muted,
        fontWeight: 600,
        marginBottom: 8,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {Icon && <Icon size={13} color={finalAccent} style={{ flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div style={{
        fontFamily: FONTS.display,
        color: THEME.text.primary,
        fontSize: 'clamp(20px, 4vw, 26px)',
        fontWeight: 500,
        letterSpacing: '0.01em',
        lineHeight: 1.1,
        wordBreak: 'break-word'
      }}>
        {value}
      </div>
      {subvalue && (
        <div style={{
          fontFamily: FONTS.mono,
          fontSize: 11,
          color: THEME.text.muted,
          marginTop: 5,
          fontWeight: 500,
          letterSpacing: '0.04em'
        }}>
          {subvalue}
        </div>
      )}
    </div>
  );
};

export const SectionHeader = ({ title, action, actionLabel }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px', gap: 12, flexWrap: 'wrap' }}>
    <div style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary }}>{title}</div>
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
    background: 'rgba(29, 26, 22, 0.65)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backdropFilter: 'blur(4px)'
  }}>
    <div className="modal-container" style={{
      background: THEME.bg.card,
      borderRadius: 10,
      padding: '24px 28px',
      width: '100%',
      maxWidth: 560,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
      border: `1px solid ${THEME.border.strong}`,
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        paddingBottom: 12,
        borderBottom: `1px solid ${THEME.border.base}`
      }}>
        <div style={{
          fontFamily: FONTS.display,
          color: THEME.text.primary,
          fontSize: 20,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: THEME.text.muted,
            lineHeight: 1,
            padding: '0 6px',
            borderRadius: 4
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
  height: 40,
  padding: '0 14px',
  borderRadius: 6,
  border: `1px solid ${THEME.border.strong}`,
  fontSize: 13.5,
  background: THEME.bg.card,
  boxSizing: 'border-box' as const,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

export const selectStyle = { ...inputStyle, cursor: 'pointer' };

export const primaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: THEME.text.primary,
  color: THEME.bg.base,
  border: '1px solid transparent',
  borderRadius: 6,
  padding: '0 20px',
  fontFamily: FONTS.mono,
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  height: 40,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
  transition: 'transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease',
};

export const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: THEME.bg.card,
  border: `1px solid ${THEME.border.strong}`,
  borderRadius: 6,
  padding: '8px 16px',
  fontFamily: FONTS.mono,
  fontSize: 11.5,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: THEME.text.primary,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
  height: 38,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

export const iconBtn = {
  background: 'transparent',
  border: 'none',
  color: THEME.accent.danger,
  cursor: 'pointer',
  padding: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
};

export const rowCard = {
  display: 'flex',
  justify: 'space-between',
  alignItems: 'center',
  background: THEME.bg.card,
  border: `1px solid ${THEME.border.base}`,
  borderRadius: 6,
  padding: '14px 18px',
  gap: 12,
  flexWrap: 'wrap' as const,
  boxSizing: 'border-box' as const,
  boxShadow: '0 1px 4px rgba(29, 26, 22, 0.02)',
};

export const tooltipStyle = {
  background: THEME.text.primary,
  border: 'none',
  borderRadius: 4,
  fontFamily: FONTS.mono,
  fontSize: 11,
  color: THEME.text.light
};



