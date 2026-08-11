import { NextResponse } from 'next/server';

const ESPN_ENDPOINTS: Record<string, string[]> = {
  SOCCER: [
    'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
  ],
  MLB: [
    'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  ],
  NBA: [
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  ],
  NFL: [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  ],
};

type PlayerProp = {
  name: string;
  pos: string;
  stat: string;
  line: number;
  avatar: string;
};

// Player rosters strictly categorized per sport to prevent sport cross-contamination
const SPORT_ROSTERS: Record<string, Record<string, PlayerProp[]>> = {
  SOCCER: {
    TAL: [
      { name: 'Ramón Sosa', pos: 'DEL', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/294821.png' },
      { name: 'Nahuel Bustos', pos: 'DEL', stat: 'Remates Totales', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/237691.png' },
      { name: 'Federico Girotti', pos: 'DEL', stat: 'Goles Anotados', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/285741.png' },
    ],
    LAN: [
      { name: 'Walter Bou', pos: 'DEL', stat: 'Goles Anotados', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/226191.png' },
      { name: 'Marcelino Moreno', pos: 'MED', stat: 'Pases Completados', line: 34.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/238121.png' },
      { name: 'Eduardo Salvio', pos: 'DEL', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/128391.png' },
    ],
    ARS: [
      { name: 'Bukayo Saka', pos: 'DEL', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/264521.png' },
      { name: 'Martin Ødegaard', pos: 'MED', stat: 'Pases Clave', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/204891.png' },
      { name: 'Kai Havertz', pos: 'DEL', stat: 'Remates Totales', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/235491.png' },
    ],
    AME: [
      { name: 'Henry Martín', pos: 'DEL', stat: 'Goles Anotados', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/210391.png' },
      { name: 'Álvaro Fidalgo', pos: 'MED', stat: 'Pases Completados', line: 48.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/239012.png' },
    ],
    CHI: [
      { name: 'Roberto Alvarado', pos: 'DEL', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/229014.png' },
      { name: 'Erick Gutiérrez', pos: 'MED', stat: 'Faltas Recibidas', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/210450.png' },
    ],
    RMD: [
      { name: 'Kylian Mbappé', pos: 'DEL', stat: 'Goles Anotados', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/226597.png' },
      { name: 'Vinícius Júnior', pos: 'DEL', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/238031.png' },
      { name: 'Jude Bellingham', pos: 'MED', stat: 'Pases Clave', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/258525.png' },
    ],
  },

  MLB: {
    DET: [
      { name: 'Riley Greene', pos: 'OF', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/41178.png' },
      { name: 'Tarik Skubal', pos: 'P', stat: 'Ponches (Strikeouts)', line: 6.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/41285.png' },
      { name: 'Spencer Torkelson', pos: '1B', stat: 'Hit + Carrera + Impulsada', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/42404.png' },
    ],
    CLE: [
      { name: 'José Ramírez', pos: '3B', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/32801.png' },
      { name: 'Steven Kwan', pos: 'OF', stat: 'Hits Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/41235.png' },
      { name: 'Josh Naylor', pos: '1B', stat: 'Carreras Impulsadas', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/35054.png' },
    ],
    LAD: [
      { name: 'Shohei Ohtani', pos: 'DH', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/39832.png' },
      { name: 'Mookie Betts', pos: 'SS', stat: 'Carreras Anotadas', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/33039.png' },
      { name: 'Freddie Freeman', pos: '1B', stat: 'Hits Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/30193.png' },
    ],
    NYY: [
      { name: 'Aaron Judge', pos: 'OF', stat: 'Jonrones', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/33192.png' },
      { name: 'Juan Soto', pos: 'OF', stat: 'Hit + Carrera + Impulsada', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/36969.png' },
      { name: 'Giancarlo Stanton', pos: 'DH', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/30583.png' },
    ],
    HOU: [
      { name: 'Jose Altuve', pos: '2B', stat: 'Hits Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/31084.png' },
      { name: 'Yordan Alvarez', pos: 'DH', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/36018.png' },
    ],
  },

  NBA: {
    LAL: [
      { name: 'LeBron James', pos: 'SF', stat: 'Puntos', line: 24.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png' },
      { name: 'Anthony Davis', pos: 'PF', stat: 'Rebotes', line: 12.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/6583.png' },
    ],
    GSW: [
      { name: 'Stephen Curry', pos: 'PG', stat: 'Triples Anotados', line: 4.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3975.png' },
    ],
    DAL: [
      { name: 'Luka Dončić', pos: 'PG', stat: 'Asistencias', line: 8.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png' },
    ],
    BOS: [
      { name: 'Jayson Tatum', pos: 'SF', stat: 'Puntos + Rebotes', line: 35.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/4065648.png' },
    ],
    DEN: [
      { name: 'Nikola Jokić', pos: 'C', stat: 'Asistencias', line: 9.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png' },
    ],
  },

  NFL: {
    KC: [
      { name: 'Patrick Mahomes', pos: 'QB', stat: 'Yardas por Pase', line: 265.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png' },
      { name: 'Travis Kelce', pos: 'TE', stat: 'Recepciones', line: 6.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    ],
    BUF: [
      { name: 'Josh Allen', pos: 'QB', stat: 'Pases de Touchdown', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3918298.png' },
    ],
    MIA: [
      { name: 'Tyreek Hill', pos: 'WR', stat: 'Yardas por Recepción', line: 85.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116365.png' },
    ],
  },
};

function deterministicProb(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 10000) / 10000;
  return Number((0.52 + normalized * 0.12).toFixed(4));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSport = (searchParams.get('sport') || 'MLB').toUpperCase();
  const sportKey = SPORT_ROSTERS[rawSport] ? rawSport : 'SOCCER';

  const endpoints = ESPN_ENDPOINTS[sportKey] || ESPN_ENDPOINTS.SOCCER;
  const targetRosters = SPORT_ROSTERS[sportKey] || SPORT_ROSTERS.SOCCER;

  const liveTeamAbbrevs = new Set<string>();

  // 1. Fetch live active scoreboards from ESPN for the requested sport ONLY
  try {
    const fetchPromises = endpoints.map(url => fetch(url, { next: { revalidate: 30 } }).then(r => r.ok ? r.json() : null).catch(() => null));
    const results = await Promise.all(fetchPromises);

    for (const data of results) {
      if (!data?.events) continue;
      for (const ev of data.events) {
        const competitors = ev.competitions?.[0]?.competitors || [];
        for (const c of competitors) {
          const t = c.team || {};
          const abbrev = (t.abbreviation || t.shortDisplayName || t.name || '').toUpperCase();
          if (abbrev) liveTeamAbbrevs.add(abbrev);
        }
      }
    }
  } catch (err) {
    console.error('ESPN fetch error:', err);
  }

  // 2. Extract players ONLY from the selected sport's team rosters
  const generatedProps: any[] = [];
  let propCounter = 1;

  for (const [abbrev, roster] of Object.entries(targetRosters)) {
    const isPlaying = liveTeamAbbrevs.size === 0 || liveTeamAbbrevs.has(abbrev);
    if (!isPlaying && generatedProps.length >= 10) continue;

    for (const player of roster) {
      const propId = `pp_${sportKey.toLowerCase()}_${propCounter++}`;
      const seed = `${player.name}_${player.stat}_${player.line}`;
      const probOver = deterministicProb(`${seed}_over`);
      const probUnder = Number((1.0 - probOver).toFixed(4));

      const evOver = Number(((probOver * 1.91 - 1) * 100).toFixed(1));
      const evUnder = Number(((probUnder * 1.91 - 1) * 100).toFixed(1));

      generatedProps.push({
        prop_id: propId,
        player_id: propId,
        player_name: player.name,
        player_position: player.pos,
        team: abbrev,
        player_image: player.avatar,
        avatar: player.avatar,
        sport: sportKey,
        stat_type: player.stat,
        line_value: player.line,
        line_score: player.line,
        over_option: {
          selection_id: `${propId}_OVER`,
          label: `Más de ${player.line}`,
          abbrev: `OVER ${player.line}`,
          decimal_odds: 1.91,
          model_prob: probOver,
          ev_percent: evOver,
        },
        under_option: {
          selection_id: `${propId}_UNDER`,
          label: `Menos de ${player.line}`,
          abbrev: `UNDER ${player.line}`,
          decimal_odds: 1.91,
          model_prob: probUnder,
          ev_percent: evUnder,
        },
        over_odds: 1.91,
        under_odds: 1.91,
        prob_over: probOver,
        prob_under: probUnder,
        ev_over: evOver,
        ev_under: evUnder,
        best_pick: evOver >= evUnder ? 'OVER' : 'UNDER',
      });
    }
  }

  return NextResponse.json({
    status: 'success',
    sport: sportKey,
    count: generatedProps.length,
    projections: generatedProps,
  });
}
