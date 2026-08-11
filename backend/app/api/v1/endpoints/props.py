from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Dict, Any, Optional
from app.services.prizepicks_service import prizepicks_service
from app.services.props_settlement import props_settlement_service

router = APIRouter()

@router.get(
    "/prizepicks",
    status_code=status.HTTP_200_OK,
    summary="Obtiene líneas Pick'em y proyecciones de jugadores en vivo de PrizePicks"
)
async def get_prizepicks_projections(
    sport: str = Query("NBA", description="Deporte o Liga (NBA, Soccer, MLB, NFL)"),
    limit: int = Query(50, ge=1, le=250)
):
    """
    Retorna proyecciones de jugadores con probabilidades del modelo probabilístico
    y momios decimales en tiempo real extraídos de la API de PrizePicks.
    """
    try:
        from app.services.cache_service import cache_service
        projections = await cache_service.get_player_props(sport=sport)
        return {
            "status": "success",
            "sport": sport,
            "count": len(projections[:limit]),
            "projections": projections[:limit]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo proyecciones: {str(e)}")

@router.get(
    "/match",
    status_code=status.HTTP_200_OK,
    summary="Obtiene proyecciones de Player Props específicas para un partido"
)
async def get_match_player_props(
    home_team: str = Query("Home", description="Nombre del equipo local"),
    home_abbrev: str = Query("LOC", description="Abreviatura local"),
    away_team: str = Query("Away", description="Nombre del equipo visitante"),
    away_abbrev: str = Query("VIS", description="Abreviatura visitante"),
    sport: str = Query("Soccer", description="Deporte"),
    event_id: str = Query("0", description="ID del evento")
):
    try:
        props = prizepicks_service.generate_match_player_props(
            home_team=home_team,
            home_abbrev=home_abbrev,
            away_team=away_team,
            away_abbrev=away_abbrev,
            sport=sport,
            event_id=event_id
        )
        return {
            "status": "success",
            "match_name": f"{home_team} vs {away_team}",
            "count": len(props),
            "projections": props
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando props del partido: {str(e)}")


@router.post(
    "/settle",
    status_code=status.HTTP_200_OK,
    summary="Liquida apuestas de Player Props contra marcadores y Box Scores oficiales"
)
async def settle_player_props(payload: Dict[str, Any]):
    """
    Evalúa picks de props (Over/Under) contra estadísticas oficiales en tiempo real.
    """
    picks = payload.get("picks", [])
    if not picks:
        raise HTTPException(status_code=400, detail="Se requiere una lista de 'picks' para liquidar.")
    
    live_stats = payload.get("live_stats", {})
    result = props_settlement_service.settle_player_prop_ticket(picks, live_stats)
    return {
        "status": "success",
        "settlement": result
    }
