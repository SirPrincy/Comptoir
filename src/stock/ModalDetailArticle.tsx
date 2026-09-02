import React, { useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  History,
  ShoppingCart,
  Sliders,
  Edit2,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Coins
} from 'lucide-react';
import { Modal, primaryBtn, ghostBtn, inputStyle } from '../ui';

interface ModalDetailArticleProps {
  product: any;
  stock: number;
  commandes: any[];
  ventes: any[];
  mouvements: any[];
  devises?: any;
  onClose: () => void;
  onEdit: (product: any) => void;
  onAdjust: (product: any) => void;
  onOpenGallery?: (title: string, images: string[]) => void;
}

export default function ModalDetailArticle({
  product,
  stock,
  commandes = [],
  ventes = [],
  mouvements = [],
  devises = { rmb: 680, usd: 4600 },
  onClose,
  onEdit,
  onAdjust,
  onOpenGallery,
}: ModalDetailArticleProps) {
  const [filterType, setFilterType] = useState<'tous' | 'achats' | 'ventes' | 'ajustements'>('tous');

  if (!product) return null;

  const seuil = product.seuilMin !== undefined ? Number(product.seuilMin) : 3;
  const isAlert = stock <= seuil;
  const isOut = stock === 0;

  const cost = product.coutTotalRenduAr || product.prixAchatAr || (product.puRmb ? Math.round(product.puRmb * (product.tauxRmb || devises?.rmb || 680)) : null);
  const price = product.prixVente || product.prixVenteEstime;
  const marginAr = cost && price ? price - cost : null;
  const marginPct = price && marginAr !== null ? Math.round((marginAr / price) * 100) : null;

  const pImages = Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);

  // 1. Filtrer les commandes / approvisionnements pour cet article
  const productCommandes = useMemo(() => {
    return commandes.filter((c: any) => c.productId === product.id || c.productNom === product.nom);
  }, [commandes, product]);

  // 2. Filtrer les ventes pour cet article
  const productVentes = useMemo(() => {
    return ventes.filter((v: any) => v.productId === product.id || v.productNom === product.nom);
  }, [ventes, product]);

  // 3. Filtrer les ajustements pour cet article
  const productAjustements = useMemo(() => {
    return mouvements.filter((m: any) =>
      m.type === 'Ajustement Stock' &&
      (m.productId === product.id || m.productNom === product.nom)
    );
  }, [mouvements, product]);

  // Totaux statistiques
  const stats = useMemo(() => {
    let totalAchete = 0;
    let totalArrive = 0;
    let totalEnTransit = 0;
    let depensesAchatsAr = 0;

    productCommandes.forEach((c: any) => {
      const q = Number(c.qty) || 0;
      totalAchete += q;
      if (c.statut === 'Arrivé' || c.qualityCheck?.isCompleted) {
        totalArrive += q;
      } else {
        totalEnTransit += q;
      }
      depensesAchatsAr += Number(c.total) || (Number(c.pu || 0) * q);
    });

    let totalVendu = 0;
    let caVentesAr = 0;
    productVentes.forEach((v: any) => {
      const q = Number(v.qty) || 0;
      totalVendu += q;
      caVentesAr += Number(v.total) || (Number(v.prixVente || 0) * q);
    });

    let totalAjustements = 0;
    productAjustements.forEach((m: any) => {
      totalAjustements += Number(m.delta) || 0;
    });

    return {
      totalAchete,
      totalArrive,
      totalEnTransit,
      depensesAchatsAr,
      totalVendu,
      caVentesAr,
      totalAjustements,
    };
  }, [productCommandes, productVentes, productAjustements]);

  // Reconstituer tous les flux chronologiques
  const fluxChronologiques = useMemo(() => {
    const items: any[] = [];

    // Achats
    productCommandes.forEach((c: any) => {
      const isArrive = c.statut === 'Arrivé' || c.qualityCheck?.isCompleted;
      items.push({
        id: `cmd-${c.id}`,
        type: 'achat',
        date: c.date || '',
        quantite: Number(c.qty) || 0,
        titre: isArrive ? 'Approvisionnement Reçu' : 'Commande en transit',
        sousTitre: c.fournisseurNom ? `Fournisseur : ${c.fournisseurNom}` : (c.refFournisseur || 'Commande Fournisseur'),
        details: `${Number(c.pu || 0).toLocaleString('fr-FR')} Ar/u · Total : ${(Number(c.total) || (Number(c.pu || 0) * Number(c.qty || 1))).toLocaleString('fr-FR')} Ar`,
        statutBadge: isArrive ? 'Arrivé en Stock' : (c.statut || 'En cours'),
        impactStock: isArrive ? `+${c.qty}` : 'En attente',
        isEntree: isArrive,
      });
    });

    // Ventes
    productVentes.forEach((v: any) => {
      items.push({
        id: `vte-${v.id}`,
        type: 'vente',
        date: v.date || '',
        quantite: Number(v.qty) || 0,
        titre: 'Vente Client',
        sousTitre: v.clientNom ? `Client : ${v.clientNom}` : 'Vente Comptoir',
        details: `${Number(v.prixVente || 0).toLocaleString('fr-FR')} Ar/u · Total : ${(Number(v.total) || (Number(v.prixVente || 0) * Number(v.qty || 1))).toLocaleString('fr-FR')} Ar`,
        statutBadge: v.statutPaiement || 'Payé',
        impactStock: `-${v.qty}`,
        isSortie: true,
      });
    });

    // Ajustements
    productAjustements.forEach((m: any) => {
      const delta = Number(m.delta) || 0;
      const val = m.valeurTotaleAr !== undefined && m.valeurTotaleAr !== null
        ? Number(m.valeurTotaleAr)
        : (m.valeurUnitaireAr ? Math.abs(delta) * Number(m.valeurUnitaireAr) : null);

      items.push({
        id: `adj-${m.id}`,
        type: 'ajustement',
        date: m.date || '',
        quantite: delta,
        titre: delta < 0 ? 'Perte / Déduction' : 'Ajustement Inventaire',
        sousTitre: m.motif || 'Régularisation de stock',
        details: val !== null ? `Valeur ajustée : ${val.toLocaleString('fr-FR')} Ar` : 'Ajustement manuel',
        statutBadge: delta < 0 ? 'Perte' : 'Ajout',
        impactStock: delta > 0 ? `+${delta}` : `${delta}`,
        isAjustement: true,
      });
    });

    // Trier par date décroissante
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [productCommandes, productVentes, productAjustements]);

  // Flux filtrés
  const fluxFiltres = useMemo(() => {
    if (filterType === 'achats') return fluxChronologiques.filter(f => f.type === 'achat');
    if (filterType === 'ventes') return fluxChronologiques.filter(f => f.type === 'vente');
    if (filterType === 'ajustements') return fluxChronologiques.filter(f => f.type === 'ajustement');
    return fluxChronologiques;
  }, [fluxChronologiques, filterType]);

  return (
    <Modal title={`📦 Historique & Fiche : ${product.nom}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* 1. Entête Produit & Photos */}
        <div style={{
          background: '#FAF7F2',
          border: '1px solid #EAE2D4',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}>
          {/* Miniature Image */}
          <div style={{ flexShrink: 0 }}>
            {pImages.length > 0 ? (
              <div
                onClick={() => onOpenGallery && onOpenGallery(product.nom, pImages)}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #EAE2D4',
                  cursor: 'pointer',
                  background: '#F5F0EB',
                  position: 'relative'
                }}
                title="Agrandir la photo"
              >
                <img src={pImages[0]} alt={product.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {pImages.length > 1 && (
                  <span style={{
                    position: 'absolute', bottom: 2, right: 2, background: 'rgba(38, 51, 61, 0.85)',
                    color: '#FAF7F2', fontSize: 9, fontWeight: 700, padding: '1px 3px', borderRadius: 3
                  }}>
                    +{pImages.length - 1}
                  </span>
                )}
              </div>
            ) : (
              <div style={{
                width: 68, height: 68, borderRadius: 8, border: '1px dashed #D3C9BC',
                background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#B0A898'
              }}>
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#26333D' }}>{product.nom}</span>
              {product.couleur && (
                <span style={{ fontSize: 11, background: '#EAE2D4', color: '#5E584E', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                  {product.couleur}
                </span>
              )}
            </div>

            <div style={{ fontSize: 12, color: '#8A8375', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Catégorie : <strong>{product.categorie || 'Général'}</strong></span>
              {product.reference && (
                <span>· Réf/SKU : <strong>{product.reference}</strong></span>
              )}
              {(product.lien || product.reference?.startsWith('http') || product.reference?.includes('1688') || product.reference?.includes('taobao')) && (
                <a
                  href={(product.lien || product.reference).startsWith('http') ? (product.lien || product.reference) : `https://${product.lien || product.reference}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#3D5A6C', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
                >
                  <span>1688 / Taobao</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Tarifs et marges */}
            <div style={{ marginTop: 6, display: 'flex', gap: 10, fontSize: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {cost && <span>Achat : <strong>{Number(cost).toLocaleString('fr-FR')} Ar</strong></span>}
              {price && <span>Vente : <strong>{Number(price).toLocaleString('fr-FR')} Ar</strong></span>}
              {marginAr !== null && (
                <span style={{ color: marginAr > 0 ? '#3F7A5C' : '#C24A3F', fontWeight: 700 }}>
                  Marge : {marginAr > 0 ? '+' : ''}{Number(marginAr).toLocaleString('fr-FR')} Ar ({marginPct}%)
                </span>
              )}
            </div>
          </div>

          {/* Boutons d'action rapide */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
            <button
              onClick={() => { onClose(); onAdjust(product); }}
              style={{ ...ghostBtn, padding: '5px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
              title="Ajuster le stock"
            >
              <Sliders size={12} />
              <span>Ajuster</span>
            </button>
            <button
              onClick={() => { onClose(); onEdit(product); }}
              style={{ ...ghostBtn, padding: '5px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
              title="Modifier la fiche"
            >
              <Edit2 size={12} />
              <span>Modifier</span>
            </button>
          </div>
        </div>

        {/* 2. Synthèse des flux et Stock Actuel (KPIs) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          
          {/* Stock actuel */}
          <div style={{
            background: stock > seuil ? '#E9F2EC' : (stock > 0 ? '#FFF8E1' : '#FBEAE8'),
            border: `1px solid ${stock > seuil ? '#BBDBC7' : (stock > 0 ? '#F3D99F' : '#F0C6C0')}`,
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: stock > seuil ? '#3F7A5C' : (stock > 0 ? '#B78103' : '#C24A3F') }}>
              📦 STOCK DISPO
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: stock > seuil ? '#166534' : (stock > 0 ? '#854D0E' : '#991B1B'), marginTop: 2 }}>
              {stock} u
            </div>
            <div style={{ fontSize: 10, color: '#736B5E', marginTop: 1 }}>
              {isOut ? 'Rupture totale' : (isAlert ? `Seuil min: ${seuil}` : 'Disponible')}
            </div>
          </div>

          {/* Total Reçu / Acheté */}
          <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3D5A6C' }}>📥 APPROVISIONNÉ</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#26333D', marginTop: 2 }}>
              {stats.totalArrive} u
            </div>
            <div style={{ fontSize: 10, color: '#736B5E', marginTop: 1 }}>
              {stats.totalEnTransit > 0 ? `+${stats.totalEnTransit} en transit` : 'Total réceptionné'}
            </div>
          </div>

          {/* Total Vendu */}
          <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3F7A5C' }}>📤 TOTAL VENDU</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#166534', marginTop: 2 }}>
              {stats.totalVendu} u
            </div>
            <div style={{ fontSize: 10, color: '#736B5E', marginTop: 1 }}>
              CA: {stats.caVentesAr.toLocaleString('fr-FR')} Ar
            </div>
          </div>

          {/* Ajustements / Pertes */}
          <div style={{ background: '#FAF7F2', border: '1px solid #EAE2D4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: stats.totalAjustements < 0 ? '#C24A3F' : '#736B5E' }}>
              ⚙️ AJUSTEMENTS
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: stats.totalAjustements < 0 ? '#C24A3F' : '#26333D', marginTop: 2 }}>
              {stats.totalAjustements > 0 ? `+${stats.totalAjustements}` : stats.totalAjustements} u
            </div>
            <div style={{ fontSize: 10, color: '#736B5E', marginTop: 1 }}>
              {productAjustements.length} régularisation(s)
            </div>
          </div>
        </div>

        {/* 3. Onglets de filtrage du Journal */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #EAE2D4', paddingBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5E584E', marginRight: 4 }}>Journal des mouvements :</span>
          <button
            onClick={() => setFilterType('tous')}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filterType === 'tous' ? '#3D5A6C' : '#EAE2D4',
              color: filterType === 'tous' ? '#FAF7F2' : '#26333D',
            }}
          >
            Tous ({fluxChronologiques.length})
          </button>
          <button
            onClick={() => setFilterType('achats')}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filterType === 'achats' ? '#3D5A6C' : '#EAE2D4',
              color: filterType === 'achats' ? '#FAF7F2' : '#26333D',
            }}
          >
            📥 Achats ({productCommandes.length})
          </button>
          <button
            onClick={() => setFilterType('ventes')}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filterType === 'ventes' ? '#3F7A5C' : '#EAE2D4',
              color: filterType === 'ventes' ? '#FAF7F2' : '#26333D',
            }}
          >
            📤 Ventes ({productVentes.length})
          </button>
          <button
            onClick={() => setFilterType('ajustements')}
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filterType === 'ajustements' ? '#C24A3F' : '#EAE2D4',
              color: filterType === 'ajustements' ? '#FAF7F2' : '#26333D',
            }}
          >
            ⚙️ Ajustements ({productAjustements.length})
          </button>
        </div>

        {/* 4. Liste chronologique des transactions de l'article */}
        {fluxFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: '#8A8375', fontSize: 12.5, background: '#FAF7F2', borderRadius: 8, border: '1px dashed #EAE2D4' }}>
            Aucun mouvement enregistré pour ce filtre.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '320px', overflowY: 'auto', paddingRight: 4 }}>
            {fluxFiltres.map((item: any) => {
              const isEntree = item.type === 'achat';
              const isSortie = item.type === 'vente';
              const isAdj = item.type === 'ajustement';

              let badgeColor = '#3D5A6C';
              let badgeBg = '#E8EFF2';
              if (isEntree) {
                badgeColor = item.isEntree ? '#166534' : '#854D0E';
                badgeBg = item.isEntree ? '#E9F2EC' : '#FFF8E1';
              } else if (isSortie) {
                badgeColor = '#3F7A5C';
                badgeBg = '#E9F2EC';
              } else if (isAdj) {
                badgeColor = item.quantite < 0 ? '#C24A3F' : '#3D5A6C';
                badgeBg = item.quantite < 0 ? '#FBEAE8' : '#E8EFF2';
              }

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid #EAE2D4',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 auto' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: badgeBg,
                      color: badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 12,
                    }}>
                      {isEntree ? '📥' : (isSortie ? '📤' : '⚙️')}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: '#26333D' }}>{item.titre}</span>
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                          {item.statutBadge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8375', marginTop: 1 }}>
                        <span>{item.sousTitre}</span>
                        {item.details && <span> · {item.details}</span>}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#A0988A', marginTop: 1 }}>
                        {item.date && !isNaN(new Date(item.date).getTime()) ? new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date non spécifiée'}
                      </div>
                    </div>
                  </div>

                  {/* Impact sur le stock */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: item.impactStock.startsWith('+') ? '#166534' : (item.impactStock.startsWith('-') ? '#C24A3F' : '#3D5A6C')
                    }}>
                      {item.impactStock} {item.impactStock !== 'En attente' ? 'u' : ''}
                    </div>
                    <div style={{ fontSize: 10, color: '#8A8375' }}>
                      {isEntree ? (item.isEntree ? 'Reçu' : 'En transit') : (isSortie ? 'Vente' : 'Ajustement')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Modal>
  );
}
