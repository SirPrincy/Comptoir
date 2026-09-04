import React from 'react';
import { Camera, X, Eye, EyeOff } from 'lucide-react';
import { Card, Field, inputStyle, selectStyle, primaryBtn } from '../ui';
import { CATEGORIES } from '../constants';
import { compressAndReadFile } from './stockUtils';

interface ProductFormProps {
  editingId: string | null;
  form: {
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
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  existingCategories: string[];
  onSubmit: () => void;
}

export default function ProductForm({
  editingId,
  form,
  setForm,
  existingCategories,
  onSubmit,
}: ProductFormProps) {
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

    setForm((prev: any) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 3),
    }));

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3D5A6C', marginBottom: 10 }}>
        {editingId ? '✏️ Modifier le produit' : '➕ Nouveau produit'}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Nom article (vente)" style={{ flex: '2 1 180px' }}>
          <input
            style={inputStyle as any}
            value={form.nom}
            onChange={e => setForm((prev: any) => ({ ...prev, nom: e.target.value }))}
            placeholder="Sac à main modèle X"
          />
        </Field>
        <Field label="Réf. / SKU 1688 / Taobao" style={{ flex: '1 1 140px' }}>
          <input
            style={inputStyle as any}
            value={form.reference}
            onChange={e => setForm((prev: any) => ({ ...prev, reference: e.target.value }))}
            placeholder="SKU fournisseur"
          />
        </Field>
        <Field label="Catégorie" style={{ flex: '1 1 140px' }}>
          <select
            style={selectStyle as any}
            value={form.categorie}
            onChange={e => setForm((prev: any) => ({ ...prev, categorie: e.target.value }))}
          >
            {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="+ Autre catégorie">+ Saisir une nouvelle catégorie...</option>
          </select>
        </Field>

        {form.categorie === '+ Autre catégorie' && (
          <Field label="Nom nouvelle catégorie" style={{ flex: '1 1 150px' }}>
            <input
              style={inputStyle as any}
              value={form.customCategorie}
              onChange={e => setForm((prev: any) => ({ ...prev, customCategorie: e.target.value }))}
              placeholder="Ex: Chaussures, Bijoux..."
            />
          </Field>
        )}

        <Field label="Prix Achat Est. (Ar)" style={{ flex: '1 1 120px' }}>
          <input
            type="number"
            style={inputStyle as any}
            value={form.prixAchatAr}
            onChange={e => setForm((prev: any) => ({ ...prev, prixAchatAr: e.target.value }))}
            placeholder="Ex: 25000"
          />
        </Field>

        <Field label="Prix Vente Cible (Ar)" style={{ flex: '1 1 120px' }}>
          <input
            type="number"
            style={inputStyle as any}
            value={form.prixVente}
            onChange={e => setForm((prev: any) => ({ ...prev, prixVente: e.target.value }))}
            placeholder="Ex: 45000"
          />
        </Field>

        <Field label="Seuil d'alerte min" style={{ flex: '1 1 100px' }}>
          <input
            type="number"
            min={0}
            style={{ ...inputStyle, fontWeight: 700, color: '#C24A3F' } as any}
            value={form.seuilMin}
            onChange={e => setForm((prev: any) => ({ ...prev, seuilMin: e.target.value }))}
            placeholder="Ex: 3"
          />
        </Field>

        <Field label="Couleur / Var." style={{ flex: '1 1 100px' }}>
          <input
            style={inputStyle as any}
            value={form.couleur}
            onChange={e => setForm((prev: any) => ({ ...prev, couleur: e.target.value }))}
            placeholder="Noir / Rouge"
          />
        </Field>

        {editingId && (
          <div
            style={{
              flex: '1 1 100%',
              marginTop: 6,
              padding: '12px 16px',
              background: form.isArchive ? '#FAF6F4' : '#FDFBF9',
              borderRadius: 10,
              border: `1px solid ${form.isArchive ? '#EAD6D0' : '#EAE2D4'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: form.isArchive ? '#F6E3DE' : '#F2EDE4',
                  color: form.isArchive ? '#991B1B' : '#736B5E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {form.isArchive ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.isArchive ? '#991B1B' : '#26333D', letterSpacing: '-0.01em' }}>
                  {form.isArchive ? 'Article masqué / archivé (Fin de cycle)' : 'Visibilité du produit dans le catalogue'}
                </div>
                <div style={{ fontSize: 11.5, color: '#736B5E', marginTop: 2, lineHeight: 1.35 }}>
                  {form.isArchive
                    ? 'Masqué du catalogue actif : aucune notification de rupture ni proposition de réassort.'
                    : 'Actif dans les flux. Cochez pour masquer et couper les alertes de réapprovisionnement.'}
                </div>
              </div>
            </div>

            {/* Switch Toggle moderne */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div
                onClick={() => setForm((prev: any) => ({ ...prev, isArchive: !prev.isArchive }))}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: form.isArchive ? '#C24A3F' : '#D1C9BC',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: form.isArchive ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: form.isArchive ? '#991B1B' : '#5E584E', whiteSpace: 'nowrap' }}>
                {form.isArchive ? 'Masqué' : 'Visible'}
              </span>
            </label>
          </div>
        )}

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
            Sélectionnez 1 à 3 images depuis votre appareil (JPG, PNG, WEBP).
          </div>
        </Field>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onSubmit} style={{ ...primaryBtn, height: 38, padding: '0 20px' }}>
            {editingId ? 'Mettre à jour' : 'Ajouter le produit'}
          </button>
        </div>
      </div>
    </Card>
  );
}
