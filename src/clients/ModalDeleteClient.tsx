import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn } from '../ui';
import { Client, ClientStat } from './types';

interface ModalDeleteClientProps {
  client: Client | null;
  stats: ClientStat;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalDeleteClient({
  client,
  stats,
  onClose,
  onConfirm,
}: ModalDeleteClientProps) {
  if (!client) return null;

  const aDesVentes = (stats.count || 0) > 0;

  return (
    <Modal title="Confirmer la suppression" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13.5, color: '#26333D', lineHeight: 1.5 }}>
          Êtes-vous sûr de vouloir supprimer le client <strong>« {client.nom} »</strong> ?
        </div>

        {aDesVentes ? (
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
              <strong>Attention :</strong> Ce client possède{' '}
              <strong>
                {stats.count} vente{stats.count > 1 ? 's' : ''}
              </strong>{' '}
              pour un montant total de{' '}
              <strong>{(stats.total || 0).toLocaleString('fr-FR')} Ar</strong>.
              <div style={{ marginTop: 4, color: '#7A3200' }}>
                Les ventes passées et les écritures en trésorerie seront conservées, mais ne seront
                plus associées à ce compte client.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: '#8A8375' }}>
            Ce client n'a aucun achat enregistré. L'opération est sans impact sur l'historique financier.
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
