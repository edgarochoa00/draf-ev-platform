import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings
import os

_db = None

def init_firebase():
    global _db
    if not firebase_admin._apps:
        cred_path = os.path.join(os.getcwd(), settings.FIREBASE_CREDENTIALS_PATH)
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")
            
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()

def get_db():
    if _db is None:
        init_firebase()
    return _db
