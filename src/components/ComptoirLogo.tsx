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
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Anneau de précision Apple */}
        <circle
          cx="20"
          cy="20"
          r="16.5"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.2"
        />

        {/* Lettre 'C' épurée et géométrique */}
        <path
          d="M26 13C24.4 11.2 22.3 10.2 19.5 10.2C14.2 10.2 10.2 14.5 10.2 20C10.2 25.5 14.2 29.8 19.5 29.8C22.5 29.8 24.8 28.6 26.2 26.5"
          stroke={variant === 'outline' ? THEME.brand.blue : '#FFFFFF'}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Point focal bleu Apple */}
        <circle
          cx="26"
          cy="20"
          r="2.2"
          fill={THEME.brand.blue}
        />
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

