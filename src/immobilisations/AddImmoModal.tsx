import React, { useState } from 'react';
import { THEME } from '../colors';
import { Modal, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { Immobilisation } from './types';
import { CATEGORIES_IMMO } from './immoUtils';

interface AddImmoModalProps {
  onClose: () => void;
  onSave: (nouvelleImmo: Immobilisation, genererEcriture: boolean, compteTresorerie: string) => void;
  comptes?: string[];
}

export default function AddImmoModal({
  onClose,
  onSave,
  comptes = ['Caisse / Espèces', 'MVola', 'Orange Money', 'BMOI Banque'],
}: AddImmoModalProps) {
  const [form, setForm] = useState({
    nom: '',
    categorie: CATEGORIES_IMMO[0],
    valeurOrigine: '',
    dateAchat: new Date().toISOString().split('T')[0],
    dureeAmortissement: '5',
    notes: '',
    genererEcriture: false,
    compteTresorerie: comptes[0] || 'Caisse / Espèces',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(form.valeurOrigine);
    const duree = Number(form.dureeAmortissement);

    if (!form.nom.trim() || isNaN(val) || val <= 0 || isNaN(duree) || duree <= 0) {
      alert('Champs invalides !');
      return;
    }

    const id = 'immo-' + Math.random().toString(36).slice(2, 10);
    const nouvelleImmo: Immobilisation = {
      id,
      nom: form.nom.trim(),
      categorie: form.categorie,
      valeurOrigine: val,
      dateAchat: form.dateAchat,
      dureeAmortissement: duree,
      notes: form.notes.trim(),
    };

    onSave(nouvelleImmo, form.genererEcriture, form.compteTresorerie);
  };

  return (
    <Modal title="Enregistrer une immobilisation" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <Field label="Désignation de l'actif *">
          <input
            type="text"
            required
            placeholder="Ex: Scooter de livraison, Ordinateur de comptabilité..."
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Catégorie *">
            <select
              value={form.categorie}
              onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              style={selectStyle}
            >
              {CATEGORIES_IMMO.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Field>

          <Field label="Durée de vie (Années) *">
            <input
              type="number"
              min="1"
              max="100"
              required
              placeholder="Ex: 5"
              value={form.dureeAmortissement}
              onChange={(e) => setForm({ ...form, dureeAmortissement: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Valeur d'acquisition (MGA) *">
            <input
              type="number"
              min="1"
              required
              placeholder="Ex: 1500000"
              value={form.valeurOrigine}
              onChange={(e) => setForm({ ...form, valeurOrigine: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Date d'acquisition *">
            <input
              type="date"
              required
              value={form.dateAchat}
              onChange={(e) => setForm({ ...form, dateAchat: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Notes / Informations supplémentaires (Optionnel)">
          <textarea
            placeholder="Numéro de série, facture, état d'acquisition..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, height: 60, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </Field>

        {/* Intégration de trésorerie automatisée */}
        <div style={{
          background: THEME.bg.soft,
          border: `1px solid ${THEME.border.base}`,
          borderRadius: 8,
          padding: 10,
          marginTop: 4,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.genererEcriture}
              onChange={(e) => setForm({ ...form, genererEcriture: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: THEME.accent.primary }}
            />
            Enregistrer la sortie de caisse en trésorerie
          </label>
          
          {form.genererEcriture && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, borderTop: `1px solid ${THEME.border.base}`, paddingTop: 8 }}>
              <Field label="Compte de règlement">
                <select
                  value={form.compteTresorerie}
                  onChange={(e) => setForm({ ...form, compteTresorerie: e.target.value })}
                  style={{ ...selectStyle, height: 32 }}
                >
                  {comptes.map(cp => (
                    <option key={cp} value={cp}>{cp}</option>
                  ))}
                </select>
              </Field>
              <div style={{ fontSize: 11, color: THEME.text.muted }}>
                Un mouvement financier de type <strong>Sortie</strong> d'un montant de <strong>{Number(form.valeurOrigine || 0).toLocaleString()} MGA</strong> sera automatiquement généré avec le tag <strong>#materiel</strong>.
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Annuler
          </button>
          <button type="submit" style={primaryBtn}>
            Enregistrer l'actif
          </button>
        </div>
      </form>
    </Modal>
  );
}
