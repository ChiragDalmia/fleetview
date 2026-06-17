import type { Vehicle } from "../../types";

type Accent = "blue" | "green" | "amber" | "purple";

const ACCENT_BORDER: Record<Accent, string> = {
  blue:   "#1B6EF3",
  green:  "#22c55e",
  amber:  "#f59e0b",
  purple: "#a855f7",
};

function MetricCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: Accent;
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "var(--bg-card)",
        borderTop: `2px solid ${ACCENT_BORDER[accent]}`,
      }}
    >
      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-3xl font-black leading-none" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {unit && (
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {unit}
        </p>
      )}
    </div>
  );
}

export function TelemetryCards({ vehicle }: { vehicle: Vehicle }) {
  const [prefix, suffix] = vehicle.id.split("-");
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      <MetricCard label="Speed"  value={String(vehicle.speed)} unit="km/h"  accent="blue" />
      <MetricCard label="Status" value={vehicle.status === "moving" ? "ON" : "IDLE"} unit={vehicle.status} accent={vehicle.status === "moving" ? "green" : "amber"} />
      <MetricCard label="Unit"   value={prefix}  unit={suffix}  accent="purple" />
    </div>
  );
}
