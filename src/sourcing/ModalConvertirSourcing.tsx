import React, { useState, useMemo } from 'react';
import { PackageCheck, AlertTriangle, AlertCircle, Check, ArrowRight, RefreshCw, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { CATEGORIES, uid } from '../constants';
import { Modal, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';

interface SourcingItem {
  id: string;
  nom: string;
  categorie?: string;
  lien?: string;
  source?: string;
  fournisseurId?: string;
  puRmb?: number;
  tauxRmb?: number;
  poidsKg?: number;
  tarifFretArKg?: number;
  prixVenteEstimeAr?: number;
  moq?: number;
  statut: string;
  notes?: string;
}

interface ModalConvertirSourcingProps {
  item: SourcingItem | null;
  products: any[];
  fournisseurs?: any[];
  devises?: { rmb: number; usd: number };
  onClose: () => void;
  onConvert: (params: {
    mode: 'creer' | 'update_existant';
    existingProductId?: string;
    productData: any;
    sourcingId: string;
  }) => void;
}

export default function ModalConvertirSourcing({
  item,
  products,
  fournisseurs = [],
  devises = { rmb: 680, usd: 4600 },
  onClose,
  onConvert,
}: ModalConvertirSourcingProps) {
  if (!item) return null;

  // Données initiales modifiables avant confirmation
  const [nom, setNom] = useState(item.nom || '');
  const [couleur, setCouleur] = useState('');
  const [categorie, setCategorie] = useState(item.categorie || CATEGORIES[0]);
  const [fournisseurId, setFournisseurId] = useState(item.fournisseurId || '');
  const [seuilMin, setSeuilMin] = useState('3');

  // Paramètres financiers ajustables
  const [puRmb, setPuRmb] = useState(String(item.puRmb || ''));
  const [tauxRmb, setTauxRmb] = useState(String(item.tauxRmb || devises?.rmb || 680));
  const [poidsKg, setPoidsKg] = useState(String(item.poidsKg || '0.2'));
  const [tarifFretArKg, setTarifFretArKg] = useState(String(item.tarifFretArKg || '45000'));
  const [prixVente, setPrixVente] = useState(String(item.prixVenteEstimeAr || ''));

  // Calculs financiers dynamiques en temps réel
  const puRmbVal = Number(puRmb) || 0;
  const tauxRmbVal = Number(tauxRmb) || (devises?.rmb || 680);
  const prixAchatAr = Math.round(puRmbVal * tauxRmbVal);

  const poidsKgVal = Number(poidsKg) || 0;
  const tarifFretVal = Number(tarifFretArKg) || 0;
  const fraisFretAr = Math.round(poidsKgVal * tarifFretVal);

  const coutTotalRenduAr = prixAchatAr + fraisFretAr;
  const prixVenteVal = Number(prixVente) || 0;

  const margeBruteAr = prixVenteVal > 0 && coutTotalRenduAr > 0 ? prixVenteVal - coutTotalRenduAr : 0;
  const tauxMarge = prixVenteVal > 0 && coutTotalRenduAr > 0 ? Math.round((margeBruteAr / prixVenteVal) * 100) : 0;
  const coefficientMultiplicateur = coutTotalRenduAr > 0 && prixVenteVal > 0 ? (prixVenteVal / coutTotalRenduAr).toFixed(2) : '0';

  // Raccourcis pour arrondir rapidement le prix de vente
  const appliquerArrondi = (multiple: number) => {
    if (prixVenteVal > 0) {
      const arrondi = Math.round(prixVenteVal / multiple) * multiple;
      setPrixVente(String(arrondi));
    }
  };

  const appliquerMargeCible = (pct: number) => {
    if (coutTotalRenduAr > 0) {
      const prixCible = Math.round(coutTotalRenduAr / (1 - pct / 100));
      // Arrondi au millier le plus proche
      const prixArrondi = Math.ceil(prixCible / 1000) * 1000;
      setPrixVente(String(prixArrondi));
    }
  };

  // Détection de doublons et similitudes
  const exactMatch = useMemo(() => {
    const clean = nom.trim().toLowerCase();
    if (!clean) return null;
    return products.find(p => p.nom.trim().toLowerCase() === clean) || null;
  }, [nom, products]);

  const similarProducts = useMemo(() => {
    const clean = nom.trim().toLowerCase();
    if (!clean) return [];
    return products.filter(p => {
      const pClean = p.nom.trim().toLowerCase();
      if (pClean === clean) return false;
      return pClean.includes(clean) || clean.includes(pClean);
    });
  }, [nom, products]);

  const handleCreateNew = () => {
    if (!nom.trim()) return;
    const nouveauProduit = {
      id: uid(),
      nom: nom.trim(),
      reference: item.lien || '',
      lien: item.lien || '',
      categorie: categorie || 'Autre',
      couleur: couleur.trim(),
      fournisseurId: fournisseurId || undefined,
      puRmb: puRmbVal > 0 ? puRmbVal : undefined,
      tauxRmb: tauxRmbVal > 0 ? tauxRmbVal : undefined,
      prixAchatAr: prixAchatAr > 0 ? prixAchatAr : undefined,
      fraisFretAr: fraisFretAr > 0 ? fraisFretAr : undefined,
      coutTotalRenduAr: coutTotalRenduAr > 0 ? coutTotalRenduAr : (prixAchatAr > 0 ? prixAchatAr : undefined),
      prixVente: prixVenteVal,
      seuilMin: Number(seuilMin) || 3,
    };

    onConvert({
      mode: 'creer',
      productData: nouveauProduit,
      sourcingId: item.id,
    });
  };

  const handleUpdateExisting = (existing: any) => {
    const updated = {
      ...existing,
      categorie: categorie || existing.categorie,
      couleur: couleur.trim() || existing.couleur || '',
      fournisseurId: fournisseurId || existing.fournisseurId,
      puRmb: puRmbVal > 0 ? puRmbVal : existing.puRmb,
      tauxRmb: tauxRmbVal > 0 ? tauxRmbVal : existing.tauxRmb,
      prixAchatAr: prixAchatAr > 0 ? prixAchatAr : existing.prixAchatAr,
      fraisFretAr: fraisFretAr > 0 ? fraisFretAr : existing.fraisFretAr,
      coutTotalRenduAr: coutTotalRenduAr > 0 ? coutTotalRenduAr : existing.coutTotalRenduAr,
      prixVente: prixVenteVal || existing.prixVente,
      reference: item.lien || existing.reference,
      lien: item.lien || existing.lien,
    };

    onConvert({
      mode: 'update_existant',
      existingProductId: existing.id,
      productData: updated,
      sourcingId: item.id,
    });
  };

  return (
    <Modal title="Validation & Importation vers le Stock" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 12.5, color: '#5E584E', lineHeight: 1.4, background: '#FAF7F2', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4' }}>
          Vérifiez et ajustez les informations du produit, le fournisseur lié et la rentabilité cible avant l'importation définitive dans le catalogue Stock.
        </div>

        {/* Alerte Doublon Exact */}
        {exactMatch && (
          <div
            style={{
              background: '#FFF8E1',
              border: '1px solid #FFE082',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#8D6E00',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <AlertTriangle size={15} color="#B78103" />
              <span>Un produit avec ce nom exact existe déjà dans le stock !</span>
            </div>
            <div>
              Produit existant : <strong>{exactMatch.nom}</strong> ({Number(exactMatch.prixVente || 0).toLocaleString('fr-FR')} Ar)
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleUpdateExisting(exactMatch)}
                style={{
                  ...primaryBtn,
                  background: '#B78103',
                  height: 30,
                  fontSize: 11.5,
                  padding: '0 10px',
                }}
              >
                <RefreshCw size={12} />
                Mettre à jour ce produit existant
              </button>
            </div>
          </div>
        )}

        {/* Alerte Produits Similaires */}
        {!exactMatch && similarProducts.length > 0 && (
          <div
            style={{
              background: '#FAF7F2',
              border: '1px solid #EAE2D4',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#5E584E',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#3D5A6C' }}>
              <AlertCircle size={14} color="#3D5A6C" />
              <span>{similarProducts.length} produit{similarProducts.length > 1 ? 's' : ''} similaire{similarProducts.length > 1 ? 's' : ''} trouvé{similarProducts.length > 1 ? 's' : ''} :</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {similarProducts.map((sp: any) => (
                <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '4px 8px', borderRadius: 6, border: '1px solid #EAE2D4' }}>
                  <span>{sp.nom} {sp.couleur ? `(${sp.couleur})` : ''} · {Number(sp.prixVente || 0).toLocaleString('fr-FR')} Ar</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateExisting(sp)}
                    style={{ background: 'none', border: 'none', color: '#3D5A6C', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Mettre à jour au lieu de créer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiche Produit & Rattachement Fournisseur */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Nom du produit dans le catalogue Stock">
            <input
              style={inputStyle as any}
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom du produit"
              required
            />
          </Field>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Field label="Catégorie" style={{ flex: '1 1 150px' }}>
              <select style={selectStyle as any} value={categorie} onChange={e => setCategorie(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Variante / Couleur (optionnel)" style={{ flex: '1 1 130px' }}>
              <input
                style={inputStyle as any}
                value={couleur}
                onChange={e => setCouleur(e.target.value)}
                placeholder="Ex: Noir, Rose, V1..."
              />
            </Field>

            <Field label="Seuil d'alerte stock (min)" style={{ flex: '1 1 110px' }}>
              <input
                type="number"
                min="0"
                style={inputStyle as any}
                value={seuilMin}
                onChange={e => setSeuilMin(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Fournisseur rattaché">
            <select
              style={selectStyle as any}
              value={fournisseurId}
              onChange={e => setFournisseurId(e.target.value)}
            >
              <option value="">-- Aucun fournisseur rattaché --</option>
              {fournisseurs.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.nom} {f.plateforme ? `(${f.plateforme})` : ''} {f.contact ? `- ${f.contact}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Section Ajustement Financier & Rentabilité */}
        <div style={{ background: '#FAF7F2', padding: 12, borderRadius: 8, border: '1px solid #EAE2D4', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D5A6C', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calculator size={15} />
            <span>Ajustement des coûts et du prix de vente</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Field label="Prix d'achat Chine (¥)" style={{ flex: '1 1 110px' }}>
              <input
                type="number"
                step="any"
                style={inputStyle as any}
                value={puRmb}
                onChange={e => setPuRmb(e.target.value)}
                placeholder="Ex: 25"
              />
            </Field>

            <Field label="Taux (Ar/¥)" style={{ flex: '1 1 90px' }}>
              <input
                type="number"
                style={inputStyle as any}
                value={tauxRmb}
                onChange={e => setTauxRmb(e.target.value)}
              />
            </Field>

            <Field label="Poids unitaire (Kg)" style={{ flex: '1 1 100px' }}>
              <input
                type="number"
                step="any"
                style={inputStyle as any}
                value={poidsKg}
                onChange={e => setPoidsKg(e.target.value)}
              />
            </Field>

            <Field label="Tarif Fret (Ar/Kg)" style={{ flex: '1 1 110px' }}>
              <input
                type="number"
                style={inputStyle as any}
                value={tarifFretArKg}
                onChange={e => setTarifFretArKg(e.target.value)}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Prix de vente public en Stock (Ar)" style={{ flex: '2 1 180px' }}>
              <input
                type="number"
                style={{ ...inputStyle, fontWeight: 700, color: '#26333D', fontSize: 14 } as any}
                value={prixVente}
                onChange={e => setPrixVente(e.target.value)}
                placeholder="Ex: 45000"
              />
            </Field>

            {/* Boutons d'aide au pricing rapide */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
              <button
                type="button"
                onClick={() => appliquerMargeCible(40)}
                style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, background: '#FFFFFF', border: '1px solid #EAE2D4' }}
                title="Fixer un prix pour obtenir 40% de marge brute"
              >
                Marge 40%
              </button>
              <button
                type="button"
                onClick={() => appliquerMargeCible(50)}
                style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, background: '#FFFFFF', border: '1px solid #EAE2D4' }}
                title="Fixer un prix pour obtenir 50% de marge brute"
              >
                Marge 50%
              </button>
              <button
                type="button"
                onClick={() => appliquerArrondi(1000)}
                style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, background: '#FFFFFF', border: '1px solid #EAE2D4' }}
                title="Arrondir aux 1 000 Ar les plus proches"
              >
                Arrondir 1k
              </button>
              <button
                type="button"
                onClick={() => appliquerArrondi(5000)}
                style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, background: '#FFFFFF', border: '1px solid #EAE2D4' }}
                title="Arrondir aux 5 000 Ar les plus proches"
              >
                Arrondir 5k
              </button>
            </div>
          </div>

          {/* Synthèse dynamique de la rentabilité finale */}
          <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 8, border: '1px solid #EAE2D4', fontSize: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span>Achat : {prixAchatAr > 0 ? `${prixAchatAr.toLocaleString('fr-FR')} Ar` : '0 Ar'}</span>
              <span style={{ margin: '0 6px', color: '#8A8375' }}>+</span>
              <span>Fret : {fraisFretAr > 0 ? `${fraisFretAr.toLocaleString('fr-FR')} Ar` : '0 Ar'}</span>
              <span style={{ margin: '0 6px', color: '#8A8375' }}>=</span>
              <span>Coût Total : <strong style={{ color: '#3D5A6C' }}>{coutTotalRenduAr.toLocaleString('fr-FR')} Ar</strong></span>
            </div>

            {prixVenteVal > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 700 }}>
                <span style={{ color: margeBruteAr > 0 ? '#3F7A5C' : '#C24A3F' }}>
                  Marge : {margeBruteAr > 0 ? '+' : ''}{margeBruteAr.toLocaleString('fr-FR')} Ar ({tauxMarge}%)
                </span>
                <span style={{ color: '#8A8375', fontSize: 11 }}>Coeff x{coefficientMultiplicateur}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Annuler
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={!nom.trim()}
            style={{
              ...primaryBtn,
              background: '#3F7A5C',
              opacity: !nom.trim() ? 0.5 : 1,
            }}
          >
            <PackageCheck size={14} />
            <span>{exactMatch ? 'Créer comme nouvelle variante' : 'Confirmer & Ajouter au Stock'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
