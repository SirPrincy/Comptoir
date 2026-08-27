import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Modal, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';

interface ModalAjustementStockProps {
  product: any;
  currentStock: number;
  onClose: () => void;
  onConfirm: (data: { delta: number; motif: string; type: string; valeurTotaleAr?: number; valeurUnitaireAr?: number }) => void;
}

export default function ModalAjustementStock({
  product,
  currentStock,
  onClose,
  onConfirm,
}: ModalAjustementStockProps) {
  const [adjustType, setAdjustType] = React.useState<'perte' | 'echantillon' | 'inventaire'>('perte');
  const [adjustDelta, setAdjustDelta] = React.useState<number | string>(-1);
  const [adjustMotif, setAdjustMotif] = React.useState('Casse / Défectueux');

  const defaultUnitCost = Number(product?.coutTotalRenduAr || product?.prixAchatAr || (product?.puRmb ? product.puRmb * 680 : 0)) || 0;
  const [adjustValeurTotale, setAdjustValeurTotale] = React.useState<string>(
    defaultUnitCost > 0 ? String(defaultUnitCost) : ''
  );

  if (!product) return null;

  const handleTypeChange = (type: 'perte' | 'echantillon' | 'inventaire', defaultDelta: number, defaultMotif: string) => {
    setAdjustType(type);
    setAdjustDelta(defaultDelta);
    setAdjustMotif(defaultMotif);
    if (defaultUnitCost > 0) {
      setAdjustValeurTotale(String(Math.abs(defaultDelta) * defaultUnitCost));
    }
  };

  const handleDeltaChange = (newDeltaStr: string) => {
    setAdjustDelta(newDeltaStr);
    const num = Math.abs(Number(newDeltaStr) || 0);
    if (defaultUnitCost > 0 && num > 0) {
      setAdjustValeurTotale(String(num * defaultUnitCost));
    }
  };

  const handleConfirm = () => {
    const deltaVal = Number(adjustDelta) || 0;
    if (deltaVal === 0) return;

    const valTotale = adjustValeurTotale !== '' && !isNaN(Number(adjustValeurTotale))
      ? Number(adjustValeurTotale)
      : undefined;

    const valUnitaire = valTotale !== undefined && Math.abs(deltaVal) > 0
      ? Math.round(valTotale / Math.abs(deltaVal))
      : undefined;

    onConfirm({
      delta: deltaVal,
      motif: adjustMotif,
      type: adjustType,
      valeurTotaleAr: valTotale,
      valeurUnitaireAr: valUnitaire,
    });
  };

  return (
    <Modal title={`Régularisation Stock : ${product.nom}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12.5, color: '#5E584E' }}>
          Stock théorique actuel : <strong style={{ color: '#3D5A6C', fontSize: 14 }}>{currentStock} unité(s)</strong>
        </div>

        <Field label="Type d'ajustement">
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleTypeChange('perte', -1, 'Casse / Défectueux')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #EAE2D4',
                background: adjustType === 'perte' ? '#FBEAE8' : '#FAF7F2',
                color: adjustType === 'perte' ? '#C24A3F' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              ⚠️ Perte / Casse
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('echantillon', -1, 'Échantillon commercial / Cadeau')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #EAE2D4',
                background: adjustType === 'echantillon' ? '#FEF3EB' : '#FAF7F2',
                color: adjustType === 'echantillon' ? '#E8985E' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              🎁 Échantillon
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('inventaire', 1, 'Correction inventaire physique')}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #EAE2D4',
                background: adjustType === 'inventaire' ? '#EBF4EC' : '#FAF7F2',
                color: adjustType === 'inventaire' ? '#3F7A5C' : '#5E584E',
                cursor: 'pointer',
              }}
            >
              🔄 Inventaire
            </button>
          </div>
        </Field>

        <Field label="Quantité à ajuster (ex: -2 pour 2 pertes, ou +5 si retrouvés)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              style={{ ...inputStyle, width: 120, fontSize: 16, fontWeight: 700 } as any}
              value={adjustDelta}
              onChange={e => handleDeltaChange(e.target.value)}
              placeholder="-1 ou +1"
            />
            <div style={{ fontSize: 12, color: Number(adjustDelta) < 0 ? '#C24A3F' : '#3F7A5C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {Number(adjustDelta) < 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              Nouveau stock : {currentStock + (Number(adjustDelta) || 0)}
            </div>
          </div>
        </Field>

        <Field label="Valeur financière à ajuster (Ar)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              type="number"
              min="0"
              style={{ ...inputStyle, fontSize: 14, fontWeight: 700, color: '#C24A3F' } as any}
              value={adjustValeurTotale}
              onChange={e => setAdjustValeurTotale(e.target.value)}
              placeholder="Ex: 25000"
            />
            <div style={{ fontSize: 11, color: '#8A8375' }}>
              Montant financier total comptabilisé dans les pertes de stock (P&L).
              {defaultUnitCost > 0 && ` (Coût unitaire indicatif de l'article : ${defaultUnitCost.toLocaleString('fr-FR')} Ar)`}
            </div>
          </div>
        </Field>

        <Field label="Motif ou Justification">
          <select
            style={selectStyle as any}
            value={adjustMotif}
            onChange={e => setAdjustMotif(e.target.value)}
          >
            <option value="Casse / Défectueux">Casse / Défectueux lors du transport ou stockage</option>
            <option value="Vol / Disparition">Vol ou disparition non justifiée</option>
            <option value="Échantillon commercial / Cadeau">Échantillon offert ou photo shooting</option>
            <option value="Correction inventaire physique">Erreur de comptage / Rectification inventaire</option>
            <option value="Autre motif">Autre motif exceptionnel</option>
          </select>
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={ghostBtn as any}>Annuler</button>
          <button onClick={handleConfirm} style={primaryBtn as any}>Valider l'ajustement</button>
        </div>
      </div>
    </Modal>
  );
}
