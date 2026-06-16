export interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  status: "moving" | "idle" | "offline";
  stream: string;
}

export interface Alert {
  id: number;
  vehicle_id: string;
  type: "SPEEDING" | "GEOFENCE_BREACH" | "HARSH_BRAKING";
  timestamp: string;
}

export interface Geofence {
  name: string;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

export interface TelemetryMessage {
  type: "TELEMETRY";
  vehicles: Vehicle[];
  alerts: Alert[];
  geofence: Geofence;
  timestamp: string;
}
