import React from 'react';
import { Modal, ghostBtn } from '../ui';
import DetailTransitaireArticles from './DetailTransitaireArticles';

export interface ModalDetailTransitaireArticlesProps {
  transitaire: any;
  commandes: any[];
  products: any[];
  initialMode?: 'all' | 'Aérien' | 'Maritime';
  onClose: () => void;
  onNavigateToLogistique?: (commandeId?: string) => void;
}

export default function ModalDetailTransitaireArticles({
  transitaire,
  commandes = [],
  products = [],
  initialMode = 'all',
  onClose,
  onNavigateToLogistique,
}: ModalDetailTransitaireArticlesProps) {
  if (!transitaire) return null;

  return (
    <Modal
      title={`Détail Fret & Articles — « ${transitaire.nom} »`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DetailTransitaireArticles
          transitaire={transitaire}
          commandes={commandes}
          products={products}
          initialMode={initialMode}
          isModal={true}
          onClose={onClose}
          onNavigateToLogistique={onNavigateToLogistique}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn as any}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
