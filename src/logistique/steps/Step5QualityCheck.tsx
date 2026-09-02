import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Field, inputStyle, selectStyle } from '../../ui';
import { THEME } from '../../colors';

interface Step5Props {
  commande: any;
  product: any;
  today: string;
  setField: (key: string, value: any) => void;
  isLocked?: boolean;
  onResetQC?: () => void;
}

export default function Step5QualityCheck({ commande, product: p, today, setField, isLocked, onResetQC }: Step5Props) {
  const qc = commande.qualityCheck || {};
  const setQc = (patch: Record<string, any>) => setField('qualityCheck', { ...qc, ...patch });

  return (
    <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={18} />
        <span>Étape 5 : Contrôle Qualité (QC) & Entrée en Stock Disponible</span>
      </div>
      <div style={{ fontSize: 12, color: THEME.text.muted }}>
        Inspectez le colis reçu. Indiquez le nombre d'articles conformes et signalez d'éventuels articles défectueux ou cassés.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Résultat de l'inspection">
          <select value={qc.statut || 'Conforme'} onChange={e => setQc({ statut: e.target.value })} style={selectStyle as any}>
            <option value="Conforme">✅ 100% Conforme</option>
            <option value="Partiellement conforme">⚠️ Partiellement conforme</option>
            <option value="Problème">❌ Non conforme / Litige</option>
          </select>
        </Field>

        <Field label="Quantité conforme">
          <input
            type="number" min={0} max={Number(commande.qty || 1)}
            value={qc.qtyConforme ?? commande.qty}
            onChange={e => {
              const val = Number(e.target.value);
              const totalQty = Number(commande.qty || 1);
              setQc({ qtyConforme: val, qtyDefectueuse: Math.max(0, totalQty - val) });
            }}
            style={inputStyle as any}
          />
        </Field>

        <Field label="Quantité défectueuse">
          <input
            type="number" min={0}
            value={qc.qtyDefectueuse ?? 0}
            onChange={e => setQc({ qtyDefectueuse: Number(e.target.value) })}
            style={inputStyle as any}
          />
        </Field>

        <Field label="Date du contrôle">
          <input
            type="date"
            value={qc.date ? qc.date.slice(0, 10) : today}
            onChange={e => {
              const val = e.target.value;
              if (!val) return;
              const d = new Date(val);
              if (isNaN(d.getTime())) return;
              setQc({ date: d.toISOString() });
            }}
            style={inputStyle as any}
          />
        </Field>
      </div>

      <Field label="Observations / Notes qualité">
        <input
          type="text" placeholder="Ex: Emballage intact, 2 pièces avec fermeture éclair bloquée..."
          value={qc.notes || ''} onChange={e => setQc({ notes: e.target.value })} style={inputStyle as any}
        />
      </Field>

      <div style={{ padding: '10px 12px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 12, color: THEME.text.primary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          📦 <strong>{qc.qtyConforme ?? commande.qty} pièces conformes</strong> sont en stock prêt à la vente du produit <strong>« {p?.nom} »</strong>.
        </div>

        {commande.qualityCheck?.isCompleted && onResetQC && !isLocked && (
          <button
            type="button"
            onClick={onResetQC}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid #DC2626',
              background: '#FEF2F2',
              color: '#DC2626',
              cursor: 'pointer',
            }}
            title="Annule la clôture QC et retire temporairement les pièces du stock disponible de vente"
          >
            Annuler la clôture QC (remettre en attente)
          </button>
        )}
      </div>
    </fieldset>
  );
}
