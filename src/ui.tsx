import React from 'react';
import { THEME } from './colors';
import { TYPOGRAPHY } from './fonts';

export const Card = ({ children, style }: any) => (
  <div style={{
    background: THEME.bg.card,
    border: `1px solid ${THEME.border.base}`,
    borderRadius: 14,
    padding: '20px 22px',
    boxSizing: 'border-box',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    ...style
  }}>{children}</div>
);

export const cardTitle = { ...TYPOGRAPHY.cardTitle, color: THEME.text.muted, marginBottom: 14, letterSpacing: '0.05em' };

export const Label = ({ children }: any) => <div style={{ ...TYPOGRAPHY.label, color: THEME.text.secondary, marginBottom: 6, fontSize: 12.5, fontWeight: 600 }}>{children}</div>;

export const Field = ({ label, children, style }: any) => (
  <div style={{ minWidth: 0, boxSizing: 'border-box', ...style }}>
    <Label>{label}</Label>
    {children}
  </div>
);

export const Empty = ({ text }: any) => (
  <div style={{ padding: '36px 20px', textAlign: 'center', color: THEME.text.muted, fontSize: 14, background: THEME.bg.soft, borderRadius: 12, border: `1px dashed ${THEME.border.strong}` }}>
    {text}
  </div>
);

export const Stat = ({ label, value, subvalue, icon: Icon, accent = THEME.accent.primary, color }: any) => {
  const finalAccent = color || accent || THEME.accent.primary;
  return (
    <div style={{
      background: THEME.bg.card,
      border: `1px solid ${THEME.border.base}`,
      borderTop: `3px solid ${finalAccent}`,
      borderRadius: 14,
      padding: '16px 18px',
      minWidth: 0,
      boxSizing: 'border-box',
      boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.text.muted, fontSize: 12, fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
        {Icon && <Icon size={14} color={finalAccent} style={{ flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div style={{ ...TYPOGRAPHY.statValue, color: THEME.text.primary, fontSize: 'clamp(17px, 3.8vw, 22px)', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>{value}</div>
      {subvalue && <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4, fontWeight: 600 }}>{subvalue}</div>}
    </div>
  );
};

export const SectionHeader = ({ title, action, actionLabel }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 16px', gap: 12, flexWrap: 'wrap' }}>
    <div style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, letterSpacing: '0.06em' }}>{title}</div>
    {actionLabel && <button onClick={action} style={ghostBtn as any}>{actionLabel}</button>}
  </div>
);

export const Modal = ({ title, onClose, children }: any) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px)' }}>
    <div className="modal-container" style={{
      background: THEME.bg.card,
      borderRadius: 20,
      padding: '24px 28px',
      width: '100%',
      maxWidth: 560,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
      border: `1px solid ${THEME.border.base}`,
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${THEME.border.base}` }}>
        <div style={{ ...TYPOGRAPHY.appTitle, color: THEME.text.primary, fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 24, color: THEME.text.muted, lineHeight: 1, padding: '0 6px', borderRadius: 6 }} title="Fermer">&times;</button>
      </div>
      <div style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: 2, margin: '0 -2px' }}>
        {children}
      </div>
    </div>
  </div>
);

export const inputStyle = {
  width: '100%',
  height: 42,
  padding: '0 14px',
  borderRadius: 10,
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
  gap: 6,
  background: `linear-gradient(135deg, ${THEME.accent.primary} 0%, #1D4ED8 100%)`,
  color: THEME.text.light,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 10,
  padding: '0 18px',
  fontWeight: 600,
  fontSize: 13.5,
  cursor: 'pointer',
  height: 40,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)',
  transition: 'transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
};
export const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: THEME.bg.card,
  border: `1px solid ${THEME.border.strong}`,
  borderRadius: 10,
  padding: '8px 16px',
  fontSize: 12.5,
  fontWeight: 600,
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
  borderRadius: 6,
};
export const rowCard = {
  display: 'flex',
  justify: 'space-between',
  alignItems: 'center',
  background: THEME.bg.card,
  border: `1px solid ${THEME.border.base}`,
  borderRadius: 10,
  padding: '14px 18px',
  gap: 12,
  flexWrap: 'wrap' as const,
  boxSizing: 'border-box' as const,
  boxShadow: '0 2px 6px rgba(44, 31, 22, 0.02)',
};
export const tooltipStyle = { background: THEME.text.primary, border: 'none', borderRadius: 8, fontSize: 12, color: THEME.text.light };


