import React from 'react';
import { Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { COMPTES_FINANCIERS } from '../constants';

interface ModalTransfertComptesProps {
  show: boolean;
  onClose: () => void;
  transfertForm: any;
  setTransfertForm: React.Dispatch<React.SetStateAction<any>>;
  executerTransfert: () => void;
  soldesParCompte: Record<string, number>;
  comptes?: string[];
}

export default function ModalTransfertComptes({
  show,
  onClose,
  transfertForm,
  setTransfertForm,
  executerTransfert,
  soldesParCompte,
  comptes,
}: ModalTransfertComptesProps) {
  if (!show) return null;

  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(38, 51, 61, 0.45)' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '18px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: '#26333D', marginBottom: 14 }}>
          ⇄ Virement / Transfert Inter-Comptes
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Compte Source (Débit −)">
            <select
              style={selectStyle as any}
              value={transfertForm.source}
              onChange={e => setTransfertForm({ ...transfertForm, source: e.target.value })}
            >
              {activeComptes.map(c => <option key={c} value={c}>{c} ({soldesParCompte[c] || 0} Ar)</option>)}
            </select>
          </Field>

          <Field label="Compte Destination (Crédit +)">
            <select
              style={selectStyle as any}
              value={transfertForm.destination}
              onChange={e => setTransfertForm({ ...transfertForm, destination: e.target.value })}
            >
              {activeComptes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Montant à transférer (Ar)">
            <input
              type="number"
              min="0"
              placeholder="ex: 200000"
              style={inputStyle as any}
              value={transfertForm.montant}
              onChange={e => setTransfertForm({ ...transfertForm, montant: e.target.value })}
            />
          </Field>

          <Field label="Motif / Description">
            <input
              style={inputStyle as any}
              value={transfertForm.description}
              onChange={e => setTransfertForm({ ...transfertForm, description: e.target.value })}
              placeholder="ex: Retrait cash pour caisse"
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={onClose} style={{ ...ghostBtn, flex: '1 1 100px', justifyContent: 'center' }}>
              Annuler
            </button>
            <button
              onClick={executerTransfert}
              disabled={!transfertForm.montant || Number(transfertForm.montant) <= 0 || transfertForm.source === transfertForm.destination}
              style={{ ...primaryBtn, flex: '1 1 140px', justifyContent: 'center' }}
            >
              Valider le transfert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
