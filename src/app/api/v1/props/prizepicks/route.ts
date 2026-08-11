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

const STAR_PLAYERS_MAP: Record<string, any[]> = {
  NBA: [
    { name: 'LeBron James', team: 'LAL', stat: 'Puntos', line: 24.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/1966.png' },
    { name: 'Stephen Curry', team: 'GSW', stat: 'Triples Anotados', line: 4.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3975.png' },
    { name: 'Luka Dončić', team: 'DAL', stat: 'Asistencias', line: 8.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png' },
    { name: 'Jayson Tatum', team: 'BOS', stat: 'Puntos + Rebotes', line: 35.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/4065648.png' },
    { name: 'Nikola Jokić', team: 'DEN', stat: 'Rebotes', line: 12.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png' },
    { name: 'Giannis Antetokounmpo', team: 'MIL', stat: 'Puntos', line: 29.5, avatar: 'https://a.espncdn.com/i/headshots/nba/players/full/3032977.png' },
  ],
  SOCCER: [
    { name: 'Lionel Messi', team: 'MIA', stat: 'Remates a Puerta', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/45843.png' },
    { name: 'Kylian Mbappé', team: 'RMD', stat: 'Goles Anotados', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/226597.png' },
    { name: 'Erling Haaland', team: 'MCI', stat: 'Remates Totales', line: 3.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/238634.png' },
    { name: 'Vinícius Júnior', team: 'RMD', stat: 'Faltas Recibidas', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/238031.png' },
    { name: 'Robert Lewandowski', team: 'BAR', stat: 'Remates a Puerta', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/126414.png' },
    { name: 'Mohamed Salah', team: 'LIV', stat: 'Pases Clave', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/soccer/players/full/167232.png' },
  ],
  MLB: [
    { name: 'Shohei Ohtani', team: 'LAD', stat: 'Bases Totales', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/39832.png' },
    { name: 'Aaron Judge', team: 'NYY', stat: 'Jonrones', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/33192.png' },
    { name: 'Mookie Betts', team: 'LAD', stat: 'Carreras Anotadas', line: 0.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/33039.png' },
    { name: 'Juan Soto', team: 'NYY', stat: 'Hit + Carrera + Impulsada', line: 2.5, avatar: 'https://a.espncdn.com/i/headshots/mlb/players/full/36969.png' },
  ],
  NFL: [
    { name: 'Patrick Mahomes', team: 'KC', stat: 'Yardas por Pase', line: 265.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png' },
    { name: 'Josh Allen', team: 'BUF', stat: 'Pases de Touchdown', line: 1.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3918298.png' },
    { name: 'Travis Kelce', team: 'KC', stat: 'Recepciones', line: 6.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    { name: 'Tyreek Hill', team: 'MIA', stat: 'Yardas por Recepción', line: 85.5, avatar: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116365.png' },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sportParam = (searchParams.get('sport') || 'NBA').toUpperCase();
  const sportKey = STAR_PLAYERS_MAP[sportParam] ? sportParam : 'NBA';

  const players = STAR_PLAYERS_MAP[sportKey] || STAR_PLAYERS_MAP.NBA;

  const props = players.map((p) => {
    const seed = `${p.name}_${p.stat}_${p.line}`;
    const probOver = deterministicProb(`${seed}_over`);
    const probUnder = Number((1.0 - probOver).toFixed(4));

    const evOver = Number(((probOver * 1.91 - 1) * 100).toFixed(1));
    const evUnder = Number(((probUnder * 1.91 - 1) * 100).toFixed(1));

    return {
      player_id: seed,
      player_name: p.name,
      team: p.team,
      avatar: p.avatar,
      sport: sportParam,
      stat_type: p.stat,
      line_score: p.line,
      over_odds: 1.91,
      under_odds: 1.91,
      prob_over: probOver,
      prob_under: probUnder,
      ev_over: evOver,
      ev_under: evUnder,
      best_pick: evOver >= evUnder ? 'OVER' : 'UNDER',
    };
  });

  return NextResponse.json({
    status: 'success',
    sport: sportParam,
    count: props.length,
    projections: props,
  });
}
