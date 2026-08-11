import httpx
import asyncio
import json
import hashlib
from datetime import datetime, timedelta, timezone
from app.ml.model import model_engine

ESPN_LEAGUES = [
    # ── Fútbol ──────────────────────────────────────────────────────────────
    {"sport": "Soccer", "league": "Liga MX",          "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard"},
    {"sport": "Soccer", "league": "Premier League",   "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard"},
    {"sport": "Soccer", "league": "La Liga",          "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard"},
    {"sport": "Soccer", "league": "Serie A",          "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard"},
    {"sport": "Soccer", "league": "Bundesliga",       "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard"},
    {"sport": "Soccer", "league": "Ligue 1",          "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard"},
    {"sport": "Soccer", "league": "Champions League", "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard"},
    {"sport": "Soccer", "league": "Europa League",    "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard"},
    {"sport": "Soccer", "league": "Liga Brasil",      "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard"},
    {"sport": "Soccer", "league": "Liga Argentina",   "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard"},
    {"sport": "Soccer", "league": "MLS",              "url": "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard"},
    # ── Béisbol ─────────────────────────────────────────────────────────────
    {"sport": "MLB",    "league": "MLB",              "url": "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"},
    # ── Basketball ──────────────────────────────────────────────────────────
    {"sport": "NBA",    "league": "NBA",              "url": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"},
    # ── Fútbol Americano ─────────────────────────────────────────────────────
    {"sport": "NFL",    "league": "NFL",              "url": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"},
]

def _deterministic_float(seed_str: str, min_val: float, max_val: float) -> float:
    """Genera un flotante determinista entre min_val y max_val basado en el hash del string."""
    hash_val = int(hashlib.md5(seed_str.encode('utf-8')).hexdigest()[:8], 16)
    normalized = hash_val / 0xFFFFFFFF
    return round(min_val + normalized * (max_val - min_val), 2)

def parse_iso_date(date_raw: str):
    """Parsea fechas ISO UTC enviadas por la API de ESPN."""
    if not date_raw:
        return None
    date_clean = date_raw.replace("Z", "+0000")
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M%z", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(date_clean, fmt)
        except ValueError:
            pass
    return None

def format_espn_date(date_raw: str) -> str:
    """Convierte fechas ISO UTC de ESPN a hora local UTC-6."""
    dt_utc = parse_iso_date(date_raw)
    if not dt_utc:
        return date_raw or "Hora por definir"

    tz_local = timezone(timedelta(hours=-6))
    dt_local = dt_utc.astimezone(tz_local)
    now = datetime.now(tz_local)

    days_es = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    months_es = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    time_str = dt_local.strftime("%H:%M")

    if dt_local.date() == now.date():
        return f"HOY ({time_str})"
    elif dt_local.date() == (now + timedelta(days=1)).date():
        return f"MAÑANA ({time_str})"
    else:
        dow = days_es[dt_local.weekday()]
        month = months_es[dt_local.month]
        return f"{dow} {dt_local.day} {month} ({time_str})"

def _best_team_name(team_obj: dict) -> str:
    for key in ("displayName", "shortDisplayName", "name", "abbreviation"):
        val = team_obj.get(key, "").strip()
        if val:
            return val
    return ""

def _extract_team_details(competitor: dict) -> dict:
    team_obj = competitor.get("team", {})
    name = _best_team_name(team_obj)
    abbrev = (
        team_obj.get("abbreviation")
        or team_obj.get("shortDisplayName")
        or name[:3]
    ).upper()
    logo = team_obj.get("logo")
    if not logo and team_obj.get("logos"):
        logo = team_obj.get("logos")[0].get("href")
    return {"name": name, "abbrev": abbrev, "logo": logo or ""}

def _parse_competitors_rich(competitors: list) -> tuple[dict, dict]:
    home_team, away_team = None, None
    for c in competitors:
        side = c.get("homeAway", "").lower()
        t_info = _extract_team_details(c)
        if not t_info["name"]:
            continue
        if side == "home":
            home_team = t_info
        elif side == "away":
            away_team = t_info

    if not home_team or not away_team:
        list_teams = [_extract_team_details(c) for c in competitors if _best_team_name(c.get("team", {}))]
        if len(list_teams) >= 2:
            home_team = home_team or list_teams[0]
            away_team = away_team or list_teams[1]

    return home_team or {"name": "Local", "abbrev": "LOC", "logo": ""}, away_team or {"name": "Visitante", "abbrev": "VIS", "logo": ""}

def generate_market_picks_ml(home_team: str, home_abbrev: str, away_team: str, away_abbrev: str, sport: str, event_id: str = "0"):
    seed = f"{event_id}_{home_team}_{away_team}"
    
    if sport == "Soccer":
        home_lambda = _deterministic_float(f"{seed}_h_lambda", 1.25, 2.15)
        away_lambda = _deterministic_float(f"{seed}_a_lambda", 0.95, 1.85)
        probs = model_engine.compute_match_probabilities(home_lambda, away_lambda, rho=-0.13)

        return [
            {
                "category": "Money Line",
                "badge": "90'",
                "picks": [
                    {"abbrev": home_abbrev, "name": f"{home_team} Gana",  "odds": round(1.0 / max(0.05, probs["home_win"] * 0.9), 2), "prob": probs["home_win"]},
                    {"abbrev": "EMPATE",    "name": "Empate",             "odds": round(1.0 / max(0.05, probs["draw"]     * 0.9), 2), "prob": probs["draw"]},
                    {"abbrev": away_abbrev, "name": f"{away_team} Gana",  "odds": round(1.0 / max(0.05, probs["away_win"] * 0.9), 2), "prob": probs["away_win"]},
                ]
            },
            {
                "category": "Goles Totales ↑/↓",
                "badge": "90'",
                "line": "2.5",
                "picks": [
                    {"abbrev": "↑ 2.5", "name": "Over 2.5 Goles",  "odds": round(1.0 / max(0.05, probs["over_25"]  * 0.88), 2), "prob": probs["over_25"]},
                    {"abbrev": "↓ 2.5", "name": "Under 2.5 Goles", "odds": round(1.0 / max(0.05, probs["under_25"] * 0.88), 2), "prob": probs["under_25"]},
                ]
            },
            {
                "category": "Tiros de Esquina",
                "badge": "90'",
                "picks": [
                    {"abbrev": "↑ 8.5",  "name": "Over 8.5 Corners",  "odds": _deterministic_float(f"{seed}_c85", 1.85, 2.30), "prob": 0.58},
                    {"abbrev": "↑ 10.5", "name": "Over 10.5 Corners", "odds": _deterministic_float(f"{seed}_c105", 2.40, 3.10), "prob": 0.45},
                    {"abbrev": "↓ 9.5",  "name": "Under 9.5 Corners", "odds": _deterministic_float(f"{seed}_u95", 1.90, 2.20), "prob": 0.52},
                ]
            },
            {
                "category": "Ambos Equipos Anotan",
                "badge": "90'",
                "picks": [
                    {"abbrev": "SÍ", "name": "Ambos Anotan: Sí", "odds": round(1.0 / max(0.05, probs["btts_yes"] * 0.9), 2), "prob": probs["btts_yes"]},
                    {"abbrev": "NO", "name": "Ambos Anotan: No", "odds": round(1.0 / max(0.05, probs["btts_no"]  * 0.9), 2), "prob": probs["btts_no"]},
                ]
            },
        ], home_lambda, away_lambda

    elif sport in ("NBA", "NFL", "MLB"):
        prob_home = _deterministic_float(f"{seed}_nba_prob", 0.40, 0.65)
        prob_away = round(1.0 - prob_home, 2)
        spread = _deterministic_float(f"{seed}_spread", 2.5, 9.5)
        total = _deterministic_float(f"{seed}_total", 195.0, 235.0) if sport == "NBA" else _deterministic_float(f"{seed}_total_nfl", 40.5, 55.5)

        return [
            {
                "category": "Money Line",
                "badge": "FINAL",
                "picks": [
                    {"abbrev": home_abbrev, "name": f"{home_team} Moneyline", "odds": round(1.0 / (prob_home * 0.9), 2), "prob": prob_home},
                    {"abbrev": away_abbrev, "name": f"{away_team} Moneyline", "odds": round(1.0 / (prob_away * 0.9), 2), "prob": prob_away},
                ]
            },
            {
                "category": "Spread (Handicap)",
                "badge": "FINAL",
                "picks": [
                    {"abbrev": f"-{spread}", "name": f"{home_team} -{spread}", "odds": _deterministic_float(f"{seed}_sp1", 1.85, 2.05), "prob": 0.50},
                    {"abbrev": f"+{spread}", "name": f"{away_team} +{spread}", "odds": _deterministic_float(f"{seed}_sp2", 1.85, 2.05), "prob": 0.46},
                ]
            },
            {
                "category": "Puntos Totales ↑/↓",
                "badge": "FINAL",
                "picks": [
                    {"abbrev": f"↑ {total}", "name": f"Over {total}",  "odds": _deterministic_float(f"{seed}_tot1", 1.85, 2.10), "prob": 0.50},
                    {"abbrev": f"↓ {total}", "name": f"Under {total}", "odds": _deterministic_float(f"{seed}_tot2", 1.85, 2.10), "prob": 0.50},
                ]
            },
        ], 110.5, 105.2

    else:
        prob_away = 0.52
        prob_home = 0.48
        return [
            {
                "category": "Money Line",
                "badge": "FINAL",
                "picks": [
                    {"abbrev": home_abbrev, "name": f"{home_team} Moneyline", "odds": 2.10, "prob": prob_home},
                    {"abbrev": away_abbrev, "name": f"{away_team} Moneyline", "odds": 1.90, "prob": prob_away},
                ]
            }
        ], 1.5, 1.2

def _extract_valid_upcoming_events(events_raw: list, sport: str, league_name: str, now_utc: datetime) -> list:
    valid_events = []
    for evt in events_raw:
        status_obj = evt.get("status", {}).get("type", {})
        state = status_obj.get("state", "").lower()
        date_raw = evt.get("date", "")
        dt_utc = parse_iso_date(date_raw)
        if not dt_utc:
            continue

        if state == "post" or dt_utc < (now_utc - timedelta(hours=3)):
            continue

        competitions = evt.get("competitions", [{}])[0]
        competitors = competitions.get("competitors", [])
        if len(competitors) < 2:
            continue

        home_dict, away_dict = _parse_competitors_rich(competitors)
        if not home_dict["name"] or not away_dict["name"]:
            continue

        venue_name = competitions.get("venue", {}).get("fullName", "Estadio Principal")
        match_name = f"{home_dict['name']} vs {away_dict['name']}"
        status_desc = status_obj.get("shortDetail", "Programado")
        is_live = state == "in"
        start_time_formatted = format_espn_date(date_raw)
        evt_id = evt.get("id", "0")

        home_form = "W-W-D-W-L"
        away_form = "W-D-W-W-W"

        raw_markets, h_lambda, a_lambda = generate_market_picks_ml(
            home_dict["name"], home_dict["abbrev"], away_dict["name"], away_dict["abbrev"], sport, evt_id
        )
        formatted_markets = []

        for cat in raw_markets:
            cat_picks = []
            for p in cat["picks"]:
                dec_odds = p["odds"]
                m_prob = p["prob"]
                ev_perc = round(((m_prob * dec_odds) - 1) * 100, 1)
                cat_picks.append({
                    "selection_id": f"{evt_id}_{p['name'].replace(' ', '_')}",
                    "selection_name": p["name"],
                    "abbrev": p.get("abbrev", p["name"][:3]),
                    "decimal_odds": dec_odds,
                    "odds_label": f"{dec_odds:.2f}x",
                    "model_prob": m_prob,
                    "ev_percent": ev_perc,
                })
            formatted_markets.append({
                "category": cat["category"],
                "badge": cat.get("badge", "90'"),
                "line": cat.get("line"),
                "picks": cat_picks,
            })

        top_pick = formatted_markets[0]["picks"][0]

        valid_events.append({
            "event_id": evt_id,
            "sport": sport,
            "league_name": league_name,
            "match_name": match_name,
            "home_team": home_dict["name"],
            "home_abbrev": home_dict["abbrev"],
            "home_logo": home_dict["logo"],
            "away_team": away_dict["name"],
            "away_abbrev": away_dict.get("abbrev", "VIS"),
            "away_logo": away_dict["logo"],
            "start_time_formatted": start_time_formatted,
            "venue": venue_name,
            "home_form": home_form,
            "away_form": away_form,
            "home_xg": h_lambda,
            "away_xg": a_lambda,
            "selection_name": top_pick["selection_name"],
            "decimal_odds": top_pick["decimal_odds"],
            "odds_label": top_pick["odds_label"],
            "model_prob": top_pick["model_prob"],
            "ev_percent": top_pick["ev_percent"],
            "date": date_raw,
            "dt_timestamp": dt_utc.timestamp(),
            "status_desc": status_desc,
            "is_live": is_live,
            "markets": formatted_markets,
        })

    return valid_events

async def _fetch_single_league_async(client: httpx.AsyncClient, item: dict, now_utc: datetime) -> list:
    sport = item["sport"]
    league_name = item["league"]
    base_url = item["url"]
    league_events = []

    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

    try:
        resp = await client.get(base_url, headers=headers, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            league_events = _extract_valid_upcoming_events(data.get("events", []), sport, league_name, now_utc)
    except Exception:
        pass

    if not league_events:
        for day_offset in range(1, 3):
            d_str = (now_utc + timedelta(days=day_offset)).strftime("%Y%m%d")
            url = f"{base_url}?dates={d_str}"
            try:
                resp = await client.get(url, headers=headers, timeout=2.0)
                if resp.status_code == 200:
                    data = resp.json()
                    valid = _extract_valid_upcoming_events(data.get("events", []), sport, league_name, now_utc)
                    if valid:
                        league_events = valid
                        break
            except Exception:
                pass

    return league_events

async def fetch_live_events_async() -> list:
    all_events = []
    now_utc = datetime.now(timezone.utc)

    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [_fetch_single_league_async(client, item, now_utc) for item in ESPN_LEAGUES]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, list) and res:
                all_events.extend(res)

    all_events.sort(key=lambda x: (0 if x.get("is_live") else 1, x.get("dt_timestamp", 0)))
    return all_events

def fetch_live_events() -> list:
    """Wrapper síncrono para compatibilidad."""
    try:
        return asyncio.run(fetch_live_events_async())
    except RuntimeError:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(fetch_live_events_async())

