import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  active: boolean;
  color: string;
  onClick: () => void;
  wide?: boolean;
}

function StatCard({ label, value, active, color, onClick, wide }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={wide ? 'col-span-2 sm:col-span-1' : undefined}
      style={{
        background: active ? '#F5EFE6' : '#FFFFFF',
        border: `1.5px solid ${active ? color : '#EAE2D4'}`,
        borderRadius: 8,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 11, color: active ? color : '#8A8375', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

interface LogistiqueStatsProps {
  stats: { enLivraison: number; enEntrepot: number; enExpedition: number; qcAfaire: number; termines: number };
  filtreStatut: string;
  setFiltreStatut: (v: string) => void;
}

export default function LogistiqueStats({ stats, filtreStatut, setFiltreStatut }: LogistiqueStatsProps) {
  const toggle = (key: string) => setFiltreStatut(filtreStatut === key ? 'all' : key);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3.5">
      <StatCard label="1. En livraison Chine" value={stats.enLivraison} color="#3D5A6C"
        active={filtreStatut === 'En livraison'} onClick={() => toggle('En livraison')} />
      <StatCard label="2. En entrepôt Chine" value={stats.enEntrepot} color="#3D5A6C"
        active={filtreStatut === 'En entrepôt'} onClick={() => toggle('En entrepôt')} />
      <StatCard label="3. Fret International" value={stats.enExpedition} color="#E8985E"
        active={filtreStatut === 'En expédition'} onClick={() => toggle('En expédition')} />
      <StatCard label="4/5. Arrivé (QC à faire)" value={stats.qcAfaire} color="#C24A3F"
        active={filtreStatut === 'qc-pending'} onClick={() => toggle('qc-pending')} />
      <StatCard label="5. Contrôlé & En Stock" value={stats.termines} color="#3F7A5C" wide
        active={filtreStatut === 'completed'} onClick={() => toggle('completed')} />
    </div>
  );
}
