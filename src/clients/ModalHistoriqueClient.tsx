import React from 'react';
import { ShoppingBag, Calendar, AlertCircle, CheckCircle2, Clock, DollarSign, ArrowRight, User } from 'lucide-react';
import { Modal, primaryBtn, ghostBtn } from '../ui';
import { Client, ClientStat, CLIENT_CATEGORIES } from './types';
import { getMontantPayeVente, getRestePayeVente, getStatutVenteLabel } from '../paymentUtils';
import { formatDernierAchat } from './clientUtils';

interface ModalHistoriqueClientProps {
  client: Client | null;
  stats: ClientStat;
  ventes: any[];
  products: any[];
  onClose: () => void;
  onEditClient: (client: Client) => void;
}

export default function ModalHistoriqueClient({
  client,
  stats,
  ventes,
  products,
  onClose,
  onEditClient,
}: ModalHistoriqueClientProps) {
  if (!client) return null;

  // Filtrer et trier les ventes du client (les plus récentes en premier)
  const clientVentes = ventes
    .filter((v: any) => v.clientId === client.id)
    .sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  const catMeta = CLIENT_CATEGORIES.find(c => c.id === client.categorie);
  const { text: dernierAchatLabel } = formatDernierAchat(stats.dernierAchat);

  return (
    <Modal title={`Fiche & Historique : ${client.nom}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
        
        {/* En-tête / Résumé profil client */}
        <div
          style={{
            background: '#FAF7F2',
            border: '1px solid #EAE2D4',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#26333D' }}>{client.nom}</span>
                {catMeta && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: catMeta.bg,
                      color: catMeta.color,
                      border: `1px solid ${catMeta.border}`,
                    }}
                  >
                    {catMeta.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                {client.contact ? `📞 ${client.contact}` : 'Sans numéro de contact enregistré'}
                {client.notes ? ` · ${client.notes}` : ''}
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onEditClient(client);
              }}
              style={{ ...ghostBtn, fontSize: 12, padding: '4px 10px', height: 'auto' } as any}
            >
              Modifier profil
            </button>
          </div>

          {/* Cartes KPI du client */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 4 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 500 }}>Total Acheté (CA)</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#245269', marginTop: 2 }}>
                {stats.total.toLocaleString('fr-FR')} Ar
              </div>
            </div>

            <div style={{ background: stats.du > 0 ? '#FEF2F2' : '#FFFFFF', border: `1px solid ${stats.du > 0 ? '#FECACA' : '#EAE2D4'}`, borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: stats.du > 0 ? '#991B1B' : '#8A8375', fontWeight: 500 }}>
                {stats.du > 0 ? '⚠️ Solde Dû (Crédit)' : 'Solde restant'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: stats.du > 0 ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                {stats.du > 0 ? `${stats.du.toLocaleString('fr-FR')} Ar` : 'À jour (0 Ar)'}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 500 }}>Commandes</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#26333D', marginTop: 2 }}>
                {stats.count} vente{stats.count > 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#8A8375', fontWeight: 500 }}>Dernière visite</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 2 }}>
                {dernierAchatLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des ventes détaillées */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: '#26333D', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Historique des achats ({clientVentes.length})</span>
          </div>

          {clientVentes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: '#FAF7F2',
                border: '1px dashed #EAE2D4',
                borderRadius: 8,
                color: '#8A8375',
                fontSize: 13,
              }}
            >
              Aucun achat enregistré pour ce client pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {clientVentes.map((v: any, index: number) => {
                const prod = products.find((p: any) => p.id === v.productId);
                const total = Number(v.total) || (Number(v.pu || 0) * Number(v.qty || 1)) || 0;
                const paye = getMontantPayeVente(v);
                const reste = getRestePayeVente(v);
                const statut = getStatutVenteLabel(v);

                const dateFormatted = v.date
                  ? new Date(v.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Date inconnue';

                return (
                  <div
                    key={v.id || `vente-${index}`}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EAE2D4',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#26333D' }}>
                          {prod ? prod.nom : (v.productNom || 'Article')}
                          {prod?.couleur && (
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#718096' }}> ({prod.couleur})</span>
                          )}
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#5B7B88', marginLeft: 6 }}>
                            x{v.qty || 1}
                          </span>
                        </div>

                        <div style={{ fontSize: 11.5, color: '#8A8375', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>📅 {dateFormatted}</span>
                          {v.pu && <span>· PU: {Number(v.pu).toLocaleString('fr-FR')} Ar</span>}
                          {Number(v.fraisLivraison) > 0 && <span>· 🚚 Livr: {Number(v.fraisLivraison).toLocaleString('fr-FR')} Ar</span>}
                          {v.modePaiement && <span>· 💳 {v.modePaiement}</span>}
                          {v.description && <span>· {v.description}</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#245269' }}>
                          {total.toLocaleString('fr-FR')} Ar
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 10,
                            marginTop: 3,
                            background: statut.type === 'paye' ? '#ECFDF5' : statut.type === 'partiel' ? '#FEF3C7' : '#FEF2F2',
                            color: statut.type === 'paye' ? '#065F46' : statut.type === 'partiel' ? '#92400E' : '#991B1B',
                            border: `1px solid ${statut.type === 'paye' ? '#A7F3D0' : statut.type === 'partiel' ? '#FDE68A' : '#FECACA'}`,
                          }}
                        >
                          {statut.label}
                        </span>
                      </div>
                    </div>

                    {/* Alerte reste à payer si crédit sur cette vente */}
                    {reste > 0 && (
                      <div
                        style={{
                          background: '#FFF5F5',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11.5,
                          color: '#C53030',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Montant versé : {paye.toLocaleString('fr-FR')} Ar</span>
                        <strong>Reste dû : {reste.toLocaleString('fr-FR')} Ar</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={primaryBtn as any}>
            Fermer la fiche
          </button>
        </div>
      </div>
    </Modal>
  );
}
