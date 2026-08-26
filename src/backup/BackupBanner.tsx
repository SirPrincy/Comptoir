import React from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { joursDepuisBackup, exporterJSON } from './backupUtils';

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
    : `Dernière sauvegarde il y a ${jours} jour${jours > 1 ? 's' : ''}.`;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '8px 14px', margin: '0 0 12px',
        background: '#FBEAE8', border: '1px solid #F0C6C0', borderRadius: 8,
        fontSize: 12.5, color: '#C24A3F',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={15} />
        <span>{texte}</span>
      </div>
      <button
        onClick={() => exporterJSON(data)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#C24A3F', color: '#FFFFFF', border: 'none',
          borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Download size={13} />
        Sauvegarder maintenant
      </button>
    </div>
  );
}
