import asyncio
import os
from datetime import datetime, timezone
from typing import Set

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from transit_feed import TransitFeed
from geofence import GeofenceTracker, Polygon, Point

# ── Config ───────────────────────────────────────────────
app = FastAPI(title="FleetView API")

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

# The live TTC feed refreshes roughly every 10-20s, so polling faster wastes
# requests without adding information.
TICK_SECONDS = int(os.getenv("TICK_SECONDS", "10"))
MAX_CLIENTS = 50
SPEEDING_THRESHOLD_KMH = int(os.getenv("SPEEDING_THRESHOLD_KMH", "50"))

# ── Geofence zones (can add multiple) ───────────────────
DOWNTOWN_CORE = Polygon(
    vertices=[
        Point(lat=43.640, lng=-79.400),
        Point(lat=43.662, lng=-79.400),
        Point(lat=43.662, lng=-79.372),
        Point(lat=43.640, lng=-79.372),
        Point(lat=43.640, lng=-79.400),  # Close the polygon
    ],
    name="Downtown Core",
)

AIRPORT_ZONE = Polygon(
    vertices=[
        Point(lat=43.676, lng=-79.631),
        Point(lat=43.694, lng=-79.631),
        Point(lat=43.694, lng=-79.589),
        Point(lat=43.676, lng=-79.589),
        Point(lat=43.676, lng=-79.631),
    ],
    name="Pearson Airport",
)

# ── State ──────────────────────────────────────────────
clients: Set[WebSocket] = set()
alerts: list = []
_alert_seq = 0

# Live TTC vehicle positions instead of pre-recorded CSV playback.
feed = TransitFeed()
geofence_tracker = GeofenceTracker([DOWNTOWN_CORE, AIRPORT_ZONE])

# vehicle_id -> latest normalized state. Populated by the polling loop;
# kept across polls so a transient feed outage doesn't blank the map.
vehicles: dict = {}


def add_alert(vehicle_id: str, atype: str, details: str = ""):
    """Add an alert to the log."""
    global _alert_seq
    _alert_seq += 1
    alerts.append({
        "id": _alert_seq,
        "vehicle_id": vehicle_id,
        "type": atype,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(alerts) > 50:
        alerts.pop(0)


async def refresh_vehicles():
    """Pull the latest real positions from the live feed and run detections."""
    snapshot = await feed.fetch()
    if snapshot is None:
        # Feed unreachable this tick — keep last known state on the map.
        return

    now = datetime.now(timezone.utc).isoformat()
    seen = set()

    for state in snapshot:
        vehicle_id = state["id"]
        seen.add(vehicle_id)
        vehicles[vehicle_id] = state

        # Check geofence crossings against the real position.
        crossings = geofence_tracker.update(
            vehicle_id=vehicle_id,
            lat=state["lat"],
            lng=state["lng"],
            timestamp=now,
        )

        for crossing in crossings:
            entered = crossing.direction == "in"
            add_alert(
                vehicle_id,
                "GEOFENCE_BREACH",
                f"{'Entered' if entered else 'Exited'} {crossing.boundary_name}",
            )

        # Speed alert
        if state["speed"] > SPEEDING_THRESHOLD_KMH:
            add_alert(vehicle_id, "SPEEDING", f"{state['speed']} km/h")

    # Drop vehicles that left the tracked subset so the map stays current.
    for stale_id in set(vehicles) - seen:
        del vehicles[stale_id]


async def broadcast(data: dict):
    """Send data to all connected clients."""
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(data)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


async def telemetry_loop():
    """Refresh live positions and broadcast every TICK_SECONDS."""
    while True:
        await refresh_vehicles()
        await broadcast({
            "type": "TELEMETRY",
            "vehicles": list(vehicles.values()),
            "alerts": alerts[-10:],  # Send last 10
            "geofence": {
                "name": DOWNTOWN_CORE.name,
                "min_lat": 43.640,
                "max_lat": 43.662,
                "min_lng": -79.400,
                "max_lng": -79.372,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        await asyncio.sleep(TICK_SECONDS)


# ── Routes ───────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # Prime with one live snapshot so the first client sees real vehicles.
    await refresh_vehicles()
    asyncio.create_task(telemetry_loop())


@app.on_event("shutdown")
async def shutdown():
    await feed.close()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    if len(clients) >= MAX_CLIENTS:
        await ws.close(code=1013)
        return
    await ws.accept()
    clients.add(ws)
    try:
        await ws.send_json({
            "type": "TELEMETRY",
            "vehicles": list(vehicles.values()),
            "alerts": alerts[-10:],
            "geofence": {
                "name": DOWNTOWN_CORE.name,
                "min_lat": 43.640,
                "max_lat": 43.662,
                "min_lng": -79.400,
                "max_lng": -79.372,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "vehicles": len(vehicles),
        "clients": len(clients),
        "alerts": len(alerts),
    }


@app.get("/geofences")
def get_geofences():
    """Return all geofence zones."""
    return {
        "zones": [
            {
                "name": DOWNTOWN_CORE.name,
                "vertices": [(v.lat, v.lng) for v in DOWNTOWN_CORE.vertices],
            },
            {
                "name": AIRPORT_ZONE.name,
                "vertices": [(v.lat, v.lng) for v in AIRPORT_ZONE.vertices],
            },
        ]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)