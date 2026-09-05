import React, { useState, useMemo, memo } from 'react';
import { Calculator, Sparkles, TrendingUp, DollarSign, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { THEME } from '../colors';
import { RADIUS, SHADOWS, Card, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { Product } from '../stock/types';
import { formatAr, formatRmb } from './analyseUtils';

interface Props {
  products: Product[];
  tauxRmb: number;
}

export const AnalyseSimulateur = memo(function AnalyseSimulateur({ products, tauxRmb }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [prixAchatRmb, setPrixAchatRmb] = useState<number | string>(10);
  const [fraisChineRmb, setFraisChineRmb] = useState<number | string>(1);
  const [tauxChange, setTauxChange] = useState<number | string>(tauxRmb || 680);
  const [fretUnitaireAr, setFretUnitaireAr] = useState<number | string>(3000);
  const [quantiteLot, setQuantiteLot] = useState<number | string>(50);

  // Objectif de marge
  const [margeCiblePct, setMargeCiblePct] = useState<number | string>(40);
  const [modeCalcul, setModeCalcul] = useState<'tauxMarge' | 'coef'>('tauxMarge');
  const [coefMultiplicateur, setCoefMultiplicateur] = useState<number | string>(2.0);

  // Si on choisit un produit existant
  const handleSelectProduct = (pId: string) => {
    setSelectedProductId(pId);
    if (!pId) return;
    const p = products.find(prod => prod.id === pId);
    if (p) {
      if (p.puRmb) setPrixAchatRmb(Number(p.puRmb));
      else if (p.prixAchat) setPrixAchatRmb(Math.round((Number(p.prixAchat) / Number(tauxChange)) * 100) / 100);

      if (p.fraisLivraisonChineDevise) setFraisChineRmb(Number(p.fraisLivraisonChineDevise));
      if (p.coutTotalRenduAr && p.prixAchat) {
        const diff = Number(p.coutTotalRenduAr) - Number(p.prixAchat);
        if (diff > 0) setFretUnitaireAr(Math.round(diff));
      }
    }
  };

  // Calculs dynamiques
  const calculs = useMemo(() => {
    const puRmb = Number(prixAchatRmb) || 0;
    const fraisRmb = Number(fraisChineRmb) || 0;
    const taux = Number(tauxChange) || 680;
    const fretAr = Number(fretUnitaireAr) || 0;
    const lot = Math.max(1, Number(quantiteLot) || 1);

    // Coûts unitaires
    const prixAchatArticleAr = Math.round(puRmb * taux);
    const fraisChineAr = Math.round(fraisRmb * taux);
    const coutRevientUnitaireAr = prixAchatArticleAr + fraisChineAr + fretAr;

    // Calcul du prix de vente selon le mode
    let prixVenteConseilleAr = 0;
    let tauxMargeEffectif = 0;
    let coefEffectif = 0;

    if (modeCalcul === 'tauxMarge') {
      const marge = Number(margeCiblePct) || 0;
      // PV = Coût / (1 - Marge%)
      const ratio = 1 - (marge / 100);
      prixVenteConseilleAr = ratio > 0 ? Math.round(coutRevientUnitaireAr / ratio) : coutRevientUnitaireAr * 2;
      tauxMargeEffectif = marge;
      coefEffectif = coutRevientUnitaireAr > 0 ? Math.round((prixVenteConseilleAr / coutRevientUnitaireAr) * 100) / 100 : 0;
    } else {
      const coef = Number(coefMultiplicateur) || 1;
      prixVenteConseilleAr = Math.round(coutRevientUnitaireAr * coef);
      coefEffectif = coef;
      tauxMargeEffectif = prixVenteConseilleAr > 0
        ? Math.round(((prixVenteConseilleAr - coutRevientUnitaireAr) / prixVenteConseilleAr) * 1000) / 10
        : 0;
    }

    // Arrondi commercial élégant (au multiple de 500 ou 1000 Ar le plus proche)
    const prixVenteArrondi500 = Math.ceil(prixVenteConseilleAr / 500) * 500;
    const margeUnitaireAr = prixVenteArrondi500 - coutRevientUnitaireAr;

    // Totaux sur le lot commandé
    const coutTotalLotAr = coutRevientUnitaireAr * lot;
    const caTotalLotAr = prixVenteArrondi500 * lot;
    const beneficeNetLotAr = margeUnitaireAr * lot;
    const seuilRentabiliteUnites = prixVenteArrondi500 > 0 ? Math.ceil(coutTotalLotAr / prixVenteArrondi500) : lot;

    return {
      prixAchatArticleAr,
      fraisChineAr,
      fretAr,
      coutRevientUnitaireAr,
      prixVenteConseilleAr,
      prixVenteArrondi500,
      margeUnitaireAr,
      tauxMargeEffectif,
      coefEffectif,
      coutTotalLotAr,
      caTotalLotAr,
      beneficeNetLotAr,
      seuilRentabiliteUnites,
      lot
    };
  }, [prixAchatRmb, fraisChineRmb, tauxChange, fretUnitaireAr, quantiteLot, margeCiblePct, modeCalcul, coefMultiplicateur]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: '20px 24px', background: THEME.bg.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: RADIUS.control,
            background: 'rgba(16, 185, 129, 0.12)',
            color: THEME.brand.emerald,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calculator size={19} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text.primary, letterSpacing: '-0.01em' }}>
              Simulateur de Marge & Prix de Vente Cible
            </div>
            <div style={{ fontSize: 12, color: THEME.text.secondary }}>
              Déterminez le juste prix de vente pour garantir votre rentabilité nette avant de commander en Chine
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}>
          {/* COLONNE GAUCHE : PARAMÈTRES D'ACHAT */}
          <div style={{
            padding: 16,
            background: THEME.bg.surface,
            borderRadius: RADIUS.card,
            border: `1px solid ${THEME.border.base}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.brand.amber, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>1. Coûts d'Approvisionnement</span>
            </div>

            {/* Charger un produit existant */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                Préremplir depuis un article existant (optionnel) :
              </label>
              <select
                value={selectedProductId}
                onChange={e => handleSelectProduct(e.target.value)}
                style={{ ...selectStyle, fontSize: 12 } as any}
              >
                <option value="">-- Saisie manuelle libre --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} {p.reference ? `(${p.reference})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Prix Achat RMB + Taux */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                  Prix Achat Chine (¥) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={prixAchatRmb}
                  onChange={e => setPrixAchatRmb(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12 } as any}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                  Taux RMB (Ar/¥) :
                </label>
                <input
                  type="number"
                  value={tauxChange}
                  onChange={e => setTauxChange(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12 } as any}
                />
              </div>
            </div>

            {/* Frais Chine RMB + Fret unitaire Ar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                  Frais interne Chine (¥) :
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={fraisChineRmb}
                  onChange={e => setFraisChineRmb(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12 } as any}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                  Fret / Transit (Ar/u) :
                </label>
                <input
                  type="number"
                  step="500"
                  value={fretUnitaireAr}
                  onChange={e => setFretUnitaireAr(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12 } as any}
                />
              </div>
            </div>

            {/* Quantité du lot */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: THEME.text.secondary, marginBottom: 4, display: 'block' }}>
                Quantité prévue de commande (lot) :
              </label>
              <input
                type="number"
                value={quantiteLot}
                onChange={e => setQuantiteLot(e.target.value)}
                style={{ ...inputStyle, fontSize: 12 } as any}
              />
            </div>

            {/* Badge récap Coût de revient */}
            <div style={{
              padding: '10px 12px',
              background: THEME.bg.card,
              borderRadius: RADIUS.item,
              border: `1px solid ${THEME.border.base}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4
            }}>
              <div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>Coût de Revient Unitaire Réel</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.brand.amber }}>
                  {formatAr(calculs.coutRevientUnitaireAr)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: THEME.text.muted }}>
                <div>Article: {formatAr(calculs.prixAchatArticleAr)}</div>
                <div>Frais + Fret: {formatAr(calculs.fraisChineAr + calculs.fretAr)}</div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : OBJECTIF DE MARGE & RÉSULTATS */}
          <div style={{
            padding: 16,
            background: THEME.bg.surface,
            borderRadius: RADIUS.card,
            border: `1px solid ${THEME.border.base}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.brand.blue, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>2. Stratégie Tarifaire & Marges</span>
            </div>

            {/* Choix du mode : Taux de marge vs Coef */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setModeCalcul('tauxMarge')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: RADIUS.control,
                  border: `1px solid ${modeCalcul === 'tauxMarge' ? THEME.brand.blue : THEME.border.base}`,
                  background: modeCalcul === 'tauxMarge' ? THEME.brand.blue : THEME.bg.card,
                  color: modeCalcul === 'tauxMarge' ? '#FFF' : THEME.text.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Taux de Marge (%)
              </button>
              <button
                type="button"
                onClick={() => setModeCalcul('coef')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: RADIUS.control,
                  border: `1px solid ${modeCalcul === 'coef' ? THEME.brand.blue : THEME.border.base}`,
                  background: modeCalcul === 'coef' ? THEME.brand.blue : THEME.bg.card,
                  color: modeCalcul === 'coef' ? '#FFF' : THEME.text.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Coefficient (ex: 2.5x)
              </button>
            </div>

            {/* Input marge ou coef */}
            {modeCalcul === 'tauxMarge' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: THEME.text.secondary }}>Taux de marge brute souhaité :</span>
                  <span style={{ color: THEME.brand.blue }}>{margeCiblePct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="85"
                  step="5"
                  value={margeCiblePct}
                  onChange={e => setMargeCiblePct(e.target.value)}
                  style={{ width: '100%', accentColor: THEME.brand.blue }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: THEME.text.muted }}>
                  <span>10% (Low-cost)</span>
                  <span>40% (Standard)</span>
                  <span>70%+ (Haut de gamme)</span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  <span style={{ color: THEME.text.secondary }}>Multiplicateur de prix :</span>
                  <span style={{ color: THEME.brand.blue }}>{coefMultiplicateur}x</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="4.0"
                  step="0.1"
                  value={coefMultiplicateur}
                  onChange={e => setCoefMultiplicateur(e.target.value)}
                  style={{ width: '100%', accentColor: THEME.brand.blue }}
                />
              </div>
            )}

            {/* RÉSULTAT PRINCIPAL : PRIX CONSEILLÉ */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(37, 99, 235, 0.08))',
              borderRadius: RADIUS.item,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.brand.emerald, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prix de Vente Recommandé
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: THEME.text.primary, margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
                {formatAr(calculs.prixVenteArrondi500)}
              </div>
              <div style={{ fontSize: 12, color: THEME.text.secondary }}>
                Bénéfice net unitaire : <strong style={{ color: THEME.brand.emerald }}>+{formatAr(calculs.margeUnitaireAr)}</strong> ({calculs.tauxMargeEffectif}% de marge)
              </div>
            </div>

            {/* RENTABILITÉ SUR LE LOT COMMANDÉ */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 11
            }}>
              <div style={{ padding: '8px 10px', background: THEME.bg.card, borderRadius: RADIUS.control, border: `1px solid ${THEME.border.base}` }}>
                <div style={{ color: THEME.text.muted }}>Budget Achat Lot ({calculs.lot} pcs)</div>
                <div style={{ fontWeight: 700, color: THEME.brand.amber, fontSize: 13 }}>{formatAr(calculs.coutTotalLotAr)}</div>
              </div>
              <div style={{ padding: '8px 10px', background: THEME.bg.card, borderRadius: RADIUS.control, border: `1px solid ${THEME.border.base}` }}>
                <div style={{ color: THEME.text.muted }}>Bénéfice Net Attendu</div>
                <div style={{ fontWeight: 800, color: THEME.brand.emerald, fontSize: 13 }}>+{formatAr(calculs.beneficeNetLotAr)}</div>
              </div>
            </div>

            {/* SEUIL D'AMORTISSEMENT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: THEME.text.secondary }}>
              <CheckCircle2 size={14} color={THEME.brand.emerald} />
              <span>
                Seuil d'amortissement : <strong>{calculs.seuilRentabiliteUnites} sur {calculs.lot} pièces</strong> vendues remboursent l'intégralité du lot !
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});
