import React, { useState, useMemo } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, ShieldCheck, DollarSign, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../qcUtils';
import { selectStyle } from '../ui';

interface ComparateurFournisseursProduitProps {
  products: any[];
  fournisseurs: any[];
  commandes: any[];
  onOrderProductWithSupplier?: (productId: string, fournisseurId: string) => void;
}

export default function ComparateurFournisseursProduit({
  products = [],
  fournisseurs = [],
  commandes = [],
  onOrderProductWithSupplier,
}: ComparateurFournisseursProduitProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  // Produit actif
  const currentProduct = useMemo(() => {
    return products.find((p: any) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Analyse comparative basée sur le RÉEL : commandes passées, prix unitaires payés, contrôle qualité QC constaté
  const comparisonResults = useMemo(() => {
    if (!currentProduct) return [];

    const productCmds = commandes.filter((c: any) => c.productId === currentProduct.id);
    const supplierIds = new Set<string>();
    productCmds.forEach((c: any) => {
      if (c.fournisseurId) supplierIds.add(c.fournisseurId);
    });

    const results = Array.from(supplierIds).map(fId => {
      const fournisseur = fournisseurs.find((f: any) => f.id === fId) || {
        id: fId,
        nom: 'Fournisseur inconnu',
        plateforme: 'Direct',
      };

      const myCmds = productCmds.filter((c: any) => c.fournisseurId === fId);
      myCmds.sort((a: any, b: any) => new Date(b.dateAchat || 0).getTime() - new Date(a.dateAchat || 0).getTime());

      const totalQty = myCmds.reduce((sum: number, c: any) => sum + (Number(c.qty) || 0), 0);
      
      const pricesRmb = myCmds.map((c: any) => Number(c.puDevise || c.puRmb || 0)).filter((p: number) => p > 0);
      const pricesAr = myCmds.map((c: any) => Number(c.pu || 0)).filter((p: number) => p > 0);

      const dernierPrixRmb = pricesRmb[0] || 0;
      const dernierPrixAr = pricesAr[0] || 0;
      const minPrixAr = pricesAr.length > 0 ? Math.min(...pricesAr) : 0;
      const avgPrixAr = pricesAr.length > 0 ? Math.round(pricesAr.reduce((a, b) => a + b, 0) / pricesAr.length) : 0;

      // Score QC spécifique au produit
      let prodConforme = 0;
      let prodDefectueuse = 0;
      let prodLitiges = 0;
      let prodQcCount = 0;

      myCmds.forEach((c: any) => {
        if (c.qualityCheck) {
          prodQcCount++;
          const qc = c.qualityCheck;
          const qty = Number(c.qty) || 1;
          const conf = qc.qtyConforme !== undefined ? Number(qc.qtyConforme) : (qc.statut === 'Conforme' ? qty : 0);
          const def = qc.qtyDefectueuse !== undefined ? Number(qc.qtyDefectueuse) : Math.max(0, qty - conf);
          prodConforme += conf;
          prodDefectueuse += def;
          if (qc.statut !== 'Conforme' || def > 0) prodLitiges++;
        }
      });

      const prodTauxQC = prodConforme + prodDefectueuse > 0
        ? Math.round((prodConforme / (prodConforme + prodDefectueuse)) * 100)
        : null;

      const globalQC = calculerScoreFournisseur(fId, commandes, products);

      return {
        fournisseur,
        nbCommandes: myCmds.length,
        totalQty,
        derniereCommandeDate: myCmds[0]?.dateAchat || null,
        dernierPrixRmb,
        dernierPrixAr,
        minPrixAr,
        avgPrixAr,
        prodTauxQC,
        prodLitiges,
        prodQcCount,
        globalQC,
      };
    });

    let minPriceVal = Infinity;
    results.forEach(r => {
      if (r.dernierPrixAr > 0 && r.dernierPrixAr < minPriceVal) {
        minPriceVal = r.dernierPrixAr;
      }
    });

    let bestQcVal = -1;
    results.forEach(r => {
      const qc = r.prodTauxQC !== null ? r.prodTauxQC : (r.globalQC?.taux ?? 100);
      if (qc > bestQcVal) {
        bestQcVal = qc;
      }
    });

    return results.map(r => {
      const isBestPrice = r.dernierPrixAr > 0 && r.dernierPrixAr === minPriceVal;
      const isBestQc = (r.prodTauxQC !== null ? r.prodTauxQC : (r.globalQC?.taux ?? 0)) === bestQcVal && bestQcVal >= 90;
      const isRecommended = isBestPrice && (r.prodLitiges === 0 || (r.prodTauxQC || 100) >= 90);

      return {
        ...r,
        isBestPrice,
        isBestQc,
        isRecommended,
      };
    });
  }, [currentProduct, commandes, fournisseurs, products]);

  if (products.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#8A8375', fontSize: 13 }}>
        Aucun produit enregistré pour effectuer une comparaison.
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAE2D4',
        borderRadius: 10,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* En-tête cliquable (Dépliable / Repliable) */}
      <div
        onClick={() => setIsOpen(v => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: '#FAF7F2',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: '#EAEBF5',
              color: '#384282',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={15} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#26333D', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Comparateur Fournisseurs par Produit</span>
              {currentProduct && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#384282', background: '#E0E3F5', padding: '1px 6px', borderRadius: 4 }}>
                  {currentProduct.nom}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#8A8375' }}>
              Prix d'achat réels constatés, conformité QC & historique des commandes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#5E584E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isOpen ? 'Réduire' : 'Déplier'}
          </button>
        </div>
      </div>

      {/* Corps dépliable */}
      {isOpen && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #EAE2D4' }}>
          {/* Ligne sélection de produit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#5E584E' }}>
              Sélectionnez un article pour analyser ses fournisseurs réels :
            </div>
            <div style={{ minWidth: 220, maxWidth: 360, flex: '1 1 220px' }}>
              <select
                style={{ ...selectStyle, fontWeight: 600, fontSize: 12 } as any}
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
              >
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} {p.couleur ? `(${p.couleur})` : ''} {p.reference ? `[${p.reference}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau comparatif ou état vide */}
          {comparisonResults.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                background: '#FAF7F2',
                borderRadius: 8,
                border: '1px dashed #D8D0C0',
                fontSize: 12,
                color: '#736B5E',
              }}
            >
              Aucun fournisseur n'a encore été associé à des commandes réelles pour cet article.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #EAE2D4', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #EAE2D4' }}>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700 }}>Fournisseur</th>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, borderLeft: '1px solid #EAE2D4' }}>
                      Dernier Prix Réel
                    </th>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, borderLeft: '1px solid #EAE2D4' }}>
                      Prix Moyen Réel
                    </th>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, borderLeft: '1px solid #EAE2D4' }}>
                      Qualité QC Réelle
                    </th>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, borderLeft: '1px solid #EAE2D4' }}>
                      Historique Réel
                    </th>
                    <th style={{ padding: '8px 10px', color: '#5E584E', fontWeight: 700, borderLeft: '1px solid #EAE2D4' }}>
                      Verdict
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((row, idx) => {
                    const qcBadge = getQCBadgeInfo(row.globalQC);

                    return (
                      <tr
                        key={row.fournisseur.id}
                        style={{
                          borderBottom: idx === comparisonResults.length - 1 ? 'none' : '1px solid #F0ECE1',
                          background: row.isRecommended ? '#F4FAF6' : (idx % 2 === 0 ? '#FFFFFF' : '#FDFAF5'),
                        }}
                      >
                        {/* Fournisseur */}
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#26333D' }}>
                          <div>{row.fournisseur.nom}</div>
                          <div style={{ fontSize: 10.5, color: '#8A8375', fontWeight: 400 }}>
                            {row.fournisseur.plateforme || 'Direct'}
                          </div>
                        </td>

                        {/* Dernier Prix Réel */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1' }}>
                          <div style={{ fontWeight: 700, color: row.isBestPrice ? '#1B6A3E' : '#26333D' }}>
                            {row.dernierPrixAr > 0 ? `${row.dernierPrixAr.toLocaleString('fr-FR')} Ar` : '—'}
                          </div>
                          {row.dernierPrixRmb > 0 && (
                            <div style={{ fontSize: 10.5, color: '#8A8375' }}>¥{row.dernierPrixRmb} RMB</div>
                          )}
                        </td>

                        {/* Prix Moyen Réel */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1' }}>
                          <div style={{ color: '#5E584E' }}>
                            {row.avgPrixAr > 0 ? `${row.avgPrixAr.toLocaleString('fr-FR')} Ar` : '—'}
                          </div>
                          {row.minPrixAr > 0 && row.minPrixAr !== row.dernierPrixAr && (
                            <div style={{ fontSize: 10, color: '#8A8375' }}>Min: {row.minPrixAr.toLocaleString('fr-FR')} Ar</div>
                          )}
                        </td>

                        {/* Qualité QC Réelle */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1' }}>
                          {row.prodTauxQC !== null ? (
                            <div>
                              <div style={{ fontWeight: 700, color: row.prodTauxQC >= 90 ? '#1B6A3E' : (row.prodTauxQC >= 75 ? '#946C00' : '#B5532A') }}>
                                {row.prodTauxQC}% conforme
                              </div>
                              <div style={{ fontSize: 10, color: '#8A8375' }}>
                                {row.prodLitiges > 0 ? `⚠️ ${row.prodLitiges} litige(s)` : '✅ 0 anomalie'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 10.5, color: '#8A8375' }}>
                              {qcBadge ? `${qcBadge.shortLabel} (${row.globalQC?.taux || 100}%)` : 'Pas encore de QC'}
                            </div>
                          )}
                        </td>

                        {/* Historique Réel */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1' }}>
                          <div>{row.nbCommandes} commande(s)</div>
                          <div style={{ fontSize: 10, color: '#8A8375' }}>{row.totalQty} pcs achetées</div>
                        </td>

                        {/* Verdict */}
                        <td style={{ padding: '8px 10px', borderLeft: '1px solid #F0ECE1' }}>
                          {row.isRecommended ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#1B6A3E', background: '#D9F2E2', padding: '2px 6px', borderRadius: 4 }}>
                              ★ Recommandé
                            </span>
                          ) : row.isBestPrice ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#1B6A3E', background: '#E3EFE9', padding: '2px 6px', borderRadius: 4 }}>
                              Moins cher
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: '#8A8375' }}>Standard</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
