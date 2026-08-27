import React, { useState, useMemo } from 'react';
import { Target, Plus, Trash2, Edit2, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Building, Users, Wifi, Zap, Award, HelpCircle } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { uid } from '../constants';
import { Card, Field, Modal, Stat, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn, rowCard, Empty } from '../ui';
import { getProductCostBreakdown } from '../pnl/pnlUtils';

export interface ChargeFixe {
  id: string;
  nom: string;
  categorie: string;
  montantMensuel: number;
  frequence: 'Mensuel' | 'Trimestriel' | 'Annuel';
  notes?: string;
  actif: boolean;
}

export const CATEGORIES_CHARGES_FIXES = [
  'Loyer & Local',
  'Salaires & Personnel',
  'Eau, Électricité & Utilities',
  'Connexion & Téléphonie',
  'Marketing & Pub Récurrent',
  'Abonnements & Logiciels',
  'Services & Honoraires',
  'Divers & Impôts',
];

const DEFAULT_PRESETS = [
  { nom: 'Loyer boutique / Dépôt', categorie: 'Loyer & Local', montantMensuel: 500000 },
  { nom: 'Salaires équipe', categorie: 'Salaires & Personnel', montantMensuel: 1200000 },
  { nom: 'Électricité & Eau (JIRAMA)', categorie: 'Eau, Électricité & Utilities', montantMensuel: 120000 },
  { nom: 'Internet Fibre & Flotte Mobile', categorie: 'Connexion & Téléphonie', montantMensuel: 150000 },
  { nom: 'Budget Marketing Facebook / Insta', categorie: 'Marketing & Pub Récurrent', montantMensuel: 300000 },
];

interface ChargesFixesProps {
  chargesFixes?: ChargeFixe[];
  ventes?: any[];
  products?: any[];
  commandes?: any[];
  updateData: (patch: any) => void;
}

export default function ChargesFixes({
  chargesFixes = [],
  ventes = [],
  products = [],
  commandes = [],
  updateData,
}: ChargesFixesProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChargeFixe | null>(null);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    categorie: CATEGORIES_CHARGES_FIXES[0],
    montantMensuel: '',
    frequence: 'Mensuel' as 'Mensuel' | 'Trimestriel' | 'Annuel',
    notes: '',
    actif: true,
  });

  const resetForm = () => {
    setForm({
      nom: '',
      categorie: CATEGORIES_CHARGES_FIXES[0],
      montantMensuel: '',
      frequence: 'Mensuel',
      notes: '',
      actif: true,
    });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (item: ChargeFixe) => {
    setEditingItem(item);
    setForm({
      nom: item.nom || '',
      categorie: item.categorie || CATEGORIES_CHARGES_FIXES[0],
      montantMensuel: item.montantMensuel ? String(item.montantMensuel) : '',
      frequence: item.frequence || 'Mensuel',
      notes: item.notes || '',
      actif: item.actif !== false,
    });
    setShowModal(true);
  };

  const handleAddPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    const newItem: ChargeFixe = {
      id: uid(),
      nom: preset.nom,
      categorie: preset.categorie,
      montantMensuel: preset.montantMensuel,
      frequence: 'Mensuel',
      actif: true,
    };
    updateData({ chargesFixes: [newItem, ...chargesFixes] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.montantMensuel) return;

    const mnt = parseFloat(form.montantMensuel) || 0;
    if (mnt <= 0) return;

    let next = [...chargesFixes];

    if (editingItem) {
      next = next.map((c) =>
        c.id === editingItem.id
          ? {
              ...c,
              nom: form.nom.trim(),
              categorie: form.categorie,
              montantMensuel: mnt,
              frequence: form.frequence,
              notes: form.notes.trim(),
              actif: form.actif,
            }
          : c
      );
    } else {
      const newItem: ChargeFixe = {
        id: uid(),
        nom: form.nom.trim(),
        categorie: form.categorie,
        montantMensuel: mnt,
        frequence: form.frequence,
        notes: form.notes.trim(),
        actif: form.actif,
      };
      next = [newItem, ...next];
    }

    updateData({ chargesFixes: next });
    setShowModal(false);
    resetForm();
  };

  const handleToggleActif = (id: string) => {
    const next = chargesFixes.map((c) => (c.id === id ? { ...c, actif: !c.actif } : c));
    updateData({ chargesFixes: next });
  };

  const handleDelete = (id: string) => {
    const next = chargesFixes.filter((c) => c.id !== id);
    updateData({ chargesFixes: next });
  };

  // Calcul du mois en cours
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Ventes du mois en cours
  const ventesMois = useMemo(() => {
    return ventes.filter((v) => v.date && v.date.startsWith(currentMonthStr));
  }, [ventes, currentMonthStr]);

  // Performance du mois (CA, COGS, Marge Brute)
  const statsMois = useMemo(() => {
    let ca = 0;
    let cogs = 0;

    ventesMois.forEach((v) => {
      const tot = Number(v.total) || 0;
      ca += tot;

      const { coutRevient } = getProductCostBreakdown(v.productId, products, commandes);
      const qty = Number(v.qty) || 1;
      cogs += coutRevient * qty;
    });

    const margeBrute = Math.max(0, ca - cogs);
    const tauxMargePct = ca > 0 ? (margeBrute / ca) * 100 : 35; // Default 35% margin rate if no sales yet

    return { ca, cogs, margeBrute, tauxMargePct };
  }, [ventesMois, products, commandes]);

  // Total des charges fixes mensuelles
  const totalChargesFixes = useMemo(() => {
    return chargesFixes
      .filter((c) => c.actif !== false)
      .reduce((sum, c) => {
        let mnt = Number(c.montantMensuel) || 0;
        if (c.frequence === 'Trimestriel') mnt = mnt / 3;
        if (c.frequence === 'Annuel') mnt = mnt / 12;
        return sum + mnt;
      }, 0);
  }, [chargesFixes]);

  // Progression & Seuil de rentabilité
  const couverturePct = totalChargesFixes > 0 ? Math.min(100, Math.round((statsMois.margeBrute / totalChargesFixes) * 100)) : 100;
  const margeRestante = Math.max(0, totalChargesFixes - statsMois.margeBrute);
  const tauxMargeDecimal = statsMois.tauxMargePct > 0 ? statsMois.tauxMargePct / 100 : 0.35;
  const pointMortCA = Math.round(totalChargesFixes / tauxMargeDecimal);
  const caRestantEstime = Math.round(margeRestante / tauxMargeDecimal);
  const estAtteint = statsMois.margeBrute >= totalChargesFixes && totalChargesFixes > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} style={{ color: THEME.accent.primary }} />
            Charges Fixes & Seuil de Rentabilité (Point Mort)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Suivi des frais mensuels récurrents (loyer, salaires, électricité) pour savoir si la marge brute couvre la structure.
          </p>
        </div>

        <button onClick={handleOpenAdd} style={{ ...primaryBtn, gap: 6 }}>
          <Plus size={16} />
          Ajouter une Charge Fixe
        </button>
      </div>

      {/* BANNER PRINCIPAL : OBJECTIF & PROGRESSION DU MOIS */}
      <Card
        style={{
          padding: 18,
          background: estAtteint ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
          borderColor: estAtteint ? THEME.accent.green : THEME.accent.primary,
          borderWidth: 2,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {estAtteint ? (
                <Award size={22} style={{ color: THEME.accent.green }} />
              ) : (
                <Target size={22} style={{ color: THEME.accent.primary }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', tracking: '0.05em', color: estAtteint ? THEME.accent.green : THEME.accent.primary }}>
                {estAtteint ? 'Seuil de Rentabilité Atteint !' : 'Objectif Couverture Frais Fixes (Ce Mois)'}
              </span>
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text.primary, lineHeight: 1.3 }}>
              {totalChargesFixes === 0 ? (
                "Aucune charge fixe enregistrée. Saisissez vos frais récurrents pour définir votre objectif de marge."
              ) : estAtteint ? (
                `🎉 Vos charges fixes de ${totalChargesFixes.toLocaleString()} Ar sont 100% couvertes par votre marge brute ! Chaque nouvelle vente génère du bénéfice net.`
              ) : (
                `Objectif : Vous devez faire ${totalChargesFixes.toLocaleString()} Ar de marge brute ce mois-ci. Vous en êtes à ${couverturePct}%.`
              )}
            </div>

            {totalChargesFixes > 0 && !estAtteint && (
              <div style={{ fontSize: 13, color: THEME.text.secondary, marginTop: 8 }}>
                Marge brute encore nécessaire : <strong>{margeRestante.toLocaleString()} Ar</strong> (soit environ <strong>{caRestantEstime.toLocaleString()} Ar</strong> de Chiffre d'Affaires supplémentaire).
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: 160 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: estAtteint ? THEME.accent.green : THEME.accent.primary }}>
              {couverturePct}%
            </div>
            <div style={{ fontSize: 12, color: THEME.text.muted, fontWeight: 600 }}>
              {statsMois.margeBrute.toLocaleString()} Ar / {totalChargesFixes.toLocaleString()} Ar
            </div>
          </div>
        </div>

        {/* Barre de progression visuelle */}
        {totalChargesFixes > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 10, width: '100%', background: THEME.bg.soft, borderRadius: 5, overflow: 'hidden', border: `1px solid ${THEME.border.base}` }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (statsMois.margeBrute / totalChargesFixes) * 100)}%`,
                  background: estAtteint ? THEME.accent.green : 'linear-gradient(90deg, #3b82f6 0%, #f59e0b 100%)',
                  borderRadius: 5,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Stat
          label="Total Charges Fixes / mois"
          value={`${totalChargesFixes.toLocaleString()} Ar`}
          subvalue={`${chargesFixes.filter((c) => c.actif !== false).length} poste(s) actif(s)`}
          icon={Building}
          color={THEME.accent.orange}
        />
        <Stat
          label="Marge Brute Réalisée (Mois)"
          value={`${statsMois.margeBrute.toLocaleString()} Ar`}
          subvalue={`Sur ${statsMois.ca.toLocaleString()} Ar de CA`}
          icon={TrendingUp}
          color={THEME.accent.green}
        />
        <Stat
          label="Point Mort (CA Seuil)"
          value={`${pointMortCA.toLocaleString()} Ar`}
          subvalue={`Taux de marge moyen : ${Math.round(statsMois.tauxMargePct)}%`}
          icon={Target}
          color={THEME.accent.primary}
        />
        <Stat
          label="Reste à Couvrir (Marge)"
          value={`${margeRestante.toLocaleString()} Ar`}
          subvalue={margeRestante === 0 ? 'Objectif atteint !' : `Env. ${caRestantEstime.toLocaleString()} Ar de CA`}
          icon={DollarSign}
          color={margeRestante === 0 ? THEME.accent.green : THEME.accent.danger}
        />
      </div>

      {/* Raccourcis d'ajout rapide (Presets) si peu ou pas de charges */}
      {chargesFixes.length < 3 && (
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={15} style={{ color: THEME.accent.orange }} />
            Ajout Rapide de Charges Courantes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEFAULT_PRESETS.map((p) => {
              const alreadyExists = chargesFixes.some((c) => c.nom.toLowerCase() === p.nom.toLowerCase());
              if (alreadyExists) return null;
              return (
                <button
                  key={p.nom}
                  onClick={() => handleAddPreset(p)}
                  style={{
                    ...ghostBtn,
                    fontSize: 12,
                    padding: '6px 12px',
                    borderColor: THEME.border.strong,
                    gap: 6,
                  }}
                >
                  <Plus size={13} />
                  {p.nom} ({p.montantMensuel.toLocaleString()} Ar/m)
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Liste des charges fixes */}
      {chargesFixes.length === 0 ? (
        <Empty text="Aucune charge fixe enregistrée. Utilisez les boutons d'ajout rapide ci-dessus ou créez vos propres postes de charges." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chargesFixes.map((item) => {
            const isActif = item.actif !== false;
            let mntMensuel = Number(item.montantMensuel) || 0;
            if (item.frequence === 'Trimestriel') mntMensuel = mntMensuel / 3;
            if (item.frequence === 'Annuel') mntMensuel = mntMensuel / 12;

            return (
              <div
                key={item.id}
                style={{
                  ...rowCard,
                  padding: '12px 16px',
                  opacity: isActif ? 1 : 0.5,
                  borderLeft: `4px solid ${isActif ? THEME.accent.primary : THEME.text.muted}`,
                }}
              >
                {/* Infos principales */}
                <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: THEME.bg.soft,
                        color: THEME.text.primary,
                        border: `1px solid ${THEME.border.strong}`,
                      }}
                    >
                      {item.categorie}
                    </span>
                    <span style={{ fontSize: 11.5, color: THEME.text.muted }}>
                      Fréquence : {item.frequence}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
                    {item.nom}
                  </div>

                  {item.notes && (
                    <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2 }}>
                      {item.notes}
                    </div>
                  )}
                </div>

                {/* Montant & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text.primary }}>
                      {item.montantMensuel.toLocaleString()} Ar
                      <span style={{ fontSize: 11, fontWeight: 500, color: THEME.text.muted }}>
                        {item.frequence === 'Trimestriel' ? ' / trim.' : item.frequence === 'Annuel' ? ' / an' : ' / mois'}
                      </span>
                    </div>
                    {item.frequence !== 'Mensuel' && (
                      <div style={{ fontSize: 11, color: THEME.text.muted }}>
                        Eq. mensuel : {Math.round(mntMensuel).toLocaleString()} Ar/mois
                      </div>
                    )}
                  </div>

                  {/* Interrupteur Actif / Inactif */}
                  <button
                    onClick={() => handleToggleActif(item.id)}
                    style={{
                      ...ghostBtn,
                      padding: '4px 10px',
                      fontSize: 11.5,
                      color: isActif ? THEME.accent.green : THEME.text.muted,
                      borderColor: isActif ? THEME.accent.green : THEME.border.base,
                    }}
                    title={isActif ? 'Désactiver temporairement' : 'Activer cette charge'}
                  >
                    {isActif ? 'Actif' : 'Inactif'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    style={{ ...ghostBtn, padding: '5px 8px', height: 32 }}
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ ...iconBtn }}
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {showModal && (
        <Modal
          title={editingItem ? 'Modifier la Charge Fixe' : 'Ajouter une Charge Fixe'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nom de la charge fixe *">
              <input
                type="text"
                placeholder="Ex: Loyer boutique Analakely, Salaire vendeur, Internet Fibre..."
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                style={inputStyle}
                required
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Catégorie">
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  style={selectStyle}
                >
                  {CATEGORIES_CHARGES_FIXES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fréquence de paiement">
                <select
                  value={form.frequence}
                  onChange={(e) => setForm({ ...form, frequence: e.target.value as any })}
                  style={selectStyle}
                >
                  <option value="Mensuel">Mensuel (chaque mois)</option>
                  <option value="Trimestriel">Trimestriel (tous les 3 mois)</option>
                  <option value="Annuel">Annuel (tous les ans)</option>
                </select>
              </Field>
            </div>

            <Field label="Montant (Ariary) *">
              <input
                type="number"
                placeholder="Ex: 500000"
                value={form.montantMensuel}
                onChange={(e) => setForm({ ...form, montantMensuel: e.target.value })}
                style={inputStyle}
                min="0"
                step="1000"
                required
              />
            </Field>

            <Field label="Notes & Commentaires (Optionnel)">
              <input
                type="text"
                placeholder="Ex: Contrat jusqu'en Décembre, paiement le 5 du mois"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => setShowModal(false)} style={ghostBtn}>
                Annuler
              </button>
              <button type="submit" style={primaryBtn}>
                {editingItem ? 'Mettre à jour' : 'Enregistrer la charge'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
