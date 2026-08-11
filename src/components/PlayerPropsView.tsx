'use client';
import API_BASE from '@/lib/api';


import { useState, useEffect } from 'react';
import { SearchIcon, RefreshIcon, ZapIcon } from './Icons';

type PlayerPropsViewProps = {
  selectedPicks: any[];
  onTogglePick: (pick: any) => void;
};

const PROPS_SPORTS = [
  { label: 'NBA',    value: 'NBA'    },
  { label: 'FÚTBOL', value: 'Soccer' },
  { label: 'MLB',    value: 'MLB'    },
  { label: 'NFL',    value: 'NFL'    },
];

export default function PlayerPropsView({ selectedPicks, onTogglePick }: PlayerPropsViewProps) {
  const [activeSport, setActiveSport] = useState<string>('NBA');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProps = async (sport: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/props/prizepicks?sport=${sport}&limit=60`);
      if (!res.ok) throw new Error('Error al conectar con la API de proyecciones');
      const data = await res.json();
      setProjections(data.projections || []);
    } catch (err: any) {
      console.warn("Notice fetching prizepicks props:", err);
      // Fallback props si el backend no está disponible localmente
      setProjections([
        {
          prop_id: 'pp_fb_1',
          player_name: 'LeBron James',
          player_position: 'SF',
          team: 'LAL',
          player_image: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',
          stat_type: 'Puntos + Rebotes + Asistencias',
          line_value: 38.5,
          sport: 'NBA',
          over_option: { label: 'Más de 38.5', abbrev: 'OVER 38.5', decimal_odds: 1.88, model_prob: 0.59, ev_percent: 11.1 },
          under_option: { label: 'Menos de 38.5', abbrev: 'UNDER 38.5', decimal_odds: 2.72, model_prob: 0.41, ev_percent: 11.3 }
        },
        {
          prop_id: 'pp_fb_2',
          player_name: 'Stephen Curry',
          player_position: 'PG',
          team: 'GSW',
          player_image: 'https://a.espncdn.com/i/headshots/nba/players/full/3975.png',
          stat_type: 'Triples Anotados',
          line_value: 4.5,
          sport: 'NBA',
          over_option: { label: 'Más de 4.5', abbrev: 'OVER 4.5', decimal_odds: 1.91, model_prob: 0.58, ev_percent: 11.1 },
          under_option: { label: 'Menos de 4.5', abbrev: 'UNDER 4.5', decimal_odds: 2.66, model_prob: 0.42, ev_percent: 11.3 }
        },
        {
          prop_id: 'pp_fb_3',
          player_name: 'Luka Dončić',
          player_position: 'PG',
          team: 'DAL',
          player_image: 'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png',
          stat_type: 'Puntos Anotados',
          line_value: 31.5,
          sport: 'NBA',
          over_option: { label: 'Más de 31.5', abbrev: 'OVER 31.5', decimal_odds: 1.97, model_prob: 0.56, ev_percent: 11.2 },
          under_option: { label: 'Menos de 31.5', abbrev: 'UNDER 31.5', decimal_odds: 2.55, model_prob: 0.44, ev_percent: 11.0 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProps(activeSport);
  }, [activeSport]);

  const filteredProjections = projections.filter(proj => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      proj.player_name.toLowerCase().includes(q) ||
      proj.team.toLowerCase().includes(q) ||
      proj.stat_type.toLowerCase().includes(q)
    );
  });

  const isPickSelected = (selectionId: string) => {
    return selectedPicks.some(p => p.selection_id === selectionId);
  };

  const handleSelectOption = (proj: any, isOver: boolean) => {
    const opt = (isOver ? proj.over_option : proj.under_option) || {
      label: isOver ? `Más de ${proj.line_value || proj.line_score || 0}` : `Menos de ${proj.line_value || proj.line_score || 0}`,
      decimal_odds: proj.over_odds || 1.91,
      model_prob: isOver ? (proj.prob_over || 0.55) : (proj.prob_under || 0.45),
      ev_percent: isOver ? (proj.ev_over || 10) : (proj.ev_under || -10),
    };
    const selId = `${proj.prop_id || proj.player_id}_${isOver ? 'OVER' : 'UNDER'}`;
    const selName = `${proj.player_name} (${opt.label}) - ${proj.stat_type}`;

    onTogglePick({
      selection_id: selId,
      event_id: proj.prop_id || proj.player_id,
      sport: proj.sport || activeSport,
      match_name: `${proj.player_name} [${proj.team || 'Prop'}]`,
      selection_name: selName,
      decimal_odds: opt.decimal_odds || 1.91,
      model_prob: opt.model_prob || 0.55,
      ev_percent: opt.ev_percent || 0,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Sub-header Banner ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(9,9,11,0.95) 100%)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)', fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <ZapIcon size={24} color="#10B981" /> Pick'em & Player Props
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Líneas de proyecciones Over/Under extraídas de PrizePicks con probabilidades cuantitativas real-time.
            </p>
          </div>

          <button
            onClick={() => fetchProps(activeSport)}
            className="chip active"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981', color: '#000', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
          >
            <RefreshIcon size={14} color="#000" /> Actualizar
          </button>
        </div>
      </div>

      {/* ── Controls Row: Sport Chips & Search Bar ──────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {PROPS_SPORTS.map(s => (
            <button
              key={s.value}
              className={`chip ${activeSport === s.value ? 'active' : ''}`}
              onClick={() => setActiveSport(s.value)}
              style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '12px' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            <SearchIcon size={16} color="var(--text-muted)" />
          </span>
          <input
            type="text"
            placeholder="Buscar jugador o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '12px',
              background: '#18181C',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#FFF',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── Projections Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando proyecciones de jugadores en vivo...
        </div>
      ) : filteredProjections.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: '#18181C', borderRadius: '20px' }}>
          No se encontraron proyecciones disponibles para {activeSport}.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredProjections.map((proj) => {
            const overId = `${proj.prop_id}_OVER`;
            const underId = `${proj.prop_id}_UNDER`;
            const isOverActive = isPickSelected(overId);
            const isUnderActive = isPickSelected(underId);

            return (
              <div
                key={proj.prop_id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  borderRadius: '20px',
                  background: '#09090B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header: Image & Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#18181C', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                    {proj.player_image ? (
                      <img src={proj.player_image} alt={proj.player_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>
                        {proj.player_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '6px', color: '#A5B4FC' }}>
                        {proj.team || activeSport}
                      </span>
                      {proj.player_position && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {proj.player_position}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {proj.player_name}
                    </div>
                  </div>
                </div>

                {/* Stat Line Banner */}
                <div style={{ background: '#18181C', padding: '10px 12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {proj.stat_type}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    {proj.line_value}
                  </div>
                </div>

                {/* Over / Under Selection Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* OVER Button */}
                  <button
                    onClick={() => handleSelectOption(proj, true)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isOverActive ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.12)',
                      background: isOverActive ? 'rgba(16,185,129,0.2)' : '#121215',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isOverActive ? '#10B981' : 'var(--text-muted)' }}>
                      MÁS DE {proj.line_value || proj.line_score}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFF' }}>
                      {(proj.over_option?.decimal_odds || proj.over_odds || 1.91).toFixed(2)}x
                    </span>
                    {(proj.over_option?.ev_percent ?? proj.ev_over ?? 0) > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        +{(proj.over_option?.ev_percent ?? proj.ev_over ?? 0).toFixed(1)}% EV
                      </span>
                    )}
                  </button>

                  {/* UNDER Button */}
                  <button
                    onClick={() => handleSelectOption(proj, false)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isUnderActive ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.12)',
                      background: isUnderActive ? 'rgba(16,185,129,0.2)' : '#121215',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isUnderActive ? '#10B981' : 'var(--text-muted)' }}>
                      MENOS DE {proj.line_value || proj.line_score}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFF' }}>
                      {(proj.under_option?.decimal_odds || proj.under_odds || 1.91).toFixed(2)}x
                    </span>
                    {(proj.under_option?.ev_percent ?? proj.ev_under ?? 0) > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        +{(proj.under_option?.ev_percent ?? proj.ev_under ?? 0).toFixed(1)}% EV
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
  );
}
