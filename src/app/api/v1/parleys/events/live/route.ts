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
          
          const markets = [
            {
              category: 'Money Line',
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
              category: 'Props Jugadores',
              badge: 'Jugadores',
              picks: [
                {
                  selection_id: `${eventId}_prop_1`,
                  abbrev: homeAbbrev,
                  selection_name: `${homeName} Strikers > 1.5 Goles`,
                  decimal_odds: 2.10,
                  odds_label: '2.10x',
                  model_prob: 0.54,
                  ev_percent: 13.4,
                },
                {
                  selection_id: `${eventId}_prop_2`,
                  abbrev: awayAbbrev,
                  selection_name: `${awayName} Remates a Puerta > 4.5`,
                  decimal_odds: 1.95,
                  odds_label: '1.95x',
                  model_prob: 0.58,
                  ev_percent: 13.1,
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
