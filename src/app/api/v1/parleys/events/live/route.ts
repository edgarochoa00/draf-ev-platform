import { NextResponse } from 'next/server';

// ESPN scoreboards endpoints
const ESPN_ENDPOINTS = [
  { sport: 'Soccer', league: 'Liga MX', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard' },
  { sport: 'Soccer', league: 'Premier League', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard' },
  { sport: 'Soccer', league: 'La Liga', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard' },
  { sport: 'Soccer', league: 'Liga Argentina', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard' },
  { sport: 'MLB', league: 'MLB', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
  { sport: 'NBA', league: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { sport: 'NFL', league: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
];

function deterministicFloat(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 10000) / 10000;
  return Number((min + normalized * (max - min)).toFixed(2));
}

function formatEspnDate(isoStr: string): string {
  if (!isoStr) return 'HOY (20:00)';
  try {
    const dt = new Date(isoStr);
    const timeStr = dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const now = new Date();
    if (dt.toDateString() === now.toDateString()) {
      return `HOY (${timeStr})`;
    }
    return `PRÓXIMO (${timeStr})`;
  } catch {
    return 'HOY (20:00)';
  }
}

export async function GET() {
  try {
    const fetchPromises = ESPN_ENDPOINTS.map(async (ep) => {
      try {
        const res = await fetch(ep.url, { next: { revalidate: 30 } });
        if (!res.ok) return [];
        const data = await res.json();
        const events = data.events || [];
        
        return events.map((ev: any) => {
          const comp = ev.competitions?.[0] || {};
          const competitors = comp.competitors || [];
          const home = competitors.find((c: any) => c.homeAway === 'home')?.team || {};
          const away = competitors.find((c: any) => c.homeAway === 'away')?.team || {};
          
          const homeName = home.displayName || home.name || 'Home Team';
          const homeAbbrev = (home.abbreviation || homeName.slice(0, 3)).toUpperCase();
          const homeLogo = home.logo || home.logos?.[0]?.href || '';
          
          const awayName = away.displayName || away.name || 'Away Team';
          const awayAbbrev = (away.abbreviation || awayName.slice(0, 3)).toUpperCase();
          const awayLogo = away.logo || away.logos?.[0]?.href || '';

          const eventId = String(ev.id || `${homeAbbrev}_${awayAbbrev}`);
          const matchName = `${homeName} vs ${awayName}`;
          
          const seed = `${eventId}_${matchName}`;
          const decimalOdds = deterministicFloat(`${seed}_odds`, 1.70, 2.90);
          const modelProb = deterministicFloat(`${seed}_prob`, 0.45, 0.65);
          
          // Calculate EV% = (Prob * Odds - 1) * 100
          const evPercent = Number(((modelProb * decimalOdds - 1) * 100).toFixed(1));
          
          const isSoccer = ep.sport === 'Soccer';
          const isMLB = ep.sport === 'MLB';
          const totalLine = isSoccer ? '2.5 Goles' : isMLB ? '8.5 Carreras' : '218.5 Puntos';

          const markets = [
            {
              category: 'Money Line (Ganador)',
              badge: "90'",
              picks: [
                {
                  selection_id: `${eventId}_home`,
                  abbrev: homeAbbrev,
                  selection_name: `${homeName} Gana`,
                  decimal_odds: decimalOdds,
                  odds_label: `${decimalOdds}x`,
                  model_prob: modelProb,
                  ev_percent: evPercent,
                },
                {
                  selection_id: `${eventId}_draw`,
                  abbrev: 'EMPATE',
                  selection_name: 'Empate',
                  decimal_odds: 3.40,
                  odds_label: '3.40x',
                  model_prob: 0.25,
                  ev_percent: -12.0,
                },
                {
                  selection_id: `${eventId}_away`,
                  abbrev: awayAbbrev,
                  selection_name: `${awayName} Gana`,
                  decimal_odds: Number((decimalOdds * 1.3).toFixed(2)),
                  odds_label: `${(decimalOdds * 1.3).toFixed(2)}x`,
                  model_prob: Number((1.0 - modelProb - 0.25).toFixed(2)),
                  ev_percent: -15.2,
                },
              ],
            },
            {
              category: 'Doble Oportunidad',
              badge: 'Populares',
              picks: [
                {
                  selection_id: `${eventId}_1X`,
                  abbrev: `${homeAbbrev} / EMP`,
                  selection_name: `${homeName} o Empate (1X)`,
                  decimal_odds: 1.25,
                  odds_label: '1.25x',
                  model_prob: 0.82,
                  ev_percent: 2.5,
                },
                {
                  selection_id: `${eventId}_X2`,
                  abbrev: `EMP / ${awayAbbrev}`,
                  selection_name: `Empate o ${awayName} (X2)`,
                  decimal_odds: 1.85,
                  odds_label: '1.85x',
                  model_prob: 0.52,
                  ev_percent: -3.7,
                },
                {
                  selection_id: `${eventId}_12`,
                  abbrev: `${homeAbbrev} / ${awayAbbrev}`,
                  selection_name: `${homeName} o ${awayName} (12)`,
                  decimal_odds: 1.30,
                  odds_label: '1.30x',
                  model_prob: 0.78,
                  ev_percent: 1.4,
                },
              ],
            },
            {
              category: `Total ${totalLine} ↑/↓`,
              badge: 'Totales',
              picks: [
                {
                  selection_id: `${eventId}_over_total`,
                  abbrev: `MÁS DE ${totalLine.split(' ')[0]}`,
                  selection_name: `Más de ${totalLine}`,
                  decimal_odds: 1.95,
                  odds_label: '1.95x',
                  model_prob: 0.56,
                  ev_percent: 9.2,
                },
                {
                  selection_id: `${eventId}_under_total`,
                  abbrev: `MENOS DE ${totalLine.split(' ')[0]}`,
                  selection_name: `Menos de ${totalLine}`,
                  decimal_odds: 1.90,
                  odds_label: '1.90x',
                  model_prob: 0.44,
                  ev_percent: -16.4,
                },
              ],
            },
            {
              category: 'Marcador Exacto (Tiempo Completo)',
              badge: 'T. Completo',
              picks: [
                {
                  selection_id: `${eventId}_score_10`,
                  abbrev: '1 - 0',
                  selection_name: `Marcador Exacto 1-0 (${homeName})`,
                  decimal_odds: 6.50,
                  odds_label: '6.50x',
                  model_prob: 0.18,
                  ev_percent: 17.0,
                },
                {
                  selection_id: `${eventId}_score_21`,
                  abbrev: '2 - 1',
                  selection_name: `Marcador Exacto 2-1 (${homeName})`,
                  decimal_odds: 7.50,
                  odds_label: '7.50x',
                  model_prob: 0.15,
                  ev_percent: 12.5,
                },
                {
                  selection_id: `${eventId}_score_11`,
                  abbrev: '1 - 1',
                  selection_name: 'Marcador Exacto 1-1',
                  decimal_odds: 6.00,
                  odds_label: '6.00x',
                  model_prob: 0.16,
                  ev_percent: -4.0,
                },
                {
                  selection_id: `${eventId}_score_01`,
                  abbrev: '0 - 1',
                  selection_name: `Marcador Exacto 0-1 (${awayName})`,
                  decimal_odds: 9.00,
                  odds_label: '9.00x',
                  model_prob: 0.11,
                  ev_percent: -1.0,
                },
              ],
            },
            {
              category: 'Ganador 1ª Mitad (1H)',
              badge: 'Mitades',
              picks: [
                {
                  selection_id: `${eventId}_1h_home`,
                  abbrev: `${homeAbbrev} 1H`,
                  selection_name: `${homeName} Gana 1ª Mitad`,
                  decimal_odds: 2.45,
                  odds_label: '2.45x',
                  model_prob: 0.48,
                  ev_percent: 17.6,
                },
                {
                  selection_id: `${eventId}_1h_draw`,
                  abbrev: 'EMPATE 1H',
                  selection_name: 'Empate 1ª Mitad',
                  decimal_odds: 2.10,
                  odds_label: '2.10x',
                  model_prob: 0.45,
                  ev_percent: -5.5,
                },
                {
                  selection_id: `${eventId}_1h_away`,
                  abbrev: `${awayAbbrev} 1H`,
                  selection_name: `${awayName} Gana 1ª Mitad`,
                  decimal_odds: 4.50,
                  odds_label: '4.50x',
                  model_prob: 0.18,
                  ev_percent: -19.0,
                },
              ],
            },
            {
              category: 'Tiros de Esquina (Corners Totales)',
              badge: 'Esquinas',
              picks: [
                {
                  selection_id: `${eventId}_corners_over9`,
                  abbrev: 'MÁS DE 8.5',
                  selection_name: 'Más de 8.5 Tiros de Esquina',
                  decimal_odds: 1.85,
                  odds_label: '1.85x',
                  model_prob: 0.61,
                  ev_percent: 12.85,
                },
                {
                  selection_id: `${eventId}_corners_under9`,
                  abbrev: 'MENOS DE 8.5',
                  selection_name: 'Menos de 8.5 Tiros de Esquina',
                  decimal_odds: 1.95,
                  odds_label: '1.95x',
                  model_prob: 0.39,
                  ev_percent: -23.95,
                },
                {
                  selection_id: `${eventId}_most_corners`,
                  abbrev: `${homeAbbrev} MÁS CORNERS`,
                  selection_name: `${homeName} Más Tiros de Esquina`,
                  decimal_odds: 1.65,
                  odds_label: '1.65x',
                  model_prob: 0.68,
                  ev_percent: 12.2,
                },
              ],
            },
            {
              category: 'Ambos Equipos Anotan (BTTS)',
              badge: 'Ambos Anotan',
              picks: [
                {
                  selection_id: `${eventId}_btts_yes`,
                  abbrev: 'SÍ ANOTAN',
                  selection_name: 'Ambos Equipos Anotan - SÍ',
                  decimal_odds: 1.82,
                  odds_label: '1.82x',
                  model_prob: 0.63,
                  ev_percent: 14.66,
                },
                {
                  selection_id: `${eventId}_btts_no`,
                  abbrev: 'NO ANOTAN',
                  selection_name: 'Ambos Equipos Anotan - NO',
                  decimal_odds: 1.98,
                  odds_label: '1.98x',
                  model_prob: 0.37,
                  ev_percent: -26.74,
                },
              ],
            },
          ];

          return {
            event_id: eventId,
            sport: ep.sport,
            league_name: ep.league,
            match_name: matchName,
            home_team: homeName,
            home_abbrev: homeAbbrev,
            home_logo: homeLogo,
            away_team: awayName,
            away_abbrev: awayAbbrev,
            away_logo: awayLogo,
            selection_name: `${homeName} Gana`,
            decimal_odds: decimalOdds,
            odds_label: `${decimalOdds}x`,
            model_prob: modelProb,
            ev_percent: evPercent,
            start_time_formatted: formatEspnDate(ev.date),
            markets: markets,
          };
        });
      } catch (err) {
        console.error(`Error fetching ${ep.league}:`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    const allEvents = results.flat();

    return NextResponse.json({
      status: 'success',
      events: allEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message, events: [] }, { status: 500 });
  }
}
