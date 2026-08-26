import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { Modal, ghostBtn, primaryBtn } from '../ui';
import { WIZARD_STEPS, getActiveStep, calculerEtaDynamique } from './logistiqueUtils';
import { TYPES_ENVOI_MARITIME, TYPES_ENVOI_AERIEN } from '../constants';
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
  onClose: () => void;
  updateCommandeField: (id: string, fields: Record<string, any>) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ColisWizardModal({
  commande, commandes = [], products, fournisseurs, tauxUsd, today, onClose, updateCommandeField, onNavigateTab,
}: ColisWizardModalProps) {
  const isLocked = Boolean(commande.qualityCheck?.isCompleted);
  const [currentStep, setCurrentStep] = useState<number>(getActiveStep(commande));
  const [qcCompletedSuccess, setQcCompletedSuccess] = useState<boolean>(false);

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
      if (prochaineEtape === 2) {
        extra.statut = 'En entrepôt';
        if (!commande.dateEnEntrepot) extra.dateEnEntrepot = new Date().toISOString();
      } else if (prochaineEtape === 3) {
        extra.statut = 'En expédition';
        if (!commande.dateEnExpedition) extra.dateEnExpedition = new Date().toISOString();
        if (!commande.dateEtaArrivee) {
          const { eta } = calculerEtaDynamique(mode, commande.transitaireId, commandes, fournisseurs, extra.dateEnExpedition);
          extra.dateEtaArrivee = eta.toISOString();
        }
      } else if (prochaineEtape === 4) {
        extra.statut = 'Arrivé';
        if (!commande.dateArrivee) extra.dateArrivee = new Date().toISOString();
      } else if (prochaineEtape === 5) {
        extra.statut = 'Arrivé';
      }
      updateCommandeField(commande.id, extra);
    }
    setCurrentStep(prochaineEtape);
  };

  const cloturerControleQualite = () => {
    if (isLocked) return;
    const currentQc = commande.qualityCheck || {};
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
    setQcCompletedSuccess(true);
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
        {isLocked && (
          <div style={{ background: '#E9F2EC', border: '1px solid #C4DEC0', borderRadius: 8, padding: '10px 14px', color: '#2C5E43', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} />
              <span>Colis clôturé & contrôlé : marchandise en stock disponible.</span>
            </div>
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
        )}

        <RecapBandeau commande={commande} product={p} puAchat={puAchat} />
        <StepperHeader currentStep={currentStep} />

        <div style={{ background: THEME.bg.card, padding: '16px', borderRadius: 10, border: `1px solid ${THEME.border.base}`, minHeight: 240 }}>
          {currentStep === 1 && <Step1Livraison commande={commande} today={today} setField={setField} isLocked={isLocked} />}
          {currentStep === 2 && (
            <Step2Entrepot
              commande={commande} fournisseurs={fournisseurs} tauxUsd={tauxUsd}
              setField={setField} handleModeChange={handleModeChange}
              handleTauxUsdChange={handleTauxUsdChange}
              handleFraisUSDChange={handleFraisUSDChange} handleFraisArChange={handleFraisArChange}
              isLocked={isLocked}
            />
          )}
          {currentStep === 3 && <Step3Fret commande={commande} commandes={commandes} fournisseurs={fournisseurs} today={today} puAchat={puAchat} setField={setField} setFields={setFields} isLocked={isLocked} />}
          {currentStep === 4 && <Step4Arrivee commande={commande} product={p} today={today} puAchat={puAchat} setField={setField} isLocked={isLocked} />}
          {currentStep === 5 && <Step5QualityCheck commande={commande} product={p} today={today} setField={setField} isLocked={isLocked} />}
        </div>

        <WizardFooter
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          passerAEtape={passerAEtape}
          cloturerControleQualite={cloturerControleQualite}
          onClose={onClose}
          isLocked={isLocked}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </Modal>
  );
}

function RecapBandeau({ commande, product: p, puAchat }: { commande: any; product: any; puAchat: number }) {
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
      <span style={{
        fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
        background: commande.qualityCheck?.isCompleted ? THEME.bg.chip : (commande.statut === 'Arrivé' ? THEME.bg.soft : THEME.bg.surface),
        color: commande.qualityCheck?.isCompleted ? THEME.accent.green : (commande.statut === 'Arrivé' ? THEME.accent.orange : THEME.accent.primary),
        border: `1px solid ${THEME.border.base}`,
      }}>
        {commande.qualityCheck?.isCompleted ? '✅ En Stock (QC Validé & Verrouillé)' : `Statut : ${commande.statut}`}
      </span>
    </div>
  );
}

function StepperHeader({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ background: THEME.bg.card, padding: '12px 14px', borderRadius: 10, border: `1px solid ${THEME.border.base}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {WIZARD_STEPS.map((ws, index) => {
          const isPassed = ws.step < currentStep;
          const isCurrent = ws.step === currentStep;
          return (
            <React.Fragment key={ws.step}>
              {index > 0 && (
                <div style={{ flex: 1, height: 3, background: isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.border.base), margin: '0 4px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.bg.soft),
                  border: `2px solid ${isPassed ? THEME.accent.green : (isCurrent ? THEME.accent.primary : THEME.border.strong)}`,
                  color: isPassed || isCurrent ? THEME.text.light : THEME.text.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                }}>
                  {isPassed ? '✓' : ws.step}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>
        {WIZARD_STEPS[currentStep - 1].label} : <span style={{ fontWeight: 400, color: THEME.text.muted }}>{WIZARD_STEPS[currentStep - 1].desc}</span>
      </div>
    </div>
  );
}

function WizardFooter({ currentStep, setCurrentStep, passerAEtape, cloturerControleQualite, onClose, isLocked, onNavigateTab }: {
  currentStep: number; setCurrentStep: (n: number) => void;
  passerAEtape: (n: number) => void; cloturerControleQualite: () => void; onClose: () => void;
  isLocked?: boolean;
  onNavigateTab?: (tab: string) => void;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2.5 mt-1">
      <div>
        {currentStep > 1 && (
          <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="w-full sm:w-auto justify-center"
            style={{ ...ghostBtn, height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <ArrowLeft size={14} /><span>Précédent</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onClose} className="w-full sm:w-auto justify-center" style={{ ...ghostBtn, height: 38, padding: '0 14px' } as any}>
          Fermer
        </button>

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
            <Sparkles size={15} /><span>Valider le QC & Entrée en stock</span>
          </button>
        )}
      </div>
    </div>
  );
}
