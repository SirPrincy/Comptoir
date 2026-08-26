import React, { useState } from 'react';
import { FileSpreadsheet, Download, Receipt, Package, Wallet, Check } from 'lucide-react';
import { THEME } from '../colors';
import { Modal, ghostBtn } from '../ui';
import { exportVentesCsv, exportAchatsCsv, exportTresorerieCsv, exportAllDataCsv } from '../dashboard/csvExportUtils';

interface ModalExportCsvProps {
  open: boolean;
  onClose: () => void;
  ventes?: any[];
  commandes?: any[];
  mouvements?: any[];
  products?: any[];
  clients?: any[];
  fournisseurs?: any[];
}

export default function ModalExportCsv({
  open,
  onClose,
  ventes = [],
  commandes = [],
  mouvements = [],
  products = [],
  clients = [],
  fournisseurs = [],
}: ModalExportCsvProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!open) return null;

  const triggerExport = (type: 'all' | 'ventes' | 'achats' | 'tresorerie') => {
    if (type === 'all') {
      exportAllDataCsv({ ventes, commandes, mouvements, products, clients, fournisseurs });
      setFeedback('Pack 3 CSV exporté !');
    } else if (type === 'ventes') {
      exportVentesCsv({ ventes, products, clients });
      setFeedback('CSV Ventes exporté !');
    } else if (type === 'achats') {
      exportAchatsCsv({ commandes, products, fournisseurs });
      setFeedback('CSV Achats exporté !');
    } else if (type === 'tresorerie') {
      exportTresorerieCsv({ mouvements, ventes, commandes });
      setFeedback('CSV Trésorerie exporté !');
    }
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  return (
    <Modal title="Exportation CSV pour Excel & Tableurs" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          fontSize: 12.5,
          color: THEME.text.secondary,
          lineHeight: 1.5,
          background: THEME.bg.soft,
          padding: '10px 12px',
          borderRadius: 8,
          border: `1px solid ${THEME.border.base}`,
        }}>
          Les fichiers CSV sont encodés en <strong>UTF-8 avec séparateurs point-virgule (;)</strong> pour un affichage parfait et immédiat dans Microsoft Excel, Google Sheets ou LibreOffice.
        </div>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: `${THEME.accent.green}18`,
            border: `1px solid ${THEME.accent.green}44`,
            color: THEME.accent.green,
            fontSize: 13,
            fontWeight: 600,
          }}>
            <Check size={16} />
            <span>{feedback}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Tout exporter */}
          <button
            onClick={() => triggerExport('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${THEME.accent.orange}44`,
              background: THEME.bg.surface,
              color: THEME.text.primary,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent.orange}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${THEME.accent.orange}44`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${THEME.accent.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={18} color={THEME.accent.orange} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text.primary }}>
                  Tout exporter (Pack 3 CSV)
                </div>
                <div style={{ fontSize: 11.5, color: THEME.text.muted }}>
                  Télécharge les Ventes, Achats/Commandes et la Trésorerie simultanément.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: THEME.bg.card, border: `1px solid ${THEME.border.base}`, color: THEME.accent.orange }}>
              Pack Complet
            </span>
          </button>

          <div style={{ height: 1, background: THEME.border.base, margin: '4px 0' }} />

          {/* Ventes CSV */}
          <button
            onClick={() => triggerExport('ventes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${THEME.border.base}`,
              background: THEME.bg.card,
              color: THEME.text.primary,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
            onMouseLeave={e => e.currentTarget.style.background = THEME.bg.card}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Receipt size={16} color={THEME.accent.green} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Ventes & Encaissements</div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>Articles, prix, clients, statuts de paiement</div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>
              {ventes.length} ligne(s)
            </span>
          </button>

          {/* Achats CSV */}
          <button
            onClick={() => triggerExport('achats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${THEME.border.base}`,
              background: THEME.bg.card,
              color: THEME.text.primary,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
            onMouseLeave={e => e.currentTarget.style.background = THEME.bg.card}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Package size={16} color={THEME.accent.primary} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Achats & Commandes Chine</div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>Fournisseurs, prix RMB/Ar, fret, numéros de suivi</div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>
              {commandes.length} commande(s)
            </span>
          </button>

          {/* Trésorerie CSV */}
          <button
            onClick={() => triggerExport('tresorerie')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${THEME.border.base}`,
              background: THEME.bg.card,
              color: THEME.text.primary,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = THEME.bg.surface}
            onMouseLeave={e => e.currentTarget.style.background = THEME.bg.card}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wallet size={16} color={THEME.accent.purple} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Trésorerie & Flux Financiers</div>
                <div style={{ fontSize: 11, color: THEME.text.muted }}>Journal des entrées et sorties de caisse et banque</div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>
              {mouvements.length} mouvement(s)
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
