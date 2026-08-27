import React, { useMemo } from 'react';
import { Package, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { THEME } from '../../colors';
import { Empty, ghostBtn, iconBtn } from '../../ui';
import { getMontantPayeMarchandise, getRestePayeMarchandise, getStatutMarchandiseLabel } from '../../paymentUtils';

export default function AchatListe({ 
  commandes, 
  products, 
  fournisseurs, 
  searchHistory, 
  ouvrirModalPaiement, 
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
      const q = searchHistory.toLowerCase();
      return nomP.includes(q) || nomF.includes(q) || track.includes(q) || (c.source || '').toLowerCase().includes(q);
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
        const itemTotal = c.total !== undefined ? Number(c.total) : (Number(c.pu || 0) * Number(c.qty || 1));
        const paye = getMontantPayeMarchandise(c, paiements);
        const reste = getRestePayeMarchandise(c, paiements);
        const statutInfo = getStatutMarchandiseLabel(c, paiements);

        return (
          <div key={c.id} style={{ background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Package size={16} color={THEME.text.muted} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {p ? p.nom : 'Article supprimé'}
                    {p && p.couleur ? ` — ${p.couleur}` : ''}
                  </span>
                  <span style={{ fontSize: 11, background: THEME.bg.soft, color: THEME.text.secondary, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {c.qty} pcs
                  </span>
                  {(c.payeEnMgaDirect || c.modeReglement === 'mga_direct') && (
                    <span style={{ fontSize: 10.5, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid #FDE68A' }}>
                      🇲🇬 Payé MGA Direct (Exclu Réserve RMB)
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
                      🚚 Livr.: {c.fraisLivraisonChineDevise ? `¥${c.fraisLivraisonChineDevise}` : `${Number(c.fraisLivraisonChine || c.fraisLivraison).toLocaleString('fr-FR')} Ar`}
                    </span>
                  )}
                  {c.tracking && <span>📦 Trk: {c.tracking}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text.primary }}>{itemTotal.toLocaleString('fr-FR')} Ar</div>
                  {reste > 0 ? (
                    <div style={{ fontSize: 11, color: THEME.accent.orange, fontWeight: 600 }}>Reste : {reste.toLocaleString('fr-FR')} Ar</div>
                  ) : (
                    <div style={{ fontSize: 11, color: THEME.accent.green, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <CheckCircle2 size={12} /> Payé
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    style={{ ...ghostBtn, fontSize: 11, padding: '4px 8px', border: reste > 0 ? `1px solid ${THEME.accent.orange}` : `1px solid ${THEME.border.strong}`, color: reste > 0 ? THEME.accent.orange : THEME.text.secondary }}
                  >
                    {reste > 0 ? 'Payer le solde' : 'Historique Pmt'}
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
