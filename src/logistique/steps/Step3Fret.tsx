import React from 'react';
import { Field, inputStyle, ghostBtn } from '../../ui';
import { calculerPRU, calculerPerformanceTransitaire, calculerEtaDynamique } from '../logistiqueUtils';
import { Clock, RefreshCw } from 'lucide-react';
import { THEME } from '../../colors';

interface Step3Props {
  commande: any;
  commandes?: any[];
  fournisseurs?: any[];
  today: string;
  puAchat: number;
  setField: (key: string, value: any) => void;
  setFields?: (fields: Record<string, any>) => void;
  isLocked?: boolean;
}

export default function Step3Fret({
  commande,
  commandes = [],
  fournisseurs = [],
  today,
  puAchat,
  setField,
  setFields,
  isLocked,
}: Step3Props) {
  const mode = commande.modeExpedition || 'Maritime';
  const fretTotal = Number(commande.fraisTransport) || 0;
  const transportLocalTotal = Number(commande.fraisTransportLocal) || 0;
  const { fretUnitaire } = calculerPRU({
    puAchat,
    fraisTransport: fretTotal,
    fraisTransportLocal: transportLocalTotal,
    qty: commande.qty,
  });

  const transitaireObj = fournisseurs.find((f: any) => f.id === commande.transitaireId);
  const perf = calculerPerformanceTransitaire(commande.transitaireId, mode, commandes, fournisseurs);

  const rechargerEtaDynamique = () => {
    const startDate = commande.dateEnExpedition || new Date();
    const { eta } = calculerEtaDynamique(mode, commande.transitaireId, commandes, fournisseurs, startDate);
    setField('dateEtaArrivee', eta.toISOString());
  };

  return (
    <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
        🚢/✈️ Départ & Fret International en cours vers Madagascar
      </div>
      <div style={{ fontSize: 12, color: THEME.text.muted }}>
        Le colis a quitté la Chine. Définissez la date de départ et vérifiez l'estimation d'arrivée (ETA).
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Date de départ de Chine">
          <input
            type="date"
            value={commande.dateEnExpedition ? commande.dateEnExpedition.slice(0, 10) : today}
            onChange={e => {
              const val = e.target.value;
              if (!val) return;
              const d = new Date(val);
              if (isNaN(d.getTime())) return;
              const iso = d.toISOString();
              const { eta } = calculerEtaDynamique(mode, commande.transitaireId, commandes, fournisseurs, val);
              
              if (setFields) {
                setFields({
                  dateEnExpedition: iso,
                  dateEtaArrivee: eta.toISOString(),
                });
              } else {
                setField('dateEnExpedition', iso);
                setField('dateEtaArrivee', eta.toISOString());
              }
            }}
            style={inputStyle as any}
          />
        </Field>

        <Field label="Date d'arrivée estimée (ETA)">
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="date"
              value={commande.dateEtaArrivee ? commande.dateEtaArrivee.slice(0, 10) : ''}
              onChange={e => {
                const val = e.target.value;
                if (!val) {
                  setField('dateEtaArrivee', undefined);
                  return;
                }
                const d = new Date(val);
                if (isNaN(d.getTime())) return;
                setField('dateEtaArrivee', d.toISOString());
              }}
              style={{ ...inputStyle, flex: 1 } as any}
            />
            <button
              type="button"
              onClick={rechargerEtaDynamique}
              style={{ ...ghostBtn, padding: '0 8px', height: 38 }}
              title="Recalculer ETA dynamique"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </Field>

        <Field label="N° Conteneur / Vol / LTA">
          <input
            type="text" value={commande.numeroConteneur || ''} onChange={e => setField('numeroConteneur', e.target.value)}
            placeholder="Ex: COSU61928, AF182..." style={inputStyle as any}
          />
        </Field>
      </div>

      {/* BANDEAU SUIVI FIABILITÉ TRANSITAIRE */}
      <div
        style={{
          padding: '10px 12px',
          background: perf.retardMoyenJours > 2 ? THEME.bg.alert : THEME.bg.surface,
          border: `1px solid ${perf.retardMoyenJours > 2 ? THEME.accent.dangerSoft : THEME.border.base}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Clock size={18} color={perf.retardMoyenJours > 2 ? THEME.accent.danger : THEME.accent.green} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: THEME.text.primary, flex: 1 }}>
          <strong>Fiabilité Transitaire ({transitaireObj ? transitaireObj.nom : 'Transitaire non sélectionné'}) :</strong>{' '}
          {perf.source === 'historique' ? (
            <span>
              Délai moyen réel de <strong>~{perf.delaiMoyenJours} jours</strong> constaté sur{' '}
              <strong>{perf.nbColisAnalyses} colis livré(s)</strong> en {mode}.
              {perf.retardMoyenJours > 2 && (
                <span style={{ color: THEME.accent.danger, fontWeight: 700, marginLeft: 6 }}>
                  ⚠️ Accuse un retard moyen de +{perf.retardMoyenJours} jours.
                </span>
              )}
            </span>
          ) : perf.source === 'tarif' ? (
            <span>Estimation basée sur la grille tarifaire renseignée (~{perf.delaiMoyenJours} jours).</span>
          ) : (
            <span>Délai standard par défaut (~{perf.delaiMoyenJours} jours en {mode}).</span>
          )}
        </div>
      </div>

      <div style={{ padding: '12px', background: THEME.bg.surface, borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
        <div style={{ fontWeight: 700, fontSize: 12.5, color: THEME.text.primary, marginBottom: 4 }}>
          Récapitulatif Logistique en cours :
        </div>
        <div style={{ fontSize: 12, color: THEME.text.secondary }}>
          • Mode : <strong>{mode} ({commande.typeEnvoi || 'Normal'})</strong><br />
          • Mesure : <strong>{mode === 'Maritime' ? `${commande.volume || 0} m³` : `${commande.poids || 0} kg`}</strong><br />
          • Coût Fret définitif : <strong>{fretTotal.toLocaleString('fr-FR')} Ar</strong> (soit {Math.round(fretUnitaire).toLocaleString('fr-FR')} Ar/pièce)
        </div>
      </div>
    </fieldset>
  );
}
