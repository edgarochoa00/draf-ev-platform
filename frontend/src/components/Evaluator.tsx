'use client';
import API_BASE from '@/lib/api';

import { useState } from 'react';
import { TicketIcon, ZapIcon, AlertIcon, ExternalLinkIcon, SaveIcon, CheckIcon } from './Icons';

type EvaluatorProps = {
  selections: any[];
  onRemove: (id: string) => void;
  bankroll: number;
  setBankroll: (b: number) => void;
  onOptimize: () => void;
};

export default function Evaluator({ 
  selections, 
  onRemove,
  bankroll,
  setBankroll,
  onOptimize
}: EvaluatorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const hasNegativeEV = selections.some(s => s.ev_percent < 0);

  const evaluateTicket = async () => {
    if (selections.length === 0) return;
    setLoading(true);
    setSavedStatus(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/parleys/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_bankroll: bankroll, 
          selections: selections.map(s => ({
            event_id: s.event_id,
            sport: s.sport,
            decimal_odds: s.decimal_odds,
            model_prob: s.model_prob,
            selection_name: s.selection_name
          }))
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ position: 'sticky', top: '90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TicketIcon size={20} color="var(--accent)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Ticket Builder</h2>
        </div>
        <span className="chip" style={{ fontSize: '0.75rem' }}>{selections.length} Picks</span>
      </div>

      {/* Input de Bankroll */}
      <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          Presupuesto Total (Bankroll MXN):
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--ev-positive)' }}>$</span>
          <input 
            className="glass-input"
            type="number"
            value={bankroll}
            onChange={(e) => setBankroll(Number(e.target.value) || 0)}
            placeholder="Ej. 1000"
          />
        </div>
      </div>

      {/* Botón de Optimización IA si hay picks de -EV */}
      {hasNegativeEV && (
        <div className="animate-fade-in" style={{ marginBottom: '16px', background: 'rgba(139, 92, 246, 0.1)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertIcon size={14} color="var(--accent-purple)" />
            Se detectaron apuestas con -EV en tu ticket.
          </div>
          <button 
            className="glass-button gradient"
            style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
            onClick={onOptimize}
          >
            <ZapIcon size={14} /> Optimizar con IA (Filtrar -EV)
          </button>
        </div>
      )}
      
      {/* Lista de Selecciones */}
      {selections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', border: '1px dashed var(--glass-border)', borderRadius: '12px', marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tu ticket está vacío.<br />Selecciona apuestas del Radar para analizarlas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
          {selections.map(s => {
            const isPos = s.ev_percent > 0;
            return (
              <div key={s.event_id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 14px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '10px',
                borderLeft: isPos ? '3px solid var(--ev-positive)' : '3px solid var(--ev-negative)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.selection_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {s.match_name}
                  </div>
                  {/* Métricas individuales */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem' }}>
                    <span>Cuota: <strong>@{s.decimal_odds.toFixed(2)}</strong></span>
                    <span style={{ color: isPos ? 'var(--ev-positive)' : 'var(--ev-negative)', fontWeight: 600 }}>
                      {isPos ? '+' : ''}{s.ev_percent.toFixed(1)}% EV
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(s.event_id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
                  title="Eliminar"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón Evaluar */}
      <button 
        className="glass-button primary" 
        style={{ width: '100%', marginBottom: '20px', padding: '12px' }}
        disabled={selections.length === 0 || loading}
        onClick={evaluateTicket}
      >
        {loading ? 'Calculando Matemáticas +EV...' : 'Evaluar Rentabilidad'}
      </button>

      {/* Resultados de la Evaluación */}
      {result && (
        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: result.is_recommended ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                {result.quality_score}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quality Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: result.combined_ev_percent > 0 ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                {result.combined_ev_percent > 0 ? '+' : ''}{result.combined_ev_percent.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor Esperado (+EV)</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Cuota Combinada Parley</span>
            <strong>@{result.combined_odds.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Stake Kelly Sugerido</span>
            <strong style={{ color: 'var(--ev-positive)', fontSize: '1rem' }}>
              ${result.recommended_stake} MXN ({result.bankroll_percentage}%)
            </strong>
          </div>
          
          <div style={{ 
            padding: '12px', 
            borderRadius: '10px', 
            background: result.is_recommended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${result.is_recommended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.85rem',
            lineHeight: '1.4',
            marginBottom: '20px'
          }}>
            {result.optimization_advice}
          </div>

          {/* Botones de Acción de Salida */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a 
              href="https://www.caliente.mx" 
              target="_blank" 
              rel="noreferrer"
              className="glass-button primary" 
              style={{ textDecoration: 'none', textAlign: 'center', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Apostar en Casa de Apuestas <ExternalLinkIcon size={16} />
            </a>
            
            {savedStatus ? (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ev-positive)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckIcon size={16} /> {savedStatus}
              </div>
            ) : (
              <button 
                className="glass-button"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setSavedStatus("Parley guardado en tu historial de Firebase")}
              >
                <SaveIcon size={16} /> Guardar en Mis Parleys
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
