'use client';
import API_BASE from '@/lib/api';

import { useEffect, useState } from 'react';
import { HistoryIcon, RefreshIcon, CheckIcon, AlertIcon } from './Icons';

export default function HistoryView() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [settlementResult, setSettlementResult] = useState<string | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/parleys/history`)
      .then(res => res.json())
      .then(data => {
        if (data.parleys) setHistory(data.parleys);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const triggerSettlement = async () => {
    setSettling(true);
    setSettlementResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/parleys/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSettlementResult(`Se liquidaron ${data.settled_count} tickets contra marcadores reales.`);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
    setSettling(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HistoryIcon size={24} color="var(--accent)" /> Historial de Parleys (Firebase)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Registro inmutable de evaluaciones y liquidación automática de partidos jugados.
          </p>
        </div>

        <button 
          className="glass-button primary"
          onClick={triggerSettlement}
          disabled={settling}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshIcon size={16} />
          {settling ? 'Liquidando Marcadores...' : 'Liquidar Tickets Automático'}
        </button>
      </div>

      {settlementResult && (
        <div className="animate-fade-in" style={{ 
          padding: '12px 16px', 
          borderRadius: '10px', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--ev-positive)',
          fontSize: '0.85rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckIcon size={16} /> {settlementResult}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Cargando historial desde Firestore...
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No hay tickets guardados aún en Firebase.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((parley, idx) => {
            const isWon = parley.status === 'WON';
            const isLost = parley.status === 'LOST';
            const isPending = parley.status === 'PENDING' || !parley.status;

            return (
              <div key={parley.id || idx} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span className="badge positive" style={{ marginRight: '8px' }}>
                      Score: {parley.quality_score}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ID: {parley.id?.substring(0, 8)}...
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: parley.total_ev > 0 ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                    {parley.total_ev > 0 ? '+' : ''}{parley.total_ev?.toFixed(1)}% EV
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>Cuota Combinada: <strong style={{ color: '#fff' }}>@{parley.total_odds?.toFixed(2)}</strong></div>
                  <div>
                    Estado: {' '}
                    {isWon && (
                      <span className="badge positive" style={{ fontWeight: 700 }}>
                        <CheckIcon size={12} /> GANADO (WON)
                      </span>
                    )}
                    {isLost && (
                      <span className="badge negative" style={{ fontWeight: 700 }}>
                        <AlertIcon size={12} /> PERDIDO (LOST)
                      </span>
                    )}
                    {isPending && (
                      <span className="chip" style={{ fontSize: '0.75rem' }}>
                        PENDIENTE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
