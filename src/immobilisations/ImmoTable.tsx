import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { THEME } from '../colors';
import { Empty, ghostBtn, iconBtn } from '../ui';
import { ImmoCalculatedDetail, Immobilisation } from './types';
import { MOIS_FR } from './immoUtils';

interface ImmoTableProps {
  immoDetails: ImmoCalculatedDetail[];
  selectedYear: number;
  selectedMonth: number;
  onSelectImmo: (immo: Immobilisation) => void;
  onDeleteImmo: (immo: Immobilisation) => void;
}

export default function ImmoTable({
  immoDetails,
  selectedYear,
  selectedMonth,
  onSelectImmo,
  onDeleteImmo,
}: ImmoTableProps) {
  if (immoDetails.length === 0) {
    return <Empty text="Aucune immobilisation enregistrée pour le moment. Cliquez sur 'Nouvelle Immo' pour commencer !" />;
  }

  const labelMois = MOIS_FR[selectedMonth - 1] || '';

  const getEtatColor = (etat: string) => {
    if (etat.startsWith('Amorti')) return THEME.accent.green;
    if (etat.startsWith('En cours')) return THEME.accent.orange;
    return THEME.text.muted;
  };

  return (
    <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.muted, fontWeight: 600 }}>
              <th style={{ padding: '12px 14px' }}>Immobilisation</th>
              <th style={{ padding: '12px 14px' }}>Catégorie</th>
              <th style={{ padding: '12px 14px' }}>Achat / Durée</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>V. Origine (MGA)</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Dotation / Mois</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Dotation {labelMois}</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Cumul fin {labelMois}</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>VNC fin {labelMois}</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>État</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {immoDetails.map((immo) => {
              const isStarted = immo.moisEcoules > 0;

              return (
                <tr
                  key={immo.id}
                  style={{
                    borderBottom: `1px solid ${THEME.border.base}`,
                    transition: 'background 0.1s ease',
                  }}
                  className="hover-bg-row"
                >
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                    <div style={{ color: THEME.text.primary }}>{immo.nom}</div>
                    {immo.notes && <div style={{ fontSize: 11, fontWeight: 400, color: THEME.text.muted, marginTop: 2 }}>{immo.notes}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: THEME.text.secondary }}>{immo.categorie}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: THEME.text.primary }}>{new Date(immo.dateAchat).toLocaleDateString('fr-FR')}</div>
                    <div style={{ fontSize: 11, color: THEME.text.muted }}>
                      {immo.dureeAmortissement} ans ({immo.totalMois} mois)
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: THEME.text.primary }}>
                    {immo.valeurOrigine.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: THEME.text.secondary, fontWeight: 500 }}>
                    {immo.dotationMensuelle.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: immo.dotationMois > 0 ? THEME.accent.orange : THEME.text.muted, fontWeight: 600 }}>
                    {immo.dotationMois > 0 ? immo.dotationMois.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: THEME.accent.green, fontWeight: 600 }}>
                    {isStarted ? immo.cumulMois.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: THEME.accent.purple }}>
                    {isStarted ? immo.vncMois.toLocaleString() : immo.valeurOrigine.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 20,
                      background: THEME.bg.soft,
                      color: getEtatColor(immo.etat),
                      whiteSpace: 'nowrap',
                    }}>
                      {immo.etat}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        onClick={() => onSelectImmo(immo)}
                        style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }}
                        title="Voir le tableau d'amortissement complet"
                      >
                        <FileText size={13} />
                        Plan
                      </button>
                      <button
                        onClick={() => onDeleteImmo(immo)}
                        style={iconBtn}
                        title="Supprimer cette immobilisation"
                      >
                        <Trash2 size={15} color={THEME.accent.danger} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

