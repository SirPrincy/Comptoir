import React, { useState, useEffect } from 'react';
import { Modal, Field, inputStyle, selectStyle, primaryBtn, ghostBtn } from '../ui';
import { Client, ClientCategory, CLIENT_CATEGORIES } from './types';

interface ModalEditClientProps {
  client: Client | null;
  onClose: () => void;
  onSave: (updated: Client) => void;
}

export default function ModalEditClient({ client, onClose, onSave }: ModalEditClientProps) {
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

  useEffect(() => {
    if (client) {
      setForm({
        nom: client.nom || '',
        contact: client.contact || '',
        notes: client.notes || '',
        categorie: client.categorie || 'particulier',
      });
    }
  }, [client]);

  if (!client) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nomTrim = form.nom.trim();
    if (!nomTrim) return;

    onSave({
      ...client,
      nom: nomTrim,
      contact: form.contact.trim(),
      notes: form.notes.trim(),
      categorie: form.categorie,
    });
  };

  return (
    <Modal title={`Modifier le client : ${client.nom}`} onClose={onClose}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nom du client *">
          <input
            style={inputStyle as any}
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
            placeholder="Nom du client"
            autoFocus
          />
        </Field>

        <Field label="Contact (Téléphone, WhatsApp, Facebook)">
          <input
            style={inputStyle as any}
            value={form.contact}
            onChange={e => setForm({ ...form, contact: e.target.value })}
            placeholder="ex: 034 00 000 00"
          />
        </Field>

        <Field label="Catégorie / Profil">
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

        <Field label="Notes & Préférences">
          <input
            style={inputStyle as any}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes..."
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={ghostBtn as any}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={!form.nom.trim()}
            style={{
              ...primaryBtn,
              opacity: form.nom.trim() ? 1 : 0.6,
              cursor: form.nom.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </Modal>
  );
}
