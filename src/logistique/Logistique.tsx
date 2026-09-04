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
  const [filtreStatut, setFiltreStatut] = useState<string>('all');

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

  const colisFiltres = useMemo(() => {
    return commandesLogistique.filter((c: any) => {
      if (filtreStatut === 'en-cours' && c.statut === 'Arrivé' && c.qualityCheck?.isCompleted) return false;
      if (filtreStatut === 'termine' && !(c.statut === 'Arrivé' && c.qualityCheck?.isCompleted)) return false;

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
  }, [commandesLogistique, filtreStatut, recherche, products, fournisseurs]);

  const stats = useMemo(() => {
    const total = commandesLogistique.length;
    const termines = commandesLogistique.filter((c: any) => c.statut === 'Arrivé' && c.qualityCheck?.isCompleted).length;
    const enCours = total - termines;
    const aerien = commandesLogistique.filter((c: any) => (c.modeExpedition || '').toLowerCase().includes('aérien') || (c.modeExpedition || '').toLowerCase().includes('aerien')).length;
    const maritime = commandesLogistique.filter((c: any) => (c.modeExpedition || '').toLowerCase().includes('maritime')).length;
    const totalFretAr = commandesLogistique.reduce((acc: number, c: any) => acc + (Number(c.fraisTransport) || 0), 0);
    return { total, enCours, termines, aerien, maritime, totalFretAr };
  }, [commandesLogistique]);

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

      {commandesLogistique.length === 0 ? (
        <Empty text="Aucun colis en transit. Dès qu'un achat est validé et payé dans l'onglet « Achat », il apparaîtra ici pour le suivi." />
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
