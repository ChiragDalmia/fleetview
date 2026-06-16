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
  const { vehicles, alerts, geofence, connected } = useFleetSocket();
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
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {showTutorial && <Tutorial onDone={finishTutorial} />}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={setSettings}
        />
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-black">
            FV
          </div>
          <h1 className="font-bold text-base tracking-tight">FleetView</h1>
          <span className="text-gray-600 text-sm hidden sm:block">Fleet Camera Monitor</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            title="Tutorial"
            className="text-gray-500 hover:text-white text-sm w-7 h-7 rounded-md border border-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center"
          >
            ?
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="text-gray-500 hover:text-white w-7 h-7 rounded-md border border-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center"
          >
            ⚙
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {connected ? "Live" : "Reconnecting..."}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden shrink-0">
          <div className="p-2.5 border-b border-gray-800">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Vehicles ({vehicles.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5">
            <VehicleList vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="border-t border-gray-800 p-2.5 max-h-56 overflow-hidden flex flex-col">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Alerts
            </p>
            <div className="overflow-y-auto">
              <AlertLog alerts={alerts} />
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative min-w-0">
          <FleetMap
            vehicles={vehicles}
            geofence={geofence}
            mapStyle={mapStyleFor(settings)}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {!selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-400 pointer-events-none">
              Click a vehicle dot to view its camera feed →
            </div>
          )}
        </main>

        {/* Right Panel — shown only when a vehicle is selected */}
        {selected && (
          <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
            <div className="p-2.5 border-b border-gray-800 flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Camera Feed
              </p>
              <button
                onClick={() => setSelectedId(null)}
                className="text-gray-500 hover:text-white text-lg leading-none transition-colors"
                title="Close panel"
              >
                ×
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1">
              <VideoPlayer streamUrl={selected.stream} vehicleId={selected.id} />
              <TelemetryCards vehicle={selected} />
              <div className="mt-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Location</p>
                <p className="text-xs font-mono text-gray-300">
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Toronto GTA Area</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
