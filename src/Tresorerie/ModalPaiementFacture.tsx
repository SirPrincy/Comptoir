import React, { useMemo } from 'react';
import { Receipt, DollarSign, ShoppingCart, Ship, CheckCircle2, AlertCircle, Info, CheckSquare, Square } from 'lucide-react';
import { Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { getRestePayeMarchandise, getRestePayeFret, getRestePayeVente, getMontantPayeMarchandise, getMontantPayeFret, getMontantPayeVente } from '../paymentUtils';
import SoldeCompteInfo from './SoldeCompteInfo';

interface ModalPaiementFactureProps {
  show: boolean;
  onClose: () => void;
  factureForm: any;
  setFactureForm: React.Dispatch<React.SetStateAction<any>>;
  handleNatureChange: (nature: string) => void;
  handleToggleSelectId: (id: string) => void;
  handleToggleSelectAll: (selectAll: boolean) => void;
  enregistrerPaiementFacture: () => void;
  ventesUnpaid: any[];
  commandesUnpaidMarchandise: any[];
  commandesUnpaidFret: any[];
  products: any[];
  clients: any[];
  fournisseurs: any[];
  paiements?: any[];
  today: string;
  comptes?: string[];
  soldesParCompte?: Record<string, number>;
  soldeRmbInfo?: any;
}

export default function ModalPaiementFacture({
  show,
  onClose,
  factureForm,
  setFactureForm,
  handleNatureChange,
  handleToggleSelectId,
  handleToggleSelectAll,
  enregistrerPaiementFacture,
  ventesUnpaid,
  commandesUnpaidMarchandise,
  commandesUnpaidFret,
  products,
  clients,
  fournisseurs,
  paiements = [],
  today,
  comptes,
  soldesParCompte = {},
  soldeRmbInfo,
}: ModalPaiementFactureProps) {
  if (!show) return null;

  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const selectedIds: string[] = Array.isArray(factureForm.selectedIds)
    ? factureForm.selectedIds
    : (factureForm.selectedId ? [factureForm.selectedId] : []);

  const itemsList = useMemo(() => {
    if (factureForm.nature === 'vente') return ventesUnpaid;
    if (factureForm.nature === 'marchandise') return commandesUnpaidMarchandise;
    return commandesUnpaidFret;
  }, [factureForm.nature, ventesUnpaid, commandesUnpaidMarchandise, commandesUnpaidFret]);

  const allSelected = itemsList.length > 0 && selectedIds.length === itemsList.length;
  const isSomeSelected = selectedIds.length > 0;

  // Calcul du reste dû total des items sélectionnés
  const totalResteDuSelection = useMemo(() => {
    let sum = 0;
    itemsList.forEach((item: any) => {
      if (selectedIds.includes(item.id)) {
        if (factureForm.nature === 'vente') sum += getRestePayeVente(item, paiements);
        else if (factureForm.nature === 'marchandise') sum += getRestePayeMarchandise(item, paiements);
        else sum += getRestePayeFret(item, paiements);
      }
    });
    return sum;
  }, [itemsList, selectedIds, factureForm.nature, paiements]);

  const montantSaisi = Number(factureForm.montant) || 0;
  const isDepasse = isSomeSelected && montantSaisi > totalResteDuSelection && totalResteDuSelection > 0;
  const isPartiel = isSomeSelected && montantSaisi < totalResteDuSelection && montantSaisi > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(38, 51, 61, 0.45)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '18px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: '#26333D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={18} color="#3D5A6C" />
          <span>Règlement / Encaissement de Factures (Multi-Paiement)</span>
        </div>
        <div style={{ fontSize: 12, color: '#8A8375', marginBottom: 14 }}>
          Cochez les factures concernées ou saisissez un règlement libre. Le surplus ou paiement sans facture sera conservé en acompte imputable plus tard.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Choix Nature de Facture */}
          <Field label="Entité & Nature de l'opération">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
              <button
                type="button"
                onClick={() => handleNatureChange('vente')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: `1.5px solid ${factureForm.nature === 'vente' ? '#3F7A5C' : '#EAE2D4'}`,
                  background: factureForm.nature === 'vente' ? '#E3EFE9' : '#FFFFFF',
                  color: factureForm.nature === 'vente' ? '#3F7A5C' : '#5E584E',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <DollarSign size={14} />
                <span>1. Encaissement Vente ({ventesUnpaid.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleNatureChange('marchandise')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: `1.5px solid ${factureForm.nature === 'marchandise' ? '#3D5A6C' : '#EAE2D4'}`,
                  background: factureForm.nature === 'marchandise' ? '#F5EFE6' : '#FFFFFF',
                  color: factureForm.nature === 'marchandise' ? '#3D5A6C' : '#5E584E',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <ShoppingCart size={14} />
                <span>2. Achat Chine ({commandesUnpaidMarchandise.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleNatureChange('fret')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: `1.5px solid ${factureForm.nature === 'fret' ? '#E8985E' : '#EAE2D4'}`,
                  background: factureForm.nature === 'fret' ? '#FEF3EB' : '#FFFFFF',
                  color: factureForm.nature === 'fret' ? '#E8985E' : '#5E584E',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <Ship size={14} />
                <span>3. Fret Transitaire ({commandesUnpaidFret.length})</span>
              </button>
            </div>
          </Field>

          {/* Liste des factures avec cases à cocher */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5E584E' }}>
                {factureForm.nature === 'vente'
                  ? "Ventes non encaissées (Crédit / Acompte)"
                  : (factureForm.nature === 'marchandise' ? "Achats Chine non payés" : "Fret dû au transitaire")}
              </label>
              {itemsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(!allSelected)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3D5A6C',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{allSelected ? 'Tout décocher' : 'Tout sélectionner'}</span>
                </button>
              )}
            </div>

            {itemsList.length === 0 ? (
              <div style={{ fontSize: 12, color: '#3F7A5C', background: '#E3EFE9', padding: '10px 12px', borderRadius: 8, border: '1px solid #C4DEC0' }}>
                ✅ Aucun solde impayé pour cette catégorie !
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid #EAE2D4', borderRadius: 8, padding: 6, background: '#FAF7F2' }}>
                {itemsList.map((item: any) => {
                  const isChecked = selectedIds.includes(item.id);
                  const p = products.find((pr: any) => pr.id === item.productId);
                  const nomP = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Article';

                  let labelTier = '';
                  let totalItem = 0;
                  let payeItem = 0;
                  let resteItem = 0;

                  if (factureForm.nature === 'vente') {
                    const cl = clients.find((c: any) => c.id === item.clientId);
                    labelTier = cl?.nom || (item.description ? item.description : 'Client');
                    totalItem = Number(item.total) || (Number(item.pu || 0) * Number(item.qty || 1));
                    payeItem = getMontantPayeVente(item, paiements);
                    resteItem = getRestePayeVente(item, paiements);
                  } else if (factureForm.nature === 'marchandise') {
                    const four = fournisseurs.find((f: any) => f.id === item.fournisseurId);
                    labelTier = four?.nom || item.source || 'Fournisseur Chine';
                    totalItem = item.total !== undefined ? Number(item.total) : (Number(item.pu || 0) * Number(item.qty || 1));
                    payeItem = getMontantPayeMarchandise(item, paiements);
                    resteItem = getRestePayeMarchandise(item, paiements);
                  } else {
                    const trans = fournisseurs.find((f: any) => f.id === item.transitaireId);
                    labelTier = trans?.nom || 'Transitaire';
                    totalItem = Number(item.fraisTransport) || 0;
                    payeItem = getMontantPayeFret(item, paiements);
                    resteItem = getRestePayeFret(item, paiements);
                  }

                  const dateStr = item.dateAchat || item.date ? new Date(item.dateAchat || item.date).toLocaleDateString('fr-FR') : '';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSelectId(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1px solid ${isChecked ? '#3D5A6C' : '#EAE2D4'}`,
                        background: isChecked ? '#FFFFFF' : '#F5F2EC',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // géré par le clic conteneur
                          style={{ cursor: 'pointer', accentColor: '#3D5A6C' }}
                        />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#26333D' }}>
                            [{labelTier}] {nomP}
                          </span>
                          {item.qty && <span style={{ fontSize: 11, color: '#736B5E', marginLeft: 4 }}>(x{item.qty})</span>}
                          {dateStr && <span style={{ fontSize: 10.5, color: '#8A8375', marginLeft: 6 }}>· {dateStr}</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#B5532A' }}>
                          Reste: {resteItem.toLocaleString('fr-FR')} Ar
                        </div>
                        <div style={{ fontSize: 10, color: '#736B5E' }}>
                          {payeItem > 0 ? (
                            <span style={{ color: '#B78103', fontWeight: 600 }}>Acompte déjà versé ({payeItem.toLocaleString('fr-FR')} Ar)</span>
                          ) : (
                            <span>Total : {totalItem.toLocaleString('fr-FR')} Ar</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Détails du paiement */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <Field label={factureForm.nature === 'vente' ? "Compte Crédité" : "Compte Débité"}>
              <select
                style={selectStyle as any}
                value={factureForm.compte}
                onChange={e => setFactureForm({ ...factureForm, compte: e.target.value })}
              >
                {activeComptes.map(c => {
                  const isRmbOpt = c === 'Réserve RMB (¥)' || c.toLowerCase().includes('rmb');
                  const s = isRmbOpt
                    ? (soldeRmbInfo?.soldeRmbDispo || 0)
                    : (soldesParCompte[c] || 0);
                  const sLabel = isRmbOpt ? `${s.toFixed(2)} ¥` : `${s.toLocaleString('fr-FR')} Ar`;
                  return (
                    <option key={c} value={c}>
                      {c} (Solde : {sLabel})
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="Montant règlement global (Ar)">
              <input
                type="number"
                min="0"
                style={{ ...inputStyle, fontWeight: 700, color: '#26333D' } as any}
                value={factureForm.montant}
                onChange={e => setFactureForm({ ...factureForm, montant: e.target.value })}
              />
            </Field>

            <Field label="Frais de transaction (Ar)">
              <input
                type="number"
                min="0"
                placeholder="Ex: 1500"
                style={inputStyle as any}
                value={factureForm.frais || ''}
                onChange={e => setFactureForm({ ...factureForm, frais: e.target.value })}
              />
              {Number(factureForm.frais) > 0 && (
                <div style={{ fontSize: 11, color: '#C24A3F', marginTop: 3, fontWeight: 600 }}>
                  💸 + {Number(factureForm.frais).toLocaleString('fr-FR')} Ar de frais débités sur {factureForm.compte}
                </div>
              )}
            </Field>

            <Field label="Date">
              <input
                type="date"
                max={today}
                style={inputStyle as any}
                value={factureForm.date}
                onChange={e => setFactureForm({ ...factureForm, date: e.target.value })}
              />
            </Field>
          </div>

          {/* Badge Solde Portefeuille */}
          <SoldeCompteInfo
            compteSelectionne={factureForm.compte}
            soldesParCompte={soldesParCompte}
            soldeRmbDispo={soldeRmbInfo?.soldeRmbDispo}
            montantOperation={
              factureForm.nature === 'vente'
                ? Math.max(0, (Number(factureForm.montant) || 0) - (Number(factureForm.frais) || 0))
                : ((Number(factureForm.montant) || 0) + (Number(factureForm.frais) || 0))
            }
            typeOperation={factureForm.nature === 'vente' ? 'credit' : 'debit'}
            activeComptes={activeComptes}
          />

          <Field label={factureForm.nature === 'vente' ? "Client / Payeur" : "Bénéficiaire / Créancier"}>
            <input
              style={inputStyle as any}
              value={factureForm.beneficiaire}
              onChange={e => setFactureForm({ ...factureForm, beneficiaire: e.target.value })}
              placeholder={factureForm.nature === 'vente' ? "Ex: Jean Rakoto" : "Ex: Boutique 1688 ou SpeedCargo"}
            />
          </Field>

          <Field label="Description / Libellé du versement">
            <input
              style={inputStyle as any}
              value={factureForm.description}
              onChange={e => setFactureForm({ ...factureForm, description: e.target.value })}
            />
          </Field>

          {/* Indicateur récapitulatif en bas de modal */}
          {montantSaisi > 0 && (() => {
            const montantImpute = Math.min(montantSaisi, totalResteDuSelection);
            const reliquatAcompte = Math.max(0, montantSaisi - totalResteDuSelection);

            return (
              <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                {isSomeSelected ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#26333D' }}>
                      <span>{selectedIds.length} facture{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}</span>
                      <span>Reste dû cumulé : <strong>{totalResteDuSelection.toLocaleString('fr-FR')} Ar</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #EAE2D4' }}>
                      <span>Montant affecté aux factures :</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#3D5A6C' }}>
                        {montantImpute.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>

                    {reliquatAcompte > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, color: '#276749', fontWeight: 700 }}>
                        <span>Acompte libre / Surplus (reliquat non imputé) :</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#276749' }}>
                          + {reliquatAcompte.toLocaleString('fr-FR')} Ar
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#2B6CB0', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Paiement / Encaissement libre sans facture :</span>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: '#2B6CB0' }}>
                        {montantSaisi.toLocaleString('fr-FR')} Ar
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#4A5568', fontStyle: 'italic' }}>
                      💡 Ce versement sera conservé en acompte disponible et pourra être affecté plus tard à vos factures.
                    </div>
                  </div>
                )}

                {Number(factureForm.frais) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, color: '#C24A3F', fontWeight: 600 }}>
                    <span>Frais de transaction ajoutés :</span>
                    <span>+ {Number(factureForm.frais).toLocaleString('fr-FR')} Ar</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTop: '1px solid #EAE2D4', fontWeight: 700, color: '#26333D' }}>
                  <span>Total net mouvementé ({factureForm.compte}) :</span>
                  <span style={{ fontSize: 13.5, color: factureForm.nature === 'vente' ? '#3F7A5C' : '#C24A3F' }}>
                    {factureForm.nature === 'vente'
                      ? `+ ${(montantSaisi - (Number(factureForm.frais) || 0)).toLocaleString('fr-FR')} Ar net`
                      : `− ${(montantSaisi + (Number(factureForm.frais) || 0)).toLocaleString('fr-FR')} Ar décaissés`}
                  </span>
                </div>

                {isPartiel && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#B78103', background: '#FFF8E1', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    <Info size={13} />
                    <span>Paiement partiel — sera ventilé sur les factures les plus anciennes d'abord (FIFO).</span>
                  </div>
                )}

                {reliquatAcompte > 0 && isSomeSelected && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#276749', background: '#F0FFF4', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    <Info size={13} />
                    <span>Le montant dépasse les factures sélectionnées ({totalResteDuSelection.toLocaleString('fr-FR')} Ar). Le surplus de {reliquatAcompte.toLocaleString('fr-FR')} Ar sera conservé en acompte libre.</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: '1 1 100px', justifyContent: 'center' }}>
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrerPaiementFacture}
              disabled={!factureForm.montant || Number(factureForm.montant) <= 0}
              style={{
                ...primaryBtn,
                flex: '1 1 180px',
                justifyContent: 'center',
                background: factureForm.nature === 'vente' ? '#3F7A5C' : '#3D5A6C',
                opacity: (Number(factureForm.montant) > 0) ? 1 : 0.4,
              }}
            >
              <CheckCircle2 size={15} /> {factureForm.nature === 'vente' ? "Valider l'encaissement" : "Valider le règlement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
