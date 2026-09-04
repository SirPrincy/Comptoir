import React from 'react';
import { THEME } from '../colors';
import { FONTS } from '../fonts';
import { RADIUS, SHADOWS } from '../ui';
import { LucideIcon } from 'lucide-react';

interface MonogramProps {
  size?: number;
  variant?: 'solid' | 'outline' | 'stamp';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Monogramme officiel "Comptoir Central" - Style Apple App Icon
 * Squircle épuré avec dégradé subtil et glyphe géométrique de précision.
 */
export const ComptoirMonogram: React.FC<MonogramProps> = ({
  size = 36,
  variant = 'solid',
  className = '',
  style = {},
}) => {
  const squircleRadius = Math.round(size * 0.23);

  return (
    <div
      className={`comptoir-monogram ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        borderRadius: squircleRadius,
        background: variant === 'solid'
          ? `linear-gradient(145deg, #1D1D1F 0%, #2C2C2E 100%)`
          : variant === 'stamp'
            ? `linear-gradient(145deg, ${THEME.brand.blue} 0%, #0056B3 100%)`
            : 'transparent',
        border: variant === 'outline'
          ? `1.5px solid ${THEME.brand.blue}`
          : `1px solid rgba(255, 255, 255, 0.12)`,
        boxShadow: variant === 'solid' || variant === 'stamp'
          ? `0 3px 10px -2px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.25)`
          : SHADOWS.subtle,
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
        ...style,
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="monoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F80ED" />
            <stop offset="100%" stopColor="#0056B3" />
          </linearGradient>
          <linearGradient id="monoSILVER" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Cercle de calibrage horloger */}
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />

        {/* Branche Arrière du C (Flux d'import bleu) */}
        <path
          d="M 64 24 C 42 21, 23 34, 23 50 C 23 66, 42 79, 64 76"
          stroke={variant === 'outline' ? THEME.brand.blue : 'url(#monoBlueGrad)'}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Branche Avant dynamique (Flux argenté/blanc) */}
        <path
          d="M 66 35 C 52 32, 36 39, 36 50 C 36 61, 52 68, 66 65"
          stroke={variant === 'outline' ? 'rgba(0, 113, 227, 0.6)' : 'url(#monoSILVER)'}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Nœud focal cyan / pivot d'échange */}
        <circle cx="65" cy="50" r="5.5" fill="#38BDF8" />
        <circle cx="65" cy="50" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Logo complet "Comptoir Central" avec typographie SF Pro
 */
export const ComptoirLogo: React.FC<LogoProps> = ({
  size = 'md',
  subtitle,
  showSubtitle = true,
  onClick,
  style = {},
}) => {
  const monogramSize = size === 'sm' ? 28 : size === 'lg' ? 42 : 34;
  const titleSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const subSize = size === 'sm' ? 10.5 : size === 'lg' ? 12 : 11;

  return (
    <div
      onClick={onClick}
      className="comptoir-logo-lockup"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 8 : 10,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      <ComptoirMonogram size={monogramSize} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: titleSize,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: THEME.text.primary,
          }}
        >
          Comptoir <span style={{ color: THEME.brand.blue }}>Central</span>
        </div>
        {showSubtitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: FONTS.body,
              fontSize: subSize,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: THEME.text.secondary,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: THEME.brand.blue, fontWeight: 700 }}>•</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle || 'Négoce & Logistique'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface SceauProps {
  text?: string;
  subtext?: string;
  size?: number;
  color?: string;
}

/**
 * Sceau d'authentification pour documents & états vides
 */
export const ComptoirSceau: React.FC<SceauProps> = ({
  text = 'COMPTOIR CENTRAL',
  subtext = 'CONTRÔLE CONFORME',
  size = 100,
  color = THEME.brand.blue,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        border: `1.5px solid ${color}30`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        textAlign: 'center',
        opacity: 0.7,
        userSelect: 'none',
        pointerEvents: 'none',
        background: `${color}08`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: size * 0.1,
          fontWeight: 700,
          color: color,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: '50%',
          height: 1,
          background: color,
          margin: '4px 0',
          opacity: 0.3,
        }}
      />
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: size * 0.07,
          fontWeight: 500,
          color: color,
          letterSpacing: '-0.01em',
        }}
      >
        {subtext}
      </div>
    </div>
  );
};

interface BrandIconProps {
  icon: LucideIcon;
  size?: number;
  iconSize?: number;
  color?: string;
  bg?: string;
  border?: string;
  style?: React.CSSProperties;
}

/**
 * Encapsuleur d'icônes standardisé style Apple
 */
export const BrandIcon: React.FC<BrandIconProps> = ({
  icon: Icon,
  size = 32,
  iconSize = 16,
  color = THEME.brand.blue,
  bg = `${THEME.brand.blue}12`,
  border = `1px solid ${THEME.brand.blue}20`,
  style = {},
}) => {
  return (
    <div
      className="brand-icon-box"
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.control,
        background: bg,
        border: border,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        flexShrink: 0,
        boxShadow: 'none',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
        ...style,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.1} />
    </div>
  );
};

/**
 * Utilitaires pour exporter ou télécharger le logo officiel au format SVG
 */
export const downloadOfficialSvg = (variant: 'logo' | 'favicon' = 'logo') => {
  const fileName = variant === 'favicon' ? 'favicon.svg' : 'logo.svg';
  const a = document.createElement('a');
  a.href = `/${fileName}`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const RAW_COMPTOIR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 120" width="100%" height="100%" fill="none">
  <defs>
    <linearGradient id="monogramBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1E242B" />
      <stop offset="50%" stopColor="#14181D" />
      <stop offset="100%" stopColor="#0B0D10" />
    </linearGradient>
    <linearGradient id="brandBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#2F80ED" />
      <stop offset="100%" stopColor="#0056B3" />
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#38BDF8" />
      <stop offset="100%" stopColor="#0284C7" />
    </linearGradient>
    <linearGradient id="silverSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#A1A1AA" stopOpacity="0.6" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.18" />
    </filter>
  </defs>

  <g transform="translate(10, 10)" filter="url(#subtleShadow)">
    <rect x="0" y="0" width="100" height="100" rx="24" fill="url(#monogramBg)" />
    <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.25" stroke="url(#silverSheen)" strokeWidth="1.2" strokeOpacity="0.25" fill="none" />
    <circle cx="50" cy="50" r="36" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="2 3" />
    <path d="M 64 24 C 42 21, 23 34, 23 50 C 23 66, 42 79, 64 76" stroke="url(#brandBlueGrad)" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M 66 35 C 52 32, 36 39, 36 50 C 36 61, 52 68, 66 65" stroke="url(#silverSheen)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    <circle cx="65" cy="50" r="5.5" fill="url(#accentGlow)" />
    <circle cx="65" cy="50" r="2.5" fill="#FFFFFF" />
  </g>

  <g transform="translate(130, 24)">
    <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="38" fontWeight="800" letterSpacing="-0.03em" fill="#18181B">
      COMPTOIR
      <tspan fill="url(#brandBlueGrad)" dx="8">CENTRAL</tspan>
    </text>
    <g transform="translate(2, 68)">
      <rect x="0" y="-8" width="14" height="4" rx="2" fill="url(#accentGlow)" />
      <text x="24" y="-3" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.18em" fill="#71717A">
        SYSTÈME ERP • GESTION, IMPORT &amp; NÉGOCE
      </text>
    </g>
  </g>
</svg>`;

/**
 * Composant Logo Vectoriel Pur SVG (intégré)
 */
export const ComptoirSvgLogo: React.FC<{
  width?: number | string;
  height?: number | string;
  isDark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  width = 240,
  height = 'auto',
  isDark = false,
  className = '',
  style = {},
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 540 120"
      width={width}
      height={height}
      fill="none"
      className={className}
      style={{ display: 'block', maxWidth: '100%', ...style }}
    >
      <defs>
        <linearGradient id="compMonoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E242B" />
          <stop offset="50%" stopColor="#14181D" />
          <stop offset="100%" stopColor="#0B0D10" />
        </linearGradient>
        <linearGradient id="compBrandBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2F80ED" />
          <stop offset="100%" stopColor="#0056B3" />
        </linearGradient>
        <linearGradient id="compAccentCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="compSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <g transform="translate(10, 10)">
        <rect x="0" y="0" width="100" height="100" rx="24" fill="url(#compMonoBg)" />
        <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.25" stroke="url(#compSilver)" strokeWidth="1.2" strokeOpacity="0.25" fill="none" />
        <circle cx="50" cy="50" r="36" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="2 3" />
        <path d="M 64 24 C 42 21, 23 34, 23 50 C 23 66, 42 79, 64 76" stroke="url(#compBrandBlue)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M 66 35 C 52 32, 36 39, 36 50 C 36 61, 52 68, 66 65" stroke="url(#compSilver)" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <circle cx="65" cy="50" r="5.5" fill="url(#compAccentCyan)" />
        <circle cx="65" cy="50" r="2.5" fill="#FFFFFF" />
      </g>

      <g transform="translate(130, 24)">
        <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="38" fontWeight="800" letterSpacing="-0.03em" fill={isDark ? '#F4F4F5' : '#18181B'}>
          COMPTOIR
          <tspan fill="url(#compBrandBlue)" dx="8">CENTRAL</tspan>
        </text>
        <g transform="translate(2, 68)">
          <rect x="0" y="-8" width="14" height="4" rx="2" fill="url(#compAccentCyan)" />
          <text x="24" y="-3" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.18em" fill={isDark ? '#A1A1AA' : '#71717A'}>
            SYSTÈME ERP • GESTION, IMPORT &amp; NÉGOCE
          </text>
        </g>
      </g>
    </svg>
  );
};

