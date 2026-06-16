import type { Alert } from "../../types";

const STYLE: Record<Alert["type"], string> = {
  SPEEDING:        "border-red-700/60    bg-red-900/20    text-red-400",
  GEOFENCE_BREACH: "border-orange-700/60 bg-orange-900/20 text-orange-400",
  HARSH_BRAKING:   "border-yellow-700/60 bg-yellow-900/20 text-yellow-400",
};

const LABEL: Record<Alert["type"], string> = {
  SPEEDING:        "⚡ Speeding",
  GEOFENCE_BREACH: "⚠ Geofence",
  HARSH_BRAKING:   "🔴 Hard Brake",
};

export function AlertLog({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p className="text-gray-600 text-xs text-center py-3">No alerts</p>;
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((a) => (
        <div key={a.id} className={`rounded border px-2.5 py-2 text-xs ${STYLE[a.type]}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold">{LABEL[a.type]}</span>
            <span className="text-gray-500 text-[10px]">{new Date(a.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-gray-400 font-mono text-[10px] mt-0.5">{a.vehicle_id}</p>
        </div>
      ))}
    </div>
  );
}
