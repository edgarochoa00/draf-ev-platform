'use client';

import { RadarIcon, HistoryIcon, LiveTrackerIcon, OCRIcon, ZapIcon } from './Icons';

type NavbarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bankroll: number;
  setBankroll: (b: number) => void;
  onOpenOCR: () => void;
};

export default function Navbar({ activeTab, setActiveTab, bankroll, setBankroll, onOpenOCR }: NavbarProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* Top Row: Logo Branding (Left) & Compact Bankroll Widget (Right) */}
        <div className="navbar-top-row">
          <div 
            className="navbar-brand"
            onClick={() => setActiveTab('radar')}
          >
            <div className="navbar-logo-icon">
              <ZapIcon size={20} color="#07090E" />
            </div>
            <div className="navbar-title-block">
              <div className="navbar-brand-name">
                DRAF <span className="highlight-ev">+EV</span>
              </div>
              <div className="navbar-brand-sub">
                Quantum Sports Engine
              </div>
            </div>
          </div>

          {/* Compact Bankroll Header Widget */}
          <div className="navbar-bankroll-widget">
            <span className="bankroll-label">Bankroll:</span>
            <span className="bankroll-currency">$</span>
            <input 
              type="number" 
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value) || 0)}
              className="bankroll-input"
            />
            <span className="bankroll-suffix">MXN</span>
          </div>
        </div>

        {/* Bottom Row: Horizontal Scroll Tabs Navigation */}
        <nav className="navbar-nav-scroll">
          <button 
            className={`chip nav-chip ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            <RadarIcon size={15} /> Radar +EV
          </button>
          <button 
            className={`chip nav-chip ${activeTab === 'pickem' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickem')}
          >
            <ZapIcon size={15} color={activeTab === 'pickem' ? '#10B981' : '#A5B4FC'} /> Pick'em Jugadores
          </button>
          <button 
            className={`chip nav-chip ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <HistoryIcon size={15} /> Mis Parleys
          </button>
          <button 
            className={`chip nav-chip ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <LiveTrackerIcon size={15} /> Live Tracker
          </button>
          <button 
            className="chip nav-chip ocr-chip"
            onClick={onOpenOCR}
          >
            <OCRIcon size={15} color="#A5B4FC" /> Escáner OCR
          </button>
        </nav>
      </div>
    </header>
  );
}
