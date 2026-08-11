import json
from app.ml.ev_calculator import BettingEngine

def main():
    engine = BettingEngine(kelly_fraction=0.25)
    
    selections = [
        {"model_prob": 0.52, "decimal_odds": 2.10}, # +EV
        {"model_prob": 0.60, "decimal_odds": 1.90}  # +EV
    ]
    
    result = engine.evaluate_parley(selections)
    print("Parley Evaluation:")
    print(json.dumps(result, indent=2))
    
    kelly = engine.calculate_kelly_stake(
        model_prob=result["combined_model_prob"],
        decimal_odds=result["combined_odds"],
        bankroll=1000.0
    )
    print("\nKelly Stake:")
    print(json.dumps(kelly, indent=2))

if __name__ == "__main__":
    main()
