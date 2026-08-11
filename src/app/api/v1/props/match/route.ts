import { NextResponse } from 'next/server';

function deterministicProb(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 10000) / 10000;
  return Number((0.52 + normalized * 0.12).toFixed(4));
}

const MATCH_PLAYERS_DB: Record<string, Record<string, any[]>> = {
  Soccer: {
    strikers: [
      { stat: 'Remates a Puerta', line: 1.5 },
      { stat: 'Goles Anotados', line: 0.5 },
      { stat: 'Remates Totales', line: 2.5 },
    ],
    midfielders: [
      { stat: 'Pases Completados', line: 34.5 },
      { stat: 'Faltas Recibidas', line: 1.5 },
    ],
  },
  MLB: {
    hitters: [
      { stat: 'Bases Totales', line: 1.5 },
      { stat: 'Hit + Carrera + Impulsada', line: 1.5 },
      { stat: 'Hits Totales', line: 0.5 },
    ],
  },
  NBA: {
    starters: [
      { stat: 'Puntos', line: 18.5 },
      { stat: 'Rebotes', line: 6.5 },
      { stat: 'Asistencias', line: 4.5 },
    ],
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get('home_team') || 'Home';
  const homeAbbrev = (searchParams.get('home_abbrev') || homeTeam.slice(0, 3)).toUpperCase();
  const awayTeam = searchParams.get('away_team') || 'Away';
  const awayAbbrev = (searchParams.get('away_abbrev') || awayTeam.slice(0, 3)).toUpperCase();
  const sport = searchParams.get('sport') || 'Soccer';

  const props: any[] = [];

  const homePlayers = [
    { name: `${homeTeam} Delantero 1`, team: homeAbbrev },
    { name: `${homeTeam} Mediocampista`, team: homeAbbrev },
  ];
  const awayPlayers = [
    { name: `${awayTeam} Delantero 1`, team: awayAbbrev },
    { name: `${awayTeam} Creador`, team: awayAbbrev },
  ];

  [...homePlayers, ...awayPlayers].forEach((player, idx) => {
    const statName = sport === 'Soccer' ? (idx % 2 === 0 ? 'Remates a Puerta' : 'Pases Completados') : (sport === 'MLB' ? 'Bases Totales' : 'Puntos');
    const lineVal = sport === 'Soccer' ? (idx % 2 === 0 ? 1.5 : 34.5) : (sport === 'MLB' ? 1.5 : 18.5);

    const seed = `${player.name}_${statName}_${lineVal}`;
    const probOver = deterministicProb(`${seed}_over`);
    const probUnder = Number((1.0 - probOver).toFixed(4));

    const evOver = Number(((probOver * 1.91 - 1) * 100).toFixed(1));
    const evUnder = Number(((probUnder * 1.91 - 1) * 100).toFixed(1));

    const avatarUrl = sport === 'MLB' 
      ? 'https://a.espncdn.com/i/headshots/mlb/players/full/39832.png'
      : sport === 'NBA'
      ? 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png'
      : 'https://a.espncdn.com/i/headshots/soccer/players/full/45843.png';

    props.push({
      prop_id: seed,
      player_id: seed,
      player_name: player.name,
      team: player.team,
      player_image: avatarUrl,
      avatar: avatarUrl,
      player_avatar: avatarUrl,
      sport: sport,
      stat_type: statName,
      line_score: lineVal,
      over_odds: 1.91,
      under_odds: 1.91,
      prob_over: probOver,
      prob_under: probUnder,
      ev_over: evOver,
      ev_under: evUnder,
      best_pick: evOver >= evUnder ? 'OVER' : 'UNDER',
    });
  });

  return NextResponse.json({
    status: 'success',
    match: `${homeTeam} vs ${awayTeam}`,
    sport: sport,
    projections: props,
  });
}
