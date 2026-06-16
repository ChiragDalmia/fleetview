import asyncio
import math
import os
import random
import time
from datetime import datetime, timezone
from typing import Set

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ── Config ───────────────────────────────────────────────
app = FastAPI(title="FleetView API")

# Only these origins may connect. Set on Render to your Vercel URL.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

TICK_SECONDS = 2
MAX_CLIENTS = 50         # connection cap
SPEED_LIMIT = 90         # km/h → SPEEDING alert
BRAKE_DROP = 30          # km/h drop in one tick → HARSH_BRAKING alert
ALERT_COOLDOWN = 15      # seconds between same alert type per vehicle

# Distinct public HLS test streams (stand-ins for real dashcams, one per vehicle)
STREAMS = [
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
    "https://test-streams.mux.dev/pts_shift/master.m3u8",
]

# One geofenced zone the UI draws and vehicles trigger on
GEOFENCE = {
    "name": "Downtown Core",
    "min_lat": 43.640, "max_lat": 43.662,
    "min_lng": -79.400, "max_lng": -79.372,
}

# Closed-loop routes — vehicles drive these instead of wandering randomly
ROUTES = [
    [(43.6510, -79.3810), (43.6480, -79.3950), (43.6560, -79.4050), (43.6620, -79.3880)],
    [(43.7030, -79.4270), (43.7100, -79.4100), (43.6950, -79.4000), (43.6900, -79.4250)],
    [(43.6320, -79.4520), (43.6400, -79.4350), (43.6500, -79.4480), (43.6380, -79.4650)],
    [(43.7210, -79.3620), (43.7100, -79.3500), (43.7000, -79.3700), (43.7150, -79.3800)],
    [(43.6810, -79.5010), (43.6900, -79.4850), (43.6750, -79.4800), (43.6700, -79.4980)],
]

# ── State (in-memory; assumes a single worker) ───────────
clients: Set[WebSocket] = set()
alerts: list = []
_alert_seq = 0
_last_alert: dict = {}


def _make_vehicles():
    ids = ["TRUCK-001", "VAN-002", "CAR-003", "TRUCK-004", "VAN-005"]
    out = []
    for i, vid in enumerate(ids):
        route = ROUTES[i]
        lat, lng = route[0]
        out.append({
            "id": vid, "lat": lat, "lng": lng, "speed": 0,
            "status": "idle" if vid == "CAR-003" else "moving",
            "stream": STREAMS[i % len(STREAMS)],
            "_route": route, "_wp": 1, "_cruise": 55,
            "_inside": (GEOFENCE["min_lat"] <= lat <= GEOFENCE["max_lat"]
                        and GEOFENCE["min_lng"] <= lng <= GEOFENCE["max_lng"]),
        })
    return out


vehicles = _make_vehicles()


# ── Geo helpers ──────────────────────────────────────────
def meters_between(lat1, lng1, lat2, lng2):
    x = math.radians(lng2 - lng1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return math.hypot(x, y) * 6_371_000


def move_toward(lat, lng, tlat, tlng, meters):
    d = meters_between(lat, lng, tlat, tlng)
    if d == 0 or d <= meters:
        return tlat, tlng, True
    f = meters / d
    return lat + (tlat - lat) * f, lng + (tlng - lng) * f, False


def in_geofence(lat, lng):
    g = GEOFENCE
    return g["min_lat"] <= lat <= g["max_lat"] and g["min_lng"] <= lng <= g["max_lng"]


# ── Alerts (monotonic IDs + cooldown to stop flooding) ───
def add_alert(vehicle_id, atype):
    global _alert_seq
    now = time.monotonic()
    key = (vehicle_id, atype)
    if now - _last_alert.get(key, -1e9) < ALERT_COOLDOWN:
        return
    _last_alert[key] = now
    _alert_seq += 1
    alerts.append({
        "id": _alert_seq,
        "vehicle_id": vehicle_id,
        "type": atype,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(alerts) > 20:
        alerts.pop(0)


# ── Simulation ───────────────────────────────────────────
def simulate_tick():
    for v in vehicles:
        if v["status"] != "moving":
            v["speed"] = 0
            continue

        prev = v["speed"]

        if prev > 40 and random.random() < 0.04:
            v["speed"] = max(0, prev - random.randint(30, 45))   # hard-brake event
        else:
            if random.random() < 0.10:
                v["_cruise"] = random.randint(35, 95)
            step = max(-15, min(15, v["_cruise"] - prev))         # cap acceleration
            v["speed"] = max(0, min(120, prev + step))

        meters = v["speed"] * 1000 / 3600 * TICK_SECONDS
        tlat, tlng = v["_route"][v["_wp"]]
        nlat, nlng, arrived = move_toward(v["lat"], v["lng"], tlat, tlng, meters)
        v["lat"], v["lng"] = round(nlat, 6), round(nlng, 6)
        if arrived:
            v["_wp"] = (v["_wp"] + 1) % len(v["_route"])

        inside = in_geofence(v["lat"], v["lng"])
        if inside != v["_inside"]:
            v["_inside"] = inside
            add_alert(v["id"], "GEOFENCE_BREACH")
        if v["speed"] > SPEED_LIMIT:
            add_alert(v["id"], "SPEEDING")
        if prev - v["speed"] >= BRAKE_DROP:
            add_alert(v["id"], "HARSH_BRAKING")


def public_vehicle(v):
    # Strip internal simulation state before sending to the browser
    return {k: v[k] for k in ("id", "lat", "lng", "speed", "status", "stream")}


def snapshot():
    return {
        "type": "TELEMETRY",
        "vehicles": [public_vehicle(v) for v in vehicles],
        "alerts": alerts[-5:],
        "geofence": GEOFENCE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def broadcast(data):
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(data)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


async def telemetry_loop():
    while True:
        simulate_tick()
        await broadcast(snapshot())
        await asyncio.sleep(TICK_SECONDS)


# ── Routes ───────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    asyncio.create_task(telemetry_loop())


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    if len(clients) >= MAX_CLIENTS:
        await ws.close(code=1013)   # try again later
        return
    await ws.accept()
    clients.add(ws)
    try:
        await ws.send_json(snapshot())   # send immediately so UI isn't blank on load
        while True:
            await ws.receive_text()      # keepalive; content is ignored
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)


@app.get("/health")
def health():
    return {"status": "ok", "vehicles": len(vehicles), "clients": len(clients)}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)