export function computeStock(
  products: any[] = [],
  commandes: any[] = [],
  ventes: any[] = [],
  mouvements: any[] = []
): Record<string, number> {
  const stockMap: Record<string, number> = {};
  
  products.forEach((p: any) => {
    stockMap[p.id] = 0;
  });

  // Entrées : Achats arrivés à Madagascar ou validés en contrôle qualité
  commandes.forEach((c: any) => {
    if (c.statut === 'Arrivé' || c.qualityCheck?.isCompleted) {
      if (stockMap[c.productId] !== undefined) {
        if (c.qualityCheck?.isCompleted && c.qualityCheck.qtyConforme !== undefined) {
          stockMap[c.productId] += Number(c.qualityCheck.qtyConforme) || 0;
        } else {
          stockMap[c.productId] += Number(c.qty) || 0;
        }
      }
    }
  });

  // Sorties : Ventes réalisées
  ventes.forEach((v: any) => {
    if (stockMap[v.productId] !== undefined) {
      stockMap[v.productId] -= Number(v.qty) || 0;
    }
  });

  // Ajustements manuels de stock (casse, vol, échantillon, correction d'inventaire)
  mouvements.forEach((m: any) => {
    if (m.productId && stockMap[m.productId] !== undefined) {
      if (m.delta !== undefined) {
        stockMap[m.productId] += Number(m.delta) || 0;
      }
    }
  });

  return stockMap;
}

export function compressAndReadFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

