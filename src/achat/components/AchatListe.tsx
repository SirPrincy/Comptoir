import React, { useMemo } from 'react';
import { Package, Trash2, CheckCircle2, Clock, Edit3, Calendar, Truck, ShoppingCart } from 'lucide-react';
import { THEME } from '../../colors';
import { Empty, ghostBtn, iconBtn } from '../../ui';
import {
  getMontantPayeMarchandise,
  getRestePayeMarchandise,
  getMontantPayeFret,
  getRestePayeFret,
  getStatutMarchandiseLabel,
  getStatutFretLabel,
} from '../../paymentUtils';

export function formatDateJMA(dateString?: string) {
  if (!dateString) return '—';
  try {
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      const [year, month, day] = dateString.trim().split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

export default function AchatListe({ 
  commandes, 
  products, 
  fournisseurs, 
  searchHistory, 
  ouvrirModalPaiement,
  onEditCommande,
  supprimerCommande,
  onNavigateTab,
  paiements = [],
}: any) {

  const listeFiltree = useMemo(() => {
    return commandes.filter((c: any) => {
      if (!searchHistory.trim()) return true;
      const p = products.find((pr: any) => pr.id === c.productId);
      const f = fournisseurs.find((fr: any) => fr.id === c.fournisseurId);
      const nomP = p ? p.nom.toLowerCase() : '';
      const nomF = f ? f.nom.toLowerCase() : '';
      const track = (c.tracking || '').toLowerCase();
      const codeA = (c.codeAchat || c.uidAchat || '').toLowerCase();
      const numStr = c.numSeq ? `n°${c.numSeq} n° ${c.numSeq} #${c.numSeq} ${c.numSeq}` : '';
      const q = searchHistory.toLowerCase();
      return nomP.includes(q) || nomF.includes(q) || track.includes(q) || (c.source || '').toLowerCase().includes(q) || codeA.includes(q) || numStr.includes(q);
    }).sort((a: any, b: any) => new Date(b.dateAchat || 0).getTime() - new Date(a.dateAchat || 0).getTime());
  }, [commandes, searchHistory, products, fournisseurs]);

  if (listeFiltree.length === 0) {
    return <Empty text="Aucun achat ne correspond à votre recherche." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {listeFiltree.map((c: any) => {
        const p = products.find((pr: any) => pr.id === c.productId);
        const fourn = fournisseurs.find((f: any) => f.id === c.fournisseurId);
        const transitaire = fournisseurs.find((f: any) => f.id === c.transitaireId);

        const itemTotal = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
        const resteM = getRestePayeMarchandise(c, paiements);

        const totalFret = Number(c.fraisTransport) || 0;
        const resteFret = getRestePayeFret(c, paiements);

        let boutonPmtTexte = 'Historique Pmt';
        let boutonPmtColor = THEME.text.secondary;
        let boutonPmtBorder = `1px solid ${THEME.border.strong}`;

        if (resteM > 0) {
          boutonPmtTexte = `Payer Achat (${resteM.toLocaleString('fr-FR')} Ar)`;
          boutonPmtColor = THEME.accent.orange;
          boutonPmtBorder = `1px solid ${THEME.accent.orange}`;
        }

        return (
          <div key={c.id} style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              
              <div 
                style={{ flex: '1 1 200px', minWidth: 0, cursor: onEditCommande ? 'pointer' : 'default' }}
                onClick={() => onEditCommande && onEditCommande(c)}
                title={onEditCommande ? 'Cliquer pour modifier cet achat' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {(c.codeAchat || c.uidAchat || c.numSeq) && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: '#2C3E50',
                        color: '#FFFFFF',
                        letterSpacing: '0.2px',
                      }}
                      title={`Code Achat : ${c.codeAchat || c.uidAchat || `A${String(c.numSeq).padStart(4, '0')}`}`}
                    >
                      {c.codeAchat || c.uidAchat || `A${String(c.numSeq).padStart(4, '0')}`}
                    </span>
                  )}
                  <Package size={16} color={THEME.text.muted} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: THEME.accent.primary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textDecoration: onEditCommande ? 'underline' : 'none', textUnderlineOffset: 3 }}>
                    {p ? p.nom : 'Article supprimé'}
                    {p && p.couleur ? ` — ${p.couleur}` : ''}
                  </span>
                  <span style={{ fontSize: 11, background: THEME.bg.soft, color: THEME.text.secondary, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {c.qty} pcs
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: '#F8F6F0',
                      color: '#5E584E',
                      border: '1px solid #EAE2D4',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Calendar size={11} style={{ color: '#8A8375' }} />
                    {formatDateJMA(c.dateAchat || c.date)}
                  </span>
                  {(c.payeEnMgaDirect || c.modeReglement === 'mga_direct') && (
                    <span style={{ fontSize: 10.5, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid #FDE68A' }}>
                      🇲🇬 Payé MGA Direct
                    </span>
                  )}
                  {c.modeReglement === 'change_auto' && (
                    <span style={{ fontSize: 10.5, background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                      🔄 Change Auto RMB
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: THEME.text.muted, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>🏪 Fournisseur: <strong>{fourn ? fourn.nom : c.source}</strong></span>
                  {c.pu && (
                    <span>
                      PU: {c.puDevise ? `¥${c.puDevise}` : `${Number(c.pu).toLocaleString('fr-FR')} Ar`}
                    </span>
                  )}
                  {Number(c.fraisLivraisonChine || c.fraisLivraison || 0) > 0 && (
                    <span>
                      🚚 Livr. Chine: {c.fraisLivraisonChineDevise ? `¥${c.fraisLivraisonChineDevise}` : `${Number(c.fraisLivraisonChine || c.fraisLivraison).toLocaleString('fr-FR')} Ar`}
                    </span>
                  )}
                  {totalFret > 0 && (
                    <span style={{ color: resteFret > 0 ? '#B5532A' : '#1B6A3E', fontWeight: 600 }}>
                      🚢 Fret ({transitaire?.nom || c.modeExpedition || 'Transitaire'}): {totalFret.toLocaleString('fr-FR')} Ar {resteFret > 0 ? `(Reste ${resteFret.toLocaleString('fr-FR')} Ar · Trésorerie)` : '(Payé)'}
                    </span>
                  )}
                  {c.tracking && <span>📦 Trk: {c.tracking}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>
                    {itemTotal.toLocaleString('fr-FR')} Ar
                  </div>
                  {resteM > 0 ? (
                    <div style={{ fontSize: 11, color: THEME.accent.orange, fontWeight: 600 }}>
                      Reste Achat: {resteM.toLocaleString('fr-FR')} Ar
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: THEME.accent.green, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <CheckCircle2 size={12} /> Achat Réglé
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {onEditCommande && (
                    <button
                      onClick={() => onEditCommande(c)}
                      style={{
                        ...ghostBtn,
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #3D5A6C',
                        background: '#FAF7F2',
                        color: '#3D5A6C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                      title="Modifier les détails de cet achat"
                    >
                      <Edit3 size={13} color="#3D5A6C" />
                      <span>Éditer</span>
                    </button>
                  )}
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('logistique')}
                      style={{ ...ghostBtn, fontSize: 11, padding: '4px 8px', border: `1px solid ${THEME.border.strong}`, color: THEME.accent.primary, display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Suivre dans l'onglet Logistique"
                    >
                      <span>🚚 Suivi</span>
                    </button>
                  )}
                  <button
                    onClick={() => ouvrirModalPaiement(c)}
                    style={{ ...ghostBtn, fontSize: 11, padding: '4px 8px', border: boutonPmtBorder, color: boutonPmtColor, fontWeight: resteM > 0 ? 600 : 400 }}
                  >
                    {boutonPmtTexte}
                  </button>
                  <button onClick={() => {
                    supprimerCommande(c.id);
                  }} style={iconBtn} title="Supprimer la commande">
                    <Trash2 size={16} color={THEME.accent.danger} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
