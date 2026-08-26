import React, { useState } from 'react';
import { Truck, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { TYPES_ENVOI_AERIEN, TYPES_ENVOI_MARITIME, uid } from '../constants';
import { Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';

export interface TarifFret {
  id: string;
  mode: 'Aérien' | 'Maritime';
  typeEnvoi: string; // Ex: Normal, Fragile, Batterie, Téléphone...
  prix: string;      // Ex: 12 $/kg, 55 000 Ar/kg, 450 $/m³
  delai?: string;    // Ex: 10-15 jours
}

/**
 * Nettoie et valide rigoureusement une liste de tarifs :
 * - Élimine les tarifs avec un prix vide ou un typeEnvoi vide
 * - Trim les chaînes de caractères
 */
export function sanitizeTarifs(tarifs?: TarifFret[]): TarifFret[] {
  if (!Array.isArray(tarifs)) return [];
  return tarifs
    .filter(t => t && typeof t === 'object')
    .map(t => ({
      id: t.id || uid(),
      mode: (t.mode === 'Maritime' ? 'Maritime' : 'Aérien') as 'Aérien' | 'Maritime',
      typeEnvoi: (t.typeEnvoi || '').trim(),
      prix: (t.prix || '').trim(),
      delai: (t.delai || '').trim() || undefined,
    }))
    .filter(t => t.prix.length > 0 && t.typeEnvoi.length > 0);
}

interface TarifFretFormProps {
  tarifs?: TarifFret[];
  onChange: (tarifs: TarifFret[]) => void;
  prixFretFallback?: string;
}

export default function TarifFretForm({
  tarifs = [],
  onChange,
  prixFretFallback,
}: TarifFretFormProps) {
  // Mode ajout
  const [mode, setMode] = useState<'Aérien' | 'Maritime'>('Aérien');
  const [typeEnvoi, setTypeEnvoi] = useState<string>(TYPES_ENVOI_AERIEN[0]);
  const [customType, setCustomType] = useState<string>('');
  const [prix, setPrix] = useState<string>('');
  const [delai, setDelai] = useState<string>('');

  // Mode modification inline d'un tarif existant
  const [editingTarifId, setEditingTarifId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'Aérien' | 'Maritime'>('Aérien');
  const [editTypeEnvoi, setEditTypeEnvoi] = useState<string>('');
  const [editCustomType, setEditCustomType] = useState<string>('');
  const [editPrix, setEditPrix] = useState<string>('');
  const [editDelai, setEditDelai] = useState<string>('');

  const handleModeChange = (nouveauMode: 'Aérien' | 'Maritime') => {
    setMode(nouveauMode);
    setTypeEnvoi(nouveauMode === 'Aérien' ? TYPES_ENVOI_AERIEN[0] : TYPES_ENVOI_MARITIME[0]);
    setCustomType('');
  };

  const handleAjouterTarif = () => {
    const typeFinal = typeEnvoi === 'Autre' ? customType.trim() : typeEnvoi;
    if (!typeFinal || !prix.trim()) return;

    const nouveauTarif: TarifFret = {
      id: uid(),
      mode,
      typeEnvoi: typeFinal,
      prix: prix.trim(),
      delai: delai.trim() || undefined,
    };

    onChange([...tarifs, nouveauTarif]);
    setPrix('');
    setDelai('');
    setCustomType('');
  };

  const handleSupprimerTarif = (tarifId: string) => {
    onChange(tarifs.filter(t => t.id !== tarifId));
    if (editingTarifId === tarifId) {
      setEditingTarifId(null);
    }
  };

  const startEditTarif = (t: TarifFret) => {
    setEditingTarifId(t.id);
    setEditMode(t.mode);
    const standardTypes = t.mode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME;
    if (standardTypes.includes(t.typeEnvoi)) {
      setEditTypeEnvoi(t.typeEnvoi);
      setEditCustomType('');
    } else {
      setEditTypeEnvoi('Autre');
      setEditCustomType(t.typeEnvoi);
    }
    setEditPrix(t.prix);
    setEditDelai(t.delai || '');
  };

  const handleSaveEditTarif = (tarifId: string) => {
    const typeFinal = editTypeEnvoi === 'Autre' ? editCustomType.trim() : editTypeEnvoi;
    if (!typeFinal || !editPrix.trim()) return;

    const updatedTarifs = tarifs.map(t => {
      if (t.id === tarifId) {
        return {
          ...t,
          mode: editMode,
          typeEnvoi: typeFinal,
          prix: editPrix.trim(),
          delai: editDelai.trim() || undefined,
        };
      }
      return t;
    });

    onChange(updatedTarifs);
    setEditingTarifId(null);
  };

  const handleCancelEditTarif = () => {
    setEditingTarifId(null);
  };

  return (
    <div
      style={{
        marginTop: 10,
        background: '#F8F6F0',
        padding: 12,
        borderRadius: 8,
        border: '1px solid #EAE3D2',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#2C5E43',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Truck size={15} /> Tarifs de fret par mode & type d'envoi (référence Logistique)
      </div>

      {/* Formulaire d'ajout rapide de tarif */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          marginBottom: 10,
        }}
      >
        <Field label="Mode" style={{ flex: '1 1 95px', minWidth: 85 }}>
          <select
            style={selectStyle as any}
            value={mode}
            onChange={e => handleModeChange(e.target.value as 'Aérien' | 'Maritime')}
          >
            <option value="Aérien">✈️ Aérien</option>
            <option value="Maritime">🚢 Maritime</option>
          </select>
        </Field>

        <Field label="Type d'envoi" style={{ flex: '1 1 110px', minWidth: 95 }}>
          <select
            style={selectStyle as any}
            value={typeEnvoi}
            onChange={e => setTypeEnvoi(e.target.value)}
          >
            {(mode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME).map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="Autre">Autre...</option>
          </select>
        </Field>

        {typeEnvoi === 'Autre' && (
          <Field label="Préciser" style={{ flex: '1 1 90px', minWidth: 80 }}>
            <input
              style={inputStyle as any}
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="Ex: Électronique"
            />
          </Field>
        )}

        <Field
          label={mode === 'Aérien' ? 'Tarif (Ar / kg)' : 'Tarif ($ / m³)'}
          style={{ flex: '1 1 120px', minWidth: 95 }}
        >
          <input
            style={inputStyle as any}
            value={prix}
            onChange={e => setPrix(e.target.value)}
            placeholder={mode === 'Aérien' ? 'ex: 60 000 Ar/kg' : 'ex: 450 $/m³'}
          />
        </Field>

        <Field label="Délai" style={{ flex: '1 1 85px', minWidth: 75 }}>
          <input
            style={inputStyle as any}
            value={delai}
            onChange={e => setDelai(e.target.value)}
            placeholder={mode === 'Aérien' ? '10-15j' : '60-90j'}
          />
        </Field>

        <button
          type="button"
          onClick={handleAjouterTarif}
          disabled={!prix.trim() || (typeEnvoi === 'Autre' && !customType.trim())}
          style={{
            ...primaryBtn,
            background: '#2C5E43',
            height: 38,
            padding: '0 12px',
            flexShrink: 0,
            opacity: prix.trim() && (typeEnvoi !== 'Autre' || customType.trim()) ? 1 : 0.6,
            cursor: prix.trim() && (typeEnvoi !== 'Autre' || customType.trim()) ? 'pointer' : 'not-allowed',
          }}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Liste des tarifs configurés avec option de modification */}
      {tarifs && tarifs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tarifs.map(t => {
            const isEditing = editingTarifId === t.id;

            if (isEditing) {
              return (
                <div
                  key={t.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #2C5E43',
                    borderRadius: 6,
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      style={{ ...selectStyle, height: 30, fontSize: 11.5, flex: '1 1 80px' } as any}
                      value={editMode}
                      onChange={e => {
                        const nm = e.target.value as 'Aérien' | 'Maritime';
                        setEditMode(nm);
                        setEditTypeEnvoi(nm === 'Aérien' ? TYPES_ENVOI_AERIEN[0] : TYPES_ENVOI_MARITIME[0]);
                        setEditCustomType('');
                      }}
                    >
                      <option value="Aérien">✈️ Aérien</option>
                      <option value="Maritime">🚢 Maritime</option>
                    </select>

                    <select
                      style={{ ...selectStyle, height: 30, fontSize: 11.5, flex: '1 1 95px' } as any}
                      value={editTypeEnvoi}
                      onChange={e => setEditTypeEnvoi(e.target.value)}
                    >
                      {(editMode === 'Aérien' ? TYPES_ENVOI_AERIEN : TYPES_ENVOI_MARITIME).map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                      <option value="Autre">Autre...</option>
                    </select>

                    {editTypeEnvoi === 'Autre' && (
                      <input
                        style={{ ...inputStyle, height: 30, fontSize: 11.5, flex: '1 1 80px' } as any}
                        value={editCustomType}
                        onChange={e => setEditCustomType(e.target.value)}
                        placeholder="Préciser"
                      />
                    )}

                    <input
                      style={{ ...inputStyle, height: 30, fontSize: 11.5, flex: '1 1 100px', fontWeight: 600 } as any}
                      value={editPrix}
                      onChange={e => setEditPrix(e.target.value)}
                      placeholder="Prix"
                    />

                    <input
                      style={{ ...inputStyle, height: 30, fontSize: 11.5, flex: '1 1 70px' } as any}
                      value={editDelai}
                      onChange={e => setEditDelai(e.target.value)}
                      placeholder="Délai"
                    />

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleSaveEditTarif(t.id)}
                        disabled={!editPrix.trim() || (editTypeEnvoi === 'Autre' && !editCustomType.trim())}
                        style={{
                          ...primaryBtn,
                          background: '#2C5E43',
                          height: 30,
                          padding: '0 8px',
                          fontSize: 11,
                        }}
                        title="Valider la modification"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditTarif}
                        style={{
                          ...ghostBtn,
                          height: 30,
                          padding: '0 8px',
                          fontSize: 11,
                        }}
                        title="Annuler"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={t.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D4E3DA',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ color: '#1B2A4A' }}>
                    {t.mode === 'Aérien' ? '✈️ Aérien' : '🚢 Maritime'} ({t.typeEnvoi})
                  </strong>{' '}
                  :{' '}
                  <span style={{ color: '#2C5E43', fontWeight: 600 }}>{t.prix}</span>
                  {t.delai && (
                    <span style={{ color: '#8A8375', marginLeft: 6 }}>({t.delai})</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => startEditTarif(t)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#5B7B88',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 4,
                    }}
                    title="Modifier ce tarif"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSupprimerTarif(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#C24A3F',
                      padding: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 4,
                    }}
                    title="Supprimer ce tarif"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#8A8375', fontStyle: 'italic' }}>
          {prixFretFallback ? `Tarif général : ${prixFretFallback}` : 'Aucun tarif spécifique enregistré.'}
        </div>
      )}
    </div>
  );
}
