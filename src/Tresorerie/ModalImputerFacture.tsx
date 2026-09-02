import React, { useState, useMemo } from 'react';
import { Link2, CheckCircle2, AlertCircle, Info, PlusCircle, Calendar, CreditCard } from 'lucide-react';
import { Field, inputStyle, primaryBtn, ghostBtn } from '../ui';
import {
  getTotalAllouePaiement,
  getReliquatPaiement,
  getRestePayeVente,
  getRestePayeMarchandise,
  getRestePayeFret,
  getMontantPayeVente,
  getMontantPayeMarchandise,
  getMontantPayeFret,
} from '../paymentUtils';

interface ModalImputerFactureProps {
  show: boolean;
  onClose: () => void;
  paiement: any;
  imputerPaiementExistant: (paiementId: string, nouvellesAllocations: { cibleId: string; montantAlloue: number }[]) => void;
  ventes: any[];
  commandes: any[];
  products: any[];
  fournisseurs: any[];
  clients: any[];
  paiements: any[];
}

export default function ModalImputerFacture({
  show,
  onClose,
  paiement,
  imputerPaiementExistant,
  ventes = [],
  commandes = [],
  products = [],
  fournisseurs = [],
  clients = [],
  paiements = [],
}: ModalImputerFactureProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  if (!show || !paiement) return null;

  const totalAlloue = getTotalAllouePaiement(paiement);
  const reliquatDispo = getReliquatPaiement(paiement);
  const nature = paiement.nature || 'vente';

  // Liste des factures/commandes impayées disponibles
  const itemsUnpaid = useMemo(() => {
    if (nature === 'vente') {
      return ventes.filter((v: any) => getRestePayeVente(v, paiements) > 0);
    } else if (nature === 'marchandise') {
      return commandes.filter((c: any) => getRestePayeMarchandise(c, paiements) > 0);
    } else {
      return commandes.filter((c: any) => getRestePayeFret(c, paiements) > 0);
    }
  }, [nature, ventes, commandes, paiements]);

  // Total actuellement saisi dans les champs d'allocation
  const totalImputationSaisie = useMemo(() => {
    return Object.values(allocations).reduce((sum: number, val: number) => sum + (Number(val) || 0), 0);
  }, [allocations]);

  const reliquatRestantApres = reliquatDispo - totalImputationSaisie;
  const isDepassement = totalImputationSaisie > reliquatDispo;

  const handleSetAmount = (id: string, amount: number) => {
    setAllocations(prev => ({
      ...prev,
      [id]: Math.max(0, amount),
    }));
  };

  const handleToggleAutoAllocate = (id: string, resteDu: number) => {
    const current = allocations[id] || 0;
    if (current > 0) {
      // Décocher
      handleSetAmount(id, 0);
    } else {
      // Cocher : allouer au max du reste dû et du reliquat encore disponible
      const dispoAvantCetItem = reliquatDispo - (totalImputationSaisie - current);
      const toAllocate = Math.min(resteDu, Math.max(0, dispoAvantCetItem));
      handleSetAmount(id, toAllocate);
    }
  };

  const handleValider = () => {
    if (isDepassement || totalImputationSaisie <= 0) return;

    const nouvellesAllocations = Object.entries(allocations)
      .map(([cibleId, amount]) => ({ cibleId, montantAlloue: Number(amount) || 0 }))
      .filter(a => a.montantAlloue > 0);

    if (nouvellesAllocations.length === 0) return;

    imputerPaiementExistant(paiement.id, nouvellesAllocations);
    onClose();
  };

  const natureLabel = nature === 'vente' ? 'Vente Client' : (nature === 'marchandise' ? 'Achat Chine' : 'Fret Logistique');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(38, 51, 61, 0.55)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '20px 18px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
        }}
      >
        {/* Titre */}
        <div style={{ fontWeight: 700, fontSize: 16, color: '#26333D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link2 size={18} color="#3D5A6C" />
          <span>Affecter des Factures à ce Règlement ({natureLabel})</span>
        </div>
        <div style={{ fontSize: 12, color: '#736B5E', marginBottom: 14 }}>
          Sélectionnez les factures à imputer sur ce versement. Aucun nouveau mouvement de trésorerie ne sera créé.
        </div>

        {/* Card Récapitulatif Règlement */}
        <div style={{
          background: '#F5F2EC',
          border: '1px solid #EAE2D4',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 700 }}>Montant Reçu / Décaissé</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#26333D', marginTop: 2 }}>
              {Number(paiement.montantTotal || 0).toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              Sur {paiement.compte}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, color: '#8A8375', textTransform: 'uppercase', fontWeight: 700 }}>Déjà Imputé</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#3D5A6C', marginTop: 2 }}>
              {totalAlloue.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 10.5, color: '#736B5E', marginTop: 1 }}>
              {paiement.lignes?.length || 0} ligne(s) rattachée(s)
            </div>
          </div>

          <div style={{ background: '#E3EFE9', padding: '8px 10px', borderRadius: 8, border: '1px solid #C4DEC0' }}>
            <div style={{ fontSize: 10.5, color: '#276749', textTransform: 'uppercase', fontWeight: 700 }}>Acompte Disponible</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#276749', marginTop: 2 }}>
              {reliquatDispo.toLocaleString('fr-FR')} Ar
            </div>
            <div style={{ fontSize: 10.5, color: '#276749', marginTop: 1, fontWeight: 600 }}>
              Prêt à être affecté
            </div>
          </div>
        </div>

        {/* Liste des factures impayées à imputer */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#26333D', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Factures / Commandes en attente de paiement ({itemsUnpaid.length})</span>
            {reliquatDispo > 0 && (
              <span style={{ fontSize: 11, color: '#3D5A6C', fontWeight: 600 }}>
                Reliquat disponible : {reliquatDispo.toLocaleString('fr-FR')} Ar
              </span>
            )}
          </div>

          {itemsUnpaid.length === 0 ? (
            <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', padding: 12, borderRadius: 8, fontSize: 12, color: '#22543D', textAlign: 'center' }}>
              ✅ Aucune facture en attente de paiement dans cette catégorie !
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', border: '1px solid #EAE2D4', borderRadius: 8, padding: 8, background: '#FAF7F2' }}>
              {itemsUnpaid.map((item: any) => {
                let labelTier = '';
                let labelTitle = '';
                let resteDu = 0;

                if (nature === 'vente') {
                  const cl = clients.find((c: any) => c.id === item.clientId);
                  const p = products.find((pr: any) => pr.id === item.productId);
                  labelTier = cl ? `Client: ${cl.nom}` : 'Client passage';
                  labelTitle = p ? `${p.nom} ×${item.qty || 1}` : `Facture Vente #${item.id.slice(-5)}`;
                  resteDu = getRestePayeVente(item, paiements);
                } else if (nature === 'marchandise') {
                  const fourn = fournisseurs.find((f: any) => f.id === item.fournisseurId);
                  const p = products.find((pr: any) => pr.id === item.productId);
                  labelTier = fourn ? `Fournisseur: ${fourn.nom}` : (item.source || 'Chine');
                  labelTitle = p ? `${p.nom} ×${item.qty || 1}` : `Commande #${item.id.slice(-5)}`;
                  resteDu = getRestePayeMarchandise(item, paiements);
                } else {
                  const trans = fournisseurs.find((f: any) => f.id === item.transitaireId);
                  const p = products.find((pr: any) => pr.id === item.productId);
                  labelTier = trans ? `Transitaire: ${trans.nom}` : 'Transitaire';
                  labelTitle = p ? `Fret — ${p.nom}` : `Fret #${item.id.slice(-5)}`;
                  resteDu = getRestePayeFret(item, paiements);
                }

                const currentAlloc = allocations[item.id] || 0;
                const isAllocated = currentAlloc > 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: isAllocated ? '#FFFFFF' : '#F5F2EC',
                      border: `1px solid ${isAllocated ? '#3D5A6C' : '#EAE2D4'}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#26333D' }}>
                        {labelTitle}
                      </div>
                      <div style={{ fontSize: 11, color: '#736B5E', marginTop: 2 }}>
                        {labelTier} • Solde dû: <strong style={{ color: '#B5532A' }}>{resteDu.toLocaleString('fr-FR')} Ar</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoAllocate(item.id, resteDu)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1px solid ${isAllocated ? '#C4DEC0' : '#EAE2D4'}`,
                          background: isAllocated ? '#E3EFE9' : '#FFFFFF',
                          color: isAllocated ? '#276749' : '#5E584E',
                          cursor: 'pointer',
                        }}
                      >
                        {isAllocated ? '✓ Sélectionné' : 'Max'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          max={resteDu}
                          placeholder="0"
                          value={currentAlloc || ''}
                          onChange={e => handleSetAmount(item.id, Number(e.target.value))}
                          style={{
                            width: 110,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: `1px solid ${isAllocated ? '#3D5A6C' : '#CBD5E0'}`,
                            fontSize: 12,
                            fontWeight: 700,
                            textAlign: 'right',
                            color: isAllocated ? '#3D5A6C' : '#26333D',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#736B5E', fontWeight: 600 }}>Ar</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Récapitulatif nouvelle imputation */}
        {totalImputationSaisie > 0 && (
          <div style={{
            background: isDepassement ? '#FFF5F5' : '#F0FFF4',
            border: `1px solid ${isDepassement ? '#FEB2B2' : '#C6F6D5'}`,
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#26333D' }}>
              <span>Montant total à imputer maintenant :</span>
              <span style={{ color: isDepassement ? '#E53E3E' : '#276749', fontSize: 13.5 }}>
                {totalImputationSaisie.toLocaleString('fr-FR')} Ar
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#4A5568', fontSize: 11.5 }}>
              <span>Reliquat acompte restant après imputation :</span>
              <strong style={{ color: reliquatRestantApres < 0 ? '#E53E3E' : '#2B6CB0' }}>
                {reliquatRestantApres.toLocaleString('fr-FR')} Ar
              </strong>
            </div>

            {isDepassement && (
              <div style={{ marginTop: 6, color: '#E53E3E', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={13} />
                <span>Le montant saisi ({totalImputationSaisie.toLocaleString('fr-FR')} Ar) dépasse l'acompte disponible ({reliquatDispo.toLocaleString('fr-FR')} Ar).</span>
              </div>
            )}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #EAE2D4' }}>
          <button type="button" onClick={onClose} style={{ ...ghostBtn, minWidth: 100 }}>
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValider}
            disabled={totalImputationSaisie <= 0 || isDepassement}
            style={{
              ...primaryBtn,
              minWidth: 180,
              justifyContent: 'center',
              background: '#3D5A6C',
              opacity: (totalImputationSaisie > 0 && !isDepassement) ? 1 : 0.4,
            }}
          >
            <CheckCircle2 size={15} /> Valider l'imputation
          </button>
        </div>
      </div>
    </div>
  );
}
