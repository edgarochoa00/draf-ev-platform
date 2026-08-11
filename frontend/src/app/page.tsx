'use client';
import API_BASE from '@/lib/api';


import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import RadarCard from '@/components/RadarCard';
import ParlayTicket from '@/components/ParlayTicket';
import HistoryView from '@/components/HistoryView';
import LiveTrackerView from '@/components/LiveTrackerView';
import PlayerPropsView from '@/components/PlayerPropsView';
import OCRScannerModal from '@/components/OCRScannerModal';
import MatchDetailModal from '@/components/MatchDetailModal';
import { RadarIcon, SearchIcon, RefreshIcon, ZapIcon } from '@/components/Icons';


// ── Sport chips (No Emojis) ──────────────────────────────────────────────────
const SPORT_CHIPS = [
  { label: 'TODOS',      value: 'Todos'  },
  { label: 'FÚTBOL',     value: 'Soccer' },
  { label: 'NBA',        value: 'NBA'    },
  { label: 'NFL',        value: 'NFL'    },
  { label: 'MLB',        value: 'MLB'    },
];

// ── League sub-filters ───────────────────────────────────────────────────────
const LEAGUE_CHIPS = [
  'TODAS',
  'Liga MX', 'Premier League', 'La Liga', 'Champions League',
  'Serie A', 'Bundesliga', 'Ligue 1', 'MLS',
  'Liga Argentina', 'Liga Brasil', 'Europa League',
];

// ── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_EVENTS: any[] = [
  {
    event_id: 'mock_1',
    sport: 'Soccer',
    league_name: 'Liga MX',
    match_name: 'Club América vs Chivas',
    home_team: 'Club América',
    home_abbrev: 'AME',
    home_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/221.png',
    away_team: 'Chivas',
    away_abbrev: 'CHI',
    away_logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/219.png',
    selection_name: 'Club América Gana',
    decimal_odds: 1.85,
    odds_label: '1.85x',
    model_prob: 0.58,
    ev_percent: 7.3,
    start_time_formatted: 'HOY (21:00)',
    markets: [
      {
        category: 'Money Line',
        badge: "90'",
        picks: [
          { selection_id: 'm1_home', abbrev: 'AME', selection_name: 'Club América Gana', decimal_odds: 1.85, odds_label: '1.85x', model_prob: 0.58, ev_percent: 7.3 },
          { selection_id: 'm1_draw', abbrev: 'EMPATE', selection_name: 'Empate', decimal_odds: 3.20, odds_label: '3.20x', model_prob: 0.25, ev_percent: -20.0 },
          { selection_id: 'm1_away', abbrev: 'CHI', selection_name: 'Chivas Gana', decimal_odds: 4.10, odds_label: '4.10x', model_prob: 0.17, ev_percent: -30.3 },
        ],
      },
    ],
  },
  {
    event_id: 'mock_2',
    sport: 'NBA',
    league_name: 'NBA',
    match_name: 'Lakers vs Warriors',
    home_team: 'Lakers',
    home_abbrev: 'LAL',
    home_logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
    away_team: 'Warriors',
    away_abbrev: 'GSW',
    away_logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png',
    selection_name: 'Lakers Moneyline',
    decimal_odds: 2.05,
    odds_label: '2.05x',
    model_prob: 0.54,
    ev_percent: 10.7,
    start_time_formatted: 'HOY (20:30)',
    markets: [
      {
        category: 'Money Line',
        badge: 'FINAL',
        picks: [
          { selection_id: 'm2_home', abbrev: 'LAL', selection_name: 'Lakers Moneyline', decimal_odds: 2.05, odds_label: '2.05x', model_prob: 0.54, ev_percent: 10.7 },
          { selection_id: 'm2_away', abbrev: 'GSW', selection_name: 'Warriors Moneyline', decimal_odds: 1.83, odds_label: '1.83x', model_prob: 0.46, ev_percent: -15.8 },
        ],
      },
    ],
  },
];

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2200);
    return () => clearTimeout(t);
  }, [onHide]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--draf-purple)',
      color: '#FFFFFF',
      padding: '12px 24px',
      borderRadius: '30px',
      fontSize: '0.9rem',
      fontWeight: 800,
      zIndex: 9999,
      boxShadow: '0 8px 30px var(--draf-purple-glow)',
      animation: 'fadeIn 0.25s ease',
      whiteSpace: 'nowrap',
    }}>
      ✓ {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab]         = useState('radar');
  const [bankroll, setBankroll]           = useState(1000);
  const [ticketSelections, setTicketSelections] = useState<any[]>([]);
  const [isOCRModalOpen, setIsOCRModalOpen]     = useState(false);
  const [selectedMatchModal, setSelectedMatchModal] = useState<any>(null);
  const [toast, setToast]                 = useState<string | null>(null);

  const [events, setEvents]               = useState<any[]>(MOCK_EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  const [selectedSport, setSelectedSport] = useState('Todos');
  const [selectedLeague, setSelectedLeague] = useState('Todas');
  const [searchQuery, setSearchQuery]     = useState('');
  const [evFilter, setEvFilter]           = useState('positive');

  // ── Load events ─────────────────────────────────────────────────────────
  const loadLiveEvents = useCallback(() => {
    setLoadingEvents(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(`${API_BASE}/api/v1/parleys/events/live`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setBackendOnline(true);
        } else {
          setEvents(MOCK_EVENTS);
          setBackendOnline(false);
        }
        setLoadingEvents(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setEvents(prev => prev.length > 0 ? prev : MOCK_EVENTS);
        setBackendOnline(false);
        setLoadingEvents(false);
      });
  }, []);

  useEffect(() => {
    loadLiveEvents();
    const interval = setInterval(loadLiveEvents, 30000);
    return () => clearInterval(interval);
  }, [loadLiveEvents]);

  // ── Ticket management ───────────────────────────────────────────────────
  const addToTicket = useCallback((selection: any): boolean => {
    const alreadyIn = ticketSelections.some(s => s.event_id === selection.event_id);
    if (alreadyIn) return false;

    setTicketSelections(prev => [...prev, selection]);
    setToast(`${selection.selection_name.split(' (')[0]} añadido al ticket`);
    return true;
  }, [ticketSelections]);

  const removeFromTicket = useCallback((id: string) => {
    setTicketSelections(prev => prev.filter(s => s.event_id !== id));
  }, []);

  const clearTicket = useCallback(() => {
    setTicketSelections([]);
  }, []);

  const handleOptimizeTicket = useCallback(() => {
    const positiveOnly = ticketSelections.filter(s => s.ev_percent > 0);
    if (positiveOnly.length === 0) {
      const topPicks = events
        .filter(e => e.ev_percent > 0)
        .slice(0, 3)
        .map(e => ({ ...e, event_id: `${e.event_id}__quick_${e.event_id}` }));
      setTicketSelections(topPicks);
    } else {
      setTicketSelections(positiveOnly);
    }
  }, [ticketSelections, events]);

  const handleImportOCR = (importedPicks: any[]) => {
    setTicketSelections(prev => [...prev, ...importedPicks]);
    setActiveTab('radar');
  };

  const addQuickPick = useCallback((event: any) => {
    const quickSelection = {
      event_id:       `${event.event_id}__quick_${event.event_id}`,
      sport:          event.sport,
      league_name:    event.league_name,
      match_name:     event.match_name,
      selection_name: event.selection_name,
      decimal_odds:   event.decimal_odds,
      model_prob:     event.model_prob,
      ev_percent:     event.ev_percent,
    };
    addToTicket(quickSelection);
  }, [addToTicket]);

  // ── Filtering ───────────────────────────────────────────────────────────
  const filteredEvents = events.filter(evt => {
    if (selectedSport !== 'Todos' && evt.sport !== selectedSport) return false;
    if (selectedSport === 'Soccer' && selectedLeague !== 'Todas' && evt.league_name !== selectedLeague) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        evt.match_name.toLowerCase().includes(q) ||
        (evt.selection_name ?? '').toLowerCase().includes(q) ||
        (evt.league_name ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (evFilter === 'positive' && evt.ev_percent <= 0) return false;
    if (evFilter === '3percent' && evt.ev_percent < 3)  return false;
    if (evFilter === '5percent' && evt.ev_percent < 5)  return false;

    return true;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bankroll={bankroll}
        setBankroll={setBankroll}
        onOpenOCR={() => setIsOCRModalOpen(true)}
      />

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="main-app-container">
        {activeTab === 'radar' && (
          <div className="dashboard-grid">
            {/* Left Column — Sports Feed */}
            <div>
              {/* Hero Banner Header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.35)', padding: '4px 14px', borderRadius: '30px', marginBottom: '8px' }}>
                  <ZapIcon size={14} color="var(--draf-purple)" />
                  <span style={{ fontSize: '0.75rem', color: '#E9D5FF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Radar +EV DRAF Engine
                  </span>
                </div>

                <h1 className="hero-title">
                  Partidos y Cuotas Cuánticas
                </h1>
                <p className="hero-subtitle">
                  Eventos deportivos reales ordenados por día y hora con cuotas desajustadas detectadas por IA.
                  {!backendOnline && (
                    <span style={{ color: '#F59E0B', marginLeft: '8px', fontSize: '0.8rem', display: 'inline-block' }}>
                      (Modo datos de respaldo activos)
                    </span>
                  )}
                </p>
              </div>

              {/* Search + Refresh Bar */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <SearchIcon size={18} />
                  </div>
                  <input
                    className="glass-input"
                    type="text"
                    style={{ paddingLeft: '44px', height: '46px', fontSize: '0.95rem' }}
                    placeholder="Buscar equipo o torneo (ej. Tigres, Columbus, Premier)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="glass-button"
                  onClick={loadLiveEvents}
                  disabled={loadingEvents}
                  style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', height: '46px', padding: '0 20px' }}
                >
                  <RefreshIcon size={16} />
                  {loadingEvents ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>

              {/* Sport Category Chips */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                {SPORT_CHIPS.map(({ label, value }) => (
                  <button
                    key={value}
                    className={`chip ${selectedSport === value ? 'active' : ''}`}
                    onClick={() => { setSelectedSport(value); setSelectedLeague('Todas'); }}
                    style={{ fontSize: '0.82rem', padding: '8px 18px', textTransform: 'uppercase', fontWeight: 800 }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* League Sub-chips (Soccer) */}
              {selectedSport === 'Soccer' && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
                  {LEAGUE_CHIPS.map(l => (
                    <button
                      key={l}
                      className={`chip ${selectedLeague === l || (selectedLeague === 'Todas' && l === 'TODAS') ? 'active' : ''}`}
                      style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                      onClick={() => setSelectedLeague(l === 'TODAS' ? 'Todas' : l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* EV Advantage Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filtro Ventaja:</span>
                {[
                  { key: 'positive', label: 'Solo +EV (>0%)' },
                  { key: '3percent', label: '> +3% EV'       },
                  { key: '5percent', label: '> +5% EV'       },
                  { key: 'all',      label: 'Mostrar Todos'  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`chip ${evFilter === key ? 'active' : ''}`}
                    onClick={() => setEvFilter(key)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {key === 'positive' && <ZapIcon size={12} color="var(--ev-positive)" />}
                    {label}
                  </button>
                ))}
              </div>

              {/* Match Feed */}
              {filteredEvents.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '54px 0' }}>
                  <SearchIcon size={32} color="var(--text-muted)" />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '12px' }}>
                    No se encontraron partidos con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <RadarCard
                    key={event.event_id}
                    selection={event}
                    onAdd={addToTicket}
                    onOpenMarkets={evt => setSelectedMatchModal(evt)}
                  />
                ))
              )}
            </div>

            {/* Right Column — Draf Parlay Ticket */}
            <div>
              <ParlayTicket
                selections={ticketSelections}
                onRemove={removeFromTicket}
                onClear={clearTicket}
                bankroll={bankroll}
                setBankroll={setBankroll}
                onOptimize={handleOptimizeTicket}
              />
            </div>
          </div>
        )}

        {activeTab === 'pickem' && (
          <div className="radar-layout">
            <div>
              <PlayerPropsView
                selectedPicks={ticketSelections}
                onTogglePick={addToTicket}
              />
            </div>
            <div>
              <ParlayTicket
                selections={ticketSelections}
                onRemove={removeFromTicket}
                onClear={clearTicket}
                bankroll={bankroll}
                setBankroll={setBankroll}
                onOptimize={handleOptimizeTicket}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'tracker' && <LiveTrackerView />}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <OCRScannerModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        onImportPicks={handleImportOCR}
      />

      <MatchDetailModal
        event={selectedMatchModal}
        allEvents={events}
        isOpen={!!selectedMatchModal}
        onClose={() => setSelectedMatchModal(null)}
        onSelectEvent={evt => setSelectedMatchModal(evt)}
        onAddSelection={addToTicket}
        ticketSelections={ticketSelections}
        onRemoveSelection={removeFromTicket}
      />

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
