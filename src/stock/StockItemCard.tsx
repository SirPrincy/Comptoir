import React from 'react';
import {
  Trash2,
  Edit2,
  ExternalLink,
  History,
  Image as ImageIcon,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Package,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface StockItemCardProps {
  key?: React.Key;
  product: any;
  stock: number;
  devises?: any;
  onOpenDetail: (p: any) => void;
  onOpenGallery: (data: { title: string; images: string[]; index: number }) => void;
  onOpenAdjust: (p: any) => void;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onToggleArchive?: (p: any) => void;
}

export default function StockItemCard({
  product: p,
  stock,
  devises,
  onOpenDetail,
  onOpenGallery,
  onOpenAdjust,
  onEdit,
  onDelete,
  onToggleArchive,
}: StockItemCardProps) {
  const isArchived = Boolean(p.isArchive || p.masque || p.archive);
  const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;
  const isAlert = !isArchived && stock <= seuil;
  const isOut = stock === 0;

  const cost = p.coutTotalRenduAr || p.prixAchatAr || (p.puRmb ? Math.round(p.puRmb * (p.tauxRmb || devises?.rmb || 680)) : null);
  const price = p.prixVente || p.prixVenteEstime;
  const marginAr = cost && price ? price - cost : null;
  const marginPct = price && marginAr !== null ? Math.round((marginAr / price) * 100) : null;

  const pImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);

  // Définition visuelle du statut
  const getStatusBadge = () => {
    if (isArchived) {
      return {
        bg: '#F3F0EB',
        color: '#736B5E',
        border: '#E2DCD2',
        dot: '#9C9487',
        icon: <Package size={12} />,
        label: 'Article Masqué',
        desc: 'Fin de vie / Désactivé',
      };
    }
    if (stock === 0) {
      return {
        bg: '#FDF0EE',
        color: '#B9382C',
        border: '#F9CBC6',
        dot: '#DC2626',
        icon: <AlertCircle size={12} />,
        label: 'Rupture de Stock',
        desc: '0 unité disponible',
      };
    }
    if (stock <= seuil) {
      return {
        bg: '#FEF8E7',
        color: '#9A6700',
        border: '#F8E2A7',
        dot: '#D97706',
        icon: <AlertCircle size={12} />,
        label: 'Stock Critique',
        desc: `≤ ${seuil} unités (seuil alerte)`,
      };
    }
    return {
      bg: '#EAF5EE',
      color: '#286846',
      border: '#CDE7D5',
      dot: '#2E8B57',
      icon: <Layers size={12} />,
      label: 'Stock Disponible',
      desc: 'Niveau optimal',
    };
  };

  const status = getStatusBadge();

  return (
    <div
      style={{
        borderLeft: isAlert ? '5px solid #C24A3F' : (isArchived ? '5px solid #A8A090' : '5px solid #286846'),
        opacity: isArchived ? 0.85 : 1,
      }}
      className="group relative bg-white rounded-2xl border border-[#EAE2D4] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={(e: any) => {
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
          return;
        }
        onOpenDetail(p);
      }}
    >
      {/* ── ÉTAGE SUPÉRIEUR (DESSUS) : Identité de l'article & Statut ── */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Identité : Image + Titre + SKU + Catégorie */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Miniature Photo avec zoom galerie */}
          <div className="shrink-0 relative">
            {pImages.length > 0 ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGallery({ title: p.nom, images: pImages, index: 0 });
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#EAE2D4] bg-[#F5F0EB] relative shadow-xs transition-transform active:scale-95 hover:border-[#3D5A6C]"
                title="Cliquer pour voir la galerie photos"
              >
                <img
                  src={pImages[0]}
                  alt={p.nom}
                  className="w-full h-full object-cover"
                />
                {pImages.length > 1 && (
                  <span className="absolute bottom-1 right-1 bg-[#26333D]/90 backdrop-blur-xs text-[#FAF7F2] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    +{pImages.length - 1}
                  </span>
                )}
              </div>
            ) : (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-dashed border-[#DCD5C9] bg-[#FAF7F2] flex items-center justify-center text-[#B0A898]"
                title="Aucune photo disponible"
              >
                <ImageIcon size={22} strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Textes descriptifs */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(p.uidCode || p.codeUid || p.numSeq) && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[#FAF7F2] bg-[#2C3E50] font-extrabold text-[11px] tracking-wide shrink-0"
                  title={`UID Article : ${p.uidCode || p.codeUid || `ART${String(p.numSeq).padStart(4, '0')}`}`}
                >
                  {p.uidCode || p.codeUid || `ART${String(p.numSeq).padStart(4, '0')}`}
                </span>
              )}
              <h3 className="font-bold text-base sm:text-[17px] text-[#26333D] tracking-tight leading-snug">
                {p.nom} {p.couleur ? `· ${p.couleur}` : ''}
              </h3>
            </div>

            <div className="text-xs text-[#736B5E] mt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EAE2D4] font-medium text-[#5E584E]">
                {p.categorie || 'Général'}
              </span>

              {p.reference && !p.reference.startsWith('http') && !p.reference.includes('1688') && !p.reference.includes('taobao') && (
                <span className="font-mono text-[11px] text-[#5E584E]">
                  SKU: <strong className="text-[#3D5A6C]">{p.reference}</strong>
                </span>
              )}

              {(p.lien || p.reference?.startsWith('http') || p.reference?.includes('1688') || p.reference?.includes('taobao')) && (
                <a
                  href={(p.lien || p.reference).startsWith('http') ? (p.lien || p.reference) : `https://${p.lien || p.reference}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0F5F8] border border-[#D5E3EC] text-[#2C4858] font-semibold text-[11px] hover:bg-[#E3EFF6] transition-colors"
                >
                  <span>Lien Taobao / 1688</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Synthèse tarifaire & marge compacte */}
            {(cost || price) && (
              <div className="text-xs text-[#5E584E] mt-1.5 flex items-center gap-2 sm:gap-3 flex-wrap">
                {cost && (
                  <span>
                    Achat : <strong className="text-[#26333D] font-semibold">{Number(cost).toLocaleString('fr-FR')} Ar</strong>
                  </span>
                )}
                {price && (
                  <span>
                    Vente : <strong className="text-[#26333D] font-semibold">{Number(price).toLocaleString('fr-FR')} Ar</strong>
                  </span>
                )}
                {marginAr !== null && (
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      marginAr >= 0
                        ? 'bg-[#EAF5EE] text-[#286846] border border-[#CDE7D5]'
                        : 'bg-[#FDF0EE] text-[#B9382C] border border-[#F9CBC6]'
                    }`}
                  >
                    Marge {marginAr >= 0 ? '+' : ''}{Number(marginAr).toLocaleString('fr-FR')} Ar
                    {marginPct !== null ? ` (${marginPct}%)` : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badge Statut + Actions rapides du header */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div
            style={{
              background: status.bg,
              color: status.color,
              borderColor: status.border,
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shadow-2xs"
          >
            <span
              style={{ background: status.dot }}
              className="w-2 h-2 rounded-full shrink-0"
            />
            <span>{status.label}</span>
          </div>

          {/* Boutons d'édition & suppression de l'en-tête */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(p);
              }}
              className="w-8 h-8 rounded-lg border border-[#EAE2D4] bg-[#FAF7F2] text-[#3D5A6C] flex items-center justify-center hover:bg-white hover:border-[#3D5A6C] transition-all"
              title="Modifier l'article"
            >
              <Edit2 size={13} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer définitivement l'article "${p.nom}" ?`)) {
                  onDelete(p.id);
                }
              }}
              className="w-8 h-8 rounded-lg border border-[#F3DDD9] bg-[#FAF7F2] text-[#C24A3F] flex items-center justify-center hover:bg-[#FDF0EE] hover:border-[#C24A3F] transition-all"
              title="Supprimer l'article"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ÉTAGE INFÉRIEUR (DESSOUS) : BANDEAU D'ACTIONS ERGONOMIQUE ── */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-[#FAF8F5]/80 border-t border-[#EAE2D4]/70 flex flex-wrap items-center justify-between gap-2">
        {/* Actions principales d'exploitation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdjust(p);
            }}
            className="px-3 py-1.5 text-xs font-bold text-[#26333D] bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE2D4] rounded-lg transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Ajuster le stock (perte, casse, réajustement physique)"
          >
            <SlidersHorizontal size={13} strokeWidth={2.2} className="text-[#3D5A6C]" />
            <span>Ajuster Stock</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(p);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-[#5E584E] bg-white hover:bg-[#FAF7F2] border border-[#EAE2D4] rounded-lg transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Voir la fiche complète et l'historique des entrées/sorties"
          >
            <History size={13} strokeWidth={2} className="text-[#736B5E]" />
            <span>Historique & Mouvements</span>
          </button>

          {onToggleArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleArchive(p);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                isArchived
                  ? 'bg-[#EAF5EE] text-[#286846] border-[#CDE7D5] hover:bg-[#DDF0E3]'
                  : 'bg-white text-[#736B5E] border-[#EAE2D4] hover:bg-[#FAF7F2]'
              }`}
              title={isArchived ? "Réactiver l'article dans les alertes" : "Masquer l'article des alertes de rupture"}
            >
              {isArchived ? <Eye size={13} strokeWidth={2} /> : <EyeOff size={13} strokeWidth={2} />}
              <span>{isArchived ? 'Réactiver l\'article' : 'Masquer (Fin de vie)'}</span>
            </button>
          )}
        </div>

        {/* Rappel d'ouverture fiche */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-[#A8A090] font-medium">
          <span>Cliquer pour détails</span>
          <span className="text-[#3D5A6C]">→</span>
        </div>
      </div>
    </div>
  );
}

