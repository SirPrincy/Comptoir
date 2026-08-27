
import React, {  useState, useMemo , memo } from 'react';
import { Trash2, DollarSign, Clock, CheckCircle2, AlertCircle, Coins, Plus, ShoppingCart, Package, Compass } from 'lucide-react';
import { THEME } from '../colors';
import { SOURCES, STATUTS_LOGISTIQUE, uid } from '../constants';
import { SectionHeader, Card, Field, Modal, Empty, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn } from '../ui';
import { calculerScoreFournisseur, getQCBadgeInfo } from '../qcUtils';
import { getMontantPayeMarchandise, getRestePayeMarchandise, getStatutMarchandiseLabel, calculerSoldeRMB } from '../paymentUtils';
import RecommandationTransitaire from './RecommandationTransitaire';
import AchatFormModal from './components/AchatFormModal';
import AchatPaiementModal from './components/AchatPaiementModal';
import AchatListe from './components/AchatListe';

const Achat = memo(function Achat({
  products = [],
  commandes = [],
  ventes = [],
  fournisseurs = [],
  devises = { rmb: 680, usd: 4600 },
  changes = [],
  mouvements = [],
  sourcing = [],
  paiements = [],
  updateAll,
  updateData,
  onNavigateTab,
  initialSearch = '',
  comptes = [],
}: any) {
  // Safe array guards against null/undefined props
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCommandes = Array.isArray(commandes) ? commandes : [];
  const safeVentes = Array.isArray(ventes) ? ventes : [];
  const safeFournisseurs = Array.isArray(fournisseurs) ? fournisseurs : [];
  const safeChanges = Array.isArray(changes) ? changes : [];
  const safeMouvements = Array.isArray(mouvements) ? mouvements : [];
  const safeSourcing = Array.isArray(sourcing) ? sourcing : [];
  const safePaiements = Array.isArray(paiements) ? paiements : [];

  const [showCmd, setShowCmd] = useState(false);
  const [subTab, setSubTab] = useState<'attente' | 'historique'>('attente');
  const [searchHistory, setSearchHistory] = useState(initialSearch);

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchHistory(initialSearch);
      if (initialSearch) {
        setSubTab('historique');
      }
    }
  }, [initialSearch]);

  // Saisie rapide d'un produit s'il n'y en a pas en stock
  const [showQuickProductForm, setShowQuickProductForm] = useState(false);
  const [quickProduct, setQuickProduct] = useState({
    nom: '',
    couleur: '',
    puRmb: '',
    prixAchatAr: '',
    prixVenteAr: '',
  });
  const today = new Date().toISOString().split('T')[0];
  const [paiementCommande, setPaiementCommande] = useState<any | null>(null);
  const [typePaiement, setTypePaiement] = useState<'total' | 'acompte'>('total');
  const [montantSaisiPaiement, setMontantSaisiPaiement] = useState('');
  const [datePaiementChoisie, setDatePaiementChoisie] = useState(today);

  const soldeRmbInfo = useMemo(() => {
    return calculerSoldeRMB(safeChanges, safeMouvements, safeCommandes, devises, safePaiements);
  }, [safeChanges, safeMouvements, safeCommandes, devises, safePaiements]);


  const supprimerCommande = (id: string) => updateAll(safeProducts, safeVentes, safeCommandes.filter((c: any) => c.id !== id));

  // Commandes avec solde restant à payer (non payées ou avec acompte partiel)
  const commandesAvecSolde = safeCommandes.filter((c: any) => {
    const reste = getRestePayeMarchandise(c, safePaiements);
    return reste > 0 || c.statut === 'Commandé';
  }).sort((a: any, b: any) => new Date(b.dateAchat || 0).getTime() - new Date(a.dateAchat || 0).getTime());

  const soldeTotalRestantDu = commandesAvecSolde.reduce((acc, c) => acc + getRestePayeMarchandise(c, safePaiements), 0);
  const dejaPayeesTotal = safeCommandes.filter((c: any) => getRestePayeMarchandise(c, safePaiements) <= 0 && STATUTS_LOGISTIQUE.includes(c.statut)).length;

  return (
    <div>
      <SectionHeader title="Achats & Avances Fournisseurs" action={() => setShowCmd(true)} actionLabel="+ Achat" />

      {/* Bandeau supérieur récapitulatif Réserve RMB & Achats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={14} color={THEME.accent.orange} />
            <span>RÉSERVE RMB DISPONIBLE</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: soldeRmbInfo.soldeRmbDispo > 0 ? THEME.accent.green : THEME.accent.danger, marginTop: 4 }}>
            {soldeRmbInfo.soldeRmbDispo.toLocaleString('fr-FR')} ¥
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            {soldeRmbInfo.soldeRmbDispo > 0
              ? `~ ${Math.round(soldeRmbInfo.soldeRmbDispo * (soldeRmbInfo.tauxMoyenAchatRmb || devises?.rmb || 680)).toLocaleString('fr-FR')} Ar (Taux : ${soldeRmbInfo.tauxMoyenAchatRmb || devises?.rmb || 680} Ar/¥)`
              : 'Solde épuisé. Rechargez via l\'onglet Change RMB.'}
          </div>
        </div>

        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={THEME.accent.orange} />
            <span>SOLDE RESTANT DÛ FOURNISSEURS</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: soldeTotalRestantDu > 0 ? THEME.accent.danger : THEME.accent.green, marginTop: 4 }}>
            {soldeTotalRestantDu.toLocaleString('fr-FR')} Ar
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            {commandesAvecSolde.length} commande{commandesAvecSolde.length > 1 ? 's' : ''} non soldée{commandesAvecSolde.length > 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.text.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={14} color={THEME.accent.primary} />
            <span>TOTAL COMMANDES D'ACHAT</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text.primary, marginTop: 4 }}>
            {safeCommandes.length}
          </div>
          <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
            {dejaPayeesTotal} entièrement réglée{dejaPayeesTotal > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      <AchatFormModal
        showCmd={showCmd}
        setShowCmd={setShowCmd}
        products={safeProducts}
        fournisseurs={safeFournisseurs}
        commandes={safeCommandes}
        ventes={safeVentes}
        devises={devises}
        soldeRmbInfo={soldeRmbInfo}
        sourcing={safeSourcing}
        updateAll={updateAll}
        today={today}
        onNavigateTab={onNavigateTab}
      />
      {/* Onglets de sous-navigation Achat */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, borderBottom: `1px solid ${THEME.border.base}`, paddingBottom: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSubTab('attente')}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: subTab === 'attente' ? THEME.accent.primary : THEME.bg.soft,
              color: subTab === 'attente' ? THEME.text.light : THEME.text.secondary,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>Solde & À Payer ({commandesAvecSolde.length})</span>
          </button>
          <button
            onClick={() => setSubTab('historique')}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: subTab === 'historique' ? THEME.accent.primary : THEME.bg.soft,
              color: subTab === 'historique' ? THEME.text.light : THEME.text.secondary,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>Historique de tous les achats ({safeCommandes.length})</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('logistique')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px dashed ${THEME.accent.orange}66`,
                background: `${THEME.accent.orange}12`,
                color: THEME.accent.orange,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Passer au suivi logistique des colis"
            >
              <span>🚚 Suivi Logistique</span>
            </button>
          )}
        </div>
        {subTab === 'historique' && (
          <input
            style={{ ...inputStyle, height: 32, fontSize: 12, width: 220 } as any}
            placeholder="🔍 Filtrer l'historique…"
            value={searchHistory}
            onChange={e => setSearchHistory(e.target.value)}
          />
        )}
      </div>

      <AchatListe 
        commandes={subTab === 'attente' ? commandesAvecSolde : safeCommandes} 
        products={safeProducts}
        fournisseurs={safeFournisseurs}
        searchHistory={searchHistory}
        ouvrirModalPaiement={setPaiementCommande}
        supprimerCommande={supprimerCommande}
        onNavigateTab={onNavigateTab}
        paiements={safePaiements}
      />

      <AchatPaiementModal
        paiementCommande={paiementCommande}
        setPaiementCommande={setPaiementCommande}
        typePaiement={typePaiement}
        setTypePaiement={setTypePaiement}
        montantSaisiPaiement={montantSaisiPaiement}
        setMontantSaisiPaiement={setMontantSaisiPaiement}
        datePaiementChoisie={datePaiementChoisie}
        setDatePaiementChoisie={setDatePaiementChoisie}
        products={safeProducts}
        commandes={safeCommandes}
        ventes={safeVentes}
        soldeRmbInfo={soldeRmbInfo}
        devises={devises}
        today={today}
        updateAll={updateAll}
        updateData={updateData}
        paiements={safePaiements}
        changes={safeChanges}
        comptes={comptes}
        mouvements={safeMouvements}
        fournisseurs={safeFournisseurs}
      />
    </div>
  );
});

export default Achat;
