import React, { useState, useMemo, memo } from 'react';
import { Trash2, ExternalLink, AlertTriangle, Search, TrendingUp, Sliders, Edit2, Plus, ArrowDownRight, ArrowUpRight, History, Package, Wallet, DollarSign, Camera, Image as ImageIcon, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { CATEGORIES, uid } from '../constants';
import { SectionHeader, Card, Field, Modal, Empty, Stat, inputStyle, selectStyle, primaryBtn, ghostBtn, rowCard, iconBtn } from '../ui';
import { computeStock, compressAndReadFile } from './stockUtils';
import ModalDetailArticle from './ModalDetailArticle';

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
  const [stockFilter, setStockFilter] = useState<'tous' | 'alerte' | 'dispo' | 'rupture'>('tous');

  React.useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Modal d'ajustement de stock
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'perte' | 'echantillon' | 'inventaire'>('perte');
  const [adjustDelta, setAdjustDelta] = useState<number | string>(-1);
  const [adjustMotif, setAdjustMotif] = useState('Casse / Défectueux');
  const [adjustValeurUnitaire, setAdjustValeurUnitaire] = useState<number | string>('');
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
    images: [],
  });

  // Gestion de l'ajout d'images (max 3)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];
    const remainingSlots = 3 - form.images.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = files.slice(0, remainingSlots);
    const newImages: string[] = [];

    for (const file of filesToProcess) {
      try {
        const base64 = await compressAndReadFile(file, 800, 800, 0.8);
        if (base64) newImages.push(base64);
      } catch (err) {
        console.error('Erreur chargement image:', err);
      }
    }

    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 3)
    }));

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };


  // Calcul du stock pour chaque produit (inclut achats + ventes + mouvements/ajustements)
  const stockByProduct = useMemo(
    () => computeStock(products, commandes, ventes, mouvements),
    [products, commandes, ventes, mouvements]
  );

  // Catégories existantes
  const existingCategories = useMemo(() => {
    const set = new Set([...CATEGORIES]);
    products.forEach((p: any) => { if (p.categorie) set.add(p.categorie); });
    return Array.from(set);
  }, [products]);

  // KPIs financiers du Stock
  const kpis = useMemo(() => {
    let totalUnites = 0;
    let valeurAchatTotale = 0;
    let caPotentielTotal = 0;
    let alertesCount = 0;

    products.forEach((p: any) => {
      const st = stockByProduct[p.id] || 0;
      const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;
      if (st <= seuil) alertesCount++;

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
  }, [products, stockByProduct]);

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const st = stockByProduct[p.id] || 0;
      const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;

      // Filtre par statut stock
      if (stockFilter === 'alerte' && st > seuil) return false;
      if (stockFilter === 'dispo' && st <= 0) return false;
      if (stockFilter === 'rupture' && st > 0) return false;

      // Filtre par catégorie
      if (selectedCat !== 'Tous' && p.categorie !== selectedCat) return false;

      // Recherche textuelle (Nom, Réf / SKU, Couleur, Catégorie)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nom = (p.nom || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const coul = (p.couleur || '').toLowerCase();
        const cat = (p.categorie || '').toLowerCase();
        return nom.includes(q) || ref.includes(q) || coul.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [products, stockByProduct, stockFilter, selectedCat, searchTerm]);

  // Ajouter ou Modifier Produit
  const enregistrerProduit = () => {
    if (!form.nom) return;
    const catFinal = form.categorie === '+ Autre catégorie' ? form.customCategorie.trim() || 'Autre' : form.categorie;
    const puRmbVal = Number(form.puRmb) || 0;
    const pAchatArVal = Number(form.prixAchatAr) || (puRmbVal > 0 ? Math.round(puRmbVal * (devises?.rmb || 680)) : 0);
    const pVenteVal = Number(form.prixVente) || 0;
    const seuilVal = Math.max(0, Number(form.seuilMin) || 0);

    if (editingId) {
      // Modification
      const updated = products.map((p: any) => p.id === editingId ? {
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
        images: form.images,
      } : p);
      updateAll(updated, ventes, commandes);
      setEditingId(null);
    } else {
      // Création
      const p = {
        id: uid(),
        nom: form.nom,
        reference: form.reference,
        categorie: catFinal,
        couleur: form.couleur,
        puRmb: puRmbVal || undefined,
        prixAchatAr: pAchatArVal || undefined,
        coutTotalRenduAr: pAchatArVal || undefined,
        prixVente: pVenteVal || undefined,
        seuilMin: seuilVal,
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
      images: existingImgs,
    });
    setShowForm(true);
  };

  const supprimerProduit = (id: string) => updateAll(products.filter((p: any) => p.id !== id), ventes, commandes);

  // Enregistrer un ajustement de stock (perte, vol, casse, réajustement inventaire)
  const validerAjustement = () => {
    if (!adjustProduct) return;
    const deltaVal = Number(adjustDelta) || 0;
    if (deltaVal === 0) return;

    const valUnit = Number(adjustValeurUnitaire) || 0;
    const valTotale = Math.abs(deltaVal) * valUnit;

    const nvMouvement = {
      id: uid(),
      type: 'Ajustement Stock',
      productId: adjustProduct.id,
      productNom: adjustProduct.nom,
      delta: deltaVal,
      motif: adjustMotif,
      valeurUnitaireAr: valUnit > 0 ? valUnit : undefined,
      valeurTotaleAr: valTotale > 0 ? valTotale : undefined,
      date: new Date().toISOString(),
    };

    if (updateData) {
      updateData({ mouvements: [...mouvements, nvMouvement] });
    } else {
      updateAll(products, ventes, commandes);
    }

    setAdjustProduct(null);
    setAdjustDelta(-1);
    setAdjustMotif('Casse / Défectueux');
    setAdjustValeurUnitaire('');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label="Total en Stock" value={`${kpis.totalUnites} unités`} icon={Package} accent="#3D5A6C" />
        <Stat label="Valeur d'Achat globale" value={`${kpis.valeurAchatTotale.toLocaleString('fr-FR')} Ar`} icon={Wallet} accent="#5E584E" />
        <Stat label="CA Cible Potentiel" value={`${kpis.caPotentielTotal.toLocaleString('fr-FR')} Ar`} icon={TrendingUp} accent="#3F7A5C" />
        <Stat
          label="Marge Potentielle"
          value={`${kpis.margePotentielle.toLocaleString('fr-FR')} Ar (${kpis.margeGlobalPct}%)`}
          icon={DollarSign}
          accent={kpis.margePotentielle > 0 ? '#3F7A5C' : '#C24A3F'}
        />
        {kpis.alertesCount > 0 && (
          <div style={{ background: '#FBEAE8', border: '1px solid #F0C6C0', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: '#C24A3F', fontWeight: 700, textTransform: 'uppercase' }}>⚠️ Alertes Stock</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#C24A3F', marginTop: 2 }}>{kpis.alertesCount} produit{kpis.alertesCount > 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Formulaire de création / édition */}
      {showForm && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3D5A6C', marginBottom: 10 }}>
            {editingId ? '✏️ Modifier le produit' : '➕ Nouveau produit'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Field label="Nom article (vente)" style={{ flex: '2 1 180px' }}>
              <input style={inputStyle as any} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Sac à main modèle X" />
            </Field>
            <Field label="Réf. / SKU 1688 / Taobao" style={{ flex: '1 1 140px' }}>
              <input style={inputStyle as any} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="SKU fournisseur" />
            </Field>
            <Field label="Catégorie" style={{ flex: '1 1 140px' }}>
              <select style={selectStyle as any} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="+ Autre catégorie">+ Saisir une nouvelle catégorie...</option>
              </select>
            </Field>

            {form.categorie === '+ Autre catégorie' && (
              <Field label="Nom nouvelle catégorie" style={{ flex: '1 1 150px' }}>
                <input
                  style={inputStyle as any}
                  value={form.customCategorie}
                  onChange={e => setForm({ ...form, customCategorie: e.target.value })}
                  placeholder="Ex: Chaussures, Bijoux..."
                />
              </Field>
            )}

            <Field label="Prix Achat Est. (Ar)" style={{ flex: '1 1 120px' }}>
              <input
                type="number"
                style={inputStyle as any}
                value={form.prixAchatAr}
                onChange={e => setForm({ ...form, prixAchatAr: e.target.value })}
                placeholder="Ex: 25000"
              />
            </Field>

            <Field label="Prix Vente Cible (Ar)" style={{ flex: '1 1 120px' }}>
              <input
                type="number"
                style={inputStyle as any}
                value={form.prixVente}
                onChange={e => setForm({ ...form, prixVente: e.target.value })}
                placeholder="Ex: 45000"
              />
            </Field>

            <Field label="Seuil d'alerte min" style={{ flex: '1 1 100px' }}>
              <input
                type="number"
                min={0}
                style={{ ...inputStyle, fontWeight: 700, color: '#C24A3F' } as any}
                value={form.seuilMin}
                onChange={e => setForm({ ...form, seuilMin: e.target.value })}
                placeholder="Ex: 3"
              />
            </Field>

            <Field label="Couleur / Var." style={{ flex: '1 1 100px' }}>
              <input style={inputStyle as any} value={form.couleur} onChange={e => setForm({ ...form, couleur: e.target.value })} placeholder="Noir / Rouge" />
            </Field>

            <Field label={`Photos de l'article (${form.images.length}/3 max)`} style={{ flex: '1 1 100%', marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                {form.images.map((imgUrl, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #EAE2D4', background: '#F5F0EB' }}>
                    <img src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(194, 74, 63, 0.9)', color: '#fff', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                      }}
                      title="Retirer cette photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {form.images.length < 3 && (
                  <label style={{
                    width: 60, height: 60, borderRadius: 8, border: '1.5px dashed #3D5A6C',
                    background: '#FAF7F2', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 2,
                    color: '#3D5A6C', fontSize: 11, fontWeight: 600
                  }}>
                    <Camera size={18} />
                    <span>+ Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8A8375', marginTop: 4 }}>
                Séléctionnez 1 à 3 images depuis votre appareil (JPG, PNG, WEBP).
              </div>
            </Field>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={enregistrerProduit} style={{ ...primaryBtn, height: 38, padding: '0 20px' }}>
                {editingId ? 'Mettre à jour' : 'Ajouter le produit'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Barre de Recherche et Filtres Express */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '2 1 200px', position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingLeft: 30 } as any}
            placeholder="🔍 Rechercher par nom, SKU, couleur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          style={{ ...selectStyle, flex: '1 1 130px', height: 36, fontSize: 12 } as any}
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
        >
          <option value="Tous">Toutes catégories</option>
          {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setStockFilter('tous')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: stockFilter === 'tous' ? '#3D5A6C' : '#EAE2D4',
              color: stockFilter === 'tous' ? '#FAF7F2' : '#26333D',
            }}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setStockFilter('alerte')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: stockFilter === 'alerte' ? '#C24A3F' : '#FBEAE8',
              color: stockFilter === 'alerte' ? '#FFFFFF' : '#C24A3F',
            }}
          >
            ⚠️ Alertes ({kpis.alertesCount})
          </button>
          <button
            onClick={() => setStockFilter('dispo')}
            style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: stockFilter === 'dispo' ? '#3F7A5C' : '#E9F2EC',
              color: stockFilter === 'dispo' ? '#FFFFFF' : '#3F7A5C',
            }}
          >
            📦 En stock
          </button>
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
            {ajustementsProduct.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderBottom: '1px solid #EAE2D4', paddingBottom: 6 }}>
                <div>
                  <strong>{m.productNom}</strong> · <span style={{ color: '#8A8375' }}>{m.motif}</span>
                  <div style={{ fontSize: 11, color: '#8A8375', marginTop: 1 }}>
                    {new Date(m.date).toLocaleString('fr-FR')}
                    {m.valeurTotaleAr && (
                      <span style={{ color: m.delta < 0 ? '#C24A3F' : '#3D5A6C', fontWeight: 600, marginLeft: 6 }}>
                        · Impact valorisé : {Number(m.valeurTotaleAr).toLocaleString('fr-FR')} Ar ({Number(m.valeurUnitaireAr || 0).toLocaleString('fr-FR')} Ar/u)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: m.delta < 0 ? '#C24A3F' : '#3F7A5C' }}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta} unité{Math.abs(m.delta) > 1 ? 's' : ''}
                  </div>
                  {m.valeurTotaleAr && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.delta < 0 ? '#C24A3F' : '#3D5A6C' }}>
                      {m.delta < 0 ? '-' : '+'}{Number(m.valeurTotaleAr).toLocaleString('fr-FR')} Ar
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal d'Ajustement de Stock */}
      {adjustProduct && (() => {
        const pCost = adjustProduct.coutTotalRenduAr || adjustProduct.prixAchatAr || (adjustProduct.puRmb ? Math.round(adjustProduct.puRmb * (adjustProduct.tauxRmb || devises?.rmb || 680)) : 0);
        const pPrice = adjustProduct.prixVente || adjustProduct.prixVenteEstime || 0;
        const currentQty = stockByProduct[adjustProduct.id] || 0;
        const deltaNum = Number(adjustDelta) || 0;
        const newQty = Math.max(0, currentQty + deltaNum);
        const valUnitNum = Number(adjustValeurUnitaire) || 0;
        const totalValorise = Math.abs(deltaNum) * valUnitNum;
        const isPerte = deltaNum < 0;

        return (
          <Modal title={`⚙️ Ajuster le stock : ${adjustProduct.nom}`} onClose={() => setAdjustProduct(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                background: '#FAF7F2',
                border: '1px solid #EAE2D4',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 600 }}>STOCK ACTUEL</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#26333D' }}>{currentQty} unité(s)</div>
                </div>
                {pCost > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 600 }}>COÛT D'ACHAT (PRU)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3D5A6C' }}>{pCost.toLocaleString('fr-FR')} Ar</div>
                  </div>
                )}
                {pPrice > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 600 }}>PRIX DE VENTE</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3F7A5C' }}>{pPrice.toLocaleString('fr-FR')} Ar</div>
                  </div>
                )}
              </div>

              <Field label="Raison de la modification">
                <select
                  style={selectStyle as any}
                  value={adjustMotif}
                  onChange={e => {
                    const motif = e.target.value;
                    setAdjustMotif(motif);
                    if (motif.includes('Casse') || motif.includes('Vol') || motif.includes('Échantillon') || motif.includes('Retrait')) {
                      if (deltaNum >= 0) setAdjustDelta(-1);
                    } else if (motif.includes('Ajout')) {
                      if (deltaNum <= 0) setAdjustDelta(1);
                    }
                  }}
                >
                  <option value="Casse / Défectueux">📉 Casse / Produit défectueux (Perte)</option>
                  <option value="Vol ou Perte">🚨 Vol ou Perte de marchandise (Perte)</option>
                  <option value="Échantillon / Usage perso">🎁 Échantillon commercial / Usage perso</option>
                  <option value="Correction d'inventaire (Retrait)">➖ Correction d'inventaire (Écart négatif)</option>
                  <option value="Correction d'inventaire (Ajout)">➕ Correction d'inventaire (Écart positif)</option>
                </select>
              </Field>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Quantité (+ ajout, - retrait)" style={{ flex: '1 1 140px' }}>
                  <input
                    type="number"
                    style={{ ...inputStyle, fontWeight: 800, fontSize: 15, color: deltaNum < 0 ? '#C24A3F' : '#3F7A5C' } as any}
                    value={adjustDelta}
                    onChange={e => setAdjustDelta(e.target.value)}
                    placeholder="Ex: -1 ou 2"
                  />
                  <div style={{ fontSize: 11, color: '#8A8375', marginTop: 3 }}>
                    Nouveau stock : <strong>{newQty} u</strong>
                  </div>
                </Field>

                <Field label="Valeur unitaire retenue (Ar)" style={{ flex: '1 1 170px' }}>
                  <input
                    type="number"
                    style={{ ...inputStyle, fontWeight: 700, fontSize: 14 } as any}
                    value={adjustValeurUnitaire}
                    onChange={e => setAdjustValeurUnitaire(e.target.value)}
                    placeholder={pCost ? String(pCost) : 'Ex: 25000'}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {pCost > 0 && (
                      <button
                        type="button"
                        onClick={() => setAdjustValeurUnitaire(pCost)}
                        style={{ fontSize: 10, padding: '2px 6px', background: '#EAE2D4', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: '#26333D' }}
                      >
                        Au coût d'achat ({pCost.toLocaleString('fr-FR')} Ar)
                      </button>
                    )}
                    {pPrice > 0 && (
                      <button
                        type="button"
                        onClick={() => setAdjustValeurUnitaire(pPrice)}
                        style={{ fontSize: 10, padding: '2px 6px', background: '#EAE2D4', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: '#26333D' }}
                      >
                        Au prix vente ({pPrice.toLocaleString('fr-FR')} Ar)
                      </button>
                    )}
                  </div>
                </Field>
              </div>

              {/* Synthèse de la Valorisation Financière de l'Ajustement */}
              {totalValorise > 0 && (
                <div style={{
                  background: isPerte ? '#FBEAE8' : '#E9F2EC',
                  border: `1px solid ${isPerte ? '#F0C6C0' : '#BBDBC7'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isPerte ? '#991B1B' : '#166534' }}>
                      {isPerte ? '💸 VALORISATION DE LA PERTE' : '📈 VALEUR DU STOCK AJOUTÉ'}
                    </div>
                    <div style={{ fontSize: 11, color: '#5E584E', marginTop: 1 }}>
                      {Math.abs(deltaNum)} unité(s) × {valUnitNum.toLocaleString('fr-FR')} Ar
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isPerte ? '#C24A3F' : '#166534' }}>
                    {isPerte ? '-' : '+'}{totalValorise.toLocaleString('fr-FR')} Ar
                  </div>
                </div>
              )}

              <button
                onClick={validerAjustement}
                style={{ ...primaryBtn, height: 42, width: '100%', justifyContent: 'center', marginTop: 6 }}
              >
                Valider l'ajustement {totalValorise > 0 ? `(${totalValorise.toLocaleString('fr-FR')} Ar)` : ''}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Liste des produits */}
      {filteredProducts.length === 0 ? (
        <Empty text="Aucun produit ne correspond à votre recherche." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredProducts.map((p: any) => {
            const stock = stockByProduct[p.id] || 0;
            const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;
            const isAlert = stock <= seuil;
            const isOut = stock === 0;

            const cost = p.coutTotalRenduAr || p.prixAchatAr || (p.puRmb ? Math.round(p.puRmb * (p.tauxRmb || devises?.rmb || 680)) : null);
            const price = p.prixVente || p.prixVenteEstime;
            const marginAr = cost && price ? price - cost : null;
            const marginPct = price && marginAr !== null ? Math.round((marginAr / price) * 100) : null;

            const pImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);

            return (
              <div
                key={p.id}
                style={{
                  ...rowCard,
                  borderLeft: isAlert ? '4px solid #C24A3F' : '1px solid #EAE2D4',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, transform 0.1s ease',
                } as any}
                onClick={(e: any) => {
                  // Éviter d'ouvrir le détail si on clique sur un bouton, un lien ou une image
                  if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
                    return;
                  }
                  setSelectedDetailProduct(p);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 200px', minWidth: 0 }}>
                  {/* Miniature Image(s) */}
                  <div style={{ flexShrink: 0 }}>
                    {pImages.length > 0 ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGallery({ title: p.nom, images: pImages, index: 0 });
                        }}
                        style={{
                          width: 50, height: 50, borderRadius: 8, overflow: 'hidden', border: '1px solid #EAE2D4',
                          cursor: 'pointer', background: '#F5F0EB', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}
                        title="Cliquer pour voir les photos"
                      >
                        <img src={pImages[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {pImages.length > 1 && (
                          <span style={{
                            position: 'absolute', bottom: 2, right: 2, background: 'rgba(38, 51, 61, 0.85)',
                            color: '#FAF7F2', fontSize: 9.5, fontWeight: 700, padding: '1px 4px', borderRadius: 4
                          }}>
                            +{pImages.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: 50, height: 50, borderRadius: 8, border: '1px dashed #D3C9BC',
                        background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#B0A898'
                      }} title="Aucune photo">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#26333D' }}>
                        {p.nom} {p.couleur ? `· ${p.couleur}` : ''}
                      </span>
                      {isAlert && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: '#FBEAE8', color: '#C24A3F', border: '1px solid #F0C6C0',
                        }}>
                          {isOut ? '❌ Rupture' : `⚠️ Stock Bas (< ${seuil})`}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#8A8375', wordBreak: 'break-word', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{p.categorie}</span>
                      {p.reference && !p.reference.startsWith('http') && !p.reference.includes('1688') && !p.reference.includes('taobao') && (
                        <span>· réf/SKU: <strong>{p.reference}</strong></span>
                      )}
                      {(p.lien || p.reference?.startsWith('http') || p.reference?.includes('1688') || p.reference?.includes('taobao')) && (
                        <a
                          href={(p.lien || p.reference).startsWith('http') ? (p.lien || p.reference) : `https://${p.lien || p.reference}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#3D5A6C', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                        >
                          <span>🔗 Lien 1688 / Taobao</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    {/* Prix, Marge Ar et Marge % */}
                    {(cost || price) && (
                      <div style={{ fontSize: 12, color: '#3D5A6C', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {cost && <span>Achat : <strong>{Number(cost).toLocaleString('fr-FR')} Ar</strong></span>}
                        {price && <span>Vente : <strong>{Number(price).toLocaleString('fr-FR')} Ar</strong></span>}
                        {marginAr !== null && (
                          <span style={{ color: marginAr > 0 ? '#3F7A5C' : '#C24A3F', fontWeight: 600 }}>
                            (Marge : {marginAr > 0 ? '+' : ''}{Number(marginAr).toLocaleString('fr-FR')} Ar
                            {marginPct !== null ? ` / ${marginPct}%` : ''})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                    background: stock > seuil ? '#E9F2EC' : (stock > 0 ? '#FFF8E1' : '#FBEAE8'),
                    color: stock > seuil ? '#3F7A5C' : (stock > 0 ? '#B78103' : '#C24A3F'),
                    whiteSpace: 'nowrap',
                  }}>
                    {stock} en stock
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailProduct(p);
                    }}
                    style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Voir l'historique et la fiche détaillée de l'article"
                  >
                    <History size={12} />
                    <span>Historique</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjustProduct(p);
                      setAdjustDelta(-1);
                      setAdjustMotif('Casse / Défectueux');
                    }}
                    style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, borderRadius: 6 }}
                    title="Ajuster le stock (perte, vol, casse, réajustement)"
                  >
                    ⚙️ Ajuster
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editerProduit(p);
                    }}
                    style={iconBtn}
                    title="Modifier le produit"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      supprimerProduit(p.id);
                    }}
                    style={iconBtn}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Fiche & Historique de l'Article */}
      {selectedDetailProduct && (
        <ModalDetailArticle
          product={selectedDetailProduct}
          stock={stockByProduct[selectedDetailProduct.id] || 0}
          commandes={commandes}
          ventes={ventes}
          mouvements={mouvements}
          devises={devises}
          onClose={() => setSelectedDetailProduct(null)}
          onEdit={(p) => editerProduit(p)}
          onAdjust={(p) => {
            setAdjustProduct(p);
            setAdjustDelta(-1);
            setAdjustMotif('Casse / Défectueux');
          }}
          onOpenGallery={(title, images) => setSelectedGallery({ title, images, index: 0 })}
        />
      )}

      {/* Modal Lightbox Galerie Photo */}
      {selectedGallery && (
        <Modal title={`📷 ${selectedGallery.title} (${selectedGallery.index + 1}/${selectedGallery.images.length})`} onClose={() => setSelectedGallery(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, maxHeight: 400, background: '#1E2830', borderRadius: 10, overflow: 'hidden', padding: 8 }}>
              <img
                src={selectedGallery.images[selectedGallery.index]}
                alt={`Photo ${selectedGallery.index + 1}`}
                style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 6 }}
              />

              {selectedGallery.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedGallery(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null)}
                    style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.25)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                    title="Photo précédente"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedGallery(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null)}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.25)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                    title="Photo suivante"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {selectedGallery.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {selectedGallery.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGallery(prev => prev ? { ...prev, index: idx } : null)}
                    style={{
                      width: 48, height: 48, borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                      border: idx === selectedGallery.index ? '2px solid #3D5A6C' : '1px solid #EAE2D4',
                      opacity: idx === selectedGallery.index ? 1 : 0.6
                    }}
                  >
                    <img src={img} alt={`Miniature ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
});

export default Stock;
