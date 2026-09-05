import React, { useState, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { primaryBtn } from '../ui';
import { COMPTES_FINANCIERS, TAGS_TRANSACTION } from '../constants';
import { getMontantPayeMarchandise, calculerSoldeRMB } from '../paymentUtils';

import ComptesFinanciers from './ComptesFinanciers';
import ModalPaiementFacture from './ModalPaiementFacture';
import ModalMouvementManuel from './ModalMouvementManuel';
import ModalTransfertComptes from './ModalTransfertComptes';
import JournalTransactions from './JournalTransactions';
import ModalDetailTransaction from './ModalDetailTransaction';

import { buildToutesTransactions, supprimerTransaction, calculerSoldeTotalMga } from './tresorerieUtils';
import { useTresorerieForms } from './useTresorerieForms';

interface TresorerieProps {
  ventes: any[];
  commandes: any[];
  products: any[];
  fournisseurs?: any[];
  clients?: any[];
  mouvements: any[];
  changes?: any[];
  devises?: any;
  comptes?: string[];
  paiements?: any[];
  updateData: (patch: any) => void;
}

export default function Tresorerie({
  ventes = [],
  commandes = [],
  products = [],
  fournisseurs = [],
  clients = [],
  mouvements = [],
  changes = [],
  devises,
  comptes,
  paiements = [],
  updateData,
}: TresorerieProps) {
  const activeComptes = (comptes && comptes.length > 0) ? comptes : COMPTES_FINANCIERS;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  // Filtres
  const [filtreType, setFiltreType] = useState<'all' | 'entrée' | 'sortie' | 'investissement'>('all');
  const [filtreDomaine, setFiltreDomaine] = useState<'all' | 'business' | 'perso'>('all');
  const [filtreCompte, setFiltreCompte] = useState<string>('all');
  const [filtreTag, setFiltreTag] = useState<string>('all');

  const today = new Date().toISOString().slice(0, 10);

  const {
    showForm,
    setShowForm,
    showTransfertModal,
    setShowTransfertModal,
    showPaiementFactureModal,
    setShowPaiementFactureModal,
    form,
    setForm,
    transfertForm,
    setTransfertForm,
    factureForm,
    setFactureForm,
    ventesUnpaid,
    commandesUnpaidMarchandise,
    commandesUnpaidFret,
    ouvrirModalRèglementFacture,
    handleNatureChange,
    handleToggleSelectId,
    handleToggleSelectAll,
    enregistrerPaiementFacture,
    imputerPaiementExistant,
    ajouterMouvement,
    executerTransfert,
  } = useTresorerieForms({
    ventes,
    commandes,
    products,
    fournisseurs,
    clients,
    mouvements,
    paiements,
    updateData,
    today,
  });

  // Construction de toutes les transactions de trésorerie
  const toutesTransactions = useMemo(() => {
    return buildToutesTransactions({
      ventes,
      commandes,
      mouvements,
      paiements,
      products,
      fournisseurs,
    });
  }, [ventes, commandes, mouvements, paiements, products, fournisseurs]);

  // Supprimer n'importe quelle transaction
  const handleSupprimerTransaction = (id: string, itemParam?: any) => {
    const item = itemParam || toutesTransactions.find((t: any) => t.id === id);
    if (!item) return;

    supprimerTransaction(item, {
      mouvements,
      paiements,
      ventes,
      commandes,
      updateData,
    });

    if (selectedTransaction && selectedTransaction.id === id) {
      setSelectedTransaction(null);
    }
  };

  // KPIs
  const caBusiness = useMemo(() => {
    return toutesTransactions
      .filter((t: any) =>
        t.type === 'entrée' &&
        !t.isInvestissement &&
        !t.isEmprunt &&
        !t.isTransfert &&
        t.tag !== '#investissement' &&
        t.tag !== '#capital' &&
        t.tag !== '#emprunt' &&
        t.tag !== '#transfert' &&
        t.categorie !== 'transfert' &&
        t.categorie !== 'emprunt' &&
        t.categorie !== 'investissement'
      )
      .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);
  }, [toutesTransactions]);

  const depensesBusiness = useMemo(() => {
    return toutesTransactions
      .filter((t: any) =>
        t.type === 'sortie' &&
        !t.isTransfert &&
        !t.isInvestissement &&
        t.tag !== '#retrait-perso' &&
        t.tag !== '#investissement' &&
        t.tag !== '#capital' &&
        t.tag !== '#remboursement' &&
        t.tag !== '#transfert' &&
        t.categorie !== 'transfert' &&
        t.categorie !== 'remboursement'
      )
      .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);
  }, [toutesTransactions]);

  const resultatBusiness = caBusiness - depensesBusiness;

  const apportsPerso = useMemo(() => {
    return toutesTransactions
      .filter((t: any) => t.isInvestissement || t.tag === '#investissement' || t.tag === '#capital' || t.tag === '#apport')
      .reduce((s: number, t: any) => s + (Number(t.montant) || 0), 0);
  }, [toutesTransactions]);

  const prelevementsPerso = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'sortie' && (m.tag === '#retrait-perso' || m.tag === '#prelevement-perso' || m.natureOp === 'retrait_perso'))
      .reduce((s: number, m: any) => s + (Number(m.montant) || 0), 0);
  }, [mouvements]);

  // Réserve RMB (Yuan)
  const statsRmb = useMemo(() => {
    return calculerSoldeRMB(changes, mouvements, commandes, devises, paiements);
  }, [changes, mouvements, commandes, devises, paiements]);

  const soldesParCompte = useMemo(() => {
    const res: Record<string, number> = {};
    activeComptes.forEach(compte => { res[compte] = 0; });

    toutesTransactions.forEach(t => {
      const c = t.compte || 'Caisse / Espèces';
      if (res[c] === undefined) res[c] = 0;
      if (t.type === 'entrée') {
        res[c] += Number(t.montant) || 0;
      } else {
        res[c] -= Number(t.montant) || 0;
      }
    });

    return res;
  }, [toutesTransactions, activeComptes]);

  const soldeGlobal = useMemo(() => {
    return calculerSoldeTotalMga(soldesParCompte);
  }, [soldesParCompte]);

  const tagsDisponibles = useMemo(() => {
    const set = new Set<string>(TAGS_TRANSACTION);
    toutesTransactions.forEach(t => {
      if (t.tag) set.add(t.tag);
    });
    return Array.from(set);
  }, [toutesTransactions]);

  const transactionsFiltrees = useMemo(() => {
    return toutesTransactions.filter(item => {
      const isPerso = item.isInvestissement || item.tag === '#retrait-perso' || item.tag === '#investissement' || item.tag === '#capital';
      const isTrans = item.isTransfert || item.tag === '#transfert' || item.categorie === 'transfert';

      if (filtreDomaine === 'business' && (isPerso || isTrans)) return false;
      if (filtreDomaine === 'perso' && !isPerso) return false;

      if (filtreType === 'entrée' && item.type !== 'entrée') return false;
      if (filtreType === 'sortie' && item.type !== 'sortie') return false;
      if (filtreType === 'investissement' && !isPerso) return false;

      if (filtreCompte !== 'all' && item.compte !== filtreCompte) return false;
      if (filtreTag !== 'all' && item.tag !== filtreTag) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(q);
        const refMatch = item.reference?.toLowerCase().includes(q);
        const tagMatch = item.tag?.toLowerCase().includes(q);
        const compteMatch = item.compte?.toLowerCase().includes(q);
        const numMatch = item.numSeq ? (
          String(item.numSeq).includes(q) ||
          `n°${item.numSeq}`.includes(q) ||
          `n° ${item.numSeq}`.includes(q) ||
          `#${item.numSeq}`.includes(q)
        ) : false;
        if (!descMatch && !refMatch && !tagMatch && !compteMatch && !numMatch) return false;
      }

      return true;
    });
  }, [toutesTransactions, filtreDomaine, filtreType, filtreCompte, filtreTag, searchQuery]);

  return (
    <div>
      {/* Soldes par Compte & Synthèse Trésorerie */}
      <ComptesFinanciers
        soldesParCompte={soldesParCompte}
        soldeGlobal={soldeGlobal}
        filtreCompte={filtreCompte}
        setFiltreCompte={setFiltreCompte}
        onOpenTransfert={() => setShowTransfertModal(true)}
        soldeRmb={statsRmb.soldeRmbDispo}
        valeurRmbAr={statsRmb.valeurRmbAr}
        comptes={activeComptes}
        updateData={updateData}
      />

      {/* Boutons d'action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#26333D' }}>
          Journal des Transactions ({toutesTransactions.length})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={ouvrirModalRèglementFacture}
            style={{
              ...primaryBtn,
              background: '#3D5A6C',
              height: 36,
              padding: '0 12px',
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Receipt size={15} />
            + Régler une Facture (Achat / Fret)
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            style={{
              ...primaryBtn,
              height: 36,
              padding: '0 12px',
              fontSize: 12.5,
            }}
          >
            {showForm ? 'Fermer la saisie' : '+ Entrée / Sortie / Investissement'}
          </button>
        </div>
      </div>

      {/* Formulaire Manuel */}
      {showForm && (
        <ModalMouvementManuel
          form={form}
          setForm={setForm}
          ajouterMouvement={ajouterMouvement}
          today={today}
          comptes={activeComptes}
          soldesParCompte={soldesParCompte}
          soldeRmbInfo={statsRmb}
        />
      )}

      {/* Modal Règlement Facture */}
      <ModalPaiementFacture
        show={showPaiementFactureModal}
        onClose={() => setShowPaiementFactureModal(false)}
        factureForm={factureForm}
        setFactureForm={setFactureForm}
        handleNatureChange={handleNatureChange}
        handleToggleSelectId={handleToggleSelectId}
        handleToggleSelectAll={handleToggleSelectAll}
        enregistrerPaiementFacture={enregistrerPaiementFacture}
        ventesUnpaid={ventesUnpaid}
        commandesUnpaidMarchandise={commandesUnpaidMarchandise}
        commandesUnpaidFret={commandesUnpaidFret}
        products={products}
        clients={clients}
        fournisseurs={fournisseurs}
        paiements={paiements}
        today={today}
        comptes={activeComptes}
        soldesParCompte={soldesParCompte}
        soldeRmbInfo={statsRmb}
      />

      {/* Modal Transfert Inter-Comptes */}
      <ModalTransfertComptes
        show={showTransfertModal}
        onClose={() => setShowTransfertModal(false)}
        transfertForm={transfertForm}
        setTransfertForm={setTransfertForm}
        executerTransfert={executerTransfert}
        soldesParCompte={soldesParCompte}
        comptes={activeComptes}
      />

      {/* Journal & Filtres */}
      <JournalTransactions
        transactionsFiltrees={transactionsFiltrees}
        toutesTransactions={toutesTransactions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtreDomaine={filtreDomaine}
        setFiltreDomaine={setFiltreDomaine}
        filtreType={filtreType}
        setFiltreType={setFiltreType}
        filtreCompte={filtreCompte}
        setFiltreCompte={setFiltreCompte}
        filtreTag={filtreTag}
        setFiltreTag={setFiltreTag}
        tagsDisponibles={tagsDisponibles}
        supprimerMouvement={handleSupprimerTransaction}
        comptes={activeComptes}
        onSelectTransaction={setSelectedTransaction}
      />

      {/* Modal Détail Transaction */}
      <ModalDetailTransaction
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        ventes={ventes}
        commandes={commandes}
        products={products}
        clients={clients}
        fournisseurs={fournisseurs}
        paiements={paiements}
        supprimerMouvement={handleSupprimerTransaction}
        imputerPaiementExistant={imputerPaiementExistant}
      />
    </div>
  );
}
