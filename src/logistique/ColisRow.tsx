import React from 'react';
import { ArrowRight, Edit3, Calendar, Truck, CreditCard } from 'lucide-react';
import { primaryBtn, ghostBtn } from '../ui';
import { WIZARD_STEPS, getActiveStep } from './logistiqueUtils';
import { getStatutMarchandiseLabel, getStatutFretLabel, getRestePayeFret } from '../paymentUtils';
import { formatDateJMA } from '../achat/components/AchatListe';

interface ColisRowProps {
  key?: any;
  commande: any;
  product?: any;
  transitaire?: any;
  paiements?: any[];
  onOuvrir: (id: string, step?: number) => void;
  onEdit?: (commande: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ColisRow({
  commande: c,
  product: p,
  transitaire,
  paiements = [],
  onOuvrir,
  onEdit,
  onNavigateTab,
}: ColisRowProps) {
  const isCompletedQC = c.qualityCheck?.isCompleted;
  const activeStepNumber = getActiveStep(c);
  const stMarchandise = getStatutMarchandiseLabel(c, paiements);
  const stFret = getStatutFretLabel(c, paiements);
  const resteFret = getRestePayeFret(c, paiements);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-white border border-[#EAE2D4] rounded-lg shadow-xs">
      <div style={{ flex: '1 1 280px', minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: '#26333D' }}>
            {p ? p.nom : 'Article commandé'} {p?.couleur ? `· ${p.couleur}` : ''}
          </span>

          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#F8F6F0', color: '#5E584E', border: '1px solid #EAE2D4', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} style={{ color: '#8A8375' }} />
            {formatDateJMA(c.dateAchat || c.datePaiement || c.date)}
          </span>

          {c.tracking && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#F5EFE6', color: '#3D5A6C', border: '1px solid #EAE2D4' }}>
              📦 {c.tracking}
            </span>
          )}

          {transitaire && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#E9F2EC', color: '#3F7A5C', border: '1px solid #D1E5D9' }}>
              🚛 {transitaire.nom}
            </span>
          )}

          {isCompletedQC && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#EBF4EC', color: '#1B6A3E', border: '1px solid #C4DEC0' }}>
              📂 Archivé en stock
            </span>
          )}

          {/* Badges de Statut de Paiement Séparés */}
          <span style={{
            fontSize: 10.5,
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 4,
            background: stMarchandise.type === 'paye' ? '#EBF4EC' : (stMarchandise.type === 'partiel' ? '#FFF8E1' : '#FFF3E0'),
            color: stMarchandise.type === 'paye' ? '#2C5E43' : (stMarchandise.type === 'partiel' ? '#B78103' : '#E65100'),
            border: `1px solid ${stMarchandise.type === 'paye' ? '#C4DEC0' : (stMarchandise.type === 'partiel' ? '#FFE082' : '#FFE0B2')}`,
          }}>
            🛒 Achat Chine: {stMarchandise.label}
          </span>

          {Number(c.fraisTransport) > 0 && (
            <span style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 4,
              background: stFret.type === 'paye' ? '#E3EFE9' : (stFret.type === 'partiel' ? '#FFF8E1' : '#FBEFEF'),
              color: stFret.type === 'paye' ? '#3F7A5C' : (stFret.type === 'partiel' ? '#B78103' : '#C24A3F'),
              border: `1px solid ${stFret.type === 'paye' ? '#C4DEC0' : (stFret.type === 'partiel' ? '#FFE082' : '#F5C6C6')}`,
            }}>
              🚢 Fret Transitaire: {stFret.label}
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#8A8375', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>Source : <strong>{c.source}</strong></span>
          <span>•</span>
          <span>Quantité : <strong>{c.qty} pièces</strong></span>
          {Number(c.fraisTransport) > 0 && (
            <>
              <span>•</span>
              <span style={{ color: resteFret > 0 ? '#B5532A' : '#1B6A3E', fontWeight: 600 }}>
                Fret : <strong>{Number(c.fraisTransport).toLocaleString('fr-FR')} Ar</strong> ({c.modeExpedition || 'Transport'}) {resteFret > 0 ? `· Reste ${resteFret.toLocaleString('fr-FR')} Ar` : '· Réglé'}
              </span>
            </>
          )}
          {Number(c.fraisTransportLocal) > 0 && (
            <>
              <span>•</span>
              <span>Livr. Entrepôt : <strong>{Number(c.fraisTransportLocal).toLocaleString('fr-FR')} Ar</strong></span>
            </>
          )}
          {c.dateEnEntrepot && (
            <>
              <span>•</span>
              <span>Entrepôt Chine : <strong>{formatDateJMA(c.dateEnEntrepot)}</strong></span>
            </>
          )}
          {c.dateEtaArrivee && c.statut !== 'Arrivé' && (
            <>
              <span>•</span>
              <span style={{ color: '#E8985E', fontWeight: 600 }}>
                ETA : {formatDateJMA(c.dateEtaArrivee)}
              </span>
            </>
          )}
        </div>

        <MicroStepper
          activeStepNumber={activeStepNumber}
          isCompletedQC={isCompletedQC}
          onStepClick={(step) => onOuvrir(c.id, step)}
        />
      </div>

      <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0 flex-wrap">
        {onEdit && (
          <button
            onClick={() => onEdit(c)}
            className="w-full sm:w-auto justify-center"
            style={{
              ...ghostBtn,
              height: 34,
              fontSize: 12,
              padding: '0 10px',
              border: '1px solid #3D5A6C',
              color: '#3D5A6C',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            } as any}
            title="Modifier les informations de cette commande d'achat"
          >
            <Edit3 size={13} color="#3D5A6C" />
            <span>Éditer</span>
          </button>
        )}

        {isCompletedQC && onNavigateTab && (
          <button
            onClick={() => onNavigateTab('vente')}
            className="w-full sm:w-auto justify-center"
            style={{
              ...primaryBtn,
              height: 34,
              fontSize: 12,
              padding: '0 10px',
              background: '#3F7A5C',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            } as any}
            title="Enregistrer une vente pour ce produit"
          >
            <span>🛒 Vendre</span>
          </button>
        )}

        <button
          onClick={() => onOuvrir(c.id)}
          className="w-full sm:w-auto justify-center"
          style={{ ...primaryBtn, height: 34, fontSize: 12.5, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 } as any}
          title="Consulter ou modifier les étapes logistiques de ce colis"
        >
          <span>Étapes logistiques</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

function MicroStepper({
  activeStepNumber,
  isCompletedQC,
  onStepClick,
}: {
  activeStepNumber: number;
  isCompletedQC?: boolean;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
      {WIZARD_STEPS.map((s, idx) => {
        const stepNum = idx + 1;
        const isPassed = isCompletedQC || stepNum < activeStepNumber;
        const isCurrent = !isCompletedQC && stepNum === activeStepNumber;
        const IconComponent = s.icon;

        return (
          <React.Fragment key={s.id}>
            <div
              onClick={() => onStepClick && onStepClick(stepNum)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer',
                background: isCurrent ? '#3D5A6C' : (isPassed ? '#EBF4EC' : '#F5EFE6'),
                color: isCurrent ? '#FFFFFF' : (isPassed ? '#1B6A3E' : '#8A8375'),
                border: isCurrent ? '1px solid #3D5A6C' : (isPassed ? '1px solid #C4DEC0' : '1px solid #EAE2D4'),
                transition: 'all 0.15s ease',
              }}
              title={`Étape ${stepNum} : ${s.label}`}
            >
              <IconComponent size={12} />
              <span>{s.label}</span>
            </div>
            {idx < WIZARD_STEPS.length - 1 && (
              <span style={{ color: '#D8D0C0', fontSize: 10 }}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
