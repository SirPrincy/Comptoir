import React from 'react';
import { Field, inputStyle } from '../../ui';
import { THEME } from '../../colors';

interface Step1Props {
  commande: any;
  today: string;
  setField: (key: string, value: any) => void;
  isLocked?: boolean;
}

export default function Step1Livraison({ commande, today, setField, isLocked }: Step1Props) {
  return (
    <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
        📦 Informations d'expédition fournisseur en Chine
      </div>
      <div style={{ fontSize: 12, color: THEME.text.muted }}>
        Renseignez le numéro de colis / suivi local communiqué par le vendeur (1688, Taobao, etc.) pour suivre l'acheminement vers votre transitaire.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="📦 N° de Colis / Tracking Chine" className="sm:col-span-2">
          <input
            type="text"
            value={commande.tracking || ''}
            onChange={e => setField('tracking', e.target.value)}
            placeholder="Ex: SF12345678, YT998877, ZTO..."
            style={inputStyle as any}
          />
        </Field>

        <Field label="Date d'expédition fournisseur">
          <input
            type="date"
            value={commande.dateEnLivraison ? commande.dateEnLivraison.slice(0, 10) : today}
            onChange={e => {
              const val = e.target.value;
              if (!val) return;
              const d = new Date(val);
              if (isNaN(d.getTime())) return;
              setField('dateEnLivraison', d.toISOString());
            }}
            style={inputStyle as any}
          />
        </Field>
      </div>

      <div style={{ padding: '10px 12px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 12, color: THEME.text.secondary }}>
        💡 Dès que le colis arrive chez votre transitaire à Guangzhou/Yiwu, passez à l'étape suivante pour enregistrer le poids/volume et calculer le fret.
      </div>
    </fieldset>
  );
}
