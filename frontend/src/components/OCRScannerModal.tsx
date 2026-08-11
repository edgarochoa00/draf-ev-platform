'use client';
import { useState } from 'react';
import { OCRIcon, UploadIcon, RefreshIcon } from './Icons';

export default function OCRScannerModal({ isOpen, onClose, onImportPicks }: { isOpen: boolean; onClose: () => void; onImportPicks: (picks: any[]) => void }) {
  const [scanning, setScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleSimulatedUpload = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const extractedPicks = [
        {
          event_id: 'ocr_1',
          sport: 'NBA',
          match_name: 'Celtics vs Heat (OCR)',
          selection_name: 'Celtics Moneyline',
          decimal_odds: 1.85,
          model_prob: 0.62,
          ev_percent: 14.7
        },
        {
          event_id: 'ocr_2',
          sport: 'Soccer',
          match_name: 'Man City vs Arsenal (OCR)',
          selection_name: 'Over 2.5 Goles',
          decimal_odds: 2.05,
          model_prob: 0.54,
          ev_percent: 10.7
        }
      ];
      onImportPicks(extractedPicks);
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '100%', padding: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <OCRIcon size={22} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Escáner OCR de Tickets</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Sube o arrastra la foto de tu ticket impreso o captura digital de Caliente/Bet365. Nuestra IA reconocerá los partidos automáticamente.
        </p>

        <div 
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => { e.preventDefault(); handleSimulatedUpload(); }}
          onClick={handleSimulatedUpload}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent-purple)' : 'var(--glass-border)'}`,
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? 'rgba(139, 92, 246, 0.05)' : 'rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
            marginBottom: '20px'
          }}
        >
          {scanning ? (
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                <RefreshIcon size={36} color="var(--accent-purple)" />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>Procesando imagen con Visión IA...</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Extrayendo cuotas y probabilidades...</div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                <UploadIcon size={36} color="var(--text-secondary)" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Haz clic o arrastra tu imagen aquí</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Soporta JPG, PNG, WEBP</span>
            </div>
          )}
        </div>

        <button className="glass-button" style={{ width: '100%' }} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
