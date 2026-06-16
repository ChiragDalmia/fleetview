import type { Vehicle } from "../../types";

interface Props {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function VehicleList({ vehicles, selectedId, onSelect }: Props) {
  if (vehicles.length === 0) {
    return <p className="text-gray-600 text-xs text-center py-6 animate-pulse">Connecting to fleet...</p>;
  }

  return (
    <div className="space-y-1.5">
      {vehicles.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          className={`
            w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200
            ${v.id === selectedId
              ? "bg-blue-900/40 border-blue-500 shadow-md shadow-blue-900/30"
              : "bg-gray-800/60 border-gray-700 hover:border-gray-500 hover:bg-gray-800"
            }
          `}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-white">{v.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              v.status === "moving" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}>
              {v.status}
            </span>
          </div>
          <p className="text-gray-500 text-[10px] mt-1 font-mono">
            {v.speed} km/h &nbsp;·&nbsp; {v.lat.toFixed(3)}, {v.lng.toFixed(3)}
          </p>
        </button>
      ))}
    </div>
  );
}
