from fastapi import APIRouter
from app.api.v1.endpoints import parleys, props

api_router = APIRouter()
api_router.include_router(parleys.router, prefix="/parleys", tags=["parleys"])
api_router.include_router(props.router, prefix="/props", tags=["props"])

