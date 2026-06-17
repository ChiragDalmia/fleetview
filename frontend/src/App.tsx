import { useState } from "react";
import { FleetMap } from "./components/Map/FleetMap";
import { VideoPlayer } from "./components/Video/VideoPlayer";
import { VehicleList } from "./components/Sidebar/VehicleList";
import { AlertLog } from "./components/Sidebar/AlertLog";
import { TelemetryCards } from "./components/Telemetry/TelemetryCards";
import { Tutorial } from "./components/Tutorial/Tutorial";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { useFleetSocket } from "./hooks/useFleetSocket";
import { loadSettings, mapStyleFor } from "./lib/settings";
import type { Settings } from "./lib/settings";

const ONBOARDED_KEY = "fleetview.onboarded";

export default function App() {
  const { vehicles, alerts, geofence, allGeofences, connected } = useFleetSocket();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) !== "1"
  );

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  function finishTutorial() {
    localStorage.setItem(ONBOARDED_KEY, "1");
    setShowTutorial(false);
  }

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {showTutorial && <Tutorial onDone={finishTutorial} />}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={setSettings}
        />
      )}

      {/* Header */}
      <header
        className="px-5 py-3 flex items-center justify-between shrink-0"
        style={{
          background: "var(--bg-panel)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 20px rgba(27,110,243,.35)",
            }}
          >
            FV
          </div>
          <h1 className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
            FleetView
          </h1>
          <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
            Fleet Camera Monitor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            title="Tutorial"
            className="text-xs w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ?
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ⚙
          </button>

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span
              className={`w-2 h-2 rounded-full ${connected ? "animate-pulse" : ""}`}
              style={{ background: connected ? "var(--success)" : "var(--danger)" }}
            />
            {connected ? "Live" : "Reconnecting..."}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="w-56 flex flex-col overflow-hidden shrink-0"
          style={{
            background: "var(--bg-panel)",
            boxShadow: "2px 0 12px rgba(0,0,0,.35)",
          }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Vehicles ({vehicles.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5">
            <VehicleList
              vehicles={vehicles}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <div className="p-2.5 max-h-56 overflow-hidden flex flex-col" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Alerts
            </p>
            <div className="overflow-y-auto">
              <AlertLog alerts={alerts} selectedId={selectedId} />
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative min-w-0">
          <FleetMap
            vehicles={vehicles}
            geofence={geofence}
            allGeofences={allGeofences}
            mapStyle={mapStyleFor(settings)}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {!selected && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-xs pointer-events-none"
              style={{
                background: "rgba(22,27,39,0.9)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                backdropFilter: "blur(8px)",
              }}
            >
              Click a vehicle dot to view its camera feed →
            </div>
          )}
        </main>

        {/* Right Panel — shown only when a vehicle is selected */}
        {selected && (
          <aside
            className="w-80 flex flex-col overflow-hidden shrink-0"
            style={{
              background: "var(--bg-panel)",
              boxShadow: "-2px 0 12px rgba(0,0,0,.35)",
            }}
          >
            <div
              className="px-3 py-2.5 flex items-center justify-between shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Camera Feed
              </p>
              <button
                onClick={() => setSelectedId(null)}
                className="text-lg leading-none"
                title="Close panel"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                ×
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              <VideoPlayer
                streamUrl={selected.stream}
                vehicleId={selected.id}
              />
              <TelemetryCards vehicle={selected} />

              {/* Location Card */}
              <div
                className="mt-3 rounded-2xl p-3"
                style={{ background: "var(--bg-card)" }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Location
                </p>
                <p className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Toronto GTA Area
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
