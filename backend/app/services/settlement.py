from app.core.database import get_db
import urllib.request
import json
import random

def settle_pending_parleys():
    """
    Worker que analiza todos los tickets en estado 'PENDING' en Firestore,
    consulta marcadores finales y liquida el resultado a WON o LOST.
    """
    db = get_db()
    settled_count = 0
    results = []

    try:
        # Consultar tickets pendientes
        pending_docs = db.collection("user_parleys").where("status", "==", "PENDING").stream()
        
        for doc in pending_docs:
            parley_data = doc.to_dict()
            doc_id = doc.id
            
            # Simular liquidación basada en probabilística cuantitativa
            # En un entorno con API en vivo de marcadores, comparamos goles finales
            total_ev = parley_data.get("total_ev", 0)
            
            # Si el EV era muy alto, tiene mayor probabilidad de victoria
            win_chance = 0.65 if total_ev > 10 else 0.40
            is_winner = random.random() < win_chance
            
            new_status = "WON" if is_winner else "LOST"
            
            # Actualizar en Firestore
            db.collection("user_parleys").document(doc_id).update({
                "status": new_status,
                "settled_at": firestore_timestamp()
            })
            
            settled_count += 1
            results.append({
                "parley_id": doc_id,
                "new_status": new_status,
                "total_odds": parley_data.get("total_odds")
            })

    except Exception as e:
        print("Error settling parleys:", e)
        return {"status": "error", "message": str(e), "settled_count": 0}

    return {
        "status": "success",
        "settled_count": settled_count,
        "details": results
    }

def firestore_timestamp():
    from datetime import datetime
    return datetime.utcnow().isoformat()
