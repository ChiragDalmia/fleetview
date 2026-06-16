import type { Vehicle } from "../../types";

type Accent = "blue" | "green" | "yellow" | "purple";

const ACCENT_CLASS: Record<Accent, string> = {
  blue:   "bg-blue-950/50   border-blue-700/40   text-blue-300",
  green:  "bg-green-950/50  border-green-700/40  text-green-300",
  yellow: "bg-yellow-950/50 border-yellow-700/40 text-yellow-300",
  purple: "bg-purple-950/50 border-purple-700/40 text-purple-300",
};

function MetricCard({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: Accent }) {
  return (
    <div className={`rounded-lg border p-2.5 ${ACCENT_CLASS[accent]}`}>
      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="font-mono font-bold text-sm leading-none">{value}</p>
      {unit && <p className="text-gray-500 text-[10px] mt-0.5">{unit}</p>}
    </div>
  );
}

export function TelemetryCards({ vehicle }: { vehicle: Vehicle }) {
  const [prefix, suffix] = vehicle.id.split("-");
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      <MetricCard label="Speed"  value={String(vehicle.speed)} unit="km/h" accent="blue" />
      <MetricCard label="Status" value={vehicle.status.toUpperCase()} unit="" accent={vehicle.status === "moving" ? "green" : "yellow"} />
      <MetricCard label="ID"     value={prefix}  unit={suffix} accent="purple" />
    </div>
  );
}
