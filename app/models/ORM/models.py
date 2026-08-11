from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    email: str
    password_hash: str
    bankroll: float = 1000.00
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(BaseModel):
    id: str
    sport_key: str
    home_team: str
    away_team: str
    commence_time: datetime
    status: str = "UPCOMING"

class Prediction(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    event_id: str
    market_key: str
    selection: str
    bookmaker_odds: float
    model_probability: float
    ev_percentage: float
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ParleyItem(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    prediction_id: str
    odds_at_placement: float
    item_status: str = "PENDING"

class UserParley(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    total_odds: float
    total_ev: float
    quality_score: float
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    items: List[ParleyItem] = Field(default_factory=list)
