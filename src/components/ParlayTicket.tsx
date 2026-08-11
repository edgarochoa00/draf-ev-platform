'use client';
import API_BASE from '@/lib/api';


import { useState, useEffect } from 'react';
import { TicketIcon, ZapIcon, AlertIcon, ExternalLinkIcon, SaveIcon, CheckIcon, RefreshIcon } from './Icons';

type TicketSelection = {
  event_id: string;
  sport: string;
  league_name?: string;
  match_name: string;
  selection_name: string;
  decimal_odds: number;
  model_prob: number;
  ev_percent: number;
};

type EvaluatorProps = {
  selections: TicketSelection[];
  onRemove: (id: string) => void;
  onClear: () => void;
  bankroll: number;
  setBankroll: (b: number) => void;
  onOptimize: () => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────
function groupByMatch(selections: TicketSelection[]) {
  const groups: Record<string, TicketSelection[]> = {};
  for (const s of selections) {
    const matchKey = s.event_id.includes('__') ? s.event_id.split('__')[0] : s.event_id;
    if (!groups[matchKey]) groups[matchKey] = [];
    groups[matchKey].push(s);
  }
  return groups;
}

function combinedOdds(selections: TicketSelection[]) {
  return selections.reduce((acc, s) => acc * s.decimal_odds, 1);
}

function combinedProb(selections: TicketSelection[]) {
  return selections.reduce((acc, s) => acc * s.model_prob, 1);
}

function combinedEV(selections: TicketSelection[]) {
  const prob = combinedProb(selections);
  const odds = combinedOdds(selections);
  return ((prob * odds) - 1) * 100;
}

function kellyStake(prob: number, odds: number, bankroll: number) {
  const edge = prob * odds - 1;
  const kelly = edge / (odds - 1);
  const fraction = Math.max(0, kelly * 0.25);
  return Math.round(fraction * bankroll * 100) / 100;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ParlayTicket({
  selections,
  onRemove,
  onClear,
  bankroll,
  setBankroll,
  onOptimize,
}: EvaluatorProps) {
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<any>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [userBetStake, setUserBetStake] = useState<number>(100);

  // Reset evaluation result when selections change so user only sees evaluation after clicking button
  useEffect(() => {
    setResult(null);
    setSavedStatus(null);
  }, [selections]);

  const hasNegativeEV = selections.some(s => s.ev_percent < 0);

  const cOdds = combinedOdds(selections);
  const cProb = combinedProb(selections);
  const cEV   = combinedEV(selections);
  const recStake = kellyStake(cProb, cOdds, bankroll);
  const potentialPayout = Math.round(userBetStake * cOdds * 100) / 100;
  const groups = groupByMatch(selections);

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
            event_id:       s.event_id,
            sport:          s.sport || 'Soccer',
            decimal_odds:   s.decimal_odds || 1.0,
            model_prob:     s.model_prob || 0.5,
            selection_name: s.selection_name,
            match_name:     s.match_name || s.selection_name || 'Match',
          })),
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Evaluate error:', error);
      setResult({
        combined_odds:         cOdds,
        combined_model_prob:   cProb,
        combined_ev_percent:   cEV,
        quality_score:         cEV > 5 ? 'A+' : cEV > 0 ? 'A' : 'C',
        is_recommended:        cEV > 0,
        recommended_stake:     recStake,
        bankroll_percentage:   Math.round((recStake / bankroll) * 100),
        optimization_advice:   cEV > 0
          ? 'Ticket balanceado con valor esperado positivo (+EV).'
          : 'Alerta: Este parley contiene selecciones con -EV. La casa tiene ventaja matemática.',
      });
    }
    setLoading(false);
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        position: 'sticky', 
        top: '90px',
        maxHeight: 'calc(100vh - 110px)',
        overflowY: 'auto',
        border: '1px solid rgba(124, 58, 237, 0.25)',
        background: '#121215',
        borderRadius: '22px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        paddingRight: '12px'
      }}
    >
      {/* ── Ticket Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TicketIcon size={18} color="var(--draf-purple)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1 }}>Ticket Parley</h2>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Draf Bet Slip</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge positive" style={{ fontSize: '0.78rem' }}>
            {selections.length} Picks
          </span>
          {selections.length > 0 && (
            <button
              className="glass-button"
              style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '20px', color: 'var(--ev-negative)' }}
              onClick={onClear}
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* ── Draf Live Multiplier & Payout Box ──────────────────────── */}
      {selections.length > 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(0, 245, 155, 0.1) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.35)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '18px',
          boxShadow: '0 0 25px rgba(124, 58, 237, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block' }}>Cuota Combinada</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                {cOdds.toFixed(2)}x
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block' }}>Ventaja (+EV)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: cEV > 0 ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                {cEV > 0 ? '+' : ''}{cEV.toFixed(1)}%
              </span>
            </div>
          </div>

          <div style={{ 
            borderTop: '1px dashed rgba(255, 255, 255, 0.12)', 
            paddingTop: '10px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.84rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ganancia Est. (${userBetStake} MXN):</span>
            <strong style={{ color: 'var(--ev-positive)', fontSize: '1.05rem' }}>${potentialPayout} MXN</strong>
          </div>
        </div>
      ) : null}

      {/* ── Quick Stake Preset Chips ───────────────────────────────────── */}
      {selections.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
            Monto a Apostar (Stake):
          </span>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[50, 100, 250, 500, recStake].filter(Boolean).map((amt, idx) => (
              <button
                key={idx}
                className={`chip ${userBetStake === amt ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                onClick={() => setUserBetStake(amt)}
              >
                ${amt} {amt === recStake ? 'KELLY' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── -EV Optimization Alert ────────────────────────────────────── */}
      {hasNegativeEV && (
        <div className="animate-fade-in" style={{ marginBottom: '16px', background: 'rgba(139, 92, 246, 0.12)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.35)' }}>
          <div style={{ fontSize: '0.78rem', color: '#C084FC', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertIcon size={14} color="#C084FC" />
            Apuestas con -EV detectadas en tu ticket.
          </div>
          <button className="glass-button gradient" style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }} onClick={onOptimize}>
            <ZapIcon size={14} /> Optimizar con IA (Filtrar -EV)
          </button>
        </div>
      )}

      {/* ── Grouped Matches Picks List ────────────────────────────────── */}
      {selections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', border: '1px dashed var(--glass-border)', borderRadius: '16px', marginBottom: '18px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
            <TicketIcon size={32} color="var(--text-muted)" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, fontWeight: 500 }}>
            Tu ticket está vacío.<br />
            Haz clic en cualquier cuota del Radar para añadirla al Parley.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: '340px', overflowY: 'auto', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(groups).map(([matchKey, picks]) => (
            <div key={matchKey} style={{ background: '#18181C', border: '1px solid var(--glass-border)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Match Header */}
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', padding: '8px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.78rem', color: '#E9D5FF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {picks[0].match_name}
                {picks[0].league_name && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.72rem' }}>• {picks[0].league_name}</span>
                )}
              </div>
              {/* Picks */}
              {picks.map(s => {
                const oddsVal = s.decimal_odds || 1.0;
                const evVal = s.ev_percent || 0;
                const isPos = evVal > 0;
                return (
                  <div key={s.event_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderLeft: isPos ? '3px solid var(--ev-positive)' : '3px solid var(--ev-negative)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.selection_name}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '0.74rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cuota: <strong style={{ color: '#fff' }}>{oddsVal.toFixed(2)}x</strong></span>
                        <span style={{ color: isPos ? 'var(--ev-positive)' : 'var(--ev-negative)', fontWeight: 700 }}>
                          {isPos ? '+' : ''}{evVal.toFixed(1)}% EV
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(s.event_id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
                      title="Eliminar pick"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Main CTA Button ───────────────────────────────────────────── */}
      <button
        className="glass-button purple-glow"
        style={{ width: '100%', marginBottom: '16px', padding: '14px', fontSize: '0.95rem' }}
        disabled={selections.length === 0 || loading}
        onClick={evaluateTicket}
      >
        {loading ? (
          <><RefreshIcon size={16} /> Calculando Modelo +EV...</>
        ) : (
          'EVALUAR Y OPTIMIZAR PARLEY'
        )}
      </button>

      {/* ── Evaluation Results ───────────────────────────────────────── */}
      {result && (
        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: result.is_recommended ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                {result.quality_score}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: result.combined_ev_percent > 0 ? 'var(--ev-positive)' : 'var(--ev-negative)' }}>
                {result.combined_ev_percent > 0 ? '+' : ''}{result.combined_ev_percent.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>EV Combinado</div>
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '12px',
            background: result.is_recommended ? 'rgba(0,245,155,0.08)' : 'rgba(255,77,109,0.08)',
            border: `1px solid ${result.is_recommended ? 'rgba(0,245,155,0.3)' : 'rgba(255,77,109,0.3)'}`,
            fontSize: '0.82rem',
            lineHeight: '1.4',
            marginBottom: '16px',
            color: '#F1F5F9'
          }}>
            {result.optimization_advice}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="https://www.caliente.mx"
              target="_blank"
              rel="noreferrer"
              className="glass-button purple-glow"
              style={{ textDecoration: 'none', textAlign: 'center', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Apostar en Caliente.mx <ExternalLinkIcon size={16} />
            </a>

            {savedStatus ? (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ev-positive)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckIcon size={16} /> {savedStatus}
              </div>
            ) : (
              <button
                className="glass-button"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setSavedStatus('✓ Parley guardado en tu historial')}
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
