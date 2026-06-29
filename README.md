# FleetView

A real-time fleet monitoring dashboard built with React, FastAPI, and MapLibre GL. It pulls live vehicle positions from the TTC (Toronto Transit Commission) via the public umoiq/NextBus feed, runs geofence and speed detection on the backend, and streams everything to connected browsers over WebSocket.

> *Curious how this started? [Read the backstory on LinkedIn](https://www.linkedin.com/posts/chiragdalmia007_today-i-got-curious-about-how-companies-like-ugcPost-7473171257904259072-kjkb/).*

![FleetView dark dashboard showing vehicle map, camera feed, and alert log]

---

## What it does

The left sidebar lists all tracked vehicles with their current speed and status (moving / idle / offline). Click any vehicle dot on the map and a right panel slides open with a live HLS camera stream, telemetry cards (speed, status, unit ID), and coordinates. The alert log at the bottom of the sidebar shows speeding events and geofence crossings as they happen — filtered to the selected vehicle if one is active.

Two geofence zones are defined out of the box: **Downtown Core** (roughly King to Bloor, Spadina to Bay) and **Pearson Airport**. The backend uses a ray-casting point-in-polygon algorithm to detect when a vehicle enters or exits either zone and fires an alert exactly once on crossing — not continuously while inside.

The feed is capped to 12 vehicles across routes 501, 504, 505, 506, and 510. Those are the streetcar routes that naturally pass through the downtown zone, so geofence events actually fire rather than being theoretical.

---

## Tech stack

**Frontend**
- React 19 with the experimental React Compiler (automatic memoization)
- TypeScript 6 — strict mode, no unused locals/params
- MapLibre GL via `react-map-gl` for the interactive vehicle map
- HLS.js for adaptive bitrate video playback, with native HLS fallback for Safari
- Tailwind CSS 4 + CSS custom properties for the dark theme
- Vite 8 for local dev and production builds

**Backend**
- FastAPI + Uvicorn (async)
- WebSocket for push telemetry every 10 seconds
- httpx for fetching the live transit feed
- No database — vehicle state lives in a Python dict, alerts are capped at 50 entries in memory

Map tiles default to OpenFreeMap (free, no key required). You can switch to MapTiler premium tiles by dropping your key into the Settings modal in the app.

---

## Getting started

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be at `http://localhost:8000`. Hit `/health` to confirm it's running and how many vehicles it's currently tracking.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dashboard connects to the WebSocket automatically. If the backend isn't running yet you'll see "Reconnecting..." in the header — it retries every 3 seconds.

---

## Configuration

Everything is driven by environment variables on the backend. You can set them in your shell or a `.env` file next to `main.py`.

| Variable | Default | What it does |
|---|---|---|
| `TICK_SECONDS` | `10` | How often to poll the transit feed and push to clients |
| `SPEEDING_THRESHOLD_KMH` | `50` | Speed above which a SPEEDING alert fires |
| `MAX_VEHICLES` | `12` | Hard cap on how many vehicles appear on the map |
| `TRANSIT_ROUTES` | `504,501,510,505,506` | Comma-separated route tags to track; empty string means all routes |
| `STALE_SECONDS` | `120` | Seconds since last feed report before a vehicle is marked offline |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allow-list for the frontend |

Frontend picks up two variables from `frontend/.env`:

```
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

---

## Project structure

```
fleetview/
├── backend/
│   ├── main.py           # FastAPI app, WebSocket endpoint, alert logic, geofence zones
│   ├── transit_feed.py   # Polls umoiq, normalizes TTC vehicle data, assigns HLS streams
│   ├── geofence.py       # Ray-casting polygon tracker, fires on enter/exit only
│   ├── data_loader.py    # Legacy CSV loader (unused, kept for reference)
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.tsx                        # Root layout: header, left sidebar, map, right panel
        ├── hooks/
        │   └── useFleetSocket.ts          # WebSocket client with 3s auto-reconnect
        ├── lib/
        │   └── settings.ts                # LocalStorage settings, map style selector
        ├── types/
        │   └── index.ts                   # Vehicle, Alert, Geofence TypeScript interfaces
        └── components/
            ├── Map/FleetMap.tsx           # MapLibre map, vehicle markers, geofence overlays
            ├── Sidebar/VehicleList.tsx    # Scrollable vehicle list with status badges
            ├── Sidebar/AlertLog.tsx       # Alert timeline, filtered by selected vehicle
            ├── Video/VideoPlayer.tsx      # HLS player with LIVE badge and vehicle label
            ├── Telemetry/TelemetryCards.tsx  # Speed / status / unit ID metric grid
            ├── Tutorial/Tutorial.tsx      # 5-step onboarding carousel (dismisses to localStorage)
            └── Settings/SettingsModal.tsx # MapTiler key input
```

---

## A few things worth knowing

**The camera feeds are placeholders.** Real TTC buses don't expose public dashcam streams. The app assigns HLS test streams from Mux and Bitdash in a round-robin so each vehicle gets a stable "camera" across page refreshes. Swapping in real RTSP/HLS sources is straightforward — the `stream` field in the feed output is just a URL.

**The transit feed doesn't need an API key.** The umoiq endpoint (`retro.umoiq.com`) is a public feed used by various transit apps. It returns up to ~1,400 real TTC vehicle positions. We intentionally limit to a handful of streetcar routes so the geofence events fire naturally as those routes cross downtown.

**Geofence crossing fires once.** The `GeofenceTracker` in `geofence.py` keeps the last known inside/outside state per vehicle. It only emits an alert when that state changes, so a vehicle sitting inside a zone doesn't spam the alert log.

**Map tiles.** The default map uses OpenFreeMap's dark vector tiles — no account needed. If you want higher-quality tiles or satellite imagery, get a free MapTiler key at maptiler.com and paste it into the Settings modal. The key is stored in `localStorage` and never sent to the backend.

**WebSocket client limit.** The backend caps simultaneous WebSocket connections at 50. Connections above that get a 1013 (try again later) close code. This is mainly a safeguard for accidental load.

---

## Running checks

```bash
# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend lint
cd frontend && npm run lint

# Backend (no test suite yet, but FastAPI docs auto-generate at /docs)
```
