import React from 'react';
import { Field, Label, inputStyle, selectStyle, ghostBtn } from '../../ui';
import { parseTarifNumber, calculerFretAuto } from '../logistiqueUtils';
import { TYPES_ENVOI_MARITIME, TYPES_ENVOI_AERIEN } from '../../constants';
import { THEME } from '../../colors';

interface Step2Props {
  commande: any;
  fournisseurs: any[];
  tauxUsd: number;
  today?: string;
  setField: (key: string, value: any) => void;
  handleModeChange: (mode: string) => void;
  handleTauxUsdChange?: (val: any) => void;
  handleFraisUSDChange: (val: any) => void;
  handleFraisArChange: (val: any) => void;
  isLocked?: boolean;
}

export default function Step2Entrepot({
  commande, fournisseurs, tauxUsd, today, setField, handleModeChange, handleTauxUsdChange, handleFraisUSDChange, handleFraisArChange, isLocked,
}: Step2Props) {
  const mode = commande.modeExpedition || 'Maritime';
  const typesDisponibles = mode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME;
  const fretTotal = Number(commande.fraisTransport) || 0;
  const activeTauxUsd = Number(commande.tauxUsd) || tauxUsd;

  const transitaireActuel = fournisseurs.find((f: any) => f.id === commande.transitaireId);
  const targetType = (commande.typeEnvoi || typesDisponibles[0]).toLowerCase();
  const tarifAssocie = transitaireActuel?.tarifs?.find(
    (t: any) => t.mode?.toLowerCase() === mode.toLowerCase() && t.typeEnvoi?.toLowerCase() === targetType
  ) || (transitaireActuel?.prixFret ? { prix: transitaireActuel.prixFret } : null);
  const tarifNum = tarifAssocie ? parseTarifNumber(tarifAssocie.prix) : null;
  const { canAutoCalcAr, autoFretAr, canAutoCalcUSD, autoFretUSD } = calculerFretAuto({
    mode, tarifNum, poids: commande.poids, volume: commande.volume,
  });

  return (
    <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
        🏢 Réception chez le Transitaire & Paramètres du Fret
      </div>
      <div style={{ fontSize: 12, color: THEME.text.muted }}>
        Sélectionnez le transitaire qui prend en charge le colis, choisissez le mode (Maritime ou Aérien) et renseignez les dimensions.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="🚛 Transitaire / Compagnie de Fret">
          <select value={commande.transitaireId || ''} onChange={e => setField('transitaireId', e.target.value)} style={selectStyle as any}>
            <option value="">— Sélectionner un transitaire —</option>
            {fournisseurs.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.nom} {f.plateforme === 'Transitaire / Fret' ? '(Transitaire)' : `(${f.plateforme})`}
              </option>
            ))}
          </select>
        </Field>

        <Field label="🚢/✈️ Mode de Transport">
          <select value={mode} onChange={e => handleModeChange(e.target.value)} style={selectStyle as any}>
            <option value="Aérien">✈️ Aérien (en Ariary / Ar)</option>
            <option value="Maritime">🚢 Maritime (en USD / $)</option>
          </select>
        </Field>

        <Field label="🏷️ Type de Marchandise">
          <select value={commande.typeEnvoi || typesDisponibles[0]} onChange={e => setField('typeEnvoi', e.target.value)} style={selectStyle as any}>
            {typesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="📅 Date d'arrivée entrepôt Chine">
          <input
            type="date"
            value={commande.dateEnEntrepot ? commande.dateEnEntrepot.slice(0, 10) : (today || '')}
            onChange={e => {
              const val = e.target.value;
              if (!val) {
                setField('dateEnEntrepot', undefined);
                return;
              }
              const d = new Date(val);
              if (isNaN(d.getTime())) return;
              setField('dateEnEntrepot', d.toISOString());
            }}
            style={inputStyle as any}
          />
        </Field>
      </div>

      <div className={mode === 'Maritime' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end" : "grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"}>
        {mode === 'Maritime' ? (
          <Field label="📐 Volume mesuré (m³)">
            <input type="number" step="any" min={0} value={commande.volume || ''} onChange={e => setField('volume', e.target.value)} placeholder="Ex: 0.15" style={inputStyle as any} />
          </Field>
        ) : (
          <Field label="⚖️ Poids mesuré (kg)">
            <input type="number" step="any" min={0} value={commande.poids || ''} onChange={e => setField('poids', e.target.value)} placeholder="Ex: 2.5" style={inputStyle as any} />
          </Field>
        )}

        {mode === 'Maritime' && (
          <Field label="💱 Taux USD Transitaire (Ar/$)">
            <input
              type="number" step="any" min={0}
              value={commande.tauxUsd ?? ''}
              onChange={e => handleTauxUsdChange ? handleTauxUsdChange(e.target.value) : setField('tauxUsd', e.target.value)}
              placeholder={`Par défaut: ${tauxUsd} Ar`} style={inputStyle as any}
            />
          </Field>
        )}

        {mode === 'Maritime' ? (
          <Field label="Fret en USD ($)">
            <input
              type="number" step="any" min={0}
              value={commande.fraisTransportUSD ?? (commande.fraisTransport ? Number((commande.fraisTransport / activeTauxUsd).toFixed(2)) : '')}
              onChange={e => handleFraisUSDChange(e.target.value)}
              placeholder="Ex: 45 $" style={inputStyle as any}
            />
          </Field>
        ) : (
          <Field label="Fret en Ariary (Ar)">
            <input type="number" min={0} value={commande.fraisTransport ?? ''} onChange={e => handleFraisArChange(e.target.value)} placeholder="Ex: 120000 Ar" style={inputStyle as any} />
          </Field>
        )}

        <div>
          <Label>Total Fret (Ariary)</Label>
          <div style={{ ...inputStyle, background: THEME.bg.soft, fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center' } as any}>
            {fretTotal.toLocaleString('fr-FR')} Ar
          </div>
        </div>
      </div>

      {!isLocked && canAutoCalcAr && autoFretAr !== null && (
        <SuggestionTarif onAppliquer={() => handleFraisArChange(autoFretAr)}>
          💡 Tarif transitaire ({commande.poids} kg × {tarifNum?.toLocaleString('fr-FR')} Ar) = <strong>{autoFretAr.toLocaleString('fr-FR')} Ar</strong>
        </SuggestionTarif>
      )}
      {!isLocked && canAutoCalcUSD && autoFretUSD !== null && (
        <SuggestionTarif onAppliquer={() => handleFraisUSDChange(autoFretUSD)}>
          💡 Tarif transitaire ({commande.volume} m³ × {tarifNum} $) = <strong>{autoFretUSD} $ ({Math.round(autoFretUSD * activeTauxUsd).toLocaleString('fr-FR')} Ar)</strong>
        </SuggestionTarif>
      )}
    </fieldset>
  );
}

function SuggestionTarif({ children, onAppliquer }: { children: React.ReactNode; onAppliquer: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: THEME.bg.surface, border: `1px solid ${THEME.border.base}`, padding: '6px 10px', borderRadius: 6, flexWrap: 'wrap', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: THEME.accent.green }}>{children}</span>
      <button type="button" onClick={onAppliquer} style={{ ...ghostBtn, padding: '3px 8px', fontSize: 11, color: THEME.accent.green, borderColor: THEME.accent.green } as any}>
        Appliquer
      </button>
    </div>
  );
}
