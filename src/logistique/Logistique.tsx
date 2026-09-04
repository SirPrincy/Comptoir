/**
 * Composant Logistique (Suivi de Colis façon Assistant / Installation pas-à-pas en 5 Étapes)
 * Étape 1 : Expédition Fournisseur · 2 : Réception Entrepôt Chine · 3 : Fret International
 * Étape 4 : Arrivée Madagascar & Validation · 5 : Contrôle Qualité (QC) & Entrée en Stock
 *
 * Ce fichier n'orchestre plus que la liste + les KPI + l'ouverture du wizard.
 * Toute la logique de chaque étape vit dans ./steps/, le wizard lui-même dans
 * ./ColisWizardModal.tsx, et les calculs purs dans ./logistiqueUtils.ts.
 */
import React, {  useState, useMemo , memo } from 'react';
import { Search } from 'lucide-react';
import { Empty, inputStyle } from '../ui';
import { STATUTS_LOGISTIQUE } from '../constants';
import LogistiqueStats from './LogistiqueStats';
import ColisRow from './ColisRow';
import ColisWizardModal from './ColisWizardModal';
import AchatEditModal from '../achat/components/AchatEditModal';

interface LogistiqueProps {
  products: any[];
  commandes: any[];
  ventes: any[];
  fournisseurs?: any[];
  devises?: { rmb: number | string; usd: number | string };
  updateAll: (products: any[], ventes: any[], commandes: any[]) => void;
  updateData?: (data: any) => void;
  paiements?: any[];
  onNavigateTab?: (tab: string) => void;
}

const Logistique = memo(function Logistique({
  products = [], commandes = [], ventes = [], fournisseurs = [],
  devises = { rmb: 680, usd: 4600 }, updateAll, updateData, paiements = [], onNavigateTab,
}: LogistiqueProps) {
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | undefined>(undefined);
  const [editingCommande, setEditingCommande] = useState<any | null>(null);
  const [recherche, setRecherche] = useState('');
  // Par défaut, masquer les colis terminés/en stock pour ne garder que le flux actif
  const [filtreStatut, setFiltreStatut] = useState<string>('en-cours');
  // Option d'archivage automatique des colis arrivés & contrôlés en stock
  const [autoArchiveArrives, setAutoArchiveArrives] = useState<boolean>(true);

  const tauxUsd = Number(devises?.usd) || 4600;
  const today = new Date().toISOString().slice(0, 10);

  const updateCommandeField = (id: string, fields: Record<string, any>) => {
    updateAll(products, ventes, commandes.map((c: any) => (c.id === id ? { ...c, ...fields } : c)));
  };

  const handleOuvrir = (id: string, step?: number) => {
    setSelectedCommandeId(id);
    setSelectedStep(step);
  };

  const handleCloseWizard = () => {
    setSelectedCommandeId(null);
    setSelectedStep(undefined);
  };

  const commandesLogistique = useMemo(() => {
    return [...commandes]
      .filter((c: any) => STATUTS_LOGISTIQUE.includes(c.statut) || c.statut === 'Payé' || c.qualityCheck)
      .sort((a, b) => {
        const tA = new Date(a.datePaiement || a.dateAchat || 0).getTime();
        const tB = new Date(b.datePaiement || b.dateAchat || 0).getTime();
        return tB - tA;
      });
  }, [commandes]);

  const stats = useMemo(() => {
    const total = commandesLogistique.length;
    const termines = commandesLogistique.filter((c: any) => c.statut === 'Arrivé' && c.qualityCheck?.isCompleted).length;
    const qcAfaire = commandesLogistique.filter((c: any) => c.statut === 'Arrivé' && !c.qualityCheck?.isCompleted).length;
    const enLivraison = commandesLogistique.filter((c: any) => c.statut === 'En livraison' || c.statut === 'En attente' || c.statut === 'Payé').length;
    const enEntrepot = commandesLogistique.filter((c: any) => c.statut === 'En entrepôt').length;
    const enExpedition = commandesLogistique.filter((c: any) => c.statut === 'En expédition').length;
    const enCours = total - termines;
    return { total, enCours, termines, qcAfaire, enLivraison, enEntrepot, enExpedition };
  }, [commandesLogistique]);

  const colisFiltres = useMemo(() => {
    return commandesLogistique.filter((c: any) => {
      const isTermine = c.statut === 'Arrivé' && c.qualityCheck?.isCompleted;
      const isQcPending = c.statut === 'Arrivé' && !c.qualityCheck?.isCompleted;

      if (filtreStatut === 'en-cours') {
        if (autoArchiveArrives && isTermine) return false;
      } else if (filtreStatut === 'qc-pending') {
        if (!isQcPending) return false;
      } else if (filtreStatut === 'completed' || filtreStatut === 'termine') {
        if (!isTermine) return false;
      } else if (filtreStatut === 'En livraison') {
        if (c.statut !== 'En livraison' && c.statut !== 'En attente' && c.statut !== 'Payé') return false;
      } else if (filtreStatut !== 'all') {
        if (c.statut !== filtreStatut) return false;
      }

      if (!recherche.trim()) return true;
      const q = recherche.toLowerCase();
      const p = products.find((pr: any) => pr.id === c.productId);
      const f = fournisseurs.find((fr: any) => fr.id === c.fournisseurId);
      const trans = fournisseurs.find((fr: any) => fr.id === c.transitaireId);
      const nomP = p ? p.nom.toLowerCase() : '';
      const nomF = f ? f.nom.toLowerCase() : '';
      const nomTrans = trans ? trans.nom.toLowerCase() : '';
      const track = (c.tracking || '').toLowerCase();
      const src = (c.source || '').toLowerCase();
      return nomP.includes(q) || nomF.includes(q) || nomTrans.includes(q) || track.includes(q) || src.includes(q);
    });
  }, [commandesLogistique, filtreStatut, recherche, autoArchiveArrives, products, fournisseurs]);

  const selectedCommande = useMemo(() => {
    if (!selectedCommandeId) return null;
    return commandes.find((c: any) => c.id === selectedCommandeId) || null;
  }, [selectedCommandeId, commandes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* En-tête avec Recherche et Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#26333D', margin: 0 }}>
            Logistique & Suivi Colis ({commandesLogistique.length})
          </h2>
          <p style={{ fontSize: 12, color: '#8A8375', margin: '2px 0 0 0' }}>
            Suivi des expéditions Chine ➔ Madagascar et contrôle qualité (QC)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('achat')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#3D5A6C',
                background: '#FAF7F2',
                border: '1px solid #D8D0C0',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              title="Aller au module Achats"
            >
              <span>🛒 Module Achats</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('vente')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#3F7A5C',
                background: '#E9F2EC',
                border: '1px solid #D1E5D9',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
              title="Aller au module de Ventes"
            >
              <span>🛒 Module Ventes</span>
            </button>
          )}

          {commandesLogistique.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#8A8375' }} />
              <input
                type="text" placeholder="Rechercher colis..."
                value={recherche} onChange={e => setRecherche(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28, height: 32, fontSize: 12 } as any}
              />
            </div>
          )}
        </div>
      </div>

      <LogistiqueStats stats={stats} filtreStatut={filtreStatut} setFiltreStatut={setFiltreStatut} />

      {/* Barre d'Onglets de Navigation (En cours vs QC vs Historique/Stock) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE2D4] pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFiltreStatut('en-cours')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              filtreStatut === 'en-cours'
                ? 'bg-[#3D5A6C] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#5A636A] hover:bg-[#EFE8DC] border border-[#EAE2D4]'
            }`}
          >
            <span>📦 En cours d'expédition</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filtreStatut === 'en-cours' ? 'bg-white/20 text-white' : 'bg-[#EAE2D4] text-[#3D5A6C]'}`}>
              {stats.enCours}
            </span>
          </button>

          <button
            onClick={() => setFiltreStatut('qc-pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              filtreStatut === 'qc-pending'
                ? 'bg-[#C24A3F] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#5A636A] hover:bg-[#EFE8DC] border border-[#EAE2D4]'
            }`}
          >
            <span>🔍 QC & À Valider</span>
            {stats.qcAfaire > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filtreStatut === 'qc-pending' ? 'bg-white/20 text-white' : 'bg-[#FADBD8] text-[#C24A3F]'}`}>
                {stats.qcAfaire}
              </span>
            )}
          </button>

          <button
            onClick={() => setFiltreStatut('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              filtreStatut === 'completed' || filtreStatut === 'termine'
                ? 'bg-[#3F7A5C] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#5A636A] hover:bg-[#EFE8DC] border border-[#EAE2D4]'
            }`}
          >
            <span>✅ Entrés en Stock</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filtreStatut === 'completed' || filtreStatut === 'termine' ? 'bg-white/20 text-white' : 'bg-[#D1E5D9] text-[#3F7A5C]'}`}>
              {stats.termines}
            </span>
          </button>

          <button
            onClick={() => setFiltreStatut('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              filtreStatut === 'all'
                ? 'bg-[#26333D] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#5A636A] hover:bg-[#EFE8DC] border border-[#EAE2D4]'
            }`}
          >
            <span>📋 Tous les colis</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filtreStatut === 'all' ? 'bg-white/20 text-white' : 'bg-[#EAE2D4] text-[#26333D]'}`}>
              {stats.total}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Option d'Archivage Auto */}
          <button
            onClick={() => setAutoArchiveArrives(!autoArchiveArrives)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              autoArchiveArrives
                ? 'bg-[#EBF4EC] text-[#2C5E43] border-[#C4DEC0]'
                : 'bg-[#FAF7F2] text-[#8A8375] border-[#EAE2D4] hover:bg-[#EFE8DC]'
            }`}
            title="Masquer automatiquement du suivi actif les colis contrôlés et entrés en stock"
          >
            <span className={`w-2 h-2 rounded-full ${autoArchiveArrives ? 'bg-[#3F7A5C]' : 'bg-[#C5BEB0]'}`}></span>
            <span>⚡ Archivage auto 'Arrivés' : <strong>{autoArchiveArrives ? 'Activé' : 'Désactivé'}</strong></span>
          </button>

          {/* Indicateur de filtre par étape spécifique (ex: En livraison, En entrepôt) */}
          {!['en-cours', 'qc-pending', 'completed', 'termine', 'all'].includes(filtreStatut) && (
            <div className="flex items-center gap-1.5 bg-[#FAF3E8] border border-[#E2D5BE] text-[#915B12] px-2.5 py-1 rounded-md text-xs font-medium">
              <span>Filtre étape : <strong>{filtreStatut}</strong> ({colisFiltres.length})</span>
              <button
                onClick={() => setFiltreStatut('en-cours')}
                className="ml-1 text-[11px] underline hover:text-[#523204] cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bannière explicative lorsque la vue Historique / Entrés en stock est sélectionnée */}
      {(filtreStatut === 'completed' || filtreStatut === 'termine') && stats.termines > 0 && (
        <div className="bg-[#F4F9F5] border border-[#D1E5D9] rounded-lg p-2.5 text-xs text-[#2C5E43] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span>📂</span>
            <span>
              <strong>Vue Historique & Archives :</strong> Les <strong>{stats.termines} colis</strong> ci-dessous ont été automatiquement transférés dans l'historique après validation du contrôle qualité (QC) pour garder votre écran de suivi actif fluide.
            </span>
          </div>
          <button
            onClick={() => setAutoArchiveArrives(!autoArchiveArrives)}
            className="text-[11px] text-[#3D5A6C] underline hover:text-[#1B2930] whitespace-nowrap cursor-pointer font-semibold"
          >
            {autoArchiveArrives ? "Désactiver l'archivage auto" : "Activer l'archivage auto"}
          </button>
        </div>
      )}

      {commandesLogistique.length === 0 ? (
        <Empty text="Aucun colis en transit. Dès qu'un achat est validé et payé dans l'onglet « Achat », il apparaîtra ici pour le suivi." />
      ) : colisFiltres.length === 0 ? (
        <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 10, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {filtreStatut === 'en-cours' ? '🎉' : '🔍'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#26333D', marginBottom: 4 }}>
            {filtreStatut === 'en-cours'
              ? "Aucun colis en cours de transit"
              : filtreStatut === 'qc-pending'
              ? "Aucun colis en attente de contrôle qualité"
              : filtreStatut === 'completed'
              ? "Aucun colis encore archivé en stock"
              : "Aucun résultat pour cette recherche"}
          </div>
          <div style={{ fontSize: 12, color: '#8A8375', marginBottom: 12 }}>
            {filtreStatut === 'en-cours' && stats.termines > 0
              ? `Tous vos colis (${stats.termines}) sont déjà arrivés à destination et sont entrés en stock.`
              : "Ajustez vos filtres pour voir les autres colis."}
          </div>
          {stats.termines > 0 && filtreStatut === 'en-cours' && (
            <button
              onClick={() => setFiltreStatut('completed')}
              style={{
                background: '#3F7A5C', color: '#FFF', border: 'none', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Consulter l'historique en stock ({stats.termines})
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {colisFiltres.map((c: any) => (
            <ColisRow
              key={c.id}
              commande={c}
              product={products.find((pr: any) => pr.id === c.productId)}
              transitaire={fournisseurs.find((f: any) => f.id === c.transitaireId)}
              paiements={paiements}
              onOuvrir={handleOuvrir}
              onEdit={setEditingCommande}
              onNavigateTab={onNavigateTab}
            />
          ))}
        </div>
      )}

      {editingCommande && (
        <AchatEditModal
          commande={editingCommande}
          onClose={() => setEditingCommande(null)}
          products={products}
          fournisseurs={fournisseurs}
          commandes={commandes}
          ventes={ventes}
          devises={devises as any}
          updateAll={updateAll}
          updateData={updateData}
          paiements={paiements}
          today={today}
          onNavigateTab={onNavigateTab}
        />
      )}

      {selectedCommande && (
        <ColisWizardModal
          commande={selectedCommande}
          commandes={commandes}
          products={products}
          fournisseurs={fournisseurs}
          tauxUsd={tauxUsd}
          today={today}
          initialStep={selectedStep}
          onClose={handleCloseWizard}
          updateCommandeField={updateCommandeField}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
});

export default Logistique;
