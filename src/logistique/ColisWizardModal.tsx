import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Unlock, Sparkles, Check } from 'lucide-react';
import { Modal, ghostBtn, primaryBtn, selectStyle } from '../ui';
import { WIZARD_STEPS, getActiveStep, calculerEtaDynamique } from './logistiqueUtils';
import { TYPES_ENVOI_MARITIME, TYPES_ENVOI_AERIEN, STATUTS_LOGISTIQUE } from '../constants';
import { THEME } from '../colors';
import Step1Livraison from './steps/Step1Livraison';
import Step2Entrepot from './steps/Step2Entrepot';
import Step3Fret from './steps/Step3Fret';
import Step4Arrivee from './steps/Step4Arrivee';
import Step5QualityCheck from './steps/Step5QualityCheck';

interface ColisWizardModalProps {
  commande: any;
  commandes?: any[];
  products: any[];
  fournisseurs: any[];
  tauxUsd: number;
  today: string;
  initialStep?: number;
  onClose: () => void;
  updateCommandeField: (id: string, fields: Record<string, any>) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ColisWizardModal({
  commande, commandes = [], products, fournisseurs, tauxUsd, today, initialStep, onClose, updateCommandeField, onNavigateTab,
}: ColisWizardModalProps) {
  const [unlockedForEdit, setUnlockedForEdit] = useState<boolean>(
    Boolean(initialStep && commande.qualityCheck?.isCompleted)
  );
  const isLocked = Boolean(commande.qualityCheck?.isCompleted) && !unlockedForEdit;
  const [currentStep, setCurrentStep] = useState<number>(initialStep || getActiveStep(commande));
  const [qcCompletedSuccess, setQcCompletedSuccess] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const p = products.find((pr: any) => pr.id === commande.productId);
  const qtyVal = Number(commande.qty || 1);
  const totalAchatChine = (commande.total !== undefined && commande.total !== null && Number(commande.total) > 0)
    ? Number(commande.total)
    : ((Number(commande.pu || 0) * qtyVal) + Number(commande.fraisLivraisonChine || 0));
  const puAchat = totalAchatChine > 0
    ? totalAchatChine / qtyVal
    : (Number(p?.prixAchat) || 0);
  const mode = commande.modeExpedition || 'Maritime';

  const setField = (key: string, value: any) => {
    if (isLocked) return;
    updateCommandeField(commande.id, { [key]: value });
  };

  const setFields = (fields: Record<string, any>) => {
    if (isLocked) return;
    updateCommandeField(commande.id, fields);
  };

  const handleStatutChange = (newStatut: string) => {
    if (isLocked) return;
    const patch: any = { statut: newStatut };
    if (newStatut === 'En entrepôt' && !commande.dateEnEntrepot) patch.dateEnEntrepot = new Date().toISOString();
    if (newStatut === 'En expédition' && !commande.dateEnExpedition) patch.dateEnExpedition = new Date().toISOString();
    if (newStatut === 'Arrivé' && !commande.dateArrivee) patch.dateArrivee = new Date().toISOString();
    updateCommandeField(commande.id, patch);
  };

  const handleResetQC = () => {
    if (isLocked) return;
    const currentQc = commande.qualityCheck || {};
    updateCommandeField(commande.id, {
      qualityCheck: {
        ...currentQc,
        isCompleted: false,
      },
    });
    setSaveNotification('Clôture QC annulée : le colis est repassé en attente de contrôle et retiré du stock disponible.');
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleModeChange = (newMode: string) => {
    if (isLocked) return;
    const defaultType = newMode === 'Aérien' ? TYPES_ENVOI_AERIEN[0] : TYPES_ENVOI_MARITIME[0];
    updateCommandeField(commande.id, {
      modeExpedition: newMode,
      typeEnvoi: defaultType,
      deviseFret: newMode === 'Aérien' ? 'Ar' : 'USD',
    });
  };

  const effectiveTauxUsd = Number(commande.tauxUsd) || tauxUsd;

  const handleTauxUsdChange = (valRate: any) => {
    if (isLocked) return;
    const rateNum = valRate === '' ? '' : Math.max(0, Number(valRate) || 0);
    const activeRate = typeof rateNum === 'number' && rateNum > 0 ? rateNum : tauxUsd;
    const currentFraisUSD = commande.fraisTransportUSD ?? (commande.fraisTransport ? Number((commande.fraisTransport / effectiveTauxUsd).toFixed(2)) : 0);
    const numUSD = Number(currentFraisUSD) || 0;
    
    updateCommandeField(commande.id, {
      tauxUsd: valRate,
      fraisTransport: Math.round(numUSD * activeRate),
    });
  };

  const handleFraisUSDChange = (valUSD: any) => {
    if (isLocked) return;
    const numUSD = valUSD === '' ? 0 : Math.max(0, Number(valUSD) || 0);
    const activeRate = Number(commande.tauxUsd) || tauxUsd;
    updateCommandeField(commande.id, {
      fraisTransportUSD: valUSD,
      fraisTransport: Math.round(numUSD * activeRate),
      deviseFret: 'USD',
    });
  };

  const handleFraisArChange = (valAr: any) => {
    if (isLocked) return;
    const numAr = valAr === '' ? 0 : Math.max(0, Number(valAr) || 0);
    const activeRate = Number(commande.tauxUsd) || tauxUsd;
    updateCommandeField(commande.id, {
      fraisTransport: numAr,
      fraisTransportUSD: activeRate > 0 ? Number((numAr / activeRate).toFixed(2)) : 0,
      deviseFret: 'Ar',
    });
  };

  const passerAEtape = (prochaineEtape: number) => {
    if (!isLocked) {
      const extra: any = {};
      const currentStatutIdx = STATUTS_LOGISTIQUE.indexOf(commande.statut);
      if (prochaineEtape === 2) {
        if (!commande.statut || currentStatutIdx < 1) extra.statut = 'En entrepôt';
        if (!commande.dateEnEntrepot) extra.dateEnEntrepot = new Date().toISOString();
      } else if (prochaineEtape === 3) {
        if (!commande.statut || currentStatutIdx < 2) extra.statut = 'En expédition';
        if (!commande.dateEnExpedition) extra.dateEnExpedition = new Date().toISOString();
        if (!commande.dateEtaArrivee) {
          const { eta } = calculerEtaDynamique(mode, commande.transitaireId, commandes, fournisseurs, extra.dateEnExpedition || commande.dateEnExpedition);
          extra.dateEtaArrivee = eta.toISOString();
        }
      } else if (prochaineEtape === 4) {
        if (!commande.statut || currentStatutIdx < 3) extra.statut = 'Arrivé';
        if (!commande.dateArrivee) extra.dateArrivee = new Date().toISOString();
      } else if (prochaineEtape === 5) {
        if (!commande.statut || currentStatutIdx < 3) extra.statut = 'Arrivé';
      }
      if (Object.keys(extra).length > 0) {
        updateCommandeField(commande.id, extra);
      }
    }
    setCurrentStep(prochaineEtape);
  };

  const cloturerControleQualite = () => {
    if (isLocked) return;
    const currentQc = commande.qualityCheck || {};
    const wasAlreadyCompleted = Boolean(commande.qualityCheck?.isCompleted);
    updateCommandeField(commande.id, {
      statut: 'Arrivé',
      qualityCheck: {
        isCompleted: true,
        statut: currentQc.statut || 'Conforme',
        qtyConforme: currentQc.qtyConforme !== undefined ? Number(currentQc.qtyConforme) : Number(commande.qty || 1),
        qtyDefectueuse: Number(currentQc.qtyDefectueuse || 0),
        notes: currentQc.notes || 'Contrôle qualité validé et intégré au stock disponible.',
        date: currentQc.date || new Date().toISOString(),
      },
    });

    if (wasAlreadyCompleted) {
      setUnlockedForEdit(false);
      setSaveNotification('Modifications enregistrées et stock mis à jour avec succès !');
      setTimeout(() => setSaveNotification(null), 3500);
    } else {
      setQcCompletedSuccess(true);
    }
  };

  if (qcCompletedSuccess) {
    const currentQc = commande.qualityCheck || {};
    const qtyConforme = currentQc.qtyConforme !== undefined ? Number(currentQc.qtyConforme) : Number(commande.qty || 1);
    return (
      <Modal title="Marchandise réceptionnée & intégrée au stock !" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '10px 4px' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#E9F2EC',
            border: '2px solid #3F7A5C',
            color: '#3F7A5C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            margin: '0 auto',
          }}>
            ✓
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#26333D' }}>
              Contrôle Qualité Validé avec Succès
            </div>
            <div style={{ fontSize: 13, color: '#8A8375', marginTop: 4 }}>
              <strong>{qtyConforme} pièce{qtyConforme > 1 ? 's' : ''}</strong> de <strong>{p ? p.nom : 'l\'article'}</strong> disponible{qtyConforme > 1 ? 's' : ''} en stock de vente
            </div>
          </div>

          <div style={{
            background: '#FAF7F2',
            border: '1px solid #EAE2D4',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 12.5,
            color: '#5E584E',
            textAlign: 'left',
          }}>
            💡 <strong>Étape suivante recommandée :</strong> Le produit est désormais prêt pour la commercialisation. Vous pouvez basculer directement vers le module <strong>Ventes</strong> pour créer une transaction ou consulter l'état du Stock.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('vente');
                }}
                style={{
                  ...primaryBtn,
                  height: 42,
                  width: '100%',
                  justifyContent: 'center',
                  background: '#3F7A5C',
                  fontSize: 13.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🛒 Créer une Vente pour ce produit</span>
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: onNavigateTab ? '1fr 1fr' : '1fr', gap: 8 }}>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('stock');
                  }}
                  style={{
                    ...ghostBtn,
                    height: 38,
                    fontSize: 12.5,
                    fontWeight: 600,
                    justifyContent: 'center',
                    border: '1px solid #D9CFC1',
                  }}
                >
                  📦 Voir l'état du Stock
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  ...ghostBtn,
                  height: 38,
                  fontSize: 12.5,
                  fontWeight: 600,
                  justifyContent: 'center',
                  border: '1px solid #D9CFC1',
                }}
              >
                Terminer & Rester en Logistique
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Assistant de Suivi Logistique — ${p ? p.nom : 'Colis'}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {saveNotification && (
          <div style={{ background: '#E9F2EC', border: '1px solid #C4DEC0', borderRadius: 8, padding: '10px 14px', color: '#2C5E43', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>✓</span>
            <span>{saveNotification}</span>
          </div>
        )}

        {isLocked ? (
          <div style={{ background: '#E9F2EC', border: '1px solid #C4DEC0', borderRadius: 8, padding: '10px 14px', color: '#2C5E43', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} />
              <span>Colis clôturé & contrôlé (Marchandise en stock disponible).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setUnlockedForEdit(true)}
                style={{
                  ...ghostBtn,
                  height: 30,
                  padding: '0 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid #3F7A5C',
                  color: '#2C5E43',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Unlock size={14} />
                <span>Déverrouiller pour modifier toute les étapes</span>
              </button>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('vente');
                  }}
                  style={{
                    ...primaryBtn,
                    height: 30,
                    padding: '0 10px',
                    fontSize: 12,
                    background: '#3F7A5C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>🛒 Passer à la Vente</span>
                </button>
              )}
            </div>
          </div>
        ) : unlockedForEdit ? (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', color: '#92400E', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Unlock size={16} color="#D97706" />
              <span>🔓 Mode modification actif : vous pouvez librement corriger toutes les étapes (dates, tracking, fret, transitaire, QC).</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setUnlockedForEdit(false);
                setSaveNotification('Modifications enregistrées et colis reverrouillé.');
                setTimeout(() => setSaveNotification(null), 3000);
              }}
              style={{
                ...ghostBtn,
                height: 28,
                padding: '0 10px',
                fontSize: 11.5,
                fontWeight: 600,
                border: '1px solid #D97706',
                color: '#92400E',
                background: '#FFFFFF',
              }}
            >
              Re-verrouiller
            </button>
          </div>
        ) : null}

        <RecapBandeau
          commande={commande}
          product={p}
          puAchat={puAchat}
          isLocked={isLocked}
          onStatutChange={handleStatutChange}
        />
        <StepperHeader currentStep={currentStep} onSelectStep={(step) => setCurrentStep(step)} />

        <div style={{ background: THEME.bg.card, padding: '16px', borderRadius: 10, border: `1px solid ${THEME.border.base}`, minHeight: 240 }}>
          {currentStep === 1 && <Step1Livraison commande={commande} today={today} setField={setField} isLocked={isLocked} />}
          {currentStep === 2 && (
            <Step2Entrepot
              commande={commande} fournisseurs={fournisseurs} tauxUsd={tauxUsd} today={today}
              setField={setField} handleModeChange={handleModeChange}
              handleTauxUsdChange={handleTauxUsdChange}
              handleFraisUSDChange={handleFraisUSDChange} handleFraisArChange={handleFraisArChange}
              isLocked={isLocked}
            />
          )}
          {currentStep === 3 && <Step3Fret commande={commande} commandes={commandes} fournisseurs={fournisseurs} today={today} puAchat={puAchat} setField={setField} setFields={setFields} isLocked={isLocked} />}
          {currentStep === 4 && <Step4Arrivee commande={commande} product={p} today={today} puAchat={puAchat} setField={setField} isLocked={isLocked} />}
          {currentStep === 5 && (
            <Step5QualityCheck
              commande={commande}
              product={p}
              today={today}
              setField={setField}
              isLocked={isLocked}
              onResetQC={handleResetQC}
            />
          )}
        </div>

        <WizardFooter
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          passerAEtape={passerAEtape}
          cloturerControleQualite={cloturerControleQualite}
          onClose={onClose}
          isLocked={isLocked}
          unlockedForEdit={unlockedForEdit}
          onUnlock={() => setUnlockedForEdit(true)}
          onRelock={() => {
            setUnlockedForEdit(false);
            setSaveNotification('Modifications enregistrées et colis reverrouillé.');
            setTimeout(() => setSaveNotification(null), 3000);
          }}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </Modal>
  );
}

function RecapBandeau({
  commande,
  product: p,
  puAchat,
  isLocked,
  onStatutChange,
}: {
  commande: any;
  product: any;
  puAchat: number;
  isLocked?: boolean;
  onStatutChange?: (st: string) => void;
}) {
  return (
    <div style={{ background: THEME.bg.surface, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: THEME.text.primary }}>
          {p ? p.nom : 'Article'} {p?.couleur ? `(${p.couleur})` : ''}
        </div>
        <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>
          Source : <strong style={{ color: THEME.text.secondary }}>{commande.source}</strong> · Quantité : <strong style={{ color: THEME.text.secondary }}>{commande.qty} pièces</strong> · Achat : <strong style={{ color: THEME.text.secondary }}>{Number(puAchat).toLocaleString('fr-FR')} Ar/u</strong>
        </div>
      </div>

      {!isLocked && onStatutChange ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: THEME.text.muted, fontWeight: 600 }}>Statut :</span>
          <select
            value={commande.statut || 'En livraison'}
            onChange={(e) => onStatutChange(e.target.value)}
            style={{
              ...selectStyle,
              height: 28,
              fontSize: 11.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#FFFFFF',
              color: commande.statut === 'Arrivé' ? THEME.accent.orange : THEME.accent.primary,
            } as any}
            title="Modifier le statut d'acheminement"
          >
            {STATUTS_LOGISTIQUE.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          {commande.qualityCheck?.isCompleted && (
            <span style={{ fontSize: 11, fontWeight: 700, color: THEME.accent.green, background: THEME.bg.chip, padding: '2px 6px', borderRadius: 4, border: `1px solid ${THEME.border.base}` }}>
              QC Validé
            </span>
          )}
        </div>
      ) : (
        <span style={{
          fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          background: commande.qualityCheck?.isCompleted ? THEME.bg.chip : (commande.statut === 'Arrivé' ? THEME.bg.soft : THEME.bg.surface),
          color: commande.qualityCheck?.isCompleted ? THEME.accent.green : (commande.statut === 'Arrivé' ? THEME.accent.orange : THEME.accent.primary),
          border: `1px solid ${THEME.border.base}`,
        }}>
          {commande.qualityCheck?.isCompleted ? '✅ En Stock (QC Validé)' : `Statut : ${commande.statut}`}
        </span>
      )}
    </div>
  );
}

function StepperHeader({ currentStep, onSelectStep }: { currentStep: number; onSelectStep: (step: number) => void }) {
  return (
    <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 10, border: `1px solid ${THEME.border.base}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        {WIZARD_STEPS.map((ws, index) => {
          const isPassed = ws.step < currentStep;
          const isCurrent = ws.step === currentStep;
          return (
            <React.Fragment key={ws.step}>
              {index > 0 && (
                <div style={{ flex: 1, height: 3, background: isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.border.base), margin: '0 2px' }} />
              )}
              <button
                type="button"
                onClick={() => onSelectStep(ws.step)}
                title={`Cliquer pour modifier l'Étape ${ws.step} : ${ws.label}`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 50,
                  borderRadius: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.bg.soft),
                  border: `2px solid ${isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.border.strong)}`,
                  color: isPassed || isCurrent ? THEME.text.light : THEME.text.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  boxShadow: isCurrent ? '0 0 0 3px rgba(61,90,108,0.25)' : 'none',
                }}>
                  {isPassed ? '✓' : ws.step}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? THEME.accent.primary : THEME.text.secondary, marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {ws.label.split('.')[1]?.trim() || ws.label}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span>Étape {currentStep} sur 5 — {WIZARD_STEPS[currentStep - 1].label} :</span>
        <span style={{ fontWeight: 400, color: THEME.text.muted }}>{WIZARD_STEPS[currentStep - 1].desc}</span>
      </div>
    </div>
  );
}

function WizardFooter({ currentStep, setCurrentStep, passerAEtape, cloturerControleQualite, onClose, isLocked, unlockedForEdit, onUnlock, onRelock, onNavigateTab }: {
  currentStep: number; setCurrentStep: (n: number) => void;
  passerAEtape: (n: number) => void; cloturerControleQualite: () => void; onClose: () => void;
  isLocked?: boolean;
  unlockedForEdit?: boolean;
  onUnlock?: () => void;
  onRelock?: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2.5 mt-1">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {currentStep > 1 && (
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="w-full sm:w-auto justify-center"
            style={{ ...ghostBtn, height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <ArrowLeft size={14} /><span>Précédent</span>
          </button>
        )}

        {/* Quick jump step buttons */}
        <div style={{ display: 'flex', items: 'center', gap: 4, marginLeft: 6 }}>
          {WIZARD_STEPS.map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              title={`Aller directement à l'Étape ${s.step}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: currentStep === s.step ? 700 : 500,
                border: currentStep === s.step ? '1px solid #3D5A6C' : '1px solid #EAE2D4',
                background: currentStep === s.step ? '#3D5A6C' : '#FFFFFF',
                color: currentStep === s.step ? '#FFFFFF' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              {s.step}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onClose} className="w-full sm:w-auto justify-center" style={{ ...ghostBtn, height: 38, padding: '0 14px' } as any}>
          Fermer
        </button>

        {isLocked && (
          <button
            type="button"
            onClick={onUnlock}
            className="w-full sm:w-auto justify-center"
            style={{ ...ghostBtn, height: 38, padding: '0 14px', border: '1px solid #3F7A5C', color: '#2C5E43', display: 'flex', alignItems: 'center', gap: 6 } as any}
          >
            <Unlock size={14} />
            <span>Déverrouiller pour modifier</span>
          </button>
        )}

        {!isLocked && unlockedForEdit && onRelock && currentStep < 5 && (
          <button
            type="button"
            onClick={onRelock}
            className="w-full sm:w-auto justify-center"
            style={{ ...ghostBtn, height: 38, padding: '0 14px', border: '1px solid #3F7A5C', color: '#2C5E43', background: '#E9F2EC', display: 'flex', alignItems: 'center', gap: 6 } as any}
            title="Enregistrer les modifications et verrouiller le colis"
          >
            <Check size={14} />
            <span>Enregistrer & Re-verrouiller</span>
          </button>
        )}

        {isLocked && onNavigateTab && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab('vente');
            }}
            className="w-full sm:w-auto justify-center"
            style={{ ...primaryBtn, height: 38, padding: '0 16px', background: '#3F7A5C', display: 'flex', alignItems: 'center', gap: 6 } as any}
          >
            <span>🛒 Passer à la Vente</span>
          </button>
        )}

        {!isLocked && currentStep < 4 && (
          <button type="button" onClick={() => passerAEtape(currentStep + 1)} className="w-full sm:w-auto justify-center"
            style={{ ...primaryBtn, height: 38, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span>Enregistrer & Suivant</span><ArrowRight size={14} />
          </button>
        )}

        {isLocked && currentStep < 5 && (
          <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="w-full sm:w-auto justify-center"
            style={{ ...ghostBtn, height: 38, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span>Suivant</span><ArrowRight size={14} />
          </button>
        )}

        {!isLocked && currentStep === 4 && (
          <button type="button" onClick={() => passerAEtape(5)} className="w-full sm:w-auto justify-center"
            style={{ ...primaryBtn, height: 38, padding: '0 16px', background: '#3D5A6C', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span>Passer au QC (Étape 5)</span><ArrowRight size={14} />
          </button>
        )}

        {!isLocked && currentStep === 5 && (
          <button type="button" onClick={cloturerControleQualite} className="w-full sm:w-auto justify-center"
            style={{ ...primaryBtn, height: 38, padding: '0 18px', background: '#3F7A5C', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <Sparkles size={15} /><span>{unlockedForEdit ? 'Enregistrer & Mettre à jour Stock' : 'Valider le QC & Entrée en stock'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
