import type { Alert } from "../../types";

interface Props {
  alerts: Alert[];
  selectedId?: string | null;
}

const STRIPE: Record<Alert["type"], string> = {
  SPEEDING:        "var(--danger)",
  GEOFENCE_BREACH: "var(--warning)",
  HARSH_BRAKING:   "#f97316",
};

const LABEL: Record<Alert["type"], string> = {
  SPEEDING:        "⚡ Overspeed",
  GEOFENCE_BREACH: "⚠ Geofence Breach",
  HARSH_BRAKING:   "🔴 Hard Brake",
};

const TEXT_COLOR: Record<Alert["type"], string> = {
  SPEEDING:        "var(--danger)",
  GEOFENCE_BREACH: "var(--warning)",
  HARSH_BRAKING:   "#f97316",
};

export function AlertLog({ alerts, selectedId }: Props) {
  const visible = selectedId
    ? alerts.filter((a) => a.vehicle_id === selectedId)
    : alerts;

  if (visible.length === 0) {
    return (
      <p className="text-[10px] text-center py-3" style={{ color: "var(--text-muted)" }}>
        ✓ No active alerts
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {visible.map((a) => (
        <div
          key={a.id}
          className="rounded-xl px-3 py-2.5 relative overflow-hidden"
          style={{ background: "var(--bg-card)" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: STRIPE[a.type] }}
          />
          <div className="pl-2 flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold" style={{ color: TEXT_COLOR[a.type] }}>
                {LABEL[a.type]}
              </span>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {a.vehicle_id}
              </p>
            </div>
            <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
              {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
