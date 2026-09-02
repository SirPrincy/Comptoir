import React from 'react';
import { AlertTriangle, PackageCheck } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn, safeDateDisplay } from '../ui';

interface ModalDeleteVenteProps {
  vente: any | null;
  product: any | null;
  client: any | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalDeleteVente({
  vente,
  product,
  client,
  onClose,
  onConfirm,
}: ModalDeleteVenteProps) {
  if (!vente) return null;

  const totalVente = Number(vente.total) || ((Number(vente.pu) || 0) * (Number(vente.qty) || 1));
  const productNom = product ? product.nom : 'Article';
  const productCouleur = product?.couleur ? ` · ${product.couleur}` : '';
  const qty = Number(vente.qty) || 1;

  return (
    <Modal title="Supprimer cette vente ?" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13.5, color: '#26333D', lineHeight: 1.5 }}>
          Voulez-vous vraiment supprimer la vente de <strong>« {productNom}{productCouleur} »</strong> ?
        </div>

        {/* Détails de la vente */}
        <div
          style={{
            background: '#FAF7F2',
            border: '1px solid #EAE2D4',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#5E584E' }}>Date & Quantité :</span>
            <strong style={{ color: '#26333D' }}>
              {safeDateDisplay(vente.date)} · {qty} pièce{qty > 1 ? 's' : ''}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#5E584E' }}>Montant total :</span>
            <strong style={{ color: '#3D5A6C' }}>
              {totalVente.toLocaleString('fr-FR')} Ar
              {Number(vente.fraisLivraison) > 0 ? ` (dont ${Number(vente.fraisLivraison).toLocaleString('fr-FR')} Ar livraison)` : ''}
            </strong>
          </div>
          {client && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#5E584E' }}>Client associé :</span>
              <strong style={{ color: '#26333D' }}>{client.nom}</strong>
            </div>
          )}
          {vente.modePaiement && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#5E584E' }}>Règlement :</span>
              <span style={{ color: '#5E584E' }}>{vente.modePaiement}</span>
            </div>
          )}
        </div>

        {/* Impact sur le Stock & la Trésorerie */}
        <div
          style={{
            background: '#EAF6EE',
            border: '1px solid #C4E6D1',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <PackageCheck size={18} color="#1B6A3E" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#1B4D33', lineHeight: 1.4 }}>
            <strong>Restitution automatique du stock :</strong>
            <div style={{ marginTop: 2 }}>
              La suppression de cette vente réintégrera immédiatement <strong>+{qty} pièce{qty > 1 ? 's' : ''}</strong> dans votre stock disponible de <em>« {productNom} »</em>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={ghostBtn as any}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              ...primaryBtn,
              background: '#C24A3F',
              borderColor: '#B03E33',
              padding: '0 14px',
            }}
          >
            Supprimer la vente
          </button>
        </div>
      </div>
    </Modal>
  );
}
