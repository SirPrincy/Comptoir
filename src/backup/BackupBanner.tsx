import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { joursDepuisBackup, exporterJSON } from './backupUtils';
import { THEME } from '../colors';
import { RADIUS, SHADOWS } from '../ui';

interface BackupBannerProps {
  data: any; // l'objet complet des données à exporter au clic
  seuilAlerteJours?: number; // à partir de combien de jours ça devient rouge (défaut 3)
}

export default function BackupBanner({ data, seuilAlerteJours = 3 }: BackupBannerProps) {
  const jours = joursDepuisBackup();
  const jamaisFait = jours === Infinity;
  const enAlerte = jamaisFait || jours >= seuilAlerteJours;

  // Rien à afficher si la sauvegarde est récente — pas de bruit inutile.
  if (!enAlerte) return null;

  const texte = jamaisFait
    ? "Aucune sauvegarde effectuée pour l'instant."
    : `Dernière sauvegarde effectuée il y a ${jours} jour${jours > 1 ? 's' : ''}.`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 16px',
        margin: '0 0 14px',
        background: 'rgba(255, 149, 0, 0.08)',
        border: '1px solid rgba(255, 149, 0, 0.25)',
        borderRadius: RADIUS.item,
        fontSize: 13,
        fontWeight: 500,
        color: THEME.brand.amber,
        boxShadow: SHADOWS.subtle,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <AlertCircle size={16} strokeWidth={2.2} />
        <span>{texte}</span>
      </div>
      <button
        onClick={() => exporterJSON(data)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: THEME.brand.amber,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: RADIUS.control,
          padding: '6px 14px',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(255, 149, 0, 0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        <Download size={13} strokeWidth={2.2} />
        Sauvegarder
      </button>
    </div>
  );
}

