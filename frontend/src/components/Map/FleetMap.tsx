import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Vehicle, Geofence, GeofenceZone } from "../../types";

interface Props {
  vehicles: Vehicle[];
  geofence: Geofence | null;
  allGeofences: GeofenceZone[];
  mapStyle: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FleetMap({
  vehicles,
  geofence,
  allGeofences,
  mapStyle,
  selectedId,
  onSelect,
}: Props) {
  // Build GeoJSON from the primary geofence bounding box
  const primaryGeofenceData = geofence && {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [geofence.min_lng, geofence.min_lat],
          [geofence.max_lng, geofence.min_lat],
          [geofence.max_lng, geofence.max_lat],
          [geofence.min_lng, geofence.max_lat],
          [geofence.min_lng, geofence.min_lat],
        ],
      ],
    },
    properties: {},
  };

  // Build GeoJSON for each detailed polygon geofence
  const polygonGeofences = allGeofences.map((zone) => ({
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [zone.vertices.map(([lat, lng]) => [lng, lat])],
    },
    properties: { name: zone.name },
  }));

  return (
    <Map
      initialViewState={{ longitude: -79.41, latitude: 43.67, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
    >
      {/* Primary bounding-box geofence (for compatibility) */}
      {primaryGeofenceData && (
        <Source id="geofence" type="geojson" data={primaryGeofenceData}>
          <Layer
            id="geofence-fill"
            type="fill"
            paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.08 }}
          />
          <Layer
            id="geofence-line"
            type="line"
            paint={{
              "line-color": "#3b82f6",
              "line-width": 1.5,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      )}

      {/* Detailed polygon geofences */}
      {polygonGeofences.map((feature, i) => (
        <Source
          key={`zone-${i}`}
          id={`zone-${i}`}
          type="geojson"
          data={feature}
        >
          <Layer
            id={`zone-fill-${i}`}
            type="fill"
            paint={{ "fill-color": "#8b5cf6", "fill-opacity": 0.12 }}
          />
          <Layer
            id={`zone-line-${i}`}
            type="line"
            paint={{
              "line-color": "#8b5cf6",
              "line-width": 2,
              "line-dasharray": [3, 3],
            }}
          />
        </Source>
      ))}

      {/* Vehicle markers */}
      {vehicles.map((v) => (
        <Marker
          key={v.id}
          longitude={v.lng}
          latitude={v.lat}
          anchor="center"
          onClick={() => onSelect(v.id)}
        >
          <div
            title={`${v.id} — ${v.speed} km/h`}
            style={{ cursor: "pointer" }}
          >
            <div
              className={`
                w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-500
                ${v.id === selectedId ? "scale-150 bg-blue-500" : ""}
                ${v.id !== selectedId && v.status === "moving" ? "bg-emerald-400" : ""}
                ${v.id !== selectedId && v.status === "idle" ? "bg-amber-400" : ""}
              `}
            />
          </div>
        </Marker>
      ))}
    </Map>
  );
}
