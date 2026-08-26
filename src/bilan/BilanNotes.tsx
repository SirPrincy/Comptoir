import React from 'react';
import { FileText } from 'lucide-react';
import { THEME } from '../colors';

export default function BilanNotes() {
  return (
    <div style={{
      background: THEME.bg.card,
      border: `1px solid ${THEME.border.base}`,
      borderRadius: 10,
      padding: 12,
      fontSize: 12,
      color: THEME.text.secondary,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontWeight: 700, color: THEME.text.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
        <FileText size={14} />
        Note d'interprétation patrimoniale
      </div>
      <div>
        • Le <strong>Bilan</strong> présente une image statique de ce que possède ton entreprise (Actif) et de ce qu'elle doit à ses actionnaires, banques et fournisseurs (Passif).
      </div>
      <div>
        • La valeur de ton <strong>Stock</strong> est calculée d'après le coût de revient d'achat réel ajusté des frais de transport/fret, garantissant une estimation extrêmement proche des normes comptables réelles (FIFO / Coût Moyen Pondéré).
      </div>
      <div>
        • L'amortissement de ton <strong>Actif Immobilisé</strong> est calculé au prorata temporis mensuel depuis la date d'acquisition de chaque immobilisation pour refléter la dépréciation réelle de ton parc informatique ou de ton outillage.
      </div>
    </div>
  );
}
