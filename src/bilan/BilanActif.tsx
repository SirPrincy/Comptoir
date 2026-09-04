import React from 'react';
import { THEME } from '../colors';
import { BilanData } from './types';

interface BilanActifProps {
  data: BilanData;
}

export default function BilanActif({ data }: BilanActifProps) {
  return (
    <div style={{ background: THEME.bg.card, borderRadius: 12, border: `1px solid ${THEME.border.base}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', background: THEME.bg.soft, borderBottom: `1px solid ${THEME.border.base}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: THEME.text.primary, fontSize: 14 }}>ACTIF (Emplois)</span>
        <span style={{ fontSize: 11, color: THEME.text.muted, fontWeight: 600 }}>Ar Net</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ACTIF IMMOBILISE */}
        <div style={{ background: THEME.bg.soft, padding: '6px 12px', fontWeight: 700, fontSize: 11.5, color: THEME.text.secondary }}>
          ACTIF IMMOBILISÉ (Moyen / Long terme)
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Immobilisations Corporelles (Matériel, PC, véhicules...)</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Valeur d'acquisition brute : {data.totalImmoBrut.toLocaleString()} Ar</span>
          </span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, color: THEME.text.primary }}>{data.totalImmoNet.toLocaleString()} Ar</span>
            {data.totalImmoAmortissement > 0 && (
              <div style={{ fontSize: 10, color: THEME.accent.orange }}>Amort. cumulés : -{Math.round(data.totalImmoAmortissement).toLocaleString()} Ar</div>
            )}
          </div>
        </div>

        {/* ACTIF CIRCULANT */}
        <div style={{ background: THEME.bg.soft, padding: '6px 12px', fontWeight: 700, fontSize: 11.5, color: THEME.text.secondary, marginTop: 4 }}>
          ACTIF CIRCULANT (Court terme / Exploitation)
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary }}>Valeur des Stocks (Prix de revient d'achat + fret)</span>
          <strong style={{ color: THEME.text.primary }}>{data.valeurStockTotal.toLocaleString()} Ar</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary }}>Créances Clients (Acomptes ou ventes à crédit restantes)</span>
          <strong style={{ color: THEME.text.primary }}>{data.totalCreancesClients.toLocaleString()} Ar</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12.5, borderBottom: `1px solid ${THEME.border.base}` }}>
          <span style={{ color: THEME.text.secondary, display: 'flex', flexDirection: 'column' }}>
            <span>Disponibilités & Trésorerie</span>
            <span style={{ fontSize: 10, color: THEME.text.muted }}>Liquidités en banque & caisses physiques</span>
          </span>
          <strong style={{ color: THEME.accent.green }}>{data.totalDisponibilites.toLocaleString()} Ar</strong>
        </div>

        {/* Détail par compte */}
        <div style={{ padding: '4px 24px 10px', display: 'flex', flexDirection: 'column', gap: 4, background: THEME.bg.soft }}>
          {Object.entries(data.balancesComptes).map(([compte, solde]) => {
            const soldeNum = solde as number;
            const isRmb = compte.toLowerCase().includes('rmb') || compte.toLowerCase().includes('yuan');
            return (
              <div key={compte} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: THEME.text.muted }}>
                <span>• {compte}</span>
                <span style={{ fontWeight: 500, color: soldeNum >= 0 ? THEME.text.secondary : THEME.accent.orange }}>
                  {isRmb ? `${soldeNum.toLocaleString()} ¥` : `${soldeNum.toLocaleString()} Ar`}
                </span>
              </div>
            );
          })}
        </div>

        {/* TOTAL ACTIF */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: THEME.bg.soft,
          borderTop: `2px solid ${THEME.border.base}`,
          fontSize: 14,
          fontWeight: 800,
          color: THEME.text.primary,
        }}>
          <span>TOTAL DE L'ACTIF</span>
          <span>{data.totalActif.toLocaleString()} Ar</span>
        </div>
      </div>
    </div>
  );
}
