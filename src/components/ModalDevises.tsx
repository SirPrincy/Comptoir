import React, { useState } from 'react';
import { Coins, Check, ArrowRight } from 'lucide-react';
import { THEME } from '../colors';
import { Modal, Field, inputStyle, primaryBtn, ghostBtn } from '../ui';

interface ModalDevisesProps {
  open: boolean;
  onClose: () => void;
  devises: { rmb: number; usd: number };
  onSave: (devises: { rmb: number; usd: number }) => void;
}

export default function ModalDevises({ open, onClose, devises, onSave }: ModalDevisesProps) {
  const [rmb, setRmb] = useState(String(devises?.rmb || 680));
  const [usd, setUsd] = useState(String(devises?.usd || 4600));

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rmbNum = Number(rmb) || 680;
    const usdNum = Number(usd) || 4600;
    onSave({ rmb: rmbNum, usd: usdNum });
    onClose();
  };

  return (
    <Modal title="Taux de change globaux du jour" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12.5, color: THEME.text.secondary, lineHeight: 1.5, background: THEME.bg.soft, padding: '10px 12px', borderRadius: 8, border: `1px solid ${THEME.border.base}` }}>
          Ces taux sont utilisés <strong>par défaut partout</strong> (Sourcing, Achats Chine, Valorisation du Stock et Logistique).
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Field label="Taux Yuan / RMB (Ar / ¥)" style={{ flex: '1 1 180px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="any"
                min="1"
                value={rmb}
                onChange={e => setRmb(e.target.value)}
                style={inputStyle as any}
                placeholder="Ex: 680"
                required
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: THEME.text.muted, fontWeight: 600 }}>
                Ar / ¥
              </span>
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
              Ex: 100 ¥ = {((Number(rmb) || 0) * 100).toLocaleString('fr-FR')} Ar
            </div>
          </Field>

          <Field label="Taux Dollar / USD (Ar / $)" style={{ flex: '1 1 180px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="any"
                min="1"
                value={usd}
                onChange={e => setUsd(e.target.value)}
                style={inputStyle as any}
                placeholder="Ex: 4600"
                required
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: THEME.text.muted, fontWeight: 600 }}>
                Ar / $
              </span>
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 4 }}>
              Ex: 100 $ = {((Number(usd) || 0) * 100).toLocaleString('fr-FR')} Ar
            </div>
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Annuler
          </button>
          <button type="submit" style={primaryBtn}>
            <Check size={14} />
            <span>Appliquer les taux</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
