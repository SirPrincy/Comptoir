import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Field, inputStyle } from '../../ui';
import { calculerPRU } from '../logistiqueUtils';
import { THEME } from '../../colors';

interface Step4Props {
  commande: any;
  product: any;
  today: string;
  puAchat: number;
  setField: (key: string, value: any) => void;
  isLocked?: boolean;
}

export default function Step4Arrivee({ commande, product: p, today, puAchat, setField, isLocked }: Step4Props) {
  const fretTotal = Number(commande.fraisTransport) || 0;
  const transportLocalTotal = Number(commande.fraisTransportLocal) || 0;
  const { pruTotal } = calculerPRU({
    puAchat,
    fraisTransport: fretTotal,
    fraisTransportLocal: transportLocalTotal,
    qty: commande.qty,
  });

  return (
    <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
        🛬 Arrivée à Madagascar & Validation Globale des Données
      </div>
      <div style={{ fontSize: 12, color: THEME.text.muted }}>
        Le colis est arrivé et dédouané. Renseignez les frais de transport du transitaire vers votre entrepôt et vérifiez le prix de revient avant le Contrôle Qualité.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Date effective d'arrivée / Dédouanement">
          <input
            type="date"
            value={commande.dateArrivee ? commande.dateArrivee.slice(0, 10) : today}
            onChange={e => {
              const val = e.target.value;
              if (!val) return;
              const d = new Date(val);
              if (isNaN(d.getTime())) return;
              setField('dateArrivee', d.toISOString());
            }}
            style={inputStyle as any}
          />
        </Field>

        <Field label="Frais transport transitaire ➔ entrepôt (Ar)">
          <input
            type="number"
            min={0}
            value={commande.fraisTransportLocal ?? ''}
            onChange={e => {
              const val = e.target.value;
              setField('fraisTransportLocal', val === '' ? '' : Math.max(0, Number(val)));
            }}
            placeholder="0 Ar (camionnage, coursier...)"
            style={inputStyle as any}
          />
        </Field>
      </div>

      <div style={{ border: `1px solid ${THEME.border.base}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ background: THEME.bg.surface, padding: '8px 12px', fontWeight: 700, fontSize: 12, color: THEME.text.primary, borderBottom: `1px solid ${THEME.border.base}` }}>
          Bilan Récapitulatif du Colis & Prix de Revient (PRU)
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span style={{ color: THEME.text.muted }}>Produit :</span><br /><strong style={{ color: THEME.text.primary }}>{p?.nom || 'Article'} ({commande.qty || 1} pcs)</strong></div>
          <div>
            <span style={{ color: THEME.text.muted }}>Coût Achat Chine :</span><br />
            <strong style={{ color: THEME.text.primary }}>{Math.round(puAchat * Number(commande.qty || 1)).toLocaleString('fr-FR')} Ar</strong>
            {Number(commande.fraisLivraisonChine || 0) > 0 && (
              <span style={{ color: THEME.text.muted, display: 'block', fontSize: 10 }}>
                (dont {Number(commande.fraisLivraisonChine).toLocaleString('fr-FR')} Ar livr. Chine)
              </span>
            )}
          </div>
          <div><span style={{ color: THEME.text.muted }}>Fret Transitaire :</span><br /><strong style={{ color: THEME.text.primary }}>{fretTotal.toLocaleString('fr-FR')} Ar</strong></div>
          <div><span style={{ color: THEME.text.muted }}>Transport ➔ Entrepôt :</span><br /><strong style={{ color: THEME.text.primary }}>{transportLocalTotal.toLocaleString('fr-FR')} Ar</strong></div>
        </div>
        <div style={{ padding: '8px 12px', background: THEME.bg.soft, borderTop: `1px solid ${THEME.border.base}`, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ color: THEME.text.secondary }}>
            Prix de Revient Unitaire réel (Achat + Fret + Transport local) :
          </span>
          <strong style={{ color: THEME.accent.green, fontSize: 13.5 }}>
            {Math.round(pruTotal).toLocaleString('fr-FR')} Ar / pièce
          </strong>
        </div>
      </div>

      <div style={{ padding: '10px 12px', background: THEME.bg.chip, borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 12, color: THEME.accent.green, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircle2 size={16} />
        <span>Toutes les informations logistiques et financières sont prêtes. Vous pouvez valider pour lancer le contrôle qualité.</span>
      </div>
    </fieldset>
  );
}
