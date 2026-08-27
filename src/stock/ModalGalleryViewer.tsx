import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../ui';

interface ModalGalleryViewerProps {
  gallery: {
    title: string;
    images: string[];
    index: number;
  } | null;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export default function ModalGalleryViewer({
  gallery,
  onClose,
  onSelectIndex,
}: ModalGalleryViewerProps) {
  if (!gallery) return null;

  return (
    <Modal title={`Galerie : ${gallery.title}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: '100%', maxHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#26333D', borderRadius: 8, overflow: 'hidden', padding: 8 }}>
          <img
            src={gallery.images[gallery.index]}
            alt={`Vue ${gallery.index + 1}`}
            style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 6 }}
          />

          {gallery.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onSelectIndex((gallery.index - 1 + gallery.images.length) % gallery.images.length)}
                style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', color: '#26333D', border: 'none',
                  borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => onSelectIndex((gallery.index + 1) % gallery.images.length)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', color: '#26333D', border: 'none',
                  borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Miniatures */}
        {gallery.images.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
            {gallery.images.map((img, i) => (
              <div
                key={i}
                onClick={() => onSelectIndex(i)}
                style={{
                  width: 50, height: 50, borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                  border: i === gallery.index ? '2px solid #3D5A6C' : '1px solid #EAE2D4',
                  opacity: i === gallery.index ? 1 : 0.6,
                  transition: '0.15s ease'
                }}
              >
                <img src={img} alt={`Miniature ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
