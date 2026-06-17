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

  function onMapLoad(evt: { target: { setPaintProperty: (layer: string, prop: string, value: unknown) => void } }) {
    const map = evt.target;
    // Parks are pure black (#0e0e0e) in dark-matter — lift them to a visible dark green
    map.setPaintProperty("park_national_park", "fill-color", "#162b1f");
    map.setPaintProperty("park_nature_reserve", "fill-color", "#162b1f");
    map.setPaintProperty("landuse",             "fill-color", "#162b1f");
    // Buildings: roof is dark gray (#393939), nudge to a blue-navy so they read against the map
    map.setPaintProperty("building-top", "fill-color", "#21293d");
    map.setPaintProperty("building-top", "fill-outline-color", "#19202e");
  }

  return (
    <Map
      initialViewState={{ longitude: -79.41, latitude: 43.67, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      onLoad={onMapLoad}
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
      {vehicles.map((v) => {
        const isSelected = v.id === selectedId;
        const isMoving = v.status === "moving";
        const dotColor = isSelected ? "#1B6EF3" : isMoving ? "#22c55e" : "#f59e0b";
        const glowColor = isSelected
          ? "rgba(27,110,243,.65)"
          : isMoving
          ? "rgba(34,197,94,.55)"
          : "rgba(245,158,11,.45)";
        const dotSize = isSelected ? 18 : 14;

        return (
          <Marker
            key={v.id}
            longitude={v.lng}
            latitude={v.lat}
            anchor="center"
            onClick={() => onSelect(v.id)}
          >
            <div
              title={`${v.id} — ${v.speed} km/h`}
              style={{ position: "relative", cursor: "pointer", width: dotSize, height: dotSize, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {/* Animated pulse ring */}
              {(isMoving || isSelected) && (
                <div
                  style={{
                    position: "absolute",
                    inset: -7,
                    borderRadius: "50%",
                    border: `2px solid ${dotColor}`,
                    animation: "pulse-ring 1.8s ease-out infinite",
                    pointerEvents: "none",
                  }}
                />
              )}
              {/* Main dot */}
              <div
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: dotColor,
                  border: "2.5px solid rgba(255,255,255,0.9)",
                  boxShadow: `0 0 ${isSelected ? 18 : 10}px ${glowColor}, 0 2px 6px rgba(0,0,0,.6)`,
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
