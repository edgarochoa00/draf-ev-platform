import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_bankroll = 1000, selections = [] } = body;

    if (!selections || selections.length === 0) {
      return NextResponse.json({ detail: 'El ticket no contiene selecciones.' }, { status: 400 });
    }

    let combinedOdds = 1.0;
    let combinedProb = 1.0;

    const evaluatedItems = selections.map((s: any) => {
      const odds = Number(s.decimal_odds || 1.0);
      const prob = Number(s.model_prob || 0.5);

      combinedOdds *= odds;
      combinedProb *= prob;

      const indEv = Number(((prob * odds - 1) * 100).toFixed(2));

      return {
        event_id: s.event_id || 'ev_1',
        sport: s.sport || 'Soccer',
        match_name: s.match_name || s.selection_name || 'Partido',
        selection_name: s.selection_name || 'Apuesta',
        decimal_odds: odds,
        model_prob: prob,
        individual_ev_percent: indEv,
      };
    });

    combinedOdds = Number(combinedOdds.toFixed(2));
    combinedProb = Number(combinedProb.toFixed(4));

    // Calculate EV% = (combinedProb * combinedOdds - 1) * 100
    const combinedEv = Number(((combinedProb * combinedOdds - 1) * 100).toFixed(2));

    // Kelly Criterion Stake
    const b = combinedOdds - 1.0;
    let kellyFraction = 0;
    if (b > 0) {
      kellyFraction = Math.max(0, (b * combinedProb - (1 - combinedProb)) / b);
    }
    const fractionalKelly = kellyFraction * 0.25; // 1/4 Kelly conservative
    const recommendedStake = Number((user_bankroll * fractionalKelly).toFixed(2));
    const bankrollPercent = Number((fractionalKelly * 100).toFixed(2));

    const qualityScore = Math.min(100, Math.max(0, Number((50 + combinedEv * 2.5).toFixed(1))));

    return NextResponse.json({
      combined_odds: combinedOdds,
      combined_model_prob: combinedProb,
      combined_ev_percent: combinedEv,
      quality_score: qualityScore,
      is_recommended: combinedEv > 0,
      recommended_stake: recommendedStake,
      bankroll_percentage: bankrollPercent,
      optimization_advice: combinedEv > 0 ? 'Ticket balanceado y altamente rentable por modelo +EV.' : 'Precaución: El valor esperado acumulado es negativo.',
      evaluated_items: evaluatedItems,
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message || 'Error en la evaluación del parley' }, { status: 500 });
  }
}
