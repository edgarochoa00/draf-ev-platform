import API_BASE from '@/lib/api';
import { useState, useEffect } from 'react';
import { ZapIcon, AlertIcon, CheckIcon } from './Icons';

type PickItem = {
  selection_id: string;
  selection_name: string;
  abbrev?: string;
  decimal_odds: number;
  odds_label?: string;
  model_prob: number;
  ev_percent: number;
};

type MarketCategory = {
  category: string;
  badge?: string;
  line?: string;
  picks: PickItem[];
};

type EventDetail = {
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
  start_time_formatted?: string;
  venue?: string;
  home_form?: string;
  away_form?: string;
  home_xg?: number;
  away_xg?: number;
  status_desc?: string;
  is_live?: boolean;
  markets?: MarketCategory[];
};

export default function MatchDetailModal({
  event,
  allEvents = [],
  isOpen,
  onClose,
  onSelectEvent,
  onAddSelection,
  ticketSelections = [],
  onRemoveSelection,
}: {
  event: EventDetail | null;
  allEvents?: EventDetail[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent?: (evt: EventDetail) => void;
  onAddSelection: (selection: any) => boolean;
  ticketSelections?: any[];
  onRemoveSelection?: (id: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('POPULARES');
  const [selectedTotalLine, setSelectedTotalLine] = useState<string>('3.5');
  const [matchProps, setMatchProps] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !event) return;
    const homeName = event.home_team || event.match_name.split(' vs ')[0] || 'Home';
    const homeAbbrev = event.home_abbrev || homeName.slice(0, 3).toUpperCase();
    const awayName = event.away_team || event.match_name.split(' vs ')[1] || 'Away';
    const awayAbbrev = event.away_abbrev || awayName.slice(0, 3).toUpperCase();

    const fallbackProps = [
      {
        prop_id: `${event.event_id}_prop_1`,
        player_name: `${homeName} Delantero Principal`,
        team: homeAbbrev,
        player_position: 'DEL',
        stat_type: event.sport === 'Soccer' ? 'Remates a Puerta' : event.sport === 'MLB' ? 'Bases Totales' : 'Puntos',
        line_value: event.sport === 'Soccer' ? 1.5 : event.sport === 'MLB' ? 1.5 : 22.5,
        player_image: 'https://a.espncdn.com/i/headshots/soccer/players/full/45843.png',
        over_option: { label: 'Más de 1.5', decimal_odds: 1.91, model_prob: 0.58, ev_percent: 11.2 },
        under_option: { label: 'Menos de 1.5', decimal_odds: 1.91, model_prob: 0.42, ev_percent: -19.7 }
      },
      {
        prop_id: `${event.event_id}_prop_2`,
        player_name: `${awayName} Atacante Clave`,
        team: awayAbbrev,
        player_position: 'DEL',
        stat_type: event.sport === 'Soccer' ? 'Goles Anotados' : event.sport === 'MLB' ? 'Hits Totales' : 'Asistencias',
        line_value: event.sport === 'Soccer' ? 0.5 : event.sport === 'MLB' ? 1.5 : 7.5,
        player_image: 'https://a.espncdn.com/i/headshots/soccer/players/full/226597.png',
        over_option: { label: 'Más de 0.5', decimal_odds: 2.10, model_prob: 0.54, ev_percent: 13.4 },
        under_option: { label: 'Menos de 0.5', decimal_odds: 1.75, model_prob: 0.46, ev_percent: -19.5 }
      },
      {
        prop_id: `${event.event_id}_prop_3`,
        player_name: `${homeName} Mediocampista / Creador`,
        team: homeAbbrev,
        player_position: 'MED',
        stat_type: event.sport === 'Soccer' ? 'Pases Completados' : event.sport === 'MLB' ? 'Bases Totales' : 'Rebotes',
        line_value: event.sport === 'Soccer' ? 34.5 : event.sport === 'MLB' ? 1.5 : 8.5,
        player_image: 'https://a.espncdn.com/i/headshots/soccer/players/full/204891.png',
        over_option: { label: 'Más de 34.5', decimal_odds: 1.85, model_prob: 0.61, ev_percent: 12.8 },
        under_option: { label: 'Menos de 34.5', decimal_odds: 1.95, model_prob: 0.39, ev_percent: -23.9 }
      }
    ];

    const url = `${API_BASE}/api/v1/props/match?home_team=${encodeURIComponent(homeName)}&home_abbrev=${encodeURIComponent(homeAbbrev)}&away_team=${encodeURIComponent(awayName)}&away_abbrev=${encodeURIComponent(awayAbbrev)}&sport=${encodeURIComponent(event.sport)}&event_id=${encodeURIComponent(event.event_id)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.projections && data.projections.length > 0) {
          setMatchProps(data.projections);
        } else {
          setMatchProps(fallbackProps);
        }
      })
      .catch(() => {
        setMatchProps(fallbackProps);
      });
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const homeName = event.home_team || event.match_name.split(' vs ')[0] || 'Home';
  const homeAbbrev = event.home_abbrev || homeName.slice(0, 3).toUpperCase();
  const awayName = event.away_team || event.match_name.split(' vs ')[1] || 'Away';
  const awayAbbrev = event.away_abbrev || awayName.slice(0, 3).toUpperCase();

  const markets = event.markets || [];

  // ── Filtrado dinámico por categoría ───────────────────────────────────────
  const filteredMarkets = markets.filter(m => {
    const catLower = activeCategory.toLowerCase();
    const mLower = m.category.toLowerCase();
    if (catLower === 'populares') {
      return mLower.includes('money') || mLower.includes('ganador') || mLower.includes('doble') || mLower.includes('total');
    }
    if (catLower === 't. completo') {
      return mLower.includes('money') || mLower.includes('ganador') || mLower.includes('marcador') || mLower.includes('total');
    }
    if (catLower === 'mitades') {
      return mLower.includes('mitad') || mLower.includes('half') || mLower.includes('1h') || mLower.includes('2h');
    }
    if (catLower === 'tiros de esquina') {
      return mLower.includes('esquina') || mLower.includes('corner');
    }
    if (catLower === 'ambos anotan') {
      return mLower.includes('ambos') || mLower.includes('btts');
    }
    return true;
  });
  const displayMarkets = filteredMarkets.length > 0 ? filteredMarkets : markets;

  const isPickSelected = (pick: PickItem) => {
    const payloadId = `${event.event_id}__${pick.selection_id}`;
    return ticketSelections.some(s => s.event_id === payloadId || s.selection_id === pick.selection_id);
  };

  const handleToggle = (pick: PickItem, catName: string) => {
    const selectionPayload = {
      event_id: `${event.event_id}__${pick.selection_id}`,
      sport: event.sport,
      league_name: event.league_name,
      match_name: event.match_name,
      selection_name: `${pick.selection_name} (${catName})`,
      decimal_odds: pick.decimal_odds,
      model_prob: pick.model_prob,
      ev_percent: pick.ev_percent,
      selection_id: pick.selection_id,
    };

    const currentlySelected = isPickSelected(pick);
    if (currentlySelected) {
      if (onRemoveSelection) {
        onRemoveSelection(selectionPayload.event_id);
      }
    } else {
      onAddSelection(selectionPayload);
    }
  };

  const handleToggleProp = (proj: any, isOver: boolean) => {
    const opt = isOver ? proj.over_option : proj.under_option;
    const selId = `${proj.prop_id}_${isOver ? 'OVER' : 'UNDER'}`;
    const selName = `${proj.player_name} (${opt.label}) - ${proj.stat_type}`;

    const payload = {
      event_id: `${event.event_id}__${selId}`,
      sport: proj.sport || event.sport,
      league_name: event.league_name,
      match_name: event.match_name,
      selection_name: selName,
      decimal_odds: opt.decimal_odds,
      model_prob: opt.model_prob,
      ev_percent: opt.ev_percent,
      selection_id: selId,
    };

    const isSelected = ticketSelections.some(s => s.selection_id === selId || s.event_id === payload.event_id);
    if (isSelected) {
      if (onRemoveSelection) onRemoveSelection(payload.event_id);
    } else {
      onAddSelection(payload);
    }
  };

  const sameSportEvents = allEvents.filter(evt => {
    if (!evt || !event) return false;
    return (evt.sport || '').toLowerCase() === (event.sport || '').toLowerCase();
  });
  const switcherEvents = sameSportEvents.length > 0 ? sameSportEvents : [event];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel animate-fade-in modal-card-content"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Match Switcher Bar (Filtered by Same Sport) ─────────────────── */}
        <div className="match-switcher-bar">
          <button 
            className="match-switcher-pill"
            onClick={onClose}
          >
            TODOS ({event.sport.toUpperCase()})
          </button>
          {switcherEvents.slice(0, 6).map(evt => {
            const isActive = evt.event_id === event.event_id;
            const hA = evt.home_abbrev || evt.match_name.split(' vs ')[0].slice(0, 3).toUpperCase();
            const aA = evt.away_abbrev || evt.match_name.split(' vs ')[1].slice(0, 3).toUpperCase();
            return (
              <button
                key={evt.event_id}
                className={`match-switcher-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectEvent && onSelectEvent(evt)}
              >
                {hA} vs {aA} {evt.start_time_formatted}
              </button>
            );
          })}
        </div>

        {/* ── Close Button ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '4px' }}>
          <button
            onClick={onClose}
            style={{ background: '#18181C', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>

        {/* ── Match Header / Versus Arena ─────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>
            {event.league_name || event.sport.toUpperCase()}
          </span>

          <div className="modal-vs-arena">
            {/* Home Team */}
            <div className="modal-team-block home">
              <span className="modal-team-name">{homeName}</span>
              <div className="modal-team-logo-wrapper">
                {event.home_logo ? (
                  <img src={event.home_logo} alt={homeName} className="modal-team-logo-img" />
                ) : (
                  <div className="modal-team-logo-placeholder blue">{homeAbbrev}</div>
                )}
              </div>
            </div>

            {/* VS Badge */}
            <span className="modal-vs-badge">VS</span>

            {/* Away Team */}
            <div className="modal-team-block away">
              <div className="modal-team-logo-wrapper">
                {event.away_logo ? (
                  <img src={event.away_logo} alt={awayName} className="modal-team-logo-img" />
                ) : (
                  <div className="modal-team-logo-placeholder purple">{awayAbbrev}</div>
                )}
              </div>
              <span className="modal-team-name">{awayName}</span>
            </div>
          </div>
        </div>

        {/* ── Category Filter Tabs ────────────────────────────────────── */}
        <div className="modal-category-tabs">
          {['POPULARES', 'PROPS JUGADORES', 'T. COMPLETO', 'MITADES', 'TIROS DE ESQUINA', 'AMBOS ANOTAN'].map(cat => (
            <button
              key={cat}
              className={`category-tab-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Market Sections Cards ────────────────────────────────────── */}
        {activeCategory === 'PROPS JUGADORES' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              ⚡ Proyecciones y Player Props del Partido
            </h3>
            {matchProps.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: '#121215', borderRadius: '16px' }}>
                Cargando props de jugadores en tiempo real...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {matchProps.slice(0, 12).map(proj => {
                  const overSelId = `${proj.prop_id}_OVER`;
                  const underSelId = `${proj.prop_id}_UNDER`;
                  const isOverSel = ticketSelections.some(s => s.selection_id === overSelId || s.event_id.includes(overSelId));
                  const isUnderSel = ticketSelections.some(s => s.selection_id === underSelId || s.event_id.includes(underSelId));

                  const isOverPos = (proj.over_option?.ev_percent || 0) > 0;
                  const isUnderPos = (proj.under_option?.ev_percent || 0) > 0;

                  return (
                    <div key={proj.prop_id} style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                      
                      {/* Top Player Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: '#18181C', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img 
                            src={proj.player_image || proj.avatar || proj.player_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.player_name)}&background=18181C&color=7C3AED&bold=true`} 
                            alt={proj.player_name} 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.player_name)}&background=18181C&color=7C3AED&bold=true`;
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {proj.player_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {proj.team} • {proj.stat_type}
                          </div>
                        </div>
                      </div>

                      {/* Over/Under Odds Buttons with +EV Badges */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* OVER Button */}
                        <button
                          onClick={() => handleToggleProp(proj, true)}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '10px',
                            border: isOverSel 
                              ? '2px solid #10B981' 
                              : isOverPos 
                                ? '1px solid rgba(16, 185, 129, 0.5)' 
                                : '1px solid rgba(255,255,255,0.1)',
                            background: isOverSel 
                              ? 'rgba(16,185,129,0.25)' 
                              : isOverPos 
                                ? 'rgba(16,185,129,0.08)' 
                                : '#18181C',
                            color: '#FFF',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: isOverPos ? '#10B981' : '#A1A1AA' }}>
                            MÁS DE {proj.line_value}
                          </span>
                          <span style={{ fontSize: '1rem', color: isOverPos ? '#10B981' : '#FFF', fontWeight: 900 }}>
                            {proj.over_option.decimal_odds}x
                          </span>
                          {isOverPos && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '4px', marginTop: '2px' }}>
                              +{proj.over_option.ev_percent.toFixed(1)}% EV
                            </span>
                          )}
                          {isOverSel && (
                            <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 900, marginTop: '2px' }}>
                              ✓ En Ticket
                            </span>
                          )}
                        </button>

                        {/* UNDER Button */}
                        <button
                          onClick={() => handleToggleProp(proj, false)}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '10px',
                            border: isUnderSel 
                              ? '2px solid #10B981' 
                              : isUnderPos 
                                ? '1px solid rgba(16, 185, 129, 0.5)' 
                                : '1px solid rgba(255,255,255,0.1)',
                            background: isUnderSel 
                              ? 'rgba(16,185,129,0.25)' 
                              : isUnderPos 
                                ? 'rgba(16,185,129,0.08)' 
                                : '#18181C',
                            color: '#FFF',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: isUnderPos ? '#10B981' : '#A1A1AA' }}>
                            MENOS DE {proj.line_value}
                          </span>
                          <span style={{ fontSize: '1rem', color: isUnderPos ? '#10B981' : '#FFF', fontWeight: 900 }}>
                            {proj.under_option.decimal_odds}x
                          </span>
                          {isUnderPos && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '4px', marginTop: '2px' }}>
                              +{proj.under_option.ev_percent.toFixed(1)}% EV
                            </span>
                          )}
                          {isUnderSel && (
                            <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 900, marginTop: '2px' }}>
                              ✓ En Ticket
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {displayMarkets.map(m => {
              const isTotal = m.category.toLowerCase().includes('goles') || m.category.toLowerCase().includes('puntos') || m.category.toLowerCase().includes('total');

              return (
                <div key={m.category} style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '18px 20px' }}>
                  
                  {/* Market Title Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {m.category}
                    </h3>
                    <span className="badge draf-badge" style={{ fontSize: '0.68rem' }}>PA</span>
                    <span className="badge draf-badge" style={{ fontSize: '0.68rem' }}>{m.badge || "90'"}</span>
                  </div>

                  {/* Over/Under Total Line Selector if applicable */}
                  {isTotal && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', background: '#18181C', padding: '8px 16px', borderRadius: '30px', width: 'fit-content' }}>
                      {['2.5', '3.5', '4.5'].map(lineVal => (
                        <button
                          key={lineVal}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: selectedTotalLine === lineVal ? '#FFFFFF' : '#A1A1AA',
                            fontSize: '1rem',
                            fontWeight: selectedTotalLine === lineVal ? 900 : 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          onClick={() => setSelectedTotalLine(lineVal)}
                        >
                          {lineVal}
                          {selectedTotalLine === lineVal && (
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#FFFFFF' }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Odds Buttons Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(m.picks.length, 3)}, 1fr)`, gap: '10px' }}>
                    {m.picks.map(pick => {
                      const isSelected = isPickSelected(pick);
                      const oddsLabel = pick.odds_label || `${pick.decimal_odds.toFixed(2)}x`;
                      const abbrevLabel = pick.abbrev || (pick.selection_name.includes('Empate') ? 'EMPATE' : pick.selection_name.slice(0, 3).toUpperCase());
                      const isPos = pick.ev_percent > 0;

                      return (
                        <div
                          key={pick.selection_id}
                          className={`draf-odds-button ${isSelected ? 'selected' : ''}`}
                          style={{
                            padding: '12px 10px',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.12)',
                            background: isSelected ? 'rgba(16,185,129,0.2)' : '#18181C'
                          }}
                          onClick={() => handleToggle(pick, m.category)}
                        >
                          <span className="odds-abbrev" style={{ color: isSelected ? '#10B981' : '#A1A1AA' }}>{abbrevLabel}</span>
                          <span className="odds-multiplier">{oddsLabel}</span>
                          {isPos && (
                            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>
                              +{pick.ev_percent.toFixed(0)}% EV
                            </span>
                          )}
                          {isSelected && (
                            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800, marginTop: '2px' }}>
                              ✓ En Ticket
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="glass-button" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Volver al Radar
          </button>
        </div>
      </div>
    </div>
  );
}

