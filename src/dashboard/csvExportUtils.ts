/**
 * Utilitaires d'exportation CSV optimisés pour Microsoft Excel et tableurs
 * Encode en UTF-8 avec BOM (\uFEFF) et séparateur point-virgule (;) pour affichage direct dans Excel
 */

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Si la chaîne contient des points-virgules, retours à la ligne ou guillemets, on échappe avec des guillemets
  if (str.includes(';') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, csvContent: string) {
  // UTF-8 BOM pour qu'Excel reconnaisse immédiatement les accents et caractères spéciaux
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Export CSV des Ventes
 */
export function exportVentesCsv(data: {
  ventes: any[];
  products?: any[];
  clients?: any[];
}) {
  const { ventes = [], products = [], clients = [] } = data;

  const productMap = new Map<string, any>();
  products.forEach(p => { if (p && p.id) productMap.set(p.id, p); });

  const clientMap = new Map<string, any>();
  clients.forEach(c => { if (c && c.id) clientMap.set(c.id, c); });

  const headers = [
    'Date',
    'Référence',
    'Article / Produit',
    'Catégorie',
    'Client',
    'Quantité',
    'Prix Unitaire (Ar)',
    'Frais de Livraison (Ar)',
    'Total (Ar)',
    'Montant Encaissé (Ar)',
    'Reste à Payer (Ar)',
    'Mode de Paiement',
    'Statut Paiement',
    'Notes',
  ];

  const rows = ventes.map(v => {
    const prod = v.productId ? productMap.get(v.productId) : null;
    const client = v.clientId ? clientMap.get(v.clientId) : null;
    const qty = Number(v.qty) || 1;
    const pu = Number(v.pu) || 0;
    const fraisLivraison = Number(v.fraisLivraison) || 0;
    const total = Number(v.total) || ((pu * qty) + fraisLivraison);
    const paye = Number(v.montantPaye) || (v.paye ? total : 0);
    const reste = Math.max(0, total - paye);

    const clientNom = v.clientNom || (client ? client.nom : 'Comptoir / Anonyme');
    const prodNom = prod ? prod.nom : (v.productNom || v.ref || 'Article divers');
    const categorie = prod ? (prod.categorie || 'Général') : 'Général';

    let statutPaiement = 'Non payé';
    if (paye >= total && total > 0) {
      statutPaiement = 'Payé';
    } else if (paye > 0) {
      statutPaiement = 'Partiel';
    }

    return [
      escapeCsvCell(v.date || ''),
      escapeCsvCell(v.ref || v.id || ''),
      escapeCsvCell(prodNom),
      escapeCsvCell(categorie),
      escapeCsvCell(clientNom),
      escapeCsvCell(qty),
      escapeCsvCell(pu),
      escapeCsvCell(fraisLivraison),
      escapeCsvCell(total),
      escapeCsvCell(paye),
      escapeCsvCell(reste),
      escapeCsvCell(v.modePaiement || 'Espèces'),
      escapeCsvCell(statutPaiement),
      escapeCsvCell(v.notes || v.description || ''),
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`ventes_${dateStr}.csv`, csv);
}

/**
 * 2. Export CSV des Achats & Commandes
 */
export function exportAchatsCsv(data: {
  commandes: any[];
  products?: any[];
  fournisseurs?: any[];
}) {
  const { commandes = [], products = [], fournisseurs = [] } = data;

  const productMap = new Map<string, any>();
  products.forEach(p => { if (p && p.id) productMap.set(p.id, p); });

  const fournisseurMap = new Map<string, any>();
  fournisseurs.forEach(f => { if (f && f.id) fournisseurMap.set(f.id, f); });

  const headers = [
    'Date',
    'Référence',
    'Article / Produit',
    'Fournisseur',
    'Quantité',
    'Prix Unitaire RMB (¥)',
    'Prix Unitaire Ar',
    'Frais Expédition Chine (Ar)',
    'Total Marchandise (Ar)',
    'Fret Transitaire (Ar)',
    'Transport Transitaire->Entrepôt (Ar)',
    'Prix Revient Unitaire PRU (Ar)',
    'Payé Marchandise (Ar)',
    'Payé Fret (Ar)',
    'Reste Dû Total (Ar)',
    'Statut Logistique',
    'N° Suivi',
  ];

  const rows = commandes.map(c => {
    const prod = c.productId ? productMap.get(c.productId) : null;
    const fourn = c.fournisseurId ? fournisseurMap.get(c.fournisseurId) : null;
    const qty = Number(c.qty) || 1;
    const pu = Number(c.pu) || 0;
    const puRmb = Number(c.puRmb || c.puDevise) || 0;
    const fraisLivraison = Number(c.fraisLivraisonChine || c.fraisLivraison) || 0;
    const totalMarchandise = Number(c.total) || ((pu * qty) + fraisLivraison);
    const fretTransitaire = Number(c.fraisTransport || c.fretEstimeAr) || 0;
    const transportLocal = Number(c.fraisTransportLocal) || 0;
    const totalGlobal = totalMarchandise + fretTransitaire + transportLocal;
    const pru = Math.round(totalGlobal / qty);

    const payeMarch = Number(c.montantPayeMarchandise || c.montantPaye || 0);
    const payeFret = Number(c.montantPayeFret || 0);
    const payeTotal = payeMarch + payeFret;
    const resteDu = Math.max(0, totalGlobal - payeTotal);

    const prodNom = prod ? prod.nom : (c.productNom || c.ref || 'Article importé');
    const fournNom = fourn ? fourn.nom : (c.fournisseurNom || 'Non spécifié');

    return [
      escapeCsvCell(c.date || c.dateAchat || ''),
      escapeCsvCell(c.ref || c.id || ''),
      escapeCsvCell(prodNom),
      escapeCsvCell(fournNom),
      escapeCsvCell(qty),
      escapeCsvCell(puRmb),
      escapeCsvCell(pu),
      escapeCsvCell(fraisLivraison),
      escapeCsvCell(totalMarchandise),
      escapeCsvCell(fretTransitaire),
      escapeCsvCell(transportLocal),
      escapeCsvCell(pru),
      escapeCsvCell(payeMarch),
      escapeCsvCell(payeFret),
      escapeCsvCell(resteDu),
      escapeCsvCell(c.statut || 'En cours'),
      escapeCsvCell(c.tracking || c.numeroSuivi || ''),
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`achats_commandes_${dateStr}.csv`, csv);
}

/**
 * 3. Export CSV de la Trésorerie & Mouvements
 */
export function exportTresorerieCsv(data: {
  mouvements: any[];
  ventes?: any[];
  commandes?: any[];
}) {
  const { mouvements = [], ventes = [], commandes = [] } = data;

  // Création du journal complet des flux
  const fluxList: any[] = [];

  // Mouvements manuels
  mouvements.forEach(m => {
    fluxList.push({
      date: m.date || '',
      description: m.description || m.libelle || 'Mouvement trésorerie',
      reference: m.reference || m.id || '',
      type: m.type || 'sortie',
      montant: Number(m.montant) || 0,
      compte: m.compte || 'Caisse Principale',
      mode: m.modePaiement || 'Espèces',
      categorie: m.categorie || 'Opérationnel',
    });
  });

  // Ventes avec encaissements directs
  ventes.forEach(v => {
    const paye = Number(v.montantPaye) || (v.paye ? (Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1))) : 0);
    if (paye > 0 && !mouvements.some(m => m.venteId === v.id || m.reference === v.ref)) {
      fluxList.push({
        date: v.date || '',
        description: `Vente comptoir : ${v.ref || 'Sans réf'}`,
        reference: v.ref || v.id || '',
        type: 'entrée',
        montant: paye,
        compte: v.compte || 'Caisse Principale',
        mode: v.modePaiement || 'Espèces',
        categorie: 'Vente Marchandises',
      });
    }
  });

  // Règlements commandes achats
  commandes.forEach(c => {
    const paye = Number(c.montantPayeMarchandise || c.montantPaye || 0) + Number(c.montantPayeFret || 0);
    if (paye > 0 && !mouvements.some(m => m.commandeId === c.id || m.reference === c.ref)) {
      fluxList.push({
        date: c.date || '',
        description: `Règlement Achat : ${c.ref || 'Commande'}`,
        reference: c.ref || c.id || '',
        type: 'sortie',
        montant: paye,
        compte: c.compte || 'Banque / Mobile Money',
        mode: 'Virement / Mobile',
        categorie: 'Achat Marchandises & Fret',
      });
    }
  });

  // Tri par date décroissante
  fluxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const headers = [
    'Date',
    'Description / Libellé',
    'Référence',
    'Sens du Flux',
    'Montant (Ar)',
    'Compte Financier',
    'Mode de Paiement',
    'Catégorie',
  ];

  const rows = fluxList.map(f => {
    const typeLabel = f.type === 'entrée' || f.type === 'entree' ? 'Entrée (+)' : f.type === 'investissement' ? 'Investissement (+)' : 'Sortie (-)';
    return [
      escapeCsvCell(f.date),
      escapeCsvCell(f.description),
      escapeCsvCell(f.reference),
      escapeCsvCell(typeLabel),
      escapeCsvCell(f.montant),
      escapeCsvCell(f.compte),
      escapeCsvCell(f.mode),
      escapeCsvCell(f.categorie),
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`tresorerie_mouvements_${dateStr}.csv`, csv);
}

/**
 * 4. Exporte l'ensemble complet (Ventes + Achats + Trésorerie)
 */
export function exportAllDataCsv(data: {
  ventes: any[];
  commandes: any[];
  mouvements: any[];
  products?: any[];
  clients?: any[];
  fournisseurs?: any[];
}) {
  exportVentesCsv({
    ventes: data.ventes,
    products: data.products,
    clients: data.clients,
  });

  // Petit décalage pour permettre aux téléchargements de se déclencher sans être bloqués par le navigateur
  setTimeout(() => {
    exportAchatsCsv({
      commandes: data.commandes,
      products: data.products,
      fournisseurs: data.fournisseurs,
    });
  }, 300);

  setTimeout(() => {
    exportTresorerieCsv({
      mouvements: data.mouvements,
      ventes: data.ventes,
      commandes: data.commandes,
    });
  }, 600);
}
