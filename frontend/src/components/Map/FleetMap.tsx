import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Vehicle, Geofence } from "../../types";

interface Props {
  vehicles: Vehicle[];
  geofence: Geofence | null;
  mapStyle: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FleetMap({ vehicles, geofence, mapStyle, selectedId, onSelect }: Props) {
  const geofenceGeoJSON = geofence
    ? {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [geofence.min_lng, geofence.min_lat],
            [geofence.max_lng, geofence.min_lat],
            [geofence.max_lng, geofence.max_lat],
            [geofence.min_lng, geofence.max_lat],
            [geofence.min_lng, geofence.min_lat],
          ]],
        },
        properties: {},
      }
    : null;

  return (
    <Map
      initialViewState={{ longitude: -79.41, latitude: 43.67, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
    >
      {geofenceGeoJSON && (
        <Source id="geofence" type="geojson" data={geofenceGeoJSON}>
          <Layer id="geofence-fill" type="fill" paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.08 }} />
          <Layer id="geofence-line" type="line" paint={{ "line-color": "#3b82f6", "line-width": 1.5, "line-dasharray": [2, 2] }} />
        </Source>
      )}

      {vehicles.map((v) => {
        const dotColor =
          v.id === selectedId ? "scale-150 bg-blue-500"
          : v.status === "moving" ? "bg-emerald-400"
          : "bg-amber-400";

        return (
          <Marker key={v.id} longitude={v.lng} latitude={v.lat} anchor="center" onClick={() => onSelect(v.id)}>
            <div
              title={`${v.id} — ${v.speed} km/h`}
              className={`w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-500 ${dotColor}`}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
