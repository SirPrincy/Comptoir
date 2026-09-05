import React, { useState, useMemo, memo } from 'react';
import { Search, History } from 'lucide-react';
import { CATEGORIES, uid } from '../constants';
import { getNextProductUid } from '../utils/uidUtils';
import { SectionHeader, Card, Empty, inputStyle, selectStyle, ghostBtn } from '../ui';
import { computeStock } from './stockUtils';
import ModalDetailArticle from './ModalDetailArticle';
import ModalAjustementStock from './ModalAjustementStock';
import ModalGalleryViewer from './ModalGalleryViewer';
import StockKpis from './StockKpis';
import ProductForm from './ProductForm';
import StockItemCard from './StockItemCard';

const Stock = memo(function Stock({
  products = [],
  commandes = [],
  ventes = [],
  mouvements = [],
  devises = { rmb: 680, usd: 4600 },
  updateAll,
  updateData,
  initialSearch = '',
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [stockFilter, setStockFilter] = useState<'tous' | 'alerte' | 'dispo' | 'rupture' | 'archives'>('tous');
  const [showArchived, setShowArchived] = useState(false);

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Modal d'ajustement de stock
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Modal Galerie Photo
  const [selectedGallery, setSelectedGallery] = useState<{ title: string; images: string[]; index: number } | null>(null);

  // Modal Fiche & Historique Produit
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any | null>(null);

  // Formulaire Produit
  const [form, setForm] = useState<{
    nom: string;
    reference: string;
    categorie: string;
    customCategorie: string;
    couleur: string;
    puRmb: string;
    prixAchatAr: string;
    prixVente: string;
    seuilMin: string;
    isArchive?: boolean;
    images: string[];
  }>({
    nom: '',
    reference: '',
    categorie: CATEGORIES[0],
    customCategorie: '',
    couleur: '',
    puRmb: '',
    prixAchatAr: '',
    prixVente: '',
    seuilMin: '3',
    isArchive: false,
    images: [],
  });

  // Calcul du stock pour chaque produit
  const stockByProduct = useMemo(
    () => computeStock(products, commandes, ventes, mouvements),
    [products, commandes, ventes, mouvements]
  );

  // Catégories existantes (excluant ou incluant selon besoin)
  const existingCategories = useMemo(() => {
    const set = new Set([...CATEGORIES]);
    products.forEach((p: any) => { if (p.categorie) set.add(p.categorie); });
    return Array.from(set);
  }, [products]);

  // Nombre d'articles archivés / masqués
  const archivedCount = useMemo(() => {
    return products.filter((p: any) => Boolean(p.isArchive || p.masque || p.archive)).length;
  }, [products]);

  const activeProductsCount = products.length - archivedCount;

  // KPIs financiers du Stock (basés sur les articles actifs, avec exclusion des alertes pour les masqués)
  const kpis = useMemo(() => {
    let totalUnites = 0;
    let valeurAchatTotale = 0;
    let caPotentielTotal = 0;
    let alertesCount = 0;

    products.forEach((p: any) => {
      const isArchived = Boolean(p.isArchive || p.masque || p.archive);
      const st = stockByProduct[p.id] || 0;
      const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;
      
      // Un produit masqué ne génère pas d'alerte de rupture
      if (!isArchived && st <= seuil) {
        alertesCount++;
      }

      if (st > 0) {
        totalUnites += st;
        const cost = Number(p.coutTotalRenduAr || p.prixAchatAr || (p.puRmb ? p.puRmb * (p.tauxRmb || devises?.rmb || 680) : 0)) || 0;
        const price = Number(p.prixVente || p.prixVenteEstime) || 0;
        valeurAchatTotale += st * cost;
        caPotentielTotal += st * price;
      }
    });

    const margePotentielle = caPotentielTotal - valeurAchatTotale;
    const margeGlobalPct = caPotentielTotal > 0 ? Math.round((margePotentielle / caPotentielTotal) * 100) : 0;

    return { totalUnites, valeurAchatTotale, caPotentielTotal, margePotentielle, margeGlobalPct, alertesCount };
  }, [products, stockByProduct, devises]);

  // Produits enrichis avec numérotation séquentielle immuable
  const productsWithNum = useMemo(() => {
    return (products || []).map((p: any, idx: number) => ({
      ...p,
      numSeq: p.numSeq || (idx + 1),
    }));
  }, [products]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    return productsWithNum.filter((p: any) => {
      const isArchived = Boolean(p.isArchive || p.masque || p.archive);
      const st = stockByProduct[p.id] || 0;
      const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;

      // Filtrage par onglet d'état
      if (stockFilter === 'archives') {
        if (!isArchived) return false;
      } else {
        // Par défaut, masquer les articles archivés sauf si l'option showArchived est activée ou qu'on est sur l'onglet dédié
        if (isArchived && !showArchived) return false;

        if (stockFilter === 'alerte' && (isArchived || st > seuil)) return false;
        if (stockFilter === 'dispo' && st <= 0) return false;
        if (stockFilter === 'rupture' && (isArchived || st !== 0)) return false;
      }

      if (selectedCat !== 'Tous' && p.categorie !== selectedCat) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nom = (p.nom || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const cat = (p.categorie || '').toLowerCase();
        const col = (p.couleur || '').toLowerCase();
        const codeUid = (p.uidCode || p.codeUid || '').toLowerCase();
        const numStr = p.numSeq ? `n°${p.numSeq} n° ${p.numSeq} #${p.numSeq} ${p.numSeq}` : '';
        return nom.includes(q) || ref.includes(q) || cat.includes(q) || col.includes(q) || codeUid.includes(q) || numStr.includes(q);
      }
      return true;
    });
  }, [productsWithNum, stockByProduct, stockFilter, showArchived, selectedCat, searchTerm]);

  // Enregistrer ou modifier un produit
  const enregistrerProduit = () => {
    if (!form.nom.trim()) return;

    const catFinal = form.categorie === '+ Autre catégorie'
      ? (form.customCategorie.trim() || 'Divers')
      : form.categorie;

    const puRmbVal = form.puRmb ? parseFloat(form.puRmb) : undefined;
    const pAchatArVal = form.prixAchatAr ? parseFloat(form.prixAchatAr) : undefined;
    const pVenteVal = form.prixVente ? parseFloat(form.prixVente) : undefined;
    const seuilVal = form.seuilMin !== '' ? parseInt(form.seuilMin, 10) : 3;

    if (editingId) {
      updateAll(
        products.map((p: any) =>
          p.id === editingId
            ? {
                ...p,
                nom: form.nom,
                reference: form.reference,
                categorie: catFinal,
                couleur: form.couleur,
                puRmb: puRmbVal || undefined,
                prixAchatAr: pAchatArVal || undefined,
                coutTotalRenduAr: pAchatArVal || undefined,
                prixVente: pVenteVal || undefined,
                seuilMin: seuilVal,
                isArchive: Boolean(form.isArchive),
                masque: Boolean(form.isArchive),
                images: form.images,
              }
            : p
        ),
        ventes,
        commandes
      );
      setEditingId(null);
    } else {
      const p = {
        id: uid(),
        uidCode: getNextProductUid(products),
        nom: form.nom,
        reference: form.reference,
        categorie: catFinal,
        couleur: form.couleur,
        puRmb: puRmbVal || undefined,
        prixAchatAr: pAchatArVal || undefined,
        coutTotalRenduAr: pAchatArVal || undefined,
        prixVente: pVenteVal || undefined,
        seuilMin: seuilVal,
        isArchive: Boolean(form.isArchive),
        masque: Boolean(form.isArchive),
        images: form.images,
      };
      updateAll([...products, p], ventes, commandes);
    }

    setForm({
      nom: '',
      reference: '',
      categorie: CATEGORIES[0],
      customCategorie: '',
      couleur: '',
      puRmb: '',
      prixAchatAr: '',
      prixVente: '',
      seuilMin: '3',
      isArchive: false,
      images: [],
    });
    setShowForm(false);
  };

  const editerProduit = (p: any) => {
    setEditingId(p.id);
    const existingImgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    setForm({
      nom: p.nom || '',
      reference: p.reference || '',
      categorie: CATEGORIES.includes(p.categorie) ? p.categorie : '+ Autre catégorie',
      customCategorie: CATEGORIES.includes(p.categorie) ? '' : p.categorie || '',
      couleur: p.couleur || '',
      puRmb: p.puRmb ? String(p.puRmb) : '',
      prixAchatAr: p.prixAchatAr || p.coutTotalRenduAr ? String(p.prixAchatAr || p.coutTotalRenduAr) : '',
      prixVente: p.prixVente || p.prixVenteEstime ? String(p.prixVente || p.prixVenteEstime) : '',
      seuilMin: p.seuilMin !== undefined ? String(p.seuilMin) : '3',
      isArchive: Boolean(p.isArchive || p.masque || p.archive),
      images: existingImgs,
    });
    setShowForm(true);
  };

  const toggleArchiveProduit = (targetP: any) => {
    const isNowArchived = !Boolean(targetP.isArchive || targetP.masque || targetP.archive);
    updateAll(
      products.map((p: any) =>
        p.id === targetP.id
          ? { ...p, isArchive: isNowArchived, masque: isNowArchived }
          : p
      ),
      ventes,
      commandes
    );
    if (selectedDetailProduct && selectedDetailProduct.id === targetP.id) {
      setSelectedDetailProduct((prev: any) => prev ? { ...prev, isArchive: isNowArchived, masque: isNowArchived } : null);
    }
  };

  const supprimerProduit = (id: string) => updateAll(products.filter((p: any) => p.id !== id), ventes, commandes);

  // Enregistrer un ajustement de stock (perte, vol, casse, réajustement inventaire)
  const validerAjustement = ({ delta, motif, type, valeurTotaleAr, valeurUnitaireAr }: { delta: number; motif: string; type: string; valeurTotaleAr?: number; valeurUnitaireAr?: number }) => {
    if (!adjustProduct) return;

    const nvMouvement = {
      id: uid(),
      type: 'Ajustement Stock',
      productId: adjustProduct.id,
      productNom: adjustProduct.nom,
      delta,
      motif,
      valeurTotaleAr,
      valeurUnitaireAr,
      date: new Date().toISOString(),
    };

    if (updateData) {
      updateData({ mouvements: [...mouvements, nvMouvement] });
    } else {
      updateAll(products, ventes, commandes);
    }

    setAdjustProduct(null);
  };

  const ajustementsProduct = useMemo(() => {
    return mouvements
      .filter((m: any) => m.type === 'Ajustement Stock')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mouvements]);

  return (
    <div>
      <SectionHeader
        title="Gestion du Stock"
        action={() => {
          setEditingId(null);
          setForm({
            nom: '',
            reference: '',
            categorie: CATEGORIES[0],
            customCategorie: '',
            couleur: '',
            puRmb: '',
            prixAchatAr: '',
            prixVente: '',
            seuilMin: '3',
            images: [],
          });
          setShowForm(s => !s);
        }}
        actionLabel={showForm ? 'Fermer' : '+ Nouveau Produit'}
      />

      {/* 1. KPIs de Valorisation Financière du Stock */}
      <StockKpis kpis={kpis} />

      {/* Formulaire de création / édition */}
      {showForm && (
        <ProductForm
          editingId={editingId}
          form={form}
          setForm={setForm}
          existingCategories={existingCategories}
          onSubmit={enregistrerProduit}
        />
      )}

      {/* 2. Barre de Recherche et Filtres Express */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '2 1 200px', position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingLeft: 30 } as any}
            placeholder="Rechercher par nom, SKU, couleur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8A8375' }} />
        </div>

        <select
          style={{ ...selectStyle, flex: '1 1 130px' } as any}
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
        >
          <option value="Tous">Toutes Catégories</option>
          {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setStockFilter('tous')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: stockFilter === 'tous' ? '#3D5A6C' : '#EAE2D4',
              color: stockFilter === 'tous' ? '#FAF7F2' : '#26333D',
            }}
          >
            Actifs ({activeProductsCount})
          </button>
          <button
            onClick={() => setStockFilter('dispo')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: stockFilter === 'dispo' ? '#3F7A5C' : '#EAE2D4',
              color: stockFilter === 'dispo' ? '#FAF7F2' : '#26333D',
            }}
          >
            En stock
          </button>
          <button
            onClick={() => setStockFilter('alerte')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: stockFilter === 'alerte' ? '#C24A3F' : '#EAE2D4',
              color: stockFilter === 'alerte' ? '#FAF7F2' : '#26333D',
            }}
          >
            ⚠️ Alertes ({kpis.alertesCount})
          </button>
          <button
            onClick={() => setStockFilter('rupture')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: stockFilter === 'rupture' ? '#5E584E' : '#EAE2D4',
              color: stockFilter === 'rupture' ? '#FAF7F2' : '#26333D',
            }}
          >
            Ruptures
          </button>
          {archivedCount > 0 && (
            <button
              onClick={() => setStockFilter('archives')}
              style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: stockFilter === 'archives' ? '#736B5E' : '#EAE2D4',
                color: stockFilter === 'archives' ? '#FAF7F2' : '#736B5E',
              }}
              title="Articles masqués / fin de vie ne générant plus d'alertes"
            >
              📦 Masqués ({archivedCount})
            </button>
          )}
        </div>

        {ajustementsProduct.length > 0 && (
          <button
            onClick={() => setShowHistory(s => !s)}
            style={{ ...ghostBtn, padding: '5px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <History size={13} />
            <span>Historique ajustements ({ajustementsProduct.length})</span>
          </button>
        )}
      </div>

      {/* Historique des ajustements récents */}
      {showHistory && (
        <Card style={{ marginBottom: 14, background: '#FAF7F2', border: '1px solid #EAE2D4' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#3D5A6C', marginBottom: 8 }}>
            📜 Historique des régularisations / pertes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ajustementsProduct.map((m: any) => {
              const val = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null
                ? Number(m.valeurTotaleAr)
                : (m.valeurUnitaireAr ? Math.abs(Number(m.delta) || 0) * Number(m.valeurUnitaireAr) : null);

              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #EAE2D4', paddingBottom: 4 }}>
                  <div>
                    <strong>{m.productNom}</strong> · <span style={{ color: '#8A8375' }}>{m.motif}</span>
                    {val !== null && (
                      <span style={{ color: m.delta < 0 ? '#C24A3F' : '#3F7A5C', fontWeight: 600, marginLeft: 6 }}>
                        ({m.delta < 0 ? '-' : '+'}{val.toLocaleString('fr-FR')} Ar)
                      </span>
                    )}
                    <div style={{ fontSize: 11, color: '#8A8375' }}>
                      {m.date && !isNaN(new Date(m.date).getTime()) ? new Date(m.date).toLocaleString('fr-FR') : '—'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: m.delta < 0 ? '#C24A3F' : '#3F7A5C' }}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta} unité{Math.abs(m.delta) > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal d'Ajustement de Stock */}
      {adjustProduct && (
        <ModalAjustementStock
          product={adjustProduct}
          currentStock={stockByProduct[adjustProduct.id] || 0}
          onClose={() => setAdjustProduct(null)}
          onConfirm={validerAjustement}
        />
      )}

      {/* Liste des produits */}
      {filteredProducts.length === 0 ? (
        <Empty text={stockFilter === 'archives' ? "Aucun article masqué ou archivé." : "Aucun produit ne correspond à votre recherche."} />
      ) : (
        <div className="flex flex-col gap-3 sm:gap-3.5">
          {filteredProducts.map((p: any) => (
            <StockItemCard
              key={p.id}
              product={p}
              stock={stockByProduct[p.id] || 0}
              devises={devises}
              onOpenDetail={(item) => setSelectedDetailProduct(item)}
              onOpenGallery={(galleryData) => setSelectedGallery(galleryData)}
              onOpenAdjust={(item) => setAdjustProduct(item)}
              onEdit={editerProduit}
              onDelete={supprimerProduit}
              onToggleArchive={toggleArchiveProduit}
            />
          ))}
        </div>
      )}

      {/* Modal Galerie Image */}
      {selectedGallery && (
        <ModalGalleryViewer
          gallery={selectedGallery}
          onClose={() => setSelectedGallery(null)}
          onSelectIndex={(idx) => setSelectedGallery(prev => prev ? { ...prev, index: idx } : null)}
        />
      )}

      {/* Modal Fiche Produit & Historique Complet */}
      {selectedDetailProduct && (
        <ModalDetailArticle
          product={selectedDetailProduct}
          stock={stockByProduct[selectedDetailProduct.id] || 0}
          commandes={commandes}
          ventes={ventes}
          mouvements={mouvements}
          devises={devises}
          onClose={() => setSelectedDetailProduct(null)}
          onEdit={editerProduit}
          onAdjust={(p) => setAdjustProduct(p)}
          onToggleArchive={toggleArchiveProduit}
          onOpenGallery={(title, images) => setSelectedGallery({ title, images, index: 0 })}
        />
      )}
    </div>
  );
});

export default Stock;
