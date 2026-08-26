import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText, CheckCircle2, Clock, Trash2, Edit2, Wallet, ArrowDownCircle, AlertCircle, DollarSign } from 'lucide-react';
import { THEME } from '../colors';
import { TYPOGRAPHY } from '../fonts';
import { CATEGORIES_FRAIS, COMPTES_FINANCIERS, uid } from '../constants';
import { Card, Field, Label, Modal, Stat, inputStyle, selectStyle, primaryBtn, ghostBtn, iconBtn, rowCard, Empty } from '../ui';

export interface NoteDeFrais {
  id: string;
  date: string;
  categorie: string;
  titre: string;
  montant: number;
  payeur: string;
  compte?: string;
  statut: 'Payé' | 'À rembourser';
  justificatif?: string;
  notes?: string;
  mouvementId?: string;
}

interface NotesDeFraisProps {
  frais?: NoteDeFrais[];
  mouvements?: any[];
  comptes?: string[];
  updateData: (patch: any) => void;
}

export default function NotesDeFrais({
  frais = [],
  mouvements = [],
  comptes = COMPTES_FINANCIERS,
  updateData,
}: NotesDeFraisProps) {
  const activeComptes = comptes && comptes.length > 0 ? comptes : COMPTES_FINANCIERS;
  
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterStatut, setFilterStatut] = useState<'all' | 'Payé' | 'À rembourser'>('all');
  const [filterPeriode, setFilterPeriode] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NoteDeFrais | null>(null);
  const [refundingItem, setRefundingItem] = useState<NoteDeFrais | null>(null);
  const [refundCompte, setRefundCompte] = useState(activeComptes[0] || 'Caisse / Espèces');

  // Today string
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form state
  const [form, setForm] = useState({
    date: todayStr,
    categorie: CATEGORIES_FRAIS[0],
    titre: '',
    montant: '',
    payeur: '',
    statut: 'Payé' as 'Payé' | 'À rembourser',
    compte: activeComptes[0] || 'Caisse / Espèces',
    justificatif: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      date: todayStr,
      categorie: CATEGORIES_FRAIS[0],
      titre: '',
      montant: '',
      payeur: '',
      statut: 'Payé',
      compte: activeComptes[0] || 'Caisse / Espèces',
      justificatif: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (item: NoteDeFrais) => {
    setEditingItem(item);
    setForm({
      date: item.date || todayStr,
      categorie: item.categorie || CATEGORIES_FRAIS[0],
      titre: item.titre || '',
      montant: item.montant ? String(item.montant) : '',
      payeur: item.payeur || '',
      statut: item.statut || 'Payé',
      compte: item.compte || activeComptes[0] || 'Caisse / Espèces',
      justificatif: item.justificatif || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  // Sauvegarde / Ajout de note de frais
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.montant) return;

    const mnt = parseFloat(form.montant) || 0;
    if (mnt <= 0) return;

    let nextFrais = [...frais];
    let nextMouvements = [...mouvements];

    if (editingItem) {
      // Modification
      let mvtId = editingItem.mouvementId;

      // Mettre à jour le mouvement de trésorerie si présent
      if (form.statut === 'Payé' && form.compte) {
        if (mvtId) {
          nextMouvements = nextMouvements.map((m: any) =>
            m.id === mvtId
              ? {
                  ...m,
                  date: form.date,
                  montant: mnt,
                  compte: form.compte,
                  description: `Note de frais : ${form.titre} (${form.categorie})`,
                }
              : m
          );
        } else {
          // Créer mouvement
          mvtId = uid();
          nextMouvements.push({
            id: mvtId,
            date: form.date,
            type: 'sortie',
            montant: mnt,
            compte: form.compte,
            tag: '#notes-de-frais',
            reference: `Frais - ${form.titre}`,
            description: `Note de frais : ${form.titre} (${form.categorie})`,
          });
        }
      } else if (form.statut === 'À rembourser' && mvtId) {
        // Supprimer le mouvement car pas encore payé par la trésorerie
        nextMouvements = nextMouvements.filter((m: any) => m.id !== mvtId);
        mvtId = undefined;
      }

      const updated: NoteDeFrais = {
        ...editingItem,
        date: form.date,
        categorie: form.categorie,
        titre: form.titre.trim(),
        montant: mnt,
        payeur: form.payeur.trim() || 'Entreprise',
        statut: form.statut,
        compte: form.statut === 'Payé' ? form.compte : undefined,
        justificatif: form.justificatif.trim(),
        notes: form.notes.trim(),
        mouvementId: mvtId,
      };

      nextFrais = nextFrais.map((f) => (f.id === editingItem.id ? updated : f));
    } else {
      // Création
      const id = uid();
      let mvtId: string | undefined = undefined;

      if (form.statut === 'Payé' && form.compte) {
        mvtId = uid();
        nextMouvements.push({
          id: mvtId,
          date: form.date,
          type: 'sortie',
          montant: mnt,
          compte: form.compte,
          tag: '#notes-de-frais',
          reference: `Frais - ${form.titre}`,
          description: `Note de frais : ${form.titre} (${form.categorie})`,
        });
      }

      const newItem: NoteDeFrais = {
        id,
        date: form.date,
        categorie: form.categorie,
        titre: form.titre.trim(),
        montant: mnt,
        payeur: form.payeur.trim() || 'Entreprise',
        statut: form.statut,
        compte: form.statut === 'Payé' ? form.compte : undefined,
        justificatif: form.justificatif.trim(),
        notes: form.notes.trim(),
        mouvementId: mvtId,
      };

      nextFrais = [newItem, ...nextFrais];
    }

    updateData({ frais: nextFrais, mouvements: nextMouvements });
    setShowModal(false);
    resetForm();
  };

  // Remboursement rapide
  const handleConfirmRefund = () => {
    if (!refundingItem) return;

    const mvtId = uid();
    const nextMouvements = [
      ...mouvements,
      {
        id: mvtId,
        date: todayStr,
        type: 'sortie',
        montant: refundingItem.montant,
        compte: refundCompte,
        tag: '#notes-de-frais',
        reference: `Remboursement - ${refundingItem.titre}`,
        description: `Remboursement note de frais à ${refundingItem.payeur} (${refundingItem.titre})`,
      },
    ];

    const nextFrais = frais.map((f) =>
      f.id === refundingItem.id
        ? {
            ...f,
            statut: 'Payé' as const,
            compte: refundCompte,
            mouvementId: mvtId,
          }
        : f
    );

    updateData({ frais: nextFrais, mouvements: nextMouvements });
    setRefundingItem(null);
  };

  // Suppression
  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cette note de frais ?')) return;

    const target = frais.find((f) => f.id === id);
    const nextFrais = frais.filter((f) => f.id !== id);
    let nextMouvements = mouvements;

    if (target?.mouvementId) {
      nextMouvements = mouvements.filter((m: any) => m.id !== target.mouvementId);
    }

    updateData({ frais: nextFrais, mouvements: nextMouvements });
  };

  // Filtrage par période
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const filteredFrais = useMemo(() => {
    return frais.filter((item) => {
      // Période
      if (filterPeriode === 'month') {
        if (!item.date || !item.date.startsWith(currentMonthStr)) return false;
      } else if (filterPeriode === 'quarter') {
        const d = new Date(item.date);
        const qNow = Math.floor(now.getMonth() / 3);
        const qItem = Math.floor(d.getMonth() / 3);
        if (d.getFullYear() !== now.getFullYear() || qNow !== qItem) return false;
      } else if (filterPeriode === 'year') {
        if (!item.date || !item.date.startsWith(String(now.getFullYear()))) return false;
      }

      // Catégorie
      if (filterCategorie !== 'all' && item.categorie !== filterCategorie) return false;

      // Statut
      if (filterStatut !== 'all' && item.statut !== filterStatut) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitre = item.titre.toLowerCase().includes(q);
        const matchPayeur = item.payeur?.toLowerCase().includes(q);
        const matchCat = item.categorie?.toLowerCase().includes(q);
        const matchJustif = item.justificatif?.toLowerCase().includes(q);
        if (!matchTitre && !matchPayeur && !matchCat && !matchJustif) return false;
      }

      return true;
    });
  }, [frais, filterPeriode, filterCategorie, filterStatut, search, currentMonthStr, now]);

  // Statistiques calculées
  const stats = useMemo(() => {
    // Total ce mois-ci
    const monthItems = frais.filter((f) => f.date && f.date.startsWith(currentMonthStr));
    const totalMois = monthItems.reduce((sum, f) => sum + (Number(f.montant) || 0), 0);

    // Total à rembourser
    const pendingItems = frais.filter((f) => f.statut === 'À rembourser');
    const totalARembourser = pendingItems.reduce((sum, f) => sum + (Number(f.montant) || 0), 0);

    // Catégorie la plus coûteuse ce mois-ci
    const catMap: Record<string, number> = {};
    monthItems.forEach((f) => {
      catMap[f.categorie] = (catMap[f.categorie] || 0) + (Number(f.montant) || 0);
    });
    let topCat = '-';
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCatAmount = val;
        topCat = cat;
      }
    });

    return {
      totalMois,
      totalARembourser,
      countPending: pendingItems.length,
      totalCount: frais.length,
      topCat,
    };
  }, [frais, currentMonthStr]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...TYPOGRAPHY.sectionTitle, color: THEME.text.primary, margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} style={{ color: THEME.accent.primary }} />
            Notes de Frais & Dépenses Courantes
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: THEME.text.muted }}>
            Suivi des frais d’exploitation (déplacements, repas, fournitures, loyer) intégrés automatiquement au P&L.
          </p>
        </div>

        <button onClick={handleOpenAdd} style={{ ...primaryBtn, gap: 6 }}>
          <Plus size={16} />
          Saisir une Note de Frais
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Stat
          label="Dépenses ce mois"
          value={`${stats.totalMois.toLocaleString()} Ar`}
          subvalue={`${frais.filter(f => f.date?.startsWith(currentMonthStr)).length} note(s) enregistrée(s)`}
          icon={ArrowDownCircle}
          color={THEME.accent.orange}
        />
        <Stat
          label="À rembourser aux collaborateurs"
          value={`${stats.totalARembourser.toLocaleString()} Ar`}
          subvalue={`${stats.countPending} note(s) en attente`}
          icon={Clock}
          color={stats.countPending > 0 ? THEME.accent.danger : THEME.accent.green}
        />
        <Stat
          label="Top Poste de dépense (Mois)"
          value={stats.topCat}
          subvalue="Plus gros budget courant"
          icon={FileText}
          color={THEME.accent.primary}
        />
        <Stat
          label="Total Notes saisies"
          value={stats.totalCount}
          subvalue="Historique global"
          icon={Wallet}
          color={THEME.text.primary}
        />
      </div>

      {/* Barre de recherche et filtres */}
      <Card style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: THEME.text.muted }} />
            <input
              type="text"
              placeholder="Rechercher libellé, payeur, reçu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, height: 36 }}
            />
          </div>

          {/* Filtre Période */}
          <select
            value={filterPeriode}
            onChange={(e) => setFilterPeriode(e.target.value as any)}
            style={{ ...selectStyle, width: 'auto', height: 36, fontSize: 12.5 }}
          >
            <option value="month">Mois en cours</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="all">Toutes les dates</option>
          </select>

          {/* Filtre Catégorie */}
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            style={{ ...selectStyle, width: 'auto', height: 36, fontSize: 12.5 }}
          >
            <option value="all">Toutes catégories</option>
            {CATEGORIES_FRAIS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtre Statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as any)}
            style={{ ...selectStyle, width: 'auto', height: 36, fontSize: 12.5 }}
          >
            <option value="all">Tous les statuts</option>
            <option value="Payé">Payé</option>
            <option value="À rembourser">À rembourser</option>
          </select>
        </div>
      </Card>

      {/* Liste des Notes de Frais */}
      {filteredFrais.length === 0 ? (
        <Empty text={frais.length === 0 ? "Aucune note de frais enregistrée. Cliquez sur 'Saisir une Note de Frais' pour débuter." : "Aucune note de frais ne correspond à vos filtres de recherche."} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredFrais.map((item) => {
            const isPaye = item.statut === 'Payé';
            return (
              <div
                key={item.id}
                style={{
                  ...rowCard,
                  padding: '12px 16px',
                  borderLeft: `4px solid ${isPaye ? THEME.accent.green : THEME.accent.orange}`,
                }}
              >
                {/* Infos Principales */}
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
                    <span style={{ fontSize: 12, color: THEME.text.muted }}>
                      {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 14, color: THEME.text.primary }}>
                    {item.titre}
                  </div>

                  <div style={{ fontSize: 12, color: THEME.text.muted, marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>
                      Payeur / Avancé par : <strong>{item.payeur || 'Entreprise'}</strong>
                    </span>
                    {item.justificatif && <span>Reçu N° : {item.justificatif}</span>}
                    {item.compte && <span>Compte : {item.compte}</span>}
                  </div>
                </div>

                {/* Montant & Statut */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text.primary }}>
                      {item.montant.toLocaleString()} Ar
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
                      {isPaye ? (
                        <span style={{ fontSize: 11.5, color: THEME.accent.green, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle2 size={12} /> Payé
                        </span>
                      ) : (
                        <span style={{ fontSize: 11.5, color: THEME.accent.orange, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={12} /> À rembourser
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!isPaye && (
                      <button
                        onClick={() => {
                          setRefundingItem(item);
                          setRefundCompte(activeComptes[0] || 'Caisse / Espèces');
                        }}
                        style={{
                          ...ghostBtn,
                          background: THEME.accent.green,
                          color: '#fff',
                          border: 'none',
                          fontSize: 11.5,
                          padding: '5px 10px',
                          height: 32,
                        }}
                        title="Rembourser via un compte financier"
                      >
                        <DollarSign size={13} /> Rembourser
                      </button>
                    )}

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
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout / modification */}
      {showModal && (
        <Modal
          title={editingItem ? 'Modifier la Note de Frais' : 'Saisir une Note de Frais'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                  required
                />
              </Field>

              <Field label="Catégorie de dépense">
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  style={selectStyle}
                >
                  {CATEGORIES_FRAIS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Libellé / Description du frais *">
              <input
                type="text"
                placeholder="Ex: Taxi déplacement client, Repas de travail, Fournitures bureau..."
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                style={inputStyle}
                required
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Montant (Ariary) *">
                <input
                  type="number"
                  placeholder="Ex: 25000"
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  style={inputStyle}
                  min="0"
                  step="100"
                  required
                />
              </Field>

              <Field label="Payé / Avancé par">
                <input
                  type="text"
                  placeholder="Ex: Gérant, Nom employé, Entreprise"
                  value={form.payeur}
                  onChange={(e) => setForm({ ...form, payeur: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Statut du règlement">
                <select
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value as any })}
                  style={selectStyle}
                >
                  <option value="Payé">Payé (par l'entreprise)</option>
                  <option value="À rembourser">À rembourser (avancé par le collaborateur)</option>
                </select>
              </Field>

              {form.statut === 'Payé' && (
                <Field label="Compte financier utilisé">
                  <select
                    value={form.compte}
                    onChange={(e) => setForm({ ...form, compte: e.target.value })}
                    style={selectStyle}
                  >
                    {activeComptes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <Field label="Référence Justificatif / Reçu (Optionnel)">
              <input
                type="text"
                placeholder="Ex: Facture N° 1024, Ticket de caisse 88"
                value={form.justificatif}
                onChange={(e) => setForm({ ...form, justificatif: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => setShowModal(false)} style={ghostBtn}>
                Annuler
              </button>
              <button type="submit" style={primaryBtn}>
                {editingItem ? 'Mettre à jour' : 'Enregistrer la note'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Remboursement rapide */}
      {refundingItem && (
        <Modal title="Rembourser la note de frais" onClose={() => setRefundingItem(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: THEME.bg.soft, padding: 12, borderRadius: 8, border: `1px solid ${THEME.border.base}`, fontSize: 13 }}>
              <div>
                <strong>Libellé :</strong> {refundingItem.titre}
              </div>
              <div>
                <strong>Bénéficiaire :</strong> {refundingItem.payeur}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: THEME.accent.green, marginTop: 4 }}>
                Montant à rembourser : {refundingItem.montant.toLocaleString()} Ar
              </div>
            </div>

            <Field label="Compte financier pour le remboursement">
              <select
                value={refundCompte}
                onChange={(e) => setRefundCompte(e.target.value)}
                style={selectStyle}
              >
                {activeComptes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ fontSize: 12, color: THEME.text.muted }}>
              Un mouvement de sortie de {refundingItem.montant.toLocaleString()} Ar sera automatiquement enregistré dans le compte <strong>{refundCompte}</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button onClick={() => setRefundingItem(null)} style={ghostBtn}>
                Annuler
              </button>
              <button onClick={handleConfirmRefund} style={{ ...primaryBtn, background: THEME.accent.green }}>
                Valider le remboursement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
