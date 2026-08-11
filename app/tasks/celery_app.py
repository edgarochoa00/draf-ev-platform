from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "betting_engine_worker",
    broker=settings.REDIS_URI,
    backend=settings.REDIS_URI
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task
def fetch_odds_task():
    """
    Tarea periódica para traer las cuotas en vivo.
    """
    return "Odds fetched successfully"
