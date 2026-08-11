'use client';

export default function LiveTrackerView() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>⚡ Live Tracker (+EV Activos)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Seguimiento en directo del rendimiento de tus apuestas en juego.
        </p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ev-positive)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
            <strong>Lakers vs Warriors</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NBA - 4Q 03:45</span>
          </div>
          <span className="badge positive">EN ENTRADA GANADORA</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem' }}>
          <div>Pick: <strong>Lakers ML</strong></div>
          <div>Marcador: <strong>108 - 102</strong></div>
          <div>EV Inicial: <strong style={{ color: 'var(--ev-positive)' }}>+11.8%</strong></div>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ev-neutral)', display: 'inline-block' }}></span>
            <strong>Chiefs vs Eagles</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NFL - 2Q 08:12</span>
          </div>
          <span className="badge negative">EN RIESGO</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem' }}>
          <div>Pick: <strong>Over 51.5</strong></div>
          <div>Puntos Actuales: <strong>17</strong></div>
          <div>EV Inicial: <strong style={{ color: 'var(--ev-positive)' }}>+6.4%</strong></div>
        </div>
      </div>
    </div>
  );
}
