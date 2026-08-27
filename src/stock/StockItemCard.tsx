import React from 'react';
import { Trash2, Edit2, ExternalLink, History, Image as ImageIcon } from 'lucide-react';
import { rowCard, ghostBtn, iconBtn } from '../ui';

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
}: StockItemCardProps) {
  const seuil = p.seuilMin !== undefined ? Number(p.seuilMin) : 3;
  const isAlert = stock <= seuil;
  const isOut = stock === 0;

  const cost = p.coutTotalRenduAr || p.prixAchatAr || (p.puRmb ? Math.round(p.puRmb * (p.tauxRmb || devises?.rmb || 680)) : null);
  const price = p.prixVente || p.prixVenteEstime;
  const marginAr = cost && price ? price - cost : null;
  const marginPct = price && marginAr !== null ? Math.round((marginAr / price) * 100) : null;

  const pImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);

  return (
    <div
      style={{
        ...rowCard,
        borderLeft: isAlert ? '4px solid #C24A3F' : '1px solid #EAE2D4',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, transform 0.1s ease',
      } as any}
      onClick={(e: any) => {
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
          return;
        }
        onOpenDetail(p);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 200px', minWidth: 0 }}>
        {/* Miniature Image(s) */}
        <div style={{ flexShrink: 0 }}>
          {pImages.length > 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenGallery({ title: p.nom, images: pImages, index: 0 });
              }}
              style={{
                width: 50, height: 50, borderRadius: 8, overflow: 'hidden', border: '1px solid #EAE2D4',
                cursor: 'pointer', background: '#F5F0EB', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              title="Cliquer pour voir les photos"
            >
              <img src={pImages[0]} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {pImages.length > 1 && (
                <span style={{
                  position: 'absolute', bottom: 2, right: 2, background: 'rgba(38, 51, 61, 0.85)',
                  color: '#FAF7F2', fontSize: 9.5, fontWeight: 700, padding: '1px 4px', borderRadius: 4
                }}>
                  +{pImages.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div style={{
              width: 50, height: 50, borderRadius: 8, border: '1px dashed #D3C9BC',
              background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#B0A898'
            }} title="Aucune photo">
              <ImageIcon size={20} />
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#26333D' }}>
              {p.nom} {p.couleur ? `· ${p.couleur}` : ''}
            </span>
            {isAlert && (
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: '#FBEAE8', color: '#C24A3F', border: '1px solid #F0C6C0',
              }}>
                {isOut ? '❌ Rupture' : `⚠️ Stock Bas (< ${seuil})`}
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#8A8375', wordBreak: 'break-word', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{p.categorie}</span>
            {p.reference && !p.reference.startsWith('http') && !p.reference.includes('1688') && !p.reference.includes('taobao') && (
              <span>· réf/SKU: <strong>{p.reference}</strong></span>
            )}
            {(p.lien || p.reference?.startsWith('http') || p.reference?.includes('1688') || p.reference?.includes('taobao')) && (
              <a
                href={(p.lien || p.reference).startsWith('http') ? (p.lien || p.reference) : `https://${p.lien || p.reference}`}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: '#3D5A6C', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
              >
                <span>🔗 Lien 1688 / Taobao</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Prix, Marge Ar et Marge % */}
          {(cost || price) && (
            <div style={{ fontSize: 12, color: '#3D5A6C', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {cost && <span>Achat : <strong>{Number(cost).toLocaleString('fr-FR')} Ar</strong></span>}
              {price && <span>Vente : <strong>{Number(price).toLocaleString('fr-FR')} Ar</strong></span>}
              {marginAr !== null && (
                <span style={{ color: marginAr > 0 ? '#3F7A5C' : '#C24A3F', fontWeight: 600 }}>
                  (Marge : {marginAr > 0 ? '+' : ''}{Number(marginAr).toLocaleString('fr-FR')} Ar
                  {marginPct !== null ? ` / ${marginPct}%` : ''})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          background: stock > seuil ? '#E9F2EC' : (stock > 0 ? '#FFF8E1' : '#FBEAE8'),
          color: stock > seuil ? '#3F7A5C' : (stock > 0 ? '#B78103' : '#C24A3F'),
          whiteSpace: 'nowrap',
        }}>
          {stock} en stock
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(p);
          }}
          style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
          title="Voir l'historique et la fiche détaillée de l'article"
        >
          <History size={12} />
          <span>Historique</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdjust(p);
          }}
          style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, borderRadius: 6 }}
          title="Ajuster le stock (perte, vol, casse, réajustement)"
        >
          ⚙️ Ajuster
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(p);
          }}
          style={iconBtn}
          title="Modifier le produit"
        >
          <Edit2 size={14} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(p.id);
          }}
          style={iconBtn}
          title="Supprimer le produit"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
