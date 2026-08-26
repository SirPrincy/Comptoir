import React, { useState } from 'react';
import { THEME } from '../colors';
import { Modal, primaryBtn, ghostBtn } from '../ui';
import { Immobilisation } from './types';
import { calculerAmortissementLineaire, calculerPlanAmortissementMensuel, MOIS_FR } from './immoUtils';

interface ImmoDetailModalProps {
  immo: Immobilisation;
  selectedYear: number;
  selectedMonth: number;
  onClose: () => void;
}

export default function ImmoDetailModal({
  immo,
  selectedYear,
  selectedMonth,
  onClose,
}: ImmoDetailModalProps) {
  const [viewMode, setViewMode] = useState<'mensuel' | 'annuel'>('mensuel');

  const totalMois = Math.max(1, Math.round((Number(immo.dureeAmortissement) || 5) * 12));
  const dotationMensuelle = Math.round(((Number(immo.valeurOrigine) || 0) / totalMois) * 100) / 100;
  
  const planAnnuel = calculerAmortissementLineaire(immo.valeurOrigine, immo.dateAchat, immo.dureeAmortissement);
  const planMensuel = calculerPlanAmortissementMensuel(immo.valeurOrigine, immo.dateAchat, immo.dureeAmortissement);

  return (
    <Modal title={`Plan d'amortissement : ${immo.nom}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Infos récapitulatives */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
          background: THEME.bg.soft,
          padding: 10,
          borderRadius: 8,
          fontSize: 12.5,
          border: `1px solid ${THEME.border.base}`,
        }}>
          <div>
            <span style={{ color: THEME.text.muted, display: 'block' }}>Coût d'acquisition :</span>
            <strong style={{ fontSize: 14, color: THEME.text.primary }}>{immo.valeurOrigine.toLocaleString()} MGA</strong>
          </div>
          <div>
            <span style={{ color: THEME.text.muted, display: 'block' }}>Date d'acquisition :</span>
            <strong>{new Date(immo.dateAchat).toLocaleDateString('fr-FR')}</strong>
          </div>
          <div>
            <span style={{ color: THEME.text.muted, display: 'block' }}>Durée & Dotation :</span>
            <strong>{immo.dureeAmortissement} ans ({totalMois} mois)</strong>
            <div style={{ fontSize: 11, color: THEME.accent.orange, marginTop: 1 }}>{dotationMensuelle.toLocaleString()} MGA / mois</div>
          </div>
          <div>
            <span style={{ color: THEME.text.muted, display: 'block' }}>Catégorie :</span>
            <strong>{immo.categorie}</strong>
          </div>
        </div>

        {/* Toggle Vue Mensuelle / Vue Annuelle */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('mensuel')}
            style={{
              ...ghostBtn,
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: viewMode === 'mensuel' ? THEME.accent.primary : 'transparent',
              color: viewMode === 'mensuel' ? THEME.text.light : THEME.text.secondary,
              borderColor: viewMode === 'mensuel' ? THEME.accent.primary : THEME.border.base,
              fontWeight: 600,
            }}
          >
            Vue Mensuelle ({planMensuel.length} mois)
          </button>
          <button
            onClick={() => setViewMode('annuel')}
            style={{
              ...ghostBtn,
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              background: viewMode === 'annuel' ? THEME.accent.primary : 'transparent',
              color: viewMode === 'annuel' ? THEME.text.light : THEME.text.secondary,
              borderColor: viewMode === 'annuel' ? THEME.accent.primary : THEME.border.base,
              fontWeight: 600,
            }}
          >
            Vue Annuelle ({planAnnuel.length} exercices)
          </button>
        </div>

        {/* Tableau complet */}
        <div style={{ border: `1px solid ${THEME.border.base}`, borderRadius: 8, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
          {viewMode === 'mensuel' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.muted, fontWeight: 600, position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '8px 10px' }}>Période (Mois)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dotation Mensuelle (MGA)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Cumul Amorti (MGA)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>VNC Résiduelle (MGA)</th>
                </tr>
              </thead>
              <tbody>
                {planMensuel.map((row, idx) => {
                  const isCurrent = row.annee === selectedYear && row.mois === selectedMonth;

                  return (
                    <tr
                      key={`${row.annee}-${row.mois}`}
                      style={{
                        borderBottom: `1px solid ${THEME.border.base}`,
                        background: isCurrent ? THEME.bg.soft : 'transparent',
                        fontWeight: isCurrent ? 'bold' : 'normal',
                      }}
                    >
                      <td style={{ padding: '7px 10px', color: isCurrent ? THEME.accent.primary : THEME.text.primary }}>
                        <span style={{ fontSize: 11, color: THEME.text.muted, marginRight: 6 }}>#{idx + 1}</span>
                        {row.labelMois} {isCurrent && ' (Mois sélectionné)'}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: THEME.accent.orange }}>
                        {row.dotation.toLocaleString()}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: THEME.accent.green }}>
                        {row.cumul.toLocaleString()}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: THEME.accent.purple }}>
                        {row.vnc.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, color: THEME.text.muted, fontWeight: 600, position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '8px 10px' }}>Exercice</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Mois actifs</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dotation Annuelle (MGA)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Cumul fin exercice (MGA)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>VNC Fin (MGA)</th>
                </tr>
              </thead>
              <tbody>
                {planAnnuel.map((row) => {
                  const isCurrent = row.annee === selectedYear;

                  return (
                    <tr
                      key={row.annee}
                      style={{
                        borderBottom: `1px solid ${THEME.border.base}`,
                        background: isCurrent ? THEME.bg.soft : 'transparent',
                        fontWeight: isCurrent ? 'bold' : 'normal',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: isCurrent ? THEME.accent.primary : THEME.text.primary }}>
                        {row.annee} {isCurrent && '(Exercice en cours)'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: THEME.text.muted }}>
                        {row.nbMois ? `${row.nbMois} mois` : '12 mois'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: THEME.accent.orange }}>
                        {row.annuite.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: THEME.accent.green }}>
                        {row.cumul.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: THEME.accent.purple }}>
                        {row.vnc.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={primaryBtn}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

