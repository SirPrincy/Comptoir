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

interface LogistiqueProps {
  products: any[];
  commandes: any[];
  ventes: any[];
  fournisseurs?: any[];
  devises?: { rmb: number | string; usd: number | string };
  updateAll: (products: any[], ventes: any[], commandes: any[]) => void;
  onNavigateTab?: (tab: string) => void;
}

const Logistique = memo(function Logistique({
  products = [], commandes = [], ventes = [], fournisseurs = [],
  devises = { rmb: 680, usd: 4600 }, updateAll, onNavigateTab,
}: LogistiqueProps) {
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('all');

  const tauxUsd = Number(devises?.usd) || 4600;
  const today = new Date().toISOString().slice(0, 10);

  const updateCommandeField = (id: string, fields: Record<string, any>) => {
    updateAll(products, ventes, commandes.map((c: any) => (c.id === id ? { ...c, ...fields } : c)));
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
      if (filtreStatut === 'qc-pending' && (c.statut !== 'Arrivé' || c.qualityCheck?.isCompleted)) return false;
      if (filtreStatut === 'completed' && (!c.qualityCheck || !c.qualityCheck?.isCompleted)) return false;
      if (!['all', 'en-cours', 'qc-pending', 'completed'].includes(filtreStatut) && c.statut !== filtreStatut) return false;

      if (!recherche.trim()) return true;
      const q = recherche.toLowerCase();
      const p = products.find((pr: any) => pr.id === c.productId);
      const transitaire = fournisseurs.find((f: any) => f.id === c.transitaireId);
      return (
        (p && p.nom.toLowerCase().includes(q)) ||
        (c.tracking && c.tracking.toLowerCase().includes(q)) ||
        (c.source && c.source.toLowerCase().includes(q)) ||
        (transitaire && transitaire.nom.toLowerCase().includes(q))
      );
    });
  }, [commandesLogistique, filtreStatut, recherche, products, fournisseurs]);

  const stats = useMemo(() => ({
    enLivraison: commandesLogistique.filter(c => c.statut === 'En livraison').length,
    enEntrepot: commandesLogistique.filter(c => c.statut === 'En entrepôt').length,
    enExpedition: commandesLogistique.filter(c => c.statut === 'En expédition').length,
    qcAfaire: commandesLogistique.filter(c => c.statut === 'Arrivé' && (!c.qualityCheck || !c.qualityCheck.isCompleted)).length,
    termines: commandesLogistique.filter(c => c.qualityCheck?.isCompleted).length,
  }), [commandesLogistique]);

  const selectedCommande = useMemo(
    () => commandes.find((c: any) => c.id === selectedCommandeId) || null,
    [commandes, selectedCommandeId]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 my-1 mb-3">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8A8375', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Suivi Logistique & Acheminement
          </div>
          <div style={{ fontSize: 11.5, color: '#5E584E', marginTop: 2 }}>
            Assistant pas-à-pas : de l'usine chinoise au contrôle qualité final à Madagascar
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('vente')}
              style={{
                height: 32,
                padding: '0 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid #C4DEC0',
                background: '#EBF4EC',
                color: '#2C5E43',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
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
              onOuvrir={setSelectedCommandeId}
              onNavigateTab={onNavigateTab}
            />
          ))}
        </div>
      )}

      {selectedCommande && (
        <ColisWizardModal
          commande={selectedCommande}
          commandes={commandes}
          products={products}
          fournisseurs={fournisseurs}
          tauxUsd={tauxUsd}
          today={today}
          onClose={() => setSelectedCommandeId(null)}
          updateCommandeField={updateCommandeField}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
});

export default Logistique;
