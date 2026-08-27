import React from 'react';
import { Trash2, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { Modal, ghostBtn, iconBtn } from '../ui';
import { MOIS_FR } from './immoUtils';

interface ImmoJournalModalProps {
  mouvements: any[];
  onClose: () => void;
  onDeleteMouvement: (id: string) => void;
  onDeleteMois: (annee: number, mois: number) => void;
}

export default function ImmoJournalModal({
  mouvements = [],
  onClose,
  onDeleteMouvement,
  onDeleteMois,
}: ImmoJournalModalProps) {
  const amortissements = mouvements
    .filter((m: any) => m.tag === '#amortissement' || m.type === 'amortissement' || m.categorie === 'amortissement')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Regroupement par mois pour vision synthétique
  const groupedByPeriod: Record<string, { annee: number; mois: number; label: string; total: number; count: number; items: any[] }> = {};

  amortissements.forEach((m) => {
    let a = m.annee;
    let mo = m.mois;

    if (!a || !mo) {
      const d = new Date(m.date);
      if (!isNaN(d.getTime())) {
        a = d.getFullYear();
        mo = d.getMonth() + 1;
      }
    }

    const key = `${a || 'Inconnu'}-${mo || 'Inconnu'}`;
    if (!groupedByPeriod[key]) {
      const label = mo && a ? `${MOIS_FR[mo - 1]} ${a}` : 'Période indéterminée';
      groupedByPeriod[key] = {
        annee: a,
        mois: mo,
        label,
        total: 0,
        count: 0,
        items: [],
      };
    }

    groupedByPeriod[key].total += Number(m.montant) || 0;
    groupedByPeriod[key].count += 1;
    groupedByPeriod[key].items.push(m);
  });

  const totalGeneral = amortissements.reduce((s, m) => s + (Number(m.montant) || 0), 0);

  return (
    <Modal title="Journal des écritures d'amortissement" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 8,
          background: THEME.bg.soft,
          border: `1px solid ${THEME.border.base}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} style={{ color: THEME.accent.purple }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>
                {amortissements.length} écriture{amortissements.length > 1 ? 's' : ''} comptabilisée{amortissements.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: THEME.text.muted }}>
                Total des dotations passées dans l'application
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.accent.purple }}>
              {totalGeneral.toLocaleString()} MGA
            </div>
          </div>
        </div>

        {amortissements.length === 0 ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            color: THEME.text.muted,
            fontSize: 13,
            background: THEME.bg.card,
            borderRadius: 8,
            border: `1px dashed ${THEME.border.base}`,
          }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px', color: THEME.text.muted, display: 'block' }} />
            Aucun amortissement n'a encore été créé.
            <div style={{ fontSize: 11.5, marginTop: 4 }}>
              Utilisez le bouton <strong>« Créer l'amortissement du mois »</strong> pour générer les écritures mensuelles.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {Object.entries(groupedByPeriod).map(([key, group]) => (
              <div
                key={key}
                style={{
                  background: THEME.bg.card,
                  border: `1px solid ${THEME.border.base}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: THEME.bg.soft,
                  borderBottom: `1px solid ${THEME.border.base}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={15} style={{ color: THEME.accent.green }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>
                      {group.label}
                    </span>
                    <span style={{ fontSize: 11, color: THEME.text.muted }}>
                      ({group.count} actif{group.count > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: THEME.accent.purple }}>
                      {group.total.toLocaleString()} MGA
                    </span>
                    {group.annee && group.mois && (
                      <button
                        type="button"
                        onClick={() => onDeleteMois(group.annee, group.mois)}
                        style={{
                          ...ghostBtn,
                          padding: '2px 6px',
                          fontSize: 11,
                          color: THEME.accent.danger,
                          borderColor: THEME.border.base,
                        }}
                        title={`Annuler tout l'amortissement de ${group.label}`}
                      >
                        <Trash2 size={12} />
                        Annuler ce mois
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ padding: '4px 0' }}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px',
                        fontSize: 12,
                        borderBottom: `1px solid ${THEME.bg.soft}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: THEME.text.primary }}>
                          {item.immoNom || item.description?.replace('Dotation aux amortissements - ', '') || 'Actif'}
                        </div>
                        <div style={{ fontSize: 11, color: THEME.text.muted }}>
                          Réf : {item.reference || 'AMORT'} · Date : {new Date(item.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: THEME.text.primary }}>
                          {Number(item.montant || 0).toLocaleString()} MGA
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMouvement(item.id)}
                          style={iconBtn}
                          title="Supprimer cette écriture"
                        >
                          <Trash2 size={13} color={THEME.accent.danger} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
