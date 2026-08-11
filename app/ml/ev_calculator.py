import numpy as np
from typing import List, Dict

class BettingEngine:
    """
    Motor de Cálculo Cuantitativo (+EV, Criterio de Kelly Fraccionado y Techos de Riesgo).
    """
    def __init__(
        self, 
        kelly_fraction: float = 0.25,
        max_single_bet_pct: float = 5.0,  # Máximo 5% del bankroll en apuesta simple
        max_parley_bet_pct: float = 3.0   # Máximo 3% del bankroll en parley
    ):
        self.kelly_fraction = kelly_fraction
        self.max_single_bet_pct = max_single_bet_pct
        self.max_parley_bet_pct = max_parley_bet_pct

    def calculate_ev(self, model_prob: float, decimal_odds: float) -> float:
        """Calcula el Porcentaje de Valor Esperado (+EV%)."""
        if model_prob <= 0 or model_prob >= 1 or decimal_odds <= 1.0:
            return 0.0
        
        ev_percent = (model_prob * decimal_odds - 1.0) * 100.0
        return round(ev_percent, 2)

    def calculate_kelly_stake(
        self, 
        model_prob: float, 
        decimal_odds: float, 
        bankroll: float,
        is_parley: bool = False
    ) -> Dict[str, float]:
        """
        Calcula el tamaño óptimo de la apuesta basado en Kelly Fraccionado
        con techos estrictos de exposición de riesgo por bankroll.
        """
        if bankroll <= 0 or model_prob <= 0 or decimal_odds <= 1.0:
            return {"recommended_stake": 0.0, "bankroll_percentage": 0.0, "is_capped": False}

        b = decimal_odds - 1.0
        q = 1.0 - model_prob
        
        f_star = (model_prob * b - q) / b
        
        if f_star <= 0:
            return {"recommended_stake": 0.0, "bankroll_percentage": 0.0, "is_capped": False}
            
        f_applied = f_star * self.kelly_fraction
        raw_pct = f_applied * 100.0
        
        # Aplicar techo de riesgo (Cap) según tipo de apuesta
        max_pct = self.max_parley_bet_pct if is_parley else self.max_single_bet_pct
        is_capped = raw_pct > max_pct
        final_pct = min(raw_pct, max_pct)
        
        recommended_stake = round(bankroll * (final_pct / 100.0), 2)
        
        return {
            "recommended_stake": recommended_stake,
            "bankroll_percentage": round(final_pct, 2),
            "is_capped": is_capped,
            "uncapped_percentage": round(raw_pct, 2)
        }

    def evaluate_parley(self, selections: List[Dict[str, float]]) -> Dict:
        """
        Evalúa un Parley de N selecciones integrando varianza acumulada y exposición de riesgo.
        """
        if not selections:
            return {
                "combined_odds": 1.0,
                "combined_model_prob": 0.0,
                "combined_ev_percent": 0.0,
                "quality_score": 0.0,
                "is_recommended": False
            }

        combined_odds = 1.0
        combined_model_prob = 1.0
        
        for sel in selections:
            combined_odds *= sel.get('decimal_odds', 1.0)
            combined_model_prob *= sel.get('model_prob', 0.0)
            
        combined_ev = self.calculate_ev(combined_model_prob, combined_odds)
        
        # Penalización por varianza según número de selecciones
        num_picks = len(selections)
        variance_score = max(0, 100 - (num_picks - 1) * 18)
        
        # Quality Score del Ticket (0 - 100)
        quality_score = max(0, min(100, (combined_ev * 4) + (variance_score * 0.6)))
        
        return {
            "combined_odds": round(combined_odds, 2),
            "combined_model_prob": round(combined_model_prob, 4),
            "combined_ev_percent": combined_ev,
            "quality_score": round(quality_score, 1),
            "is_recommended": combined_ev > 2.0 and num_picks <= 4
        }

