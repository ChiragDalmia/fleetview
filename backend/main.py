import asyncio
import os
from datetime import datetime, timezone
from typing import Set

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from data_loader import FleetDataLoader
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

TICK_SECONDS = 2
MAX_CLIENTS = 50

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

# Load fleet data from CSV
loader = FleetDataLoader("fleet_data.csv")
geofence_tracker = GeofenceTracker([DOWNTOWN_CORE, AIRPORT_ZONE])

vehicles = {}
for vehicle_id in loader.get_all_vehicles():
    state = loader.get_vehicle_state(vehicle_id)
    if state:
        vehicles[vehicle_id] = {
            "id": state["id"],
            "lat": state["lat"],
            "lng": state["lng"],
            "speed": state["speed"],
            "status": state["status"],
            "stream": state["stream"],
        }


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


def simulate_tick():
    """Advance all vehicles by one reading from the CSV."""
    for vehicle_id in list(vehicles.keys()):
        state = loader.get_vehicle_state(vehicle_id)
        if not state:
            continue

        vehicles[vehicle_id]["lat"] = state["lat"]
        vehicles[vehicle_id]["lng"] = state["lng"]
        vehicles[vehicle_id]["speed"] = state["speed"]
        vehicles[vehicle_id]["status"] = state["status"]

        # Check geofence crossings
        crossings = geofence_tracker.update(
            vehicle_id=vehicle_id,
            lat=state["lat"],
            lng=state["lng"],
            timestamp=state["timestamp"].isoformat(),
        )

        for crossing in crossings:
            add_alert(
                vehicle_id,
                f"GEOFENCE_{crossing.direction.upper()}",
                f"Crossed {crossing.boundary_name}: {crossing.direction}",
            )

        # Speed alert
        if state["speed"] > 90:
            add_alert(vehicle_id, "SPEEDING", f"{state['speed']} km/h")


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
    """Simulate tick and broadcast every TICK_SECONDS."""
    while True:
        simulate_tick()
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
    asyncio.create_task(telemetry_loop())


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