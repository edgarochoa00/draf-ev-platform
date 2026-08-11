from typing import List, Dict, Any
from app.schemas.parley import ParleyEvaluationRequest, ParleyEvaluationResponse
from app.ml.ev_calculator import BettingEngine
from app.models.ORM.models import UserParley, ParleyItem
from app.repositories.parley_repository import ParleyRepository

class ParleyService:
    """
    Capa de Servicio para evaluación probabilística y coordinación de persistencia.
    """
    def __init__(self):
        self.repository = ParleyRepository()
        self.engine = BettingEngine(kelly_fraction=0.25)

    def evaluate_ticket_in_memory(
        self, payload: ParleyEvaluationRequest, user_id: str = "anonymous"
    ) -> tuple[ParleyEvaluationResponse, UserParley]:
        raw_selections = [sel.model_dump() for sel in payload.selections]
        parley_metrics = self.engine.evaluate_parley(raw_selections)
        
        kelly_data = self.engine.calculate_kelly_stake(
            model_prob=parley_metrics["combined_model_prob"],
            decimal_odds=parley_metrics["combined_odds"],
            bankroll=payload.user_bankroll,
            is_parley=len(payload.selections) > 1
        )
        
        num_picks = len(payload.selections)
        advice = "Ticket balanceado y rentable."
        if parley_metrics["combined_ev_percent"] <= 0:
            advice = "Alerta: Este parley tiene un Valor Esperado negativo (-EV). La casa tiene ventaja matemática."
        elif num_picks > 3:
            advice = f"Atención: Tienes {num_picks} selecciones. La alta varianza reduce drásticamente la tasa de acierto real. Considera dividirlo."
        if kelly_data.get("is_capped"):
            advice += f" Apuesta recortada al techo de riesgo del {kelly_data['bankroll_percentage']}% por gestión de Bankroll."

        evaluated_items = []
        for item in payload.selections:
            item_ev = self.engine.calculate_ev(item.model_prob, item.decimal_odds)
            evaluated_items.append({
                **item.model_dump(),
                "individual_ev_percent": item_ev
            })

        response = ParleyEvaluationResponse(
            combined_odds=parley_metrics["combined_odds"],
            combined_model_prob=parley_metrics["combined_model_prob"],
            combined_ev_percent=parley_metrics["combined_ev_percent"],
            quality_score=parley_metrics["quality_score"],
            is_recommended=parley_metrics["is_recommended"],
            recommended_stake=kelly_data["recommended_stake"],
            bankroll_percentage=kelly_data["bankroll_percentage"],
            optimization_advice=advice,
            evaluated_items=evaluated_items
        )

        new_parley = UserParley(
            user_id=user_id,
            total_odds=parley_metrics["combined_odds"],
            total_ev=parley_metrics["combined_ev_percent"],
            quality_score=parley_metrics["quality_score"],
            items=[ParleyItem(prediction_id=item.event_id, odds_at_placement=item.decimal_odds) for item in payload.selections]
        )

        return response, new_parley

    async def persist_parley_background(self, parley: UserParley):
        """Tarea asíncrona diferida para guardar en Firestore en segundo plano."""
        await self.repository.save_parley(parley)

def get_parley_service() -> ParleyService:
    return ParleyService()
