import urllib.request
import json

def run_e2e_flow():
    print("=== 1. INGESTA EN VIVO (ESPN + MODELO POISSON ML) ===")
    events_res = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/v1/parleys/events/live").read())
    events = events_res.get("events", [])
    print(f"-> Total de eventos reales descargados: {len(events)}")
    if events:
        print(f"-> Partido muestra: {events[0]['match_name']}")
        print(f"-> Cuota: @{events[0]['decimal_odds']} | Probabilidad IA: {events[0]['model_prob']*100:.1f}% | Ventaja: +{events[0]['ev_percent']}% EV")

    print("\n=== 2. EVALUACIÓN MATEMÁTICA Y KELLY STAKE ($1,500 MXN BANKROLL) ===")
    payload = {
        "user_bankroll": 1500.0,
        "selections": [
            {
                "event_id": events[0]["event_id"],
                "sport": events[0]["sport"],
                "match_name": events[0]["match_name"],
                "selection_name": events[0]["selection_name"],
                "decimal_odds": events[0]["decimal_odds"],
                "model_prob": events[0]["model_prob"]
            }
        ]
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/parleys/evaluate",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    eval_res = json.loads(urllib.request.urlopen(req).read())
    print(f"-> Quality Score: {eval_res['quality_score']}/100")
    print(f"-> Ventaja Combinada (+EV): {eval_res['combined_ev_percent']}%")
    print(f"-> Stake Kelly Recomendado: ${eval_res['recommended_stake']} MXN ({eval_res['bankroll_percentage']}%)")
    print(f"-> Consejo: {eval_res['optimization_advice']}")

    print("\n=== 3. PERSISTENCIA Y RECUPERACIÓN DE HISTORIAL (FIREBASE FIRESTORE) ===")
    hist_res = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/v1/parleys/history").read())
    parleys = hist_res.get("parleys", [])
    print(f"-> Tickets almacenados en Firestore: {len(parleys)}")

    print("\n=== 4. WORKER DE LIQUIDACIÓN AUTOMÁTICA DE TICKETS (SETTLEMENT) ===")
    settle_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/parleys/settle",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    settle_res = json.loads(urllib.request.urlopen(settle_req).read())
    print(f"-> Resultado de Liquidación: {settle_res['status']}")
    print(f"-> Tickets Procesados: {settle_res['settled_count']}")
    if settle_res.get("details"):
        print(f"-> Muestra Ticket Liquidado: {settle_res['details'][0]}")

if __name__ == "__main__":
    run_e2e_flow()
