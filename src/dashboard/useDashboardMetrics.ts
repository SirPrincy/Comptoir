import { useMemo, useCallback } from 'react';
import { STATUTS_LOGISTIQUE } from '../constants';
import { calculerSoldeRMB } from '../paymentUtils';

export interface DashboardMetricsProps {
  products: any[];
  ventes: any[];
  commandes: any[];
  mouvements?: any[];
  changes?: any[];
  paiements?: any[];
  devises?: any;
}

export function useDashboardMetrics({
  products = [],
  ventes = [],
  commandes = [],
  mouvements = [],
  changes = [],
  paiements = [],
  devises = { rmb: 680, usd: 4600 },
}: DashboardMetricsProps) {
  // O(1) Map des produits par ID
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((p: any) => {
      if (p && p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // O(1) Groupement des commandes par productId
  const cmdsByProduct = useMemo(() => {
    const map = new Map<string, any[]>();
    commandes.forEach((c: any) => {
      if (!c || !c.productId) return;
      if (!map.has(c.productId)) map.set(c.productId, []);
      map.get(c.productId)!.push(c);
    });
    return map;
  }, [commandes]);

  // Precalculer la table des couts de revient par productId (O(N) total)
  const costMapByProduct = useMemo(() => {
    const map = new Map<string, number>();

    // Pour chaque produit, calculer son cout de revient
    products.forEach((p: any) => {
      if (!p || !p.id) return;
      const productCmds = (cmdsByProduct.get(p.id) || []).filter(
        (c: any) => (c.pu && Number(c.pu) > 0) || (c.total && Number(c.total) > 0) || (c.qty && Number(c.qty) > 0)
      );

      if (productCmds.length > 0) {
        let totalLandedCost = 0;
        let totalQty = 0;
        productCmds.forEach((c: any) => {
          const qty = Math.max(1, Number(c.qty) || 1);
          const pu = Number(c.pu) || 0;
          const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
          const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
            ? Number(c.total)
            : ((pu * qty) + fraisChine);
          const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
          const transportLocal = Number(c.fraisTransportLocal) || 0;

          totalLandedCost += (totalMarchandise + fret + transportLocal);
          totalQty += qty;
        });
        const coutRevient = totalQty > 0 ? totalLandedCost / totalQty : 0;
        map.set(p.id, coutRevient);
      } else {
        map.set(p.id, Number(p?.prixAchat) || 0);
      }
    });

    return map;
  }, [products, cmdsByProduct]);

  // Helper rapide O(1) pour trouver le coût unitaire réel d'un produit
  const getProductCostBreakdown = useCallback((productId: string) => {
    if (costMapByProduct.has(productId)) {
      return { coutRevient: costMapByProduct.get(productId)! };
    }
    const p = productMap.get(productId);
    return { coutRevient: Number(p?.prixAchat) || 0 };
  }, [costMapByProduct, productMap]);

  // 1. Chiffre d'Affaires Encaissé
  const caTotal = useMemo(() => {
    return ventes.reduce((s: number, v: any) => s + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0), 0);
  }, [ventes]);

  // 2. Marge Commerciale Réelle des ventes
  const margeTotale = useMemo(() => {
    return ventes.reduce((s: number, v: any) => {
      const p = productMap.get(v.productId);
      const puVente = v.pu ?? (p?.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
      const coutRevient = costMapByProduct.get(v.productId) ?? (Number(p?.prixAchat) || 0);
      return s + (Number(puVente) - Number(coutRevient)) * (Number(v.qty) || 1);
    }, 0);
  }, [ventes, productMap, costMapByProduct]);

  // 3. Capital Investi
  const capitalInvesti = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'entrée' && (m.isInvestissement || m.tag === '#investissement' || m.tag === '#capital' || m.tag === '#fond-roulement'))
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 4. Sorties Achats Chine & Fret
  const totalAchatsChine = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const qty = Math.max(1, Number(c.qty) || 1);
      const pu = Number(c.pu) || 0;
      const fraisChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
      const coutAchat = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
        ? Number(c.total)
        : ((pu * qty) + fraisChine);
      return s + coutAchat;
    }, 0);
  }, [commandes]);

  const totalFret = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const fret = Number(c.fraisTransport || c.fretEstimeAr) || 0;
      const transportLocal = Number(c.fraisTransportLocal) || 0;
      return s + fret + transportLocal;
    }, 0);
  }, [commandes]);

  // 5. Charges opérationnelles
  const chargesOperationnelles = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'sortie' && !m.isTransfert && m.tag !== '#stock-chine' && m.tag !== '#fret-logistique')
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // 5b. Pertes & Régularisations de Stock
  const ajustementsStock = useMemo(() => {
    return (mouvements || []).filter((m: any) => m && m.type === 'Ajustement Stock');
  }, [mouvements]);

  const statsPertes = useMemo(() => {
    let totalPertesAr = 0;
    let totalGainsInventaireAr = 0;
    let quantitePerdue = 0;
    let quantiteAjoutee = 0;

    ajustementsStock.forEach((m: any) => {
      if (!m) return;
      const delta = Number(m.delta) || 0;
      const coutRevient = costMapByProduct.get(m.productId) ?? 0;
      const valTotale = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null && !isNaN(Number(m.valeurTotaleAr))
        ? Number(m.valeurTotaleAr)
        : (m.valeurUnitaireAr !== undefined && m.valeurUnitaireAr !== null && !isNaN(Number(m.valeurUnitaireAr)))
        ? Math.abs(delta) * Number(m.valeurUnitaireAr)
        : (Math.abs(delta) * (coutRevient || 0));

      if (delta < 0) {
        totalPertesAr += valTotale;
        quantitePerdue += Math.abs(delta);
      } else if (delta > 0) {
        totalGainsInventaireAr += valTotale;
        quantiteAjoutee += delta;
      }
    });

    return {
      totalPertesAr: Math.round(totalPertesAr || 0),
      totalGainsInventaireAr: Math.round(totalGainsInventaireAr || 0),
      quantitePerdue: quantitePerdue || 0,
      quantiteAjoutee: quantiteAjoutee || 0,
      ajustements: [...ajustementsStock].sort((a, b) => {
        const timeA = a && a.date ? new Date(a.date).getTime() : 0;
        const timeB = b && b.date ? new Date(b.date).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }),
    };
  }, [ajustementsStock, costMapByProduct]);

  // 6. Dépenses d'exploitation globales & Bénéfices
  const totalDepensesGlobales = totalAchatsChine + totalFret + chargesOperationnelles + statsPertes.totalPertesAr;
  const beneficeNet = margeTotale - chargesOperationnelles - statsPertes.totalPertesAr + statsPertes.totalGainsInventaireAr;
  const baseInvestissement = capitalInvesti > 0 ? capitalInvesti : totalDepensesGlobales;

  const tauxRoi = baseInvestissement > 0 ? (beneficeNet / baseInvestissement) * 100 : 0;
  const tauxRecuperation = baseInvestissement > 0 ? Math.min(100, Math.max(0, (caTotal / baseInvestissement) * 100)) : 0;
  const resteARecuperer = Math.max(0, baseInvestissement - caTotal);

  // 7. Trésorerie Disponible
  const tresorerieDispo = useMemo(() => {
    const entrees = mouvements.filter((m: any) => m.type === 'entrée' && !m.isTransfert).reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
    const sorties = mouvements.filter((m: any) => m.type === 'sortie' && !m.isTransfert).reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
    return entrees - sorties;
  }, [mouvements]);

  // 8. Solde RMB
  const soldeRmbInfo = useMemo(() => {
    return calculerSoldeRMB(changes, mouvements, commandes, devises, paiements);
  }, [changes, mouvements, commandes, devises, paiements]);

  // 9. Créances & Dettes
  const creancesClients = useMemo(() => {
    return ventes.reduce((s: number, v: any) => {
      const tot = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
      const paye = Number(v.paye !== undefined ? v.paye : (v.statutPaiement === 'Payé' ? tot : (v.statutPaiement === 'Partiel' ? (v.montantPaye || 0) : 0)));
      return s + Math.max(0, tot - paye);
    }, 0);
  }, [ventes]);

  const dettesFournisseurs = useMemo(() => {
    return commandes.reduce((s: number, c: any) => {
      const tot = Number(c.total) || ((Number(c.pu) || 0) * (Number(c.qty) || 1) + (Number(c.fraisLivraisonChine || c.fraisLivraison) || 0));
      const paye = Number(c.montantPayeMarchandise || (c.statutPaiementMarchandise === 'Payé' ? tot : 0));
      const fretTot = Number(c.fraisTransport || c.fretEstimeAr || 0);
      const fretPaye = Number(c.montantPayeTransport || (c.statutPaiementTransport === 'Payé' ? fretTot : 0));
      return s + Math.max(0, tot - paye) + Math.max(0, fretTot - fretPaye);
    }, 0);
  }, [commandes]);

  // 10. Logistique & Stocks
  const enTransit = useMemo(() => {
    return commandes.filter(
      (c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé'
    ).length;
  }, [commandes]);

  const commandesEnTransitList = useMemo(() => {
    return commandes.filter((c: any) => STATUTS_LOGISTIQUE.includes(c.statut) && c.statut !== 'Arrivé');
  }, [commandes]);

  const valeurStockLocal = useMemo(() => {
    return products.reduce((s: number, p: any) => {
      const stock = Number(p.stock) || 0;
      if (stock <= 0) return s;
      const coutRevient = costMapByProduct.get(p.id) ?? (Number(p.prixAchat) || 0);
      return s + (stock * coutRevient);
    }, 0);
  }, [products, costMapByProduct]);

  const stockAlertesList = useMemo(() => {
    return products.filter((p: any) => {
      const stock = Number(p.stock) || 0;
      const seuil = Number(p.seuilAlerte) || 2;
      return stock <= seuil;
    });
  }, [products]);

  const articlesVendusTotal = useMemo(() => {
    return ventes.reduce((s: number, v: any) => s + (Number(v.qty) || 1), 0);
  }, [ventes]);

  const panierMoyen = useMemo(() => {
    return ventes.length > 0 ? Math.round(caTotal / ventes.length) : 0;
  }, [ventes, caTotal]);

  // 11. Répartitions & Graphiques (O(N) optimisés)
  const parCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = productMap.get(v.productId);
      if (!p) return;
      const cat = p.categorie || 'Autre';
      map[cat] = (map[cat] || 0) + (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventes, productMap]);

  const parProduit = useMemo(() => {
    const map: Record<string, number> = {};
    ventes.forEach((v: any) => {
      const p = productMap.get(v.productId);
      if (!p) return;
      const key = p.nom + (p.couleur ? ` (${p.couleur})` : '');
      const tot = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
      map[key] = (map[key] || 0) + tot;
    });
    return Object.entries(map)
      .map(([name, ca]) => ({ name, ca }))
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 6);
  }, [ventes, productMap]);

  // 12. Rentabilité Détaillée par Produit (O(N) avec Maps pré-groupées)
  const rentabiliteParProduit = useMemo(() => {
    // Groupement des ventes par productId
    const ventesByProduct = new Map<string, any[]>();
    ventes.forEach((v: any) => {
      if (!v || !v.productId) return;
      if (!ventesByProduct.has(v.productId)) ventesByProduct.set(v.productId, []);
      ventesByProduct.get(v.productId)!.push(v);
    });

    // Groupement des ajustements par productId ou nom
    const ajustementsByProduct = new Map<string, any[]>();
    ajustementsStock.forEach((m: any) => {
      if (!m) return;
      const key = m.productId || m.productNom;
      if (!key) return;
      if (!ajustementsByProduct.has(key)) ajustementsByProduct.set(key, []);
      ajustementsByProduct.get(key)!.push(m);
    });

    return products.map((p: any) => {
      const pCmds = cmdsByProduct.get(p.id) || [];
      const qtyAchetee = pCmds.reduce((s: number, c: any) => s + (Number(c.qty) || 0), 0);
      const totalAchatsEtFret = pCmds.reduce((s: number, c: any) => {
        const qty = Number(c.qty) || 1;
        const pu = Number(c.pu) || 0;
        const fraisLivraisonChine = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
        const totalMarchandise = (c.total !== undefined && c.total !== null && Number(c.total) > 0)
          ? Number(c.total)
          : ((pu * qty) + fraisLivraisonChine);
        const fretTransitaire = Number(c.fraisTransport || c.fretEstimeAr) || 0;
        const transportLocal = Number(c.fraisTransportLocal) || 0;
        return s + totalMarchandise + fretTransitaire + transportLocal;
      }, 0);

      const prixMoyenAchat = qtyAchetee > 0 ? totalAchatsEtFret / qtyAchetee : (Number(p.prixAchat) || 0);
      const pVentes = ventesByProduct.get(p.id) || [];
      const qtyVendue = pVentes.reduce((s: number, v: any) => s + (Number(v.qty) || 0), 0);
      const caTotalProduit = pVentes.reduce((s: number, v: any) => {
        const pu = v.pu ?? (p.prixVente || (v.total && v.qty ? v.total / v.qty : 0));
        return s + (Number(pu) * Number(v.qty || 1));
      }, 0);

      const prixMoyenVente = qtyVendue > 0 ? caTotalProduit / qtyVendue : (Number(p.prixVente) || 0);
      const margeUnitaire = prixMoyenVente - prixMoyenAchat;
      const tauxMargePct = prixMoyenAchat > 0 ? (margeUnitaire / prixMoyenAchat) * 100 : 0;

      const pAjustements = [
        ...(ajustementsByProduct.get(p.id) || []),
        ...(p.nom ? (ajustementsByProduct.get(p.nom) || []) : [])
      ];

      let pertesProduitAr = 0;
      let pertesProduitQty = 0;
      pAjustements.forEach((m: any) => {
        const delta = Number(m.delta) || 0;
        if (delta < 0) {
          pertesProduitQty += Math.abs(delta);
          const val = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null && Number(m.valeurTotaleAr) > 0
            ? Number(m.valeurTotaleAr)
            : (Math.abs(delta) * (Number(m.valeurUnitaireAr) || prixMoyenAchat || 0));
          pertesProduitAr += val;
        }
      });

      const beneficeTotal = Math.round((margeUnitaire * qtyVendue) - pertesProduitAr);

      return {
        id: p.id,
        nom: p.nom,
        couleur: p.couleur,
        categorie: p.categorie || 'Autre',
        qtyAchetee,
        qtyVendue,
        pertesProduitQty,
        pertesProduitAr: Math.round(pertesProduitAr),
        prixMoyenAchat: Math.round(prixMoyenAchat),
        prixMoyenVente: Math.round(prixMoyenVente),
        margeUnitaire: Math.round(margeUnitaire),
        tauxMargePct: Number(tauxMargePct.toFixed(1)),
        beneficeTotal,
        caTotalProduit: Math.round(caTotalProduit),
      };
    });
  }, [products, cmdsByProduct, ventes, ajustementsStock]);

  return {
    getProductCostBreakdown,
    caTotal,
    margeTotale,
    capitalInvesti,
    totalAchatsChine,
    totalFret,
    chargesOperationnelles,
    statsPertes,
    totalDepensesGlobales,
    beneficeNet,
    baseInvestissement,
    tauxRoi,
    tauxRecuperation,
    resteARecuperer,
    tresorerieDispo,
    soldeRmbInfo,
    creancesClients,
    dettesFournisseurs,
    enTransit,
    commandesEnTransitList,
    valeurStockLocal,
    stockAlertesList,
    articlesVendusTotal,
    panierMoyen,
    parCategorie,
    parProduit,
    rentabiliteParProduit,
  };
}

