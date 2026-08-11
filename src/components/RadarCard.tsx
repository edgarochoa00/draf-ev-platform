'use client';

import { useState } from 'react';
import { ZapIcon, AlertIcon } from './Icons';

type Selection = {
  event_id: string;
  sport: string;
  league_name?: string;
  match_name: string;
  home_team?: string;
  home_abbrev?: string;
  home_logo?: string;
  away_team?: string;
  away_abbrev?: string;
  away_logo?: string;
  selection_name: string;
  decimal_odds: number;
  odds_label?: string;
  model_prob: number;
  ev_percent: number;
  start_time_formatted?: string;
  venue?: string;
  home_form?: string;
  away_form?: string;
  home_xg?: number;
  away_xg?: number;
  is_live?: boolean;
  status_desc?: string;
  markets?: any[];
};

export default function RadarCard({ 
  selection, 
  onAdd,
  onOpenMarkets
}: { 
  selection: Selection;
  onAdd: (s: any) => any;
  onOpenMarkets?: (s: Selection) => void;
}) {
  const isPositive = (selection.ev_percent || 0) > 0;
  const homeName = selection.home_team || selection.match_name.split(' vs ')[0] || 'Home';
  const homeAbbrev = selection.home_abbrev || homeName.slice(0, 3).toUpperCase();
  const awayName = selection.away_team || selection.match_name.split(' vs ')[1] || 'Away';
  const awayAbbrev = selection.away_abbrev || awayName.slice(0, 3).toUpperCase();

  const [selectedPickId, setSelectedPickId] = useState<string | null>(null);

  const handlePickSelect = (pickPayload: any) => {
    onAdd(pickPayload);
    setSelectedPickId(pickPayload.selection_id);
    setTimeout(() => setSelectedPickId(null), 2000);
  };

  // Find Money Line or Full Time market
  const mainMarket = selection.markets?.[0] || null;
  const picks = mainMarket?.picks || [
    { selection_id: `${selection.event_id}_home`, abbrev: homeAbbrev, selection_name: `${homeName} Gana`, decimal_odds: selection.decimal_odds || 1.85, odds_label: `${(selection.decimal_odds || 1.85).toFixed(2)}x`, ev_percent: selection.ev_percent || 0, model_prob: selection.model_prob || 0.5 },
    { selection_id: `${selection.event_id}_draw`, abbrev: 'EMPATE', selection_name: 'Empate', decimal_odds: 3.40, odds_label: '3.40x', ev_percent: -12.0, model_prob: 0.25 },
    { selection_id: `${selection.event_id}_away`, abbrev: awayAbbrev, selection_name: `${awayName} Gana`, decimal_odds: 3.90, odds_label: '3.90x', ev_percent: -18.0, model_prob: 0.20 },
  ];

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{ 
        marginBottom: '16px',
        padding: '18px 20px',
        background: '#121215',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* ── Top Match Info Row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge draf-badge">{selection.league_name || selection.sport}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selection.start_time_formatted}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>xG: {selection.home_xg || 1.5} - {selection.away_xg || 1.2}</span>
        </div>
      </div>

      {/* ── Main Row: Teams (Left) & Odds Buttons Grid (Right) ──────────── */}
      <div className="radar-card-main-row">
        {/* Left Column: Team Names & Logos */}
        <div className="radar-card-teams-col" onClick={() => onOpenMarkets && onOpenMarkets(selection)}>
          {/* Home Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#18181C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selection.home_logo ? (
                <img src={selection.home_logo} alt={homeName} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6' }}>{homeAbbrev}</span>
              )}
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {homeName}
            </span>
          </div>

          {/* Away Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#18181C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selection.away_logo ? (
                <img src={selection.away_logo} alt={awayName} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8B5CF6' }}>{awayAbbrev}</span>
              )}
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {awayName}
            </span>
          </div>
        </div>

        {/* Right Column: 3 Odds Buttons Grid */}
        <div className="radar-card-odds-col">
          <div className="draf-odds-grid">
            {picks.map((p: any) => {
              const isSelected = selectedPickId === p.selection_id;
              const abbrevLabel = p.abbrev || (p.selection_name.includes('Empate') ? 'EMPATE' : p.selection_name.slice(0, 3).toUpperCase());
              const oddsVal = p.decimal_odds || 1.0;
              const oddsLabel = p.odds_label || `${oddsVal.toFixed(2)}x`;
              const evVal = p.ev_percent || 0;
              const isPos = evVal > 0;

              return (
                <div
                  key={p.selection_id}
                  className={`draf-odds-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePickSelect({
                    event_id: `${selection.event_id}__${p.selection_id}`,
                    sport: selection.sport,
                    league_name: selection.league_name,
                    match_name: selection.match_name,
                    selection_name: `${p.selection_name} (${mainMarket?.category || 'Money Line'})`,
                    decimal_odds: oddsVal,
                    model_prob: p.model_prob || 0.5,
                    ev_percent: evVal,
                    selection_id: p.selection_id,
                  })}
                >
                  <span className="odds-abbrev">{abbrevLabel}</span>
                  <span className="odds-multiplier">{oddsLabel}</span>
                  {isPos && (
                    <span style={{ fontSize: '0.62rem', color: 'var(--ev-positive)', fontWeight: 700, marginTop: '-2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      +{evVal.toFixed(0)}% EV
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Bottom Row (+EV Advantage & "Ver más >") ─────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
        <span className={`badge ${isPositive ? 'positive' : 'draf-badge'}`}>
          {isPositive ? <ZapIcon size={12} color="var(--ev-positive)" /> : null}
          {isPositive ? `+${(selection.ev_percent || 0).toFixed(1)}% EV Ventaja IA` : 'Cuotas Equilibradas'}
        </span>

        {onOpenMarkets && (
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#A1A1AA', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s ease'
            }}
            onClick={() => onOpenMarkets(selection)}
            onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}
          >
            Ver más &gt;
          </button>
        )}
      </div>
    </div>
  );
}
