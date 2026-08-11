import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    parleys: [
      {
        parley_id: 'parley_mock_101',
        created_at: new Date().toISOString(),
        status: 'WON',
        combined_odds: 4.85,
        total_stake: 50.0,
        potential_payout: 242.5,
        profit_loss: 192.5,
        ev_percent: 14.2,
        picks: [
          { selection_name: 'Club América Gana', match_name: 'Club América vs Chivas', decimal_odds: 1.85, ev_percent: 7.3 },
          { selection_name: 'Detroit Tigers Moneyline', match_name: 'Detroit Tigers vs Cleveland Guardians', decimal_odds: 2.27, ev_percent: 11.2 },
        ],
      },
    ],
  });
}
