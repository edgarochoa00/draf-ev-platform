from fastapi import Header, HTTPException, Depends
import firebase_admin
from firebase_admin import auth
from app.core.database import init_firebase

def get_current_user(authorization: str = Header(None)):
    """
    Middleware / Dependencia para verificar el Firebase Auth ID Token enviado en los headers.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Devuelve usuario anónimo si no hay token de autenticación
        return {"uid": "anonymous", "email": "invitado@parley.app"}
        
    token = authorization.split("Bearer ")[1]
    try:
        init_firebase()
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido de Firebase: {str(e)}")
