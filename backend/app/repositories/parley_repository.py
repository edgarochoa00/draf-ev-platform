import asyncio
from typing import List, Optional
from app.models.ORM.models import UserParley

class ParleyRepository:
    """
    Repositorio Asíncrono para almacenamiento y consulta de Parleys en Firestore.
    Evita el bloqueo del Event Loop de asyncio.
    """
    def __init__(self):
        self._db = None

    def _get_async_db(self):
        if self._db is None:
            try:
                from google.cloud import firestore
                self._db = firestore.AsyncClient()
            except Exception:
                self._db = None
        return self._db

    async def save_parley(self, parley: UserParley) -> str:
        """Guarda un ticket de parley de forma 100% asíncrona sin bloquear el event loop."""
        db = self._get_async_db()
        if not db:
            def _sync_save():
                try:
                    from app.core.database import get_db
                    sync_db = get_db()
                    doc_dict = parley.model_dump(mode="json")
                    sync_db.collection("user_parleys").document(parley.id).set(doc_dict)
                except Exception as e:
                    print("Error saving parley to Firestore:", e)
            try:
                await asyncio.wait_for(asyncio.to_thread(_sync_save), timeout=0.8)
            except Exception:
                pass
            return parley.id

        try:
            doc_ref = db.collection("user_parleys").document(parley.id)
            await asyncio.wait_for(doc_ref.set(parley.model_dump(mode="json")), timeout=0.8)
            return parley.id
        except Exception as e:
            print("Async Firestore save error:", e)
            return parley.id

    async def get_user_history(self, user_id: str = "anonymous", limit: int = 20) -> List[dict]:
        """Obtiene el historial de parleys de forma asíncrona."""
        db = self._get_async_db()
        if not db:
            def _sync_get():
                try:
                    from app.core.database import get_db
                    sync_db = get_db()
                    docs = sync_db.collection("user_parleys").limit(limit).stream()
                    return [doc.to_dict() for doc in docs]
                except Exception as e:
                    return []
            try:
                return await asyncio.wait_for(asyncio.to_thread(_sync_get), timeout=0.8)
            except Exception:
                return []

        try:
            query = db.collection("user_parleys").where("user_id", "==", user_id).limit(limit)
            docs = await asyncio.wait_for(query.get(), timeout=0.8)
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print("Async Firestore history query error:", e)
            return []

