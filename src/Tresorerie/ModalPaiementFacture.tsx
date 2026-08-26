import React from 'react';
import { Receipt, DollarSign, ShoppingCart, Ship, CheckCircle2 } from 'lucide-react';
import { Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { getRestePayeMarchandise, getRestePayeFret, getRestePayeVente } from '../paymentUtils';

interface ModalPaiementFactureProps {
  show: boolean;
  onClose: () => void;
  factureForm: any;
  setFactureForm: React.Dispatch<React.SetStateAction<any>>;
  handleNatureChange: (nature: string) => void;
  handleCommandeChange: (id: string) => void;
  enregistrerPaiementFacture: () => void;
  ventesUnpaid: any[];
  commandesUnpaidMarchandise: any[];
  commandesUnpaidFret: any[];
  products: any[];
  clients: any[];
  fournisseurs: any[];
  today: string;
  comptes?: string[];
}

export default function ModalPaiementFacture({
  show,
  onClose,
  factureForm,
  setFactureForm,
  handleNatureChange,
  handleCommandeChange,
  enregistrerPaiementFacture,
  ventesUnpaid,
  commandesUnpaidMarchandise,
  commandesUnpaidFret,
  products,
  clients,
  fournisseurs,
  today,
  comptes,
}: ModalPaiementFactureProps) {
  if (!show) return null;

  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(38, 51, 61, 0.45)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '18px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: '#26333D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={18} color="#3D5A6C" />
          <span>Règlement / Encaissement de Facture</span>
        </div>
        <div style={{ fontSize: 12, color: '#8A8375', marginBottom: 14 }}>
          Sélectionnez l'opération à enregistrer. Le montant s'auto-remplit. Acompte possible.
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
                <span>1. Encaissement Vente</span>
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
                <span>2. Achat Chine</span>
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
                <span>3. Fret Transitaire</span>
              </button>
            </div>
          </Field>

          {/* Choix de la facture / commande à régler */}
          <Field label={
            factureForm.nature === 'vente'
              ? "Vente non encaissée (Crédit / Acompte)"
              : (factureForm.nature === 'marchandise' ? "Achat Chine non payé" : "Fret dû au transitaire")
          }>
            {factureForm.nature === 'vente' ? (
              ventesUnpaid.length === 0 ? (
                <div style={{ fontSize: 12, color: '#3F7A5C', background: '#E3EFE9', padding: '8px 12px', borderRadius: 6 }}>
                  ✅ Toutes les ventes aux clients sont réglées !
                </div>
              ) : (
                <select
                  style={{ ...selectStyle, width: '100%' } as any}
                  value={factureForm.selectedId}
                  onChange={e => handleCommandeChange(e.target.value)}
                >
                  {ventesUnpaid.map((v: any) => {
                    const p = products.find((pr: any) => pr.id === v.productId);
                    const nomP = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Produit';
                    const cl = clients.find((c: any) => c.id === v.clientId);
                    const nomClient = cl?.nom || (v.description ? v.description : 'Client');
                    const totalVente = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1));
                    const reste = getRestePayeVente(v);
                    return (
                      <option key={v.id} value={v.id}>
                        [{nomClient}] Vente {nomP} (x{v.qty || 1}) — Reste: {reste.toLocaleString('fr-FR')} Ar (sur {totalVente.toLocaleString('fr-FR')} Ar)
                      </option>
                    );
                  })}
                </select>
              )
            ) : (factureForm.nature === 'marchandise' ? (
              commandesUnpaidMarchandise.length === 0 ? (
                <div style={{ fontSize: 12, color: '#3F7A5C', background: '#E3EFE9', padding: '8px 12px', borderRadius: 6 }}>
                  ✅ Tous les achats de marchandises sont réglés !
                </div>
              ) : (
                <select
                  style={{ ...selectStyle, width: '100%' } as any}
                  value={factureForm.selectedId}
                  onChange={e => handleCommandeChange(e.target.value)}
                >
                  {commandesUnpaidMarchandise.map((c: any) => {
                    const p = products.find((pr: any) => pr.id === c.productId);
                    const nomP = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Produit';
                    const totalAchat = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
                    const four = fournisseurs.find((f: any) => f.id === c.fournisseurId);
                    const nomFour = four?.nom || c.source || 'Fournisseur Chine';
                    const reste = getRestePayeMarchandise(c);
                    return (
                      <option key={c.id} value={c.id}>
                        [{nomFour}] {nomP} (x{c.qty || 1}) — Reste: {reste.toLocaleString('fr-FR')} Ar (sur {totalAchat.toLocaleString('fr-FR')} Ar)
                      </option>
                    );
                  })}
                </select>
              )
            ) : (
              commandesUnpaidFret.length === 0 ? (
                <div style={{ fontSize: 12, color: '#3F7A5C', background: '#E3EFE9', padding: '8px 12px', borderRadius: 6 }}>
                  ✅ Tous les frais de fret sont actuellement réglés !
                </div>
              ) : (
                <select
                  style={{ ...selectStyle, width: '100%' } as any}
                  value={factureForm.selectedId}
                  onChange={e => handleCommandeChange(e.target.value)}
                >
                  {commandesUnpaidFret.map((c: any) => {
                    const p = products.find((pr: any) => pr.id === c.productId);
                    const nomP = p ? `${p.nom}${p.couleur ? ` (${p.couleur})` : ''}` : 'Produit';
                    const fretAr = Number(c.fraisTransport) || 0;
                    const trans = fournisseurs.find((f: any) => f.id === c.transitaireId);
                    const nomTrans = trans?.nom || 'Transitaire';
                    const reste = getRestePayeFret(c);
                    return (
                      <option key={c.id} value={c.id}>
                        [{nomTrans}] Fret {c.modeExpedition || ''} — {nomP} (x{c.qty || 1}) — Reste: {reste.toLocaleString('fr-FR')} Ar (sur {fretAr.toLocaleString('fr-FR')} Ar)
                      </option>
                    );
                  })}
                </select>
              )
            ))}
          </Field>

          {/* Détails du paiement */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <Field label={factureForm.nature === 'vente' ? "Compte Crédité" : "Compte Débité"}>
              <select
                style={selectStyle as any}
                value={factureForm.compte}
                onChange={e => setFactureForm({ ...factureForm, compte: e.target.value })}
              >
                {activeComptes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Montant règlement (Ar)">
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

          <Field label={factureForm.nature === 'vente' ? "Client / Payeur" : "Bénéficiaire / Créancier"}>
            <input
              style={inputStyle as any}
              value={factureForm.beneficiaire}
              onChange={e => setFactureForm({ ...factureForm, beneficiaire: e.target.value })}
              placeholder={factureForm.nature === 'vente' ? "Ex: Jean Rakoto" : "Ex: Boutique 1688 ou SpeedCargo"}
            />
          </Field>

          <Field label="Description / Libellé">
            <input
              style={inputStyle as any}
              value={factureForm.description}
              onChange={e => setFactureForm({ ...factureForm, description: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} style={{ ...ghostBtn, flex: '1 1 100px', justifyContent: 'center' }}>
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrerPaiementFacture}
              disabled={!factureForm.selectedId || !factureForm.montant || Number(factureForm.montant) <= 0}
              style={{
                ...primaryBtn,
                flex: '1 1 180px',
                justifyContent: 'center',
                background: factureForm.nature === 'vente' ? '#3F7A5C' : '#3D5A6C',
                opacity: (factureForm.selectedId && Number(factureForm.montant) > 0) ? 1 : 0.4,
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
