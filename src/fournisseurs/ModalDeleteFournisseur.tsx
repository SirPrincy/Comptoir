import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn } from '../ui';
import { QCSummary } from '../qcUtils';

interface ModalDeleteFournisseurProps {
  fournisseur: any | null;
  nbCommandes: number;
  scoreQC: QCSummary | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalDeleteFournisseur({
  fournisseur,
  nbCommandes,
  scoreQC,
  onClose,
  onConfirm,
}: ModalDeleteFournisseurProps) {
  if (!fournisseur) return null;

  const aDesCommandes = nbCommandes > 0;
  const aDesLitiges = (scoreQC?.nbLitiges || 0) > 0;
  const isTransitaire = fournisseur.plateforme === 'Transitaire / Fret';

  return (
    <Modal title="Confirmer la suppression" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13.5, color: '#26333D', lineHeight: 1.5 }}>
          Êtes-vous sûr de vouloir supprimer le {isTransitaire ? 'transitaire' : 'fournisseur'}{' '}
          <strong>« {fournisseur.nom} »</strong> ?
        </div>

        {aDesCommandes ? (
          <div
            style={{
              background: '#FFF4E5',
              border: '1px solid #FFE0B2',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} color="#E65100" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: '#9C4100', lineHeight: 1.4 }}>
              <strong>Attention : Historique actif</strong>
              <div style={{ marginTop: 2 }}>
                Ce partenaire est associé à <strong>{nbCommandes} commande{nbCommandes > 1 ? 's' : ''}</strong>
                {aDesLitiges && (
                  <span>
                    {' '}dont <strong>{scoreQC?.nbLitiges} non-conformité(s) / litige(s) QC</strong> enregistrés
                  </span>
                )}.
              </div>
              <div style={{ marginTop: 4, color: '#7A3200' }}>
                Les commandes passées et leurs données de suivi logistique resteront enregistrées, mais le lien vers ce partenaire sera rompu.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: '#8A8375' }}>
            Aucune commande n'est associée à ce {isTransitaire ? 'transitaire' : 'fournisseur'}. La suppression n'impactera aucun historique.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button onClick={onClose} style={ghostBtn as any}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{ ...primaryBtn, background: '#C24A3F', borderColor: '#B03E33' }}
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </Modal>
  );
}
