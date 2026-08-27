import React, { memo, useState, useMemo } from 'react';
import { Package, Search, Award, TrendingUp } from 'lucide-react';
import { THEME } from '../colors';
import { Card, Empty, inputStyle, selectStyle } from '../ui';

interface ProductProfitabilityItem {
  id: string;
  nom: string;
  couleur?: string;
  categorie: string;
  qtyAchetee: number;
  qtyVendue: number;
  pertesProduitQty: number;
  pertesProduitAr: number;
  prixMoyenAchat: number;
  prixMoyenVente: number;
  margeUnitaire: number;
  tauxMargePct: number;
  beneficeTotal: number;
  caTotalProduit: number;
}

interface ProductProfitabilityTableProps {
  rentabiliteParProduit: ProductProfitabilityItem[];
}

const ProductProfitabilityTable = memo(function ProductProfitabilityTable({
  rentabiliteParProduit,
}: ProductProfitabilityTableProps) {
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [sortBy, setSortBy] = useState<'benefice' | 'margePct' | 'nom' | 'ca'>('benefice');

  // Filtrage et Tri des produits pour la rentabilité
  const produitsFitresEtTries = useMemo(() => {
    return rentabiliteParProduit
      .filter((p) => {
        if (!rechercheProduit.trim()) return true;
        const q = rechercheProduit.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          (p.couleur && p.couleur.toLowerCase().includes(q)) ||
          p.categorie.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'margePct') return b.tauxMargePct - a.tauxMargePct;
        if (sortBy === 'ca') return b.caTotalProduit - a.caTotalProduit;
        if (sortBy === 'nom') return a.nom.localeCompare(b.nom);
        return b.beneficeTotal - a.beneficeTotal;
      });
  }, [rentabiliteParProduit, rechercheProduit, sortBy]);

  // Insights clés sur la rentabilité
  const topRentabilitePct = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.prixMoyenAchat > 0 && (p.qtyVendue > 0 || p.prixMoyenVente > 0));
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.tauxMargePct - a.tauxMargePct)[0];
  }, [rentabiliteParProduit]);

  const topBeneficeTotal = useMemo(() => {
    const list = rentabiliteParProduit.filter((p) => p.qtyVendue > 0 && p.beneficeTotal > 0);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.beneficeTotal - a.beneficeTotal)[0];
  }, [rentabiliteParProduit]);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: THEME.text.primary }}>Rentabilité par Produit</div>
            <div style={{ fontSize: 12, color: '#8A8375' }}>
              Calcul basé sur le prix moyen d'achat (achat + fret) et le prix moyen de vente réels
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 170 }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#8A8375' }} />
            <input
              type="text"
              placeholder="Rechercher produit..."
              value={rechercheProduit}
              onChange={(e) => setRechercheProduit(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12 } as any}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ ...selectStyle, height: 32, fontSize: 12, width: 'auto' } as any}
          >
            <option value="benefice">Tri : Bénéfice Total (Ar)</option>
            <option value="margePct">Tri : Taux de Marge (%)</option>
            <option value="ca">Tri : Chiffre d'Affaires (Ar)</option>
            <option value="nom">Tri : Nom de Produit</option>
          </select>
        </div>
      </div>

      {/* Insights Clés */}
      {(topRentabilitePct || topBeneficeTotal) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
          {topRentabilitePct && (
            <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Meilleur Taux de Marge</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topRentabilitePct.nom} {topRentabilitePct.couleur ? `(${topRentabilitePct.couleur})` : ''}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.green }}>
                  +{topRentabilitePct.tauxMargePct}% de marge ({topRentabilitePct.margeUnitaire.toLocaleString('fr-FR')} Ar/u)
                </div>
              </div>
            </div>
          )}

          {topBeneficeTotal && (
            <div style={{ background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: '1px solid ' + THEME.border.base, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: THEME.bg.chip, color: THEME.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Plus Fort Bénéfice Total</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topBeneficeTotal.nom} {topBeneficeTotal.couleur ? `(${topBeneficeTotal.couleur})` : ''}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.accent.primary }}>
                  +{topBeneficeTotal.beneficeTotal.toLocaleString('fr-FR')} Ar générés ({topBeneficeTotal.qtyVendue} vendus)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tableau récapitulatif de rentabilité */}
      {produitsFitresEtTries.length === 0 ? (
        <Empty text="Aucun produit ne correspond aux critères." />
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid ' + THEME.border.base, borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: THEME.bg.soft, borderBottom: '1px solid ' + THEME.border.base, color: THEME.text.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '10px 12px' }}>Produit</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Achat Moy.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Prix Vente Moy.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Marge / Unité</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Taux Marge %</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bénéfice Total</th>
              </tr>
            </thead>
            <tbody>
              {produitsFitresEtTries.map((p, idx) => {
                const isPositive = p.margeUnitaire >= 0;
                const bgBadge = p.tauxMargePct >= 50
                  ? THEME.bg.chip
                  : p.tauxMargePct >= 20
                  ? THEME.bg.soft
                  : p.tauxMargePct > 0
                  ? THEME.bg.soft
                  : THEME.bg.alert;

                const colorBadge = p.tauxMargePct >= 50
                  ? THEME.accent.green
                  : p.tauxMargePct >= 20
                  ? THEME.accent.primary
                  : p.tauxMargePct > 0
                  ? THEME.accent.orange
                  : THEME.accent.danger;

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: idx === produitsFitresEtTries.length - 1 ? 'none' : '1px solid ' + THEME.border.base,
                      background: idx % 2 === 0 ? THEME.bg.card : THEME.bg.base,
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 13 }}>
                        {p.nom} {p.couleur ? `(${p.couleur})` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        {p.categorie} · {p.qtyVendue} vendu(s) / {p.qtyAchetee} acheté(s)
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: THEME.text.secondary }}>
                        {p.prixMoyenAchat.toLocaleString('fr-FR')} Ar
                      </span>
                      {p.qtyAchetee > 0 && (
                        <div style={{ fontSize: 10.5, color: THEME.text.muted }}>PRU moy. (achat + livr. + fret)</div>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: THEME.text.primary }}>
                        {p.prixMoyenVente.toLocaleString('fr-FR')} Ar
                      </span>
                      {p.qtyVendue > 0 && (
                        <div style={{ fontSize: 10.5, color: THEME.text.muted }}>sur {p.qtyVendue} vente(s)</div>
                      )}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: isPositive ? THEME.accent.green : THEME.accent.danger }}>
                        {isPositive ? '+' : ''}{p.margeUnitaire.toLocaleString('fr-FR')} Ar
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: bgBadge,
                          color: colorBadge,
                        }}
                      >
                        {p.tauxMargePct >= 0 ? '+' : ''}{p.tauxMargePct}%
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: p.beneficeTotal >= 0 ? THEME.accent.green : THEME.accent.danger }}>
                        {p.beneficeTotal >= 0 ? '+' : ''}{p.beneficeTotal.toLocaleString('fr-FR')} Ar
                      </span>
                      {p.pertesProduitAr > 0 && (
                        <div style={{ fontSize: 10.5, color: THEME.accent.danger, marginTop: 1 }}>
                          dont -{p.pertesProduitAr.toLocaleString('fr-FR')} Ar perte ({p.pertesProduitQty} pcs)
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
});

export default ProductProfitabilityTable;
