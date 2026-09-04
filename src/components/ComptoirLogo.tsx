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
 * Monogramme Étoile des Mondes & Boussole Navigatrice
 * Symbole intemporel du commerce d'envergure : guidance, horizon, excellence et expansion sans frontières.
 */
export const ComptoirMonogram: React.FC<MonogramProps> = ({
  size = 36,
  variant = 'solid',
  className = '',
  style = {},
}) => {
  const squircleRadius = Math.round(size * 0.25);

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
            ? 'linear-gradient(145deg, #151821 0%, #0B0D12 100%)'
            : variant === 'stamp'
              ? 'linear-gradient(145deg, #1E3A8A 0%, #0F172A 100%)'
              : variant === 'glass'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'transparent',
        border:
          variant === 'outline'
            ? `1.5px solid #F59E0B`
            : '1px solid rgba(251, 191, 36, 0.22)',
        boxShadow:
          variant === 'solid' || variant === 'stamp'
            ? '0 4px 14px -2px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(254, 243, 199, 0.25)'
            : SHADOWS.subtle,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        ...style,
      }}
    >
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Or Stellaire Lumineux & Royal */}
          <linearGradient id="goldLightGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="goldDeepGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Anneau Méridien et Horizon */}
          <linearGradient id="meridianGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="sapphirePoint" x1="50" y1="50" x2="70" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Cercle Méridien Ciselé (Horizon Terrestre) */}
        <circle
          cx="50"
          cy="50"
          r="37"
          stroke="url(#meridianGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 3.5"
          opacity="0.4"
        />

        {/* Arc Majeur sculptant le "C" de Comptoir autour de l'étoile */}
        <path
          d="M 68 22 A 38 38 0 1 0 68 78"
          stroke="url(#meridianGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* Rayons Secondaires Intercardinaux (Platine/Saphir) */}
        <path d="M 50 50 L 71 29 L 55 46 Z" fill="url(#sapphirePoint)" />
        <path d="M 50 50 L 71 71 L 55 54 Z" fill="url(#sapphirePoint)" />
        <path d="M 50 50 L 29 71 L 45 54 Z" fill="url(#sapphirePoint)" />
        <path d="M 50 50 L 29 29 L 45 46 Z" fill="url(#sapphirePoint)" />

        {/* Branche NORD — Cap & Vision (Facette claire / Facette ambrée) */}
        <path d="M 50 14 L 50 50 L 43 45 Z" fill="url(#goldLightGrad)" />
        <path d="M 50 14 L 57 45 L 50 50 Z" fill="url(#goldDeepGrad)" />

        {/* Branche SUD — Ancrage & Solidité */}
        <path d="M 50 86 L 43 55 L 50 50 Z" fill="url(#goldDeepGrad)" />
        <path d="M 50 86 L 50 50 L 57 55 Z" fill="url(#goldLightGrad)" />

        {/* Branche EST — Source & Approvisionnement Orient */}
        <path d="M 86 50 L 55 43 L 50 50 Z" fill="url(#goldLightGrad)" />
        <path d="M 86 50 L 50 50 L 55 57 Z" fill="url(#goldDeepGrad)" />

        {/* Branche OUEST — Distribution & Marchés */}
        <path d="M 14 50 L 50 50 L 45 43 Z" fill="url(#goldDeepGrad)" />
        <path d="M 14 50 L 45 57 L 50 50 Z" fill="url(#goldLightGrad)" />

        {/* Diamant Central — Cœur d'Or Pur */}
        <polygon points="50,44 56,50 50,56 44,50" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="2.2" fill="#D97706" />
        <circle cx="50" cy="50" r="1" fill="#FFFFFF" />
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
 * Logo complet "Comptoir Central" avec typographie noble et baseline inspirante
 */
export const ComptoirLogo: React.FC<LogoProps> = ({
  size = 'md',
  subtitle,
  showSubtitle = true,
  onClick,
  style = {},
}) => {
  const monogramSize = size === 'sm' ? 28 : size === 'lg' ? 42 : 34;
  const titleSize = size === 'sm' ? 14 : size === 'lg' ? 19.5 : 16;
  const subSize = size === 'sm' ? 9.5 : size === 'lg' ? 11.5 : 10;

  // Baseline par défaut inspirante et prestigieuse
  const displaySubtitle = subtitle || "L'Audace sans frontières";

  return (
    <div
      onClick={onClick}
      className="comptoir-logo-lockup"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 9 : 11,
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
            fontWeight: 850,
            fontSize: titleSize,
            letterSpacing: '-0.035em',
            lineHeight: 1.12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: THEME.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 4.5,
          }}
        >
          <span style={{ letterSpacing: '-0.025em' }}>COMPTOIR</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #D97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              letterSpacing: '-0.015em',
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
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: THEME.text.muted,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: '#D97706', fontSize: 7.5 }}>✦</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.09em' }}>
              {displaySubtitle}
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
 * Sceau d'excellence et de conformité
 */
export const ComptoirSceau: React.FC<SceauProps> = ({
  text = 'COMPTOIR CENTRAL',
  subtext = 'EXCELLENCE SANS FRONTIÈRES',
  size = 96,
  color = '#D97706',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        border: `1.5px solid ${color}40`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        textAlign: 'center',
        opacity: 0.85,
        userSelect: 'none',
        pointerEvents: 'none',
        background: `${color}08`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: size * 0.095,
          fontWeight: 800,
          color: color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
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
          opacity: 0.45,
        }}
      />
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: size * 0.065,
          fontWeight: 700,
          color: color,
          letterSpacing: '0.08em',
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
      <stop offset="0%" stopColor="#151821" />
      <stop offset="100%" stopColor="#0B0D12" />
    </linearGradient>
    <linearGradient id="goldLightGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFBEB" />
      <stop offset="40%" stopColor="#FDE68A" />
      <stop offset="100%" stopColor="#F59E0B" />
    </linearGradient>
    <linearGradient id="goldDeepGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="70%" stopColor="#D97706" />
      <stop offset="100%" stopColor="#92400E" />
    </linearGradient>
    <linearGradient id="meridianGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
      <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
    </linearGradient>
    <linearGradient id="sapphirePoint" x1="50" y1="50" x2="70" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#2563EB" />
      <stop offset="60%" stopColor="#1D4ED8" />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
    </filter>
  </defs>

  <g transform="translate(12, 10)" filter="url(#subtleShadow)">
    <rect x="0" y="0" width="100" height="100" rx="25" fill="url(#monogramBg)" />
    <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="24.25" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.25" fill="none" />
    
    <!-- Méridien & Arc C -->
    <circle cx="50" cy="50" r="37" stroke="url(#meridianGrad)" strokeWidth="1.2" strokeDasharray="3 3.5" opacity="0.4" />
    <path d="M 68 22 A 38 38 0 1 0 68 78" stroke="url(#meridianGrad)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
    
    <!-- Rayons secondaires -->
    <path d="M 50 50 L 71 29 L 55 46 Z" fill="url(#sapphirePoint)" />
    <path d="M 50 50 L 71 71 L 55 54 Z" fill="url(#sapphirePoint)" />
    <path d="M 50 50 L 29 71 L 45 54 Z" fill="url(#sapphirePoint)" />
    <path d="M 50 50 L 29 29 L 45 46 Z" fill="url(#sapphirePoint)" />

    <!-- Branches Cardinales -->
    <path d="M 50 14 L 50 50 L 43 45 Z" fill="url(#goldLightGrad)" />
    <path d="M 50 14 L 57 45 L 50 50 Z" fill="url(#goldDeepGrad)" />
    <path d="M 50 86 L 43 55 L 50 50 Z" fill="url(#goldDeepGrad)" />
    <path d="M 50 86 L 50 50 L 57 55 Z" fill="url(#goldLightGrad)" />
    <path d="M 86 50 L 55 43 L 50 50 Z" fill="url(#goldLightGrad)" />
    <path d="M 86 50 L 50 50 L 55 57 Z" fill="url(#goldDeepGrad)" />
    <path d="M 14 50 L 50 50 L 45 43 Z" fill="url(#goldDeepGrad)" />
    <path d="M 14 50 L 45 57 L 50 50 Z" fill="url(#goldLightGrad)" />

    <!-- Cœur Diamant -->
    <polygon points="50,44 56,50 50,56 44,50" fill="#FFFFFF" />
    <circle cx="50" cy="50" r="2.2" fill="#D97706" />
    <circle cx="50" cy="50" r="1" fill="#FFFFFF" />
  </g>

  <g transform="translate(132, 24)">
    <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="36" fontWeight="850" letterSpacing="-0.035em" fill="#18181B">
      COMPTOIR
      <tspan fill="url(#textGrad)" dx="8">CENTRAL</tspan>
    </text>
    <g transform="translate(2, 68)">
      <text x="0" y="-1" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="13" fontWeight="700" letterSpacing="0.18em" fill="#92400E">
        ✦ L'AUDACE SANS FRONTIÈRES
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
        <linearGradient id="svgMonogramBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#151821" />
          <stop offset="100%" stopColor="#0B0D12" />
        </linearGradient>
        <linearGradient id="svgGoldLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="svgGoldDeep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="svgMeridian" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="svgSapphire" x1="50" y1="50" x2="70" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="svgTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      <g transform="translate(12, 10)">
        <rect x="0" y="0" width="100" height="100" rx="25" fill="url(#svgMonogramBg)" />
        <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="24.25" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.25" fill="none" />
        
        <circle cx="50" cy="50" r="37" stroke="url(#svgMeridian)" strokeWidth="1.2" strokeDasharray="3 3.5" opacity="0.4" />
        <path d="M 68 22 A 38 38 0 1 0 68 78" stroke="url(#svgMeridian)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
        
        <path d="M 50 50 L 71 29 L 55 46 Z" fill="url(#svgSapphire)" />
        <path d="M 50 50 L 71 71 L 55 54 Z" fill="url(#svgSapphire)" />
        <path d="M 50 50 L 29 71 L 45 54 Z" fill="url(#svgSapphire)" />
        <path d="M 50 50 L 29 29 L 45 46 Z" fill="url(#svgSapphire)" />

        <path d="M 50 14 L 50 50 L 43 45 Z" fill="url(#svgGoldLightGrad)" />
        <path d="M 50 14 L 57 45 L 50 50 Z" fill="url(#svgGoldDeep)" />
        <path d="M 50 86 L 43 55 L 50 50 Z" fill="url(#svgGoldDeep)" />
        <path d="M 50 86 L 50 50 L 57 55 Z" fill="url(#svgGoldLight)" />
        <path d="M 86 50 L 55 43 L 50 50 Z" fill="url(#svgGoldLight)" />
        <path d="M 86 50 L 50 50 L 55 57 Z" fill="url(#svgGoldDeep)" />
        <path d="M 14 50 L 50 50 L 45 43 Z" fill="url(#svgGoldDeep)" />
        <path d="M 14 50 L 45 57 L 50 50 Z" fill="url(#svgGoldLight)" />

        <polygon points="50,44 56,50 50,56 44,50" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="2.2" fill="#D97706" />
        <circle cx="50" cy="50" r="1" fill="#FFFFFF" />
      </g>

      <g transform="translate(132, 24)">
        <text x="0" y="44" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="36" fontWeight="850" letterSpacing="-0.035em" fill={isDark ? '#F8FAFC' : '#18181B'}>
          COMPTOIR
          <tspan fill="url(#svgTextGrad)" dx="8">CENTRAL</tspan>
        </text>
        <g transform="translate(2, 68)">
          <text x="0" y="-1" fontFamily="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" fontSize="13" fontWeight="700" letterSpacing="0.18em" fill={isDark ? '#FBBF24' : '#92400E'}>
            ✦ L'AUDACE SANS FRONTIÈRES
          </text>
        </g>
      </g>
    </svg>
  );
};
