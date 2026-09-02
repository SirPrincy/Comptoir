import React, { useState } from 'react';
import { Receipt, Calendar, CreditCard, Tag, ArrowRight, CheckCircle2, User, Building, Package, Ship, ShoppingCart, Trash2, AlertTriangle, PlusCircle, Link2 } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn, iconBtn } from '../ui';
import { THEME } from '../colors';
import { formatDateDisplay, getCategoryBadge } from './JournalTransactions';
import { getAccountIcon } from './ComptesFinanciers';
import { getTotalAllouePaiement, getReliquatPaiement } from '../paymentUtils';
import ModalImputerFacture from './ModalImputerFacture';

interface ModalDetailTransactionProps {
  transaction: any | null;
  onClose: () => void;
  ventes?: any[];
  commandes?: any[];
  products?: any[];
  clients?: any[];
  fournisseurs?: any[];
  paiements?: any[];
  supprimerMouvement?: (id: string, item?: any) => void;
  imputerPaiementExistant?: (paiementId: string, allocations: { cibleId: string; montantAlloue: number }[]) => void;
}

export default function ModalDetailTransaction({
  transaction,
  onClose,
  ventes = [],
  commandes = [],
  products = [],
  clients = [],
  fournisseurs = [],
  paiements = [],
  supprimerMouvement,
  imputerPaiementExistant,
}: ModalDetailTransactionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showImputerModal, setShowImputerModal] = useState(false);

  if (!transaction) return null;

  const isPositif = transaction.type === 'entrée';
  const badge = getCategoryBadge(transaction.categorie, transaction.tag, transaction.isInvestissement);

  // Chercher le paiement groupé correspondant si présent
  const paiementObj = transaction.paiementObj || (paiements && paiements.find((p: any) =>
    p.id === transaction.paiementId ||
    (p.date === transaction.date && p.montantTotal === transaction.montant && p.compte === transaction.compte)
  ));

  const hasMultipleLignes = paiementObj && Array.isArray(paiementObj.lignes) && paiementObj.lignes.length > 0;
  const reliquatPaiement = paiementObj ? getReliquatPaiement(paiementObj) : 0;

  // Single item helpers
  const singleVente = transaction.venteId ? ventes.find((v: any) => v.id === transaction.venteId) : null;
  const singleCommande = transaction.commandeId ? commandes.find((c: any) => c.id === transaction.commandeId) : null;

  return (
    <>
    <Modal
      isOpen={Boolean(transaction)}
      onClose={onClose}
      title={hasMultipleLignes ? `Bordereau de Règlement Groupé (${paiementObj.lignes.length} éléments)` : 'Détails de la Transaction'}
      maxWidth={620}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI & EN-TÊTE PRINCIPAL */}
        <div style={{
          background: isPositif ? '#F2F9F4' : '#FDF4F3',
          border: `1px solid ${isPositif ? '#C3E6CD' : '#F5C6C2'}`,
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                background: badge.bg,
                color: badge.color,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}>
                {badge.label}
              </span>
              {transaction.compte && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  color: '#4A5568',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {getAccountIcon(transaction.compte)}
                  {transaction.compte}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />
              <span>{formatDateDisplay(transaction.date)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Montant {isPositif ? 'Encaissé' : 'Décaissé'}
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: isPositif ? '#2E7D32' : '#C62828',
              letterSpacing: '-0.02em',
            }}>
              {isPositif ? '+' : '−'} {transaction.montant.toLocaleString('fr-FR')} Ar
            </div>
          </div>
        </div>

        {/* INFORMATIONS COMPLÉMENTAIRES */}
        <div style={{
          background: THEME.bg.card,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: THEME.text.primary }}>
            {transaction.description || 'Aucune description saisie'}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: THEME.text.secondary }}>
            {transaction.reference && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Receipt size={13} style={{ color: THEME.text.muted }} />
                <span>Réf : <strong>{transaction.reference}</strong></span>
              </div>
            )}
            {transaction.tag && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Tag size={13} style={{ color: THEME.text.muted }} />
                <span style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: THEME.bg.soft,
                  fontWeight: 600,
                  fontSize: 11,
                }}>
                  {transaction.tag}
                </span>
              </div>
            )}
            {paiementObj?.beneficiaire && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={13} style={{ color: THEME.text.muted }} />
                <span>Tier : <strong>{paiementObj.beneficiaire}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL DE LA VENTILATION MULTI-FACTURES / GROUPÉE */}
        {hasMultipleLignes ? (
          <div style={{
            background: THEME.bg.card,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: THEME.text.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${THEME.border.base}`,
              paddingBottom: 8,
            }}>
              <span>📑 Ventilation sur {paiementObj.lignes.length} facture(s) / commande(s)</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: THEME.accent.primary, background: THEME.bg.chip, padding: '2px 8px', borderRadius: 12 }}>
                Règlement Unique
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paiementObj.lignes.map((l: any, idx: number) => {
                let targetLabel = '';
                let detailLabel = '';
                let tierLabel = '';

                if (l.cibleType === 'vente') {
                  const v = ventes.find((item: any) => item.id === l.cibleId);
                  if (v) {
                    const p = products.find((pr: any) => pr.id === v.productId);
                    const cl = clients.find((c: any) => c.id === v.clientId);
                    targetLabel = `Facture Vente #${v.id.slice(-5)}`;
                    detailLabel = p ? `${p.nom} ×${v.qty || 1}` : 'Article Vendu';
                    tierLabel = cl ? `Client: ${cl.nom}` : 'Client passage';
                  } else {
                    targetLabel = 'Facture Vente';
                  }
                } else if (l.cibleType === 'marchandise') {
                  const c = commandes.find((item: any) => item.id === l.cibleId);
                  if (c) {
                    const p = products.find((pr: any) => pr.id === c.productId);
                    const fourn = fournisseurs.find((f: any) => f.id === c.fournisseurId);
                    targetLabel = `Commande Achat #${c.id.slice(-5)}`;
                    detailLabel = p ? `${p.nom} ×${c.qty || 1}` : 'Article Chine';
                    tierLabel = fourn ? `Fournisseur: ${fourn.nom}` : (c.source || 'Fournisseur');
                  } else {
                    targetLabel = 'Commande Marchandise';
                  }
                } else if (l.cibleType === 'fret') {
                  const c = commandes.find((item: any) => item.id === l.cibleId);
                  if (c) {
                    const p = products.find((pr: any) => pr.id === c.productId);
                    const trans = fournisseurs.find((f: any) => f.id === c.transitaireId);
                    targetLabel = `Fret Logistique #${c.id.slice(-5)}`;
                    detailLabel = p ? `Transport ${c.modeExpedition || 'Fret'} — ${p.nom}` : 'Colisage Fret';
                    tierLabel = trans ? `Transitaire: ${trans.nom}` : 'Transitaire';
                  } else {
                    targetLabel = 'Fret Logistique';
                  }
                }

                return (
                  <div
                    key={idx}
                    style={{
                      background: THEME.bg.soft,
                      border: `1px solid ${THEME.border.base}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary }}>
                        {targetLabel}
                      </div>
                      <div style={{ fontSize: 11.5, color: THEME.text.secondary }}>
                        {detailLabel} {tierLabel ? `• ${tierLabel}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: THEME.accent.primary }}>
                        {Number(l.montantAlloue || 0).toLocaleString('fr-FR')} Ar
                      </div>
                      <div style={{ fontSize: 10, color: THEME.text.muted }}>
                        Imputé
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (singleVente || singleCommande) ? (
          <div style={{
            background: THEME.bg.card,
            border: `1px solid ${THEME.border.base}`,
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text.primary }}>
              📦 Article & Détail Associé
            </div>
            {singleVente && (() => {
              const p = products.find((pr: any) => pr.id === singleVente.productId);
              const cl = clients.find((c: any) => c.id === singleVente.clientId);
              return (
                <div style={{ fontSize: 12, color: THEME.text.secondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Produit : <strong>{p ? p.nom : 'Produit'}</strong> (×{singleVente.qty || 1})</div>
                  {cl && <div>Client : <strong>{cl.nom}</strong></div>}
                  <div>Total Vente : <strong>{Number(singleVente.total || (singleVente.pu * singleVente.qty)).toLocaleString('fr-FR')} Ar</strong></div>
                </div>
              );
            })()}
            {singleCommande && (() => {
              const p = products.find((pr: any) => pr.id === singleCommande.productId);
              const fourn = fournisseurs.find((f: any) => f.id === singleCommande.fournisseurId);
              return (
                <div style={{ fontSize: 12, color: THEME.text.secondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Article : <strong>{p ? p.nom : 'Article'}</strong> (×{singleCommande.qty || 1})</div>
                  {fourn && <div>Fournisseur : <strong>{fourn.nom}</strong></div>}
                  <div>Statut logistique : <strong>{singleCommande.statut || 'En cours'}</strong></div>
                </div>
              );
            })()}
          </div>
        ) : null}

        {/* STATUT ACOMPTE LIBRE / RELIQUAT DISPONIBLE (SAGE LOGIC) */}
        {paiementObj && (
          <div style={{
            background: reliquatPaiement > 0 ? '#E3EFE9' : THEME.bg.card,
            border: `1px solid ${reliquatPaiement > 0 ? '#C4DEC0' : THEME.border.base}`,
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: reliquatPaiement > 0 ? '#276749' : THEME.text.primary }}>
                {reliquatPaiement > 0 ? '💡 Acompte Libre / Reliquat Disponible' : '✔ Statut du Règlement'}
              </div>
              <div style={{ fontSize: 11, color: reliquatPaiement > 0 ? '#3A7D5B' : THEME.text.secondary, marginTop: 2 }}>
                {reliquatPaiement > 0
                  ? `${reliquatPaiement.toLocaleString('fr-FR')} Ar disponible sur ce versement`
                  : `Ce versement de ${Number(paiementObj.montantTotal || 0).toLocaleString('fr-FR')} Ar est intégralement imputé.`}
              </div>
            </div>

            {imputerPaiementExistant && (
              <button
                type="button"
                onClick={() => setShowImputerModal(true)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#3D5A6C',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PlusCircle size={14} />
                <span>{reliquatPaiement > 0 ? 'Imputer cet acompte' : 'Ajouter des factures'}</span>
              </button>
            )}
          </div>
        )}

        {/* FRAIS DE TRANSACTION ASSOCIÉS */}
        {paiementObj && Number(paiementObj.frais) > 0 && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="#DC2626" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>
                  Frais de transaction débités
                </div>
                <div style={{ fontSize: 11, color: '#B91C1C' }}>
                  Enregistré en débit séparé sur {paiementObj.compte}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>
              − {Number(paiementObj.frais).toLocaleString('fr-FR')} Ar
            </div>
          </div>
        )}

        {/* BOUTONS D'ACTION */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 8,
          paddingTop: 12,
          borderTop: `1px solid ${THEME.border.base}`,
        }}>
          {confirmDelete ? (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontSize: 12.5, fontWeight: 600 }}>
                <AlertTriangle size={16} color="#DC2626" />
                <span>Confirmer la suppression définitive de cette transaction ?</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{ ...ghostBtn, height: 32, fontSize: 12, padding: '0 12px' }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (supprimerMouvement) {
                      supprimerMouvement(transaction.id, transaction);
                      onClose();
                    }
                  }}
                  style={{
                    ...primaryBtn,
                    background: '#DC2626',
                    borderColor: '#B91C1C',
                    height: 32,
                    fontSize: 12,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Trash2 size={13} />
                  <span>Oui, supprimer</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {supprimerMouvement ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ ...ghostBtn, color: '#C24A3F', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={14} />
                  <span>Supprimer cette transaction</span>
                </button>
              ) : <div />}

              <button
                onClick={onClose}
                style={{ ...primaryBtn, padding: '8px 20px', fontSize: 12.5 }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>

    {showImputerModal && paiementObj && imputerPaiementExistant && (
      <ModalImputerFacture
        show={showImputerModal}
        onClose={() => setShowImputerModal(false)}
        paiement={paiementObj}
        imputerPaiementExistant={imputerPaiementExistant}
        ventes={ventes}
        commandes={commandes}
        products={products}
        fournisseurs={fournisseurs}
        clients={clients}
        paiements={paiements}
      />
    )}
    </>
  );
}
