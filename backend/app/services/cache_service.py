import asyncio
import time
from typing import List, Dict, Any, Optional
from app.services.espn_service import fetch_live_events_async
from app.services.prizepicks_service import prizepicks_service

class IngestionCacheService:
    """
    Servidor de Caché en Memoria y Worker en Segundo Plano para Ingesta Ultra-Rápida (<10 ms).
    Pre-obtiene marcadores de ESPN y proyecciones de PrizePicks periódicamente.
    """
    def __init__(self):
        self._events_cache: List[Dict[str, Any]] = []
        self._events_last_updated: float = 0.0

        self._props_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._props_last_updated: Dict[str, float] = {}

        self._is_running: bool = False
        self._lock = asyncio.Lock()

    async def get_live_events(self) -> List[Dict[str, Any]]:
        """Devuelve marcadores de ESPN desde la memoria en tiempo récord."""
        if self._events_cache:
            return self._events_cache

        # Si la caché está vacía, realizar primera ingesta bajo demanda
        async with self._lock:
            if not self._events_cache:
                try:
                    self._events_cache = await fetch_live_events_async()
                    self._events_last_updated = time.time()
                except Exception as e:
                    print("Cache initial fetch notice:", e)
        return self._events_cache

    async def get_player_props(self, sport: str = "NBA") -> List[Dict[str, Any]]:
        """Devuelve proyecciones de jugadores desde la memoria en tiempo récord."""
        sport_key = str(sport).upper()
        if sport_key in self._props_cache and self._props_cache[sport_key]:
            return self._props_cache[sport_key]

        async with self._lock:
            if sport_key not in self._props_cache or not self._props_cache[sport_key]:
                try:
                    props = await prizepicks_service.fetch_projections(sport=sport, per_page=100)
                    self._props_cache[sport_key] = props
                    self._props_last_updated[sport_key] = time.time()
                except Exception as e:
                    print(f"Props cache fetch notice ({sport}):", e)
        return self._props_cache.get(sport_key, [])

    async def _update_all_caches(self):
        """Worker en segundo plano para refrescar caché periódicamente."""
        # 1. Refrescar eventos en vivo de ESPN
        try:
            events = await fetch_live_events_async()
            if events:
                async with self._lock:
                    self._events_cache = events
                    self._events_last_updated = time.time()
        except Exception as e:
            print("Background event cache update notice:", e)

        # 2. Refrescar proyecciones de PrizePicks para todos los deportes
        for sport in ["NBA", "Soccer", "MLB", "NFL"]:
            try:
                props = await prizepicks_service.fetch_projections(sport=sport, per_page=100)
                if props:
                    async with self._lock:
                        self._props_cache[sport.upper()] = props
                        self._props_last_updated[sport.upper()] = time.time()
            except Exception as e:
                print(f"Background props cache update notice ({sport}):", e)

    async def start_background_loop(self):
        """Inicia el bucle infinito del worker de fondo."""
        if self._is_running:
            return
        self._is_running = True
        print("🚀 Background Ingestion Cache Worker iniciado...")
        
        # Ejecutar primera actualización inmediatamente
        await self._update_all_caches()

        while self._is_running:
            await asyncio.sleep(30)  # Refrescar cada 30 segundos
            await self._update_all_caches()

cache_service = IngestionCacheService()
