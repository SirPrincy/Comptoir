import React, { useState } from 'react';
import { Card, Field, Label, inputStyle, selectStyle, primaryBtn } from '../ui';
import { uid } from '../constants';
import { Client, ClientCategory, CLIENT_CATEGORIES } from './types';

interface ClientFormProps {
  onAdd: (client: Client) => void;
}

export default function ClientForm({ onAdd }: ClientFormProps) {
  const [form, setForm] = useState<{
    nom: string;
    contact: string;
    notes: string;
    categorie: ClientCategory;
  }>({
    nom: '',
    contact: '',
    notes: '',
    categorie: 'particulier',
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nomTrim = form.nom.trim();
    if (!nomTrim) return;

    onAdd({
      id: uid(),
      nom: nomTrim,
      contact: form.contact.trim(),
      notes: form.notes.trim(),
      categorie: form.categorie,
      dateCreation: new Date().toISOString(),
    });

    setForm({ nom: '', contact: '', notes: '', categorie: 'particulier' });
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Nom du client *" style={{ flex: '2 1 160px' }}>
            <input
              style={inputStyle as any}
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom ou pseudo (ex: Rina, Toky...)"
              autoFocus
            />
          </Field>

          <Field label="Contact (Tél / WhatsApp / FB)" style={{ flex: '1.5 1 150px' }}>
            <input
              style={inputStyle as any}
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              placeholder="ex: 034 12 345 67"
            />
          </Field>

          <Field label="Catégorie / Profil" style={{ flex: '1.2 1 140px' }}>
            <select
              style={selectStyle as any}
              value={form.categorie}
              onChange={e => setForm({ ...form, categorie: e.target.value as ClientCategory })}
            >
              {CLIENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={!form.nom.trim()}
            style={{
              ...primaryBtn,
              height: 38,
              alignSelf: 'flex-end',
              opacity: form.nom.trim() ? 1 : 0.6,
              cursor: form.nom.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Ajouter
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <Label>Notes & Préférences</Label>
          <input
            style={inputStyle as any}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Client fidèle, revendeur, adresse de livraison, préférences..."
          />
        </div>
      </form>
    </Card>
  );
}
