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
        className="px-5 py-0 flex items-center justify-between shrink-0"
        style={{
          background: "var(--bg-panel)",
          borderBottom: "1px solid var(--border)",
          height: "52px",
        }}
      >
        {/* Left: Logo + title */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black select-none"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)",
              boxShadow: "0 0 18px rgba(27,110,243,.4)",
              letterSpacing: "0.05em",
            }}
          >
            FV
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
              FleetView
            </h1>
            <span className="text-[10px] hidden sm:block" style={{ color: "var(--text-muted)" }}>
              Fleet Camera Monitor
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* GitHub link */}
          <a
            href="https://github.com/ChiragDalmia/fleetview/"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--text-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
            </svg>
          </a>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

          {/* Tutorial */}
          <button
            onClick={() => setShowTutorial(true)}
            title="Tutorial"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--text-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            ?
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--text-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

          {/* Connection status */}
          <div
            className="flex items-center gap-2 text-xs px-3 h-8 rounded-lg"
            style={{
              color: connected ? "var(--success)" : "var(--danger)",
              background: connected ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
              border: `1px solid ${connected ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? "animate-pulse" : ""}`}
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
