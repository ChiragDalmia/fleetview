import { useState, useEffect, useRef } from "react";
import type { Vehicle, Alert, Geofence } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export function useFleetSocket() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "TELEMETRY") {
          setVehicles(data.vehicles);
          if (data.geofence) setGeofence(data.geofence);
          setAlerts((prev) => {
            const incoming = (data.alerts as Alert[]).filter(
              (a) => !prev.some((p) => p.id === a.id)
            );
            return [...incoming, ...prev].slice(0, 20);
          });
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closed) setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, []);

  return { vehicles, alerts, geofence, connected };
}
