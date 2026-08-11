import sys
import os

# Ensure backend folder is in python path for serverless imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.router import api_router

app = FastAPI(
    title="DRAF EV Platform API",
    description="Engine para predicciones +EV, Momios y Props de Jugadores",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/health")
def health_check():
    return {"status": "online", "platform": "Vercel Serverless"}
