import React from 'react';
import { THEME } from '../colors';
import { FONTS } from '../fonts';
import { RADIUS, SHADOWS } from '../ui';
import { LucideIcon } from 'lucide-react';

interface MonogramProps {
  size?: number;
  variant?: 'solid' | 'outline' | 'stamp' | 'glass';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Monogramme Comptoir Central — Design Signature Haute Précision
 * Géométrie pure : Hexagone biseauté / Cube isométrique architectural
 * symbolisant le transit international, le container de négoce et le "C" de Comptoir.
 */
export const ComptoirMonogram: React.FC<MonogramProps> = ({
  size = 36,
  variant = 'solid',
  className = '',
  style = {},
}) => {
  const squircleRadius = Math.round(size * 0.24);

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
        background:
          variant === 'solid'
            ? 'linear-gradient(145deg, #1C2028 0%, #0F1216 100%)'
            : variant === 'stamp'
              ? 'linear-gradient(145deg, #0071E3 0%, #004BB3 100%)'
              : variant === 'glass'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'transparent',
        border:
          variant === 'outline'
            ? `1.5px solid ${THEME.brand.blue}`
            : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          variant === 'solid' || variant === 'stamp'
            ? '0 3px 12px -2px rgba(10, 14, 20, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            : SHADOWS.subtle,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        ...style,
      }}
    >
      <svg
        width={size * 0.64}
        height={size * 0.64}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Dégradés premium haute définition */}
          <linearGradient id="cmTopFacet" x1="50" y1="14" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id="cmLeftFacet" x1="18" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#0F2468" />
          </linearGradient>

          <linearGradient id="cmRightFacet" x1="82" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="cmInnerEdge" x1="50" y1="28" x2="50" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="cmGoldAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Facette Supérieure (Toit isométrique du hub) */}
        <path
          d="M 50 14 L 81 31 L 50 48 L 19 31 Z"
          fill="url(#cmTopFacet)"
        />

        {/* Facette Gauche (Solide / Stock / Sécurité) */}
        <path
          d="M 19 33 L 48 49 L 48 83 L 19 67 Z"
          fill="url(#cmLeftFacet)"
        />

        {/* Facette Droite sculptée formant l'arche ouverte du "C" */}
        <path
          d="M 52 49 L 81 33 L 81 50 L 65 59 L 65 67 L 81 58 L 81 67 L 52 83 Z"
          fill="url(#cmRightFacet)"
        />

        {/* Ligne de faisceau central haute précision */}
        <path
          d="M 50 16 L 78 32 L 50 47 L 22 32 Z"
          stroke="url(#cmInnerEdge)"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Point focal d'échange et d'énergie commerciale (Or ambré) */}
        <circle cx="50" cy="48" r="3.5" fill="url(#cmGoldAccent)" />
        <circle cx="50" cy="48" r="1.5" fill="#FFFFFF" />
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
 * Logo complet "Comptoir Central" avec typographie moderne et raffinée
 */
export const ComptoirLogo: React.FC<LogoProps> = ({
  size = 'md',
  subtitle,
  showSubtitle = true,
  onClick,
  style = {},
}) => {
  const monogramSize = size === 'sm' ? 28 : size === 'lg' ? 40 : 33;
  const titleSize = size === 'sm' ? 14 : size === 'lg' ? 19 : 15.5;
  const subSize = size === 'sm' ? 10 : size === 'lg' ? 11.5 : 10.5;

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
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: titleSize,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: THEME.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>COMPTOIR</span>
          <span
            style={{
              color: THEME.brand.blue,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            CENTRAL
          </span>
        </div>
        {showSubtitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: FONTS.body,
              fontSize: subSize,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: THEME.text.muted,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: THEME.brand.blue, fontSize: 8 }}>◆</span>
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
 * Sceau d'authentification géométrique
 */
export const ComptoirSceau: React.FC<SceauProps> = ({
  text = 'COMPTOIR CENTRAL',
  subtext = 'CONTRÔLE CONFORME',
  size = 96,
  color = THEME.brand.blue,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        border: `1.5px solid ${color}35`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        textAlign: 'center',
        opacity: 0.8,
        userSelect: 'none',
        pointerEvents: 'none',
        background: `${color}06`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: size * 0.095,
          fontWeight: 800,
          color: color,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: '45%',
          height: 1,
          background: color,
          margin: '4px 0',
          opacity: 0.35,
        }}
      />
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: size * 0.065,
          fontWeight: 600,
          color: color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
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
 * Encapsuleur d'icônes standardisé
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
      <stop offset="0%" stopColor="#1C2028" />
      <stop offset="100%" stopColor="#0F1216" />
    </linearGradient>
    <linearGradient id="cmTopFacet" x1="50" y1="14" x2="50" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#60A5FA" />
      <stop offset="100%" stopColor="#2563EB" />
    </linearGradient>
    <linearGradient id="cmLeftFacet" x1="18" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#1E40AF" />
      <stop offset="100%" stopColor="#0F2468" />
    </linearGradient>
    <linearGradient id="cmRightFacet" x1="82" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#38BDF8" />
      <stop offset="100%" stopColor="#1D4ED8" />
    </linearGradient>
    <linearGradient id="cmInnerEdge" x1="50" y1="28" x2="50" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
    </linearGradient>
    <linearGradient id="cmGoldAccent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FDE047" />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
    <linearGradient id="brandBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#2563EB" />
      <stop offset="100%" stopColor="#0284C7" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0A0E14" floodOpacity="0.3" />
    </filter>
  </defs>

  <g transform="translate(12, 10)" filter="url(#subtleShadow)">
    <rect x="0" y="0" width="100" height="100" rx="24" fill="url(#monogramBg)" />
    <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.25" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" fill="none" />
    <path d="M 50 14 L 81 31 L 50 48 L 19 31 Z" fill="url(#cmTopFacet)" />
    <path d="M 19 33 L 48 49 L 48 83 L 19 67 Z" fill="url(#cmLeftFacet)" />
    <path d="M 52 49 L 81 33 L 81 50 L 65 59 L 65 67 L 81 58 L 81 67 L 52 83 Z" fill="url(#cmRightFacet)" />
    <path d="M 50 16 L 78 32 L 50 47 L 22 32 Z" stroke="url(#cmInnerEdge)" strokeWidth="1.2" fill="none" />
    <circle cx="50" cy="48" r="3.5" fill="url(#cmGoldAccent)" />
    <circle cx="50" cy="48" r="1.5" fill="#FFFFFF" />
  </g>

  <g transform="translate(132, 24)">
    <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="36" fontWeight="800" letterSpacing="-0.035em" fill="#18181B">
      COMPTOIR
      <tspan fill="url(#brandBlueGrad)" dx="8">CENTRAL</tspan>
    </text>
    <g transform="translate(2, 68)">
      <circle cx="4" cy="-4" r="3" fill="#0071E3" />
      <text x="16" y="-1" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.14em" fill="#64748B">
        GESTION, IMPORT CHINE &amp; NÉGOCE
      </text>
    </g>
  </g>
</svg>`;

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
        <linearGradient id="compIsoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1C2028" />
          <stop offset="100%" stopColor="#0F1216" />
        </linearGradient>
        <linearGradient id="compTopFacet" x1="50" y1="14" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="compLeftFacet" x1="18" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#0F2468" />
        </linearGradient>
        <linearGradient id="compRightFacet" x1="82" y1="44" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="compInnerEdge" x1="50" y1="28" x2="50" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="compGoldAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="compTextBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      <g transform="translate(12, 10)">
        <rect x="0" y="0" width="100" height="100" rx="24" fill="url(#compIsoBg)" />
        <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.25" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.15" fill="none" />
        <path d="M 50 14 L 81 31 L 50 48 L 19 31 Z" fill="url(#compTopFacet)" />
        <path d="M 19 33 L 48 49 L 48 83 L 19 67 Z" fill="url(#compLeftFacet)" />
        <path d="M 52 49 L 81 33 L 81 50 L 65 59 L 65 67 L 81 58 L 81 67 L 52 83 Z" fill="url(#compRightFacet)" />
        <path d="M 50 16 L 78 32 L 50 47 L 22 32 Z" stroke="url(#compInnerEdge)" strokeWidth="1.2" fill="none" />
        <circle cx="50" cy="48" r="3.5" fill="url(#compGoldAccent)" />
        <circle cx="50" cy="48" r="1.5" fill="#FFFFFF" />
      </g>

      <g transform="translate(132, 24)">
        <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="36" fontWeight="800" letterSpacing="-0.035em" fill={isDark ? '#F4F4F5' : '#18181B'}>
          COMPTOIR
          <tspan fill="url(#compTextBlue)" dx="8">CENTRAL</tspan>
        </text>
        <g transform="translate(2, 68)">
          <circle cx="4" cy="-4" r="3" fill="#0071E3" />
          <text x="16" y="-1" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="12" fontWeight="700" letterSpacing="0.14em" fill={isDark ? '#94A3B8' : '#64748B'}>
            GESTION, IMPORT CHINE &amp; NÉGOCE
          </text>
        </g>
      </g>
    </svg>
  );
};
