import os
from typing import Dict, List, Optional

import httpx

# ── Config ───────────────────────────────────────────────
# TTC live vehicle locations via the umoiq (NextBus) public feed.
# No API key required. Returns ~1400 real vehicles across the network.
FEED_URL = os.getenv(
    "TRANSIT_FEED_URL",
    "https://retro.umoiq.com/service/publicJSONFeed",
)
AGENCY = os.getenv("TRANSIT_AGENCY", "ttc")

# Routes that pass through the downtown geofence zones, so crossings fire
# naturally. Comma-separated route tags; empty string means "all routes".
_routes_env = os.getenv("TRANSIT_ROUTES", "504,501,510,505,506")
ROUTE_FILTER = {r.strip() for r in _routes_env.split(",") if r.strip()}

MAX_VEHICLES = int(os.getenv("MAX_VEHICLES", "12"))

# A vehicle whose last report is older than this is treated as offline.
STALE_SECONDS = int(os.getenv("STALE_SECONDS", "120"))

# Placeholder dashcam streams, assigned round-robin. Real TTC buses don't
# expose public camera feeds, so these stand in for the in-cab view.
STREAMS = [
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    "https://test-streams.mux.dev/pts_shift/master.m3u8",
    "https://test-streams.mux.dev/test_001/stream.m3u8",
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
]


def _status(speed: int, secs_since_report: int) -> str:
    """Derive a vehicle status from speed and report freshness."""
    if secs_since_report > STALE_SECONDS:
        return "offline"
    return "moving" if speed > 0 else "idle"


class TransitFeed:
    """Polls a live transit agency feed and normalizes it to FleetView vehicles.

    Output shape matches the original CSV loader exactly so the rest of the
    app (geofence tracker, WebSocket broadcast, frontend) is unchanged:
        {id, lat, lng, speed, status, stream}
    """

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=20.0)
        # Stable stream assignment per vehicle id, so a bus keeps its "camera"
        # across polls instead of flickering between streams.
        self._stream_for: Dict[str, str] = {}

    async def fetch(self) -> Optional[List[dict]]:
        """Fetch and normalize current vehicle positions.

        Returns a list of vehicle dicts, or None if the feed was unreachable
        (so callers can keep the last known state instead of going blank).
        """
        params = {"command": "vehicleLocations", "a": AGENCY, "t": "0"}
        try:
            resp = await self._client.get(FEED_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return None

        raw = data.get("vehicle", [])
        if isinstance(raw, dict):  # feed returns a bare object when count == 1
            raw = [raw]

        vehicles: List[dict] = []
        for v in raw:
            if v.get("predictable") != "true":
                continue

            route = v.get("routeTag", "")
            if ROUTE_FILTER and route not in ROUTE_FILTER:
                continue

            try:
                lat = float(v["lat"])
                lng = float(v["lon"])
                speed = int(float(v.get("speedKmHr", 0)))
                secs = int(float(v.get("secsSinceReport", 0)))
            except (KeyError, ValueError, TypeError):
                continue

            run = v.get("id", "?")
            label = f"{route}-{run}" if route else run

            vehicles.append({
                "id": label,
                "lat": lat,
                "lng": lng,
                "speed": speed,
                "status": _status(speed, secs),
                "stream": self._stream_for_vehicle(label),
            })

        # Keep a stable, bounded subset so the dashboard stays readable.
        vehicles.sort(key=lambda x: x["id"])
        return vehicles[:MAX_VEHICLES]

    def _stream_for_vehicle(self, vehicle_id: str) -> str:
        if vehicle_id not in self._stream_for:
            self._stream_for[vehicle_id] = STREAMS[
                len(self._stream_for) % len(STREAMS)
            ]
        return self._stream_for[vehicle_id]

    async def close(self):
        await self._client.aclose()
