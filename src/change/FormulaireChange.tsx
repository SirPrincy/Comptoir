import React from 'react';
import { Check, Coins, Wallet, Building2, User } from 'lucide-react';
import { Card, SectionHeader, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';
import { CANAUX_RMB, VITESSE_OPTIONS, INTERMEDIAIRES_HABITUELS } from './types';

interface FormulaireChangeProps {
  editingId: string | null;
  form: {
    date: string;
    montantMga: string;
    montantRmb: string;
    taux: string;
    fraisMga: string;
    fournisseur: string;
    canal: string;
    vitesseExecution: string;
    noteFiabilite: string;
    compteSource: string;
    domaineFonds: 'business' | 'perso';
    reference: string;
    notes: string;
    genererMouvementTresorerie: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => void;
  onCancel: () => void;
  handleTauxChange: (val: string) => void;
  comptes?: string[];
}

export default function FormulaireChange({
  editingId,
  form,
  setForm,
  onSave,
  onCancel,
  handleTauxChange,
  comptes,
}: FormulaireChangeProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const mgaNum = Number(form.montantMga) || 0;
  const rmbNum = Number(form.montantRmb) || 0;
  const fraisNum = Number(form.fraisMga) || 0;
  const totalSortieMga = mgaNum + fraisNum;

  return (
    <Card style={{ background: '#FFF9EF', border: '1.5px solid #F0DDB3', padding: 16 }}>
      <SectionHeader
        title={editingId ? "Modifier l'opération de change" : "Saisir un nouvel achat de Yuan (RMB)"}
        subtitle="MGA dépensé ➔ RMB crédité sur votre compte WeChat/Alipay/1688 + Sortie Trésorerie automatique"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {/* Ligne 1 : Date, Fournisseur, Canal */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Date de l'opération" style={{ flex: '1 1 140px' }}>
            <input
              type="date"
              style={inputStyle as any}
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
          </Field>

          <Field label="Exchanger / Intermédiaire P2P" style={{ flex: '1.5 1 200px' }}>
            <input
              style={inputStyle as any}
              value={form.fournisseur}
              onChange={e => setForm({ ...form, fournisseur: e.target.value })}
              placeholder="Ex: Tanà Exchange, Contact WeChat, Agent X"
              list="exchangers-list"
            />
            <datalist id="exchangers-list">
              {INTERMEDIAIRES_HABITUELS.map(i => (
                <option key={i} value={i} />
              ))}
            </datalist>
          </Field>

          <Field label="Canal de réception RMB" style={{ flex: '1.5 1 180px' }}>
            <select
              style={selectStyle as any}
              value={form.canal}
              onChange={e => setForm({ ...form, canal: e.target.value })}
            >
              {CANAUX_RMB.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Ligne 2 : Montant MGA, Montant RMB, Taux Calculé, Frais */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4' }}>
          <Field label="Montant MGA déboursé (Ar) *" style={{ flex: '1.2 1 160px' }}>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#C24A3F' } as any}
              value={form.montantMga}
              onChange={e => {
                const newMga = e.target.value;
                const mga = Number(newMga);
                const rmb = Number(form.montantRmb);
                let newTaux = form.taux;
                if (mga > 0 && rmb > 0) {
                  newTaux = String(Math.round((mga / rmb) * 100) / 100);
                }
                setForm({ ...form, montantMga: newMga, taux: newTaux });
              }}
              placeholder="Ex: 6 800 000"
            />
          </Field>

          <Field label="Montant RMB reçu (¥) *" style={{ flex: '1.2 1 160px' }}>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#2C5E43' } as any}
              value={form.montantRmb}
              onChange={e => {
                const newRmb = e.target.value;
                const rmb = Number(newRmb);
                const mga = Number(form.montantMga);
                let newTaux = form.taux;
                if (mga > 0 && rmb > 0) {
                  newTaux = String(Math.round((mga / rmb) * 100) / 100);
                }
                setForm({ ...form, montantRmb: newRmb, taux: newTaux });
              }}
              placeholder="Ex: 10 000"
            />
          </Field>

          <Field label="Taux Réel Calculé (Ar / ¥)" style={{ flex: '1 1 130px' }}>
            <input
              type="number"
              style={{ ...inputStyle, fontWeight: 700, color: '#8D6E00' } as any}
              value={form.taux}
              onChange={e => handleTauxChange(e.target.value)}
              placeholder="Ex: 680"
            />
          </Field>

          <Field label="Frais annexes (Ar, optionnel)" style={{ flex: '1 1 120px' }}>
            <input
              type="number"
              style={inputStyle as any}
              value={form.fraisMga}
              onChange={e => setForm({ ...form, fraisMga: e.target.value })}
              placeholder="Ex: 5 000"
            />
          </Field>
        </div>

        {/* Ligne 3 : Vitesse, Note, Référence & Notes */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Vitesse de transfert" style={{ flex: '1 1 160px' }}>
            <select
              style={selectStyle as any}
              value={form.vitesseExecution}
              onChange={e => setForm({ ...form, vitesseExecution: e.target.value })}
            >
              {VITESSE_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Note Fiabilité Exchanger" style={{ flex: '1 1 160px' }}>
            <select
              style={selectStyle as any}
              value={form.noteFiabilite}
              onChange={e => setForm({ ...form, noteFiabilite: e.target.value })}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5/5 - Parfait)</option>
              <option value="4">⭐⭐⭐⭐ (4/5 - Bon service)</option>
              <option value="3">⭐⭐⭐ (3/5 - Correct)</option>
              <option value="2">⭐⭐ (2/5 - Lent/Instable)</option>
              <option value="1">⭐ (1/5 - Problème/Litige)</option>
            </select>
          </Field>

          <Field label="Référence / Contact / ID Transaction" style={{ flex: '1.2 1 180px' }}>
            <input
              style={inputStyle as any}
              value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex: Virement #4829 - Contact WeChat"
            />
          </Field>

          <Field label="Remarques & Usage" style={{ flex: '1.5 1 200px' }}>
            <input
              style={inputStyle as any}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: Rechargement pour lot sacs 1688"
            />
          </Field>
        </div>

        {/* SECTION IMPACT AUTOMATIQUE TRÉSORERIE */}
        <div style={{ background: '#F0F4F8', border: '1px solid #D1DEE8', borderRadius: 8, padding: 12, marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Wallet size={16} color="#3D5A6C" />
            <span>Impact Automatique sur la Trésorerie MGA (Pas de double saisie)</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Source des Fonds : Compte Financier */}
            <Field label="Compte Débité (Trésorerie)" style={{ flex: '1 1 180px' }}>
              <select
                style={selectStyle as any}
                value={form.compteSource}
                onChange={e => setForm({ ...form, compteSource: e.target.value })}
              >
                {activeComptes.filter(c => c !== 'Réserve RMB (¥)').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            {/* Origine des Fonds : Business vs Perso */}
            <Field label="Origine des Fonds" style={{ flex: '1 1 180px' }}>
              <select
                style={selectStyle as any}
                value={form.domaineFonds}
                onChange={e => setForm({ ...form, domaineFonds: e.target.value as 'business' | 'perso' })}
              >
                <option value="business">🏢 Fonds Société / Business (Fonds de roulement)</option>
                <option value="perso">👤 Fonds Personnels / Apport du Dirigeant</option>
              </select>
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#26333D', cursor: 'pointer', userSelect: 'none', marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.genererMouvementTresorerie}
              onChange={e => setForm({ ...form, genererMouvementTresorerie: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#3F7A5C' }}
            />
            <span>
              Créer automatiquement une sortie de <strong>{totalSortieMga.toLocaleString('fr-FR')} Ar</strong> sur le compte <strong>{form.compteSource}</strong> ({form.domaineFonds === 'perso' ? 'Apport Perso' : 'Sortie Business #change-rmb'})
            </span>
          </label>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={onCancel}
            style={ghostBtn}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!form.montantMga || !form.montantRmb}
            style={{
              ...primaryBtn,
              background: '#3F7A5C',
              opacity: !form.montantMga || !form.montantRmb ? 0.5 : 1,
            }}
          >
            <Check size={14} />
            <span>{editingId ? 'Mettre à jour' : 'Enregistrer le Change'}</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
