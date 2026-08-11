from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class SelectionItem(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    event_id: str
    sport: str
    match_name: str
    selection_name: str
    decimal_odds: float = Field(..., gt=1.0, description="Cuota decimal ofrecida por la casa")
    model_prob: float = Field(..., gt=0.0, lt=1.0, description="Probabilidad calculada por ML")

class ParleyEvaluationRequest(BaseModel):
    user_bankroll: Optional[float] = Field(1000.0, ge=0.0)
    selections: List[SelectionItem] = Field(..., min_length=1, max_length=10)

class SelectionEvaluationResponse(SelectionItem):
    individual_ev_percent: float

class ParleyEvaluationResponse(BaseModel):
    combined_odds: float
    combined_model_prob: float
    combined_ev_percent: float
    quality_score: float
    is_recommended: bool
    recommended_stake: float
    bankroll_percentage: float
    optimization_advice: str
    evaluated_items: List[SelectionEvaluationResponse]
