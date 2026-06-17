import type { Vehicle } from "../../types";

interface Props {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function VehicleList({ vehicles, selectedId, onSelect }: Props) {
  if (vehicles.length === 0) {
    return (
      <p className="text-xs text-center py-6 animate-pulse" style={{ color: "var(--text-muted)" }}>
        Connecting to fleet...
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {vehicles.map((v) => {
        const isSelected = v.id === selectedId;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="w-full text-left px-3 py-3 rounded-xl"
            style={
              isSelected
                ? {
                    background: "rgba(27,110,243,0.12)",
                    borderLeft: "3px solid var(--accent)",
                    boxShadow: "0 4px 16px rgba(27,110,243,.1)",
                  }
                : {
                    background: "var(--bg-card)",
                    borderLeft: "3px solid transparent",
                  }
            }
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {v.id}
                </span>
                <div className="mt-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={
                      v.status === "moving"
                        ? { background: "rgba(34,197,94,.15)", color: "var(--success)" }
                        : { background: "rgba(245,158,11,.15)", color: "var(--warning)" }
                    }
                  >
                    {v.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black leading-none" style={{ color: "var(--text-primary)" }}>
                  {v.speed}
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  km/h
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
