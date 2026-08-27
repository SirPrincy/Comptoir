import React from 'react';
import { Card, Field, inputStyle, selectStyle, primaryBtn } from '../ui';
import { COMPTES_FINANCIERS, TAGS_TRANSACTION } from '../constants';
import SoldeCompteInfo from './SoldeCompteInfo';

interface FormSaisieProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  ajouterMouvement: () => void;
  today: string;
  comptes?: string[];
  soldesParCompte?: Record<string, number>;
  soldeRmbInfo?: any;
}

export default function ModalMouvementManuel({
  form,
  setForm,
  ajouterMouvement,
  today,
  comptes,
  soldesParCompte = {},
  soldeRmbInfo,
}: FormSaisieProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;

  return (
    <Card style={{ marginBottom: 18, background: '#FAF7F2', borderColor: '#E3DDD2', padding: '14px 16px' }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3D5A6C', marginBottom: 12 }}>
        Saisie manuelle (Apport, Prélèvement Perso, Dépense Business)
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Field label="Nature & Domaine de l'opération" style={{ flex: '1 1 220px' }}>
          <select
            style={selectStyle as any}
            value={form.natureOp || (form.type === 'investissement' ? 'apport_perso' : (form.tag === '#retrait-perso' ? 'retrait_perso' : (form.type === 'entrée' ? 'entree_business' : 'depense_business')))}
            onChange={e => {
              const val = e.target.value;
              if (val === 'apport_perso') {
                setForm({
                  ...form,
                  natureOp: 'apport_perso',
                  type: 'entrée',
                  isPerso: true,
                  tag: '#investissement',
                });
              } else if (val === 'retrait_perso') {
                setForm({
                  ...form,
                  natureOp: 'retrait_perso',
                  type: 'sortie',
                  isPerso: true,
                  tag: '#retrait-perso',
                });
              } else if (val === 'entree_business') {
                setForm({
                  ...form,
                  natureOp: 'entree_business',
                  type: 'entrée',
                  isPerso: false,
                  tag: '#fond-roulement',
                });
              } else {
                setForm({
                  ...form,
                  natureOp: 'depense_business',
                  type: 'sortie',
                  isPerso: false,
                  tag: '#loyer-charges',
                });
              }
            }}
          >
            <option value="apport_perso">👤 Capital / Apport personnel (+)</option>
            <option value="retrait_perso">👤 Prélèvement / Retrait personnel (−)</option>
            <option value="entree_business">💼 Recette / Entrée Business (+)</option>
            <option value="depense_business">💼 Dépense / Charge Business (−)</option>
          </select>
        </Field>

        <Field label="Compte / Portefeuille" style={{ flex: '1 1 140px' }}>
          <select
            style={selectStyle as any}
            value={form.compte}
            onChange={e => setForm({ ...form, compte: e.target.value })}
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

        <Field label="Montant (en Ariary)" style={{ flex: '1 1 130px' }}>
          <input
            type="number"
            min="0"
            placeholder="ex: 200000"
            style={inputStyle as any}
            value={form.montant}
            onChange={e => setForm({ ...form, montant: e.target.value })}
          />
        </Field>

        <Field label="Frais transaction (Ar, opt.)" style={{ flex: '1 1 130px' }}>
          <input
            type="number"
            min="0"
            placeholder="ex: 1500"
            style={inputStyle as any}
            value={form.frais || ''}
            onChange={e => setForm({ ...form, frais: e.target.value })}
          />
        </Field>

        <Field label="Date" style={{ flex: '1 1 120px' }}>
          <input
            type="date"
            max={today}
            style={inputStyle as any}
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
          />
        </Field>
      </div>

      <div style={{ marginTop: 8 }}>
        <SoldeCompteInfo
          compteSelectionne={form.compte}
          soldesParCompte={soldesParCompte}
          soldeRmbDispo={soldeRmbInfo?.soldeRmbDispo}
          montantOperation={Number(form.montant) || 0}
          typeOperation={form.type === 'entrée' ? 'credit' : 'debit'}
          activeComptes={activeComptes}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Description détaillée" style={{ flex: '2 1 200px' }}>
          <input
            style={inputStyle as any}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="ex: Retrait salaire perso, Injection capital, Loyer local..."
          />
        </Field>

        <Field label="Tag / Catégorie" style={{ flex: '1 1 130px' }}>
          <select
            style={selectStyle as any}
            value={form.tag}
            onChange={e => setForm({ ...form, tag: e.target.value })}
          >
            {TAGS_TRANSACTION.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Réf / N° transaction" style={{ flex: '1 1 130px' }}>
          <input
            style={inputStyle as any}
            value={form.reference}
            onChange={e => setForm({ ...form, reference: e.target.value })}
            placeholder="ex: TX12345"
          />
        </Field>

        <button
          onClick={ajouterMouvement}
          disabled={!form.montant || !form.description.trim()}
          style={{
            ...primaryBtn,
            height: 38,
            flex: '1 1 120px',
            justifyContent: 'center',
            opacity: form.montant && form.description.trim() ? 1 : 0.5,
          }}
        >
          Enregistrer
        </button>
      </div>
    </Card>
  );
}
