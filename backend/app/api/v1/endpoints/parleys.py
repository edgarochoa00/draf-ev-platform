from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from app.schemas.parley import ParleyEvaluationRequest, ParleyEvaluationResponse
from app.services.parley_service import ParleyService, get_parley_service

router = APIRouter()

@router.post(
    "/evaluate",
    response_model=ParleyEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evalúa la rentabilidad y calidad de un Parley"
)
async def evaluate_parley_ticket(
    payload: ParleyEvaluationRequest,
    background_tasks: BackgroundTasks,
    parley_service: ParleyService = Depends(get_parley_service)
):
    if not payload.selections:
        raise HTTPException(status_code=400, detail="El ticket no contiene selecciones.")
        
    # Evaluación pura en memoria sin bloqueo
    response, new_parley = parley_service.evaluate_ticket_in_memory(payload, user_id="anonymous")
    
    # Persistencia asíncrona diferida en segundo plano (Background Tasks)
    background_tasks.add_task(parley_service.persist_parley_background, new_parley)
    
    return response

@router.get("/history")
async def get_parley_history(parley_service: ParleyService = Depends(get_parley_service)):
    try:
        history = await parley_service.repository.get_user_history(user_id="anonymous", limit=20)
        return {"status": "success", "parleys": history}
    except Exception as e:
        return {"status": "error", "message": str(e), "parleys": []}

@router.get("/events/live")
async def get_live_events():
    from app.services.cache_service import cache_service
    events = await cache_service.get_live_events()
    return {"status": "success", "events": events}


@router.post("/settle")
async def settle_parleys():
    from app.services.settlement import settle_pending_parleys
    result = settle_pending_parleys()
    return result
