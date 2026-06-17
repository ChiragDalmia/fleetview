from typing import List, Tuple
from dataclasses import dataclass
import math

@dataclass
class Point:
    """A lat/lng coordinate."""
    lat: float
    lng: float

    def __hash__(self):
        return hash((round(self.lat, 6), round(self.lng, 6)))

    def __eq__(self, other):
        return (
            abs(self.lat - other.lat) < 1e-6
            and abs(self.lng - other.lng) < 1e-6
        )


@dataclass
class Polygon:
    """A closed polygon defined by vertices in lat/lng order."""
    vertices: List[Point]
    name: str = "Zone"

    def __post_init__(self):
        if len(self.vertices) < 3:
            raise ValueError("Polygon must have at least 3 vertices")
        # Ensure polygon is closed
        if self.vertices[0] != self.vertices[-1]:
            self.vertices.append(self.vertices[0])


class RayCastingEngine:
    """
    Ray-casting algorithm for point-in-polygon containment.
    
    Fires a ray from the point to infinity (east/right in lng direction).
    Count intersections with polygon edges:
    - Odd count = inside
    - Even count = outside
    
    Handles edge cases:
    - Points exactly on vertices or edges → boundary condition (handled via epsilon)
    """

    EPSILON = 1e-9  # Tolerance for floating-point comparisons

    @staticmethod
    def is_point_in_polygon(point: Point, polygon: Polygon) -> bool:
        """
        Determine if a point is inside a polygon using ray-casting.
        
        Args:
            point: The point to test (lat, lng)
            polygon: The polygon to test against
        
        Returns:
            True if point is inside or on the boundary, False otherwise
        """
        vertices = polygon.vertices
        n = len(vertices) - 1  # Exclude the closing duplicate vertex

        # Cast a ray to the right (increasing lng)
        intersection_count = 0

        for i in range(n):
            v1 = vertices[i]
            v2 = vertices[i + 1]

            # Skip horizontal edges (they never cross a horizontal ray)
            if abs(v1.lat - v2.lat) < RayCastingEngine.EPSILON:
                continue

            # Check if the ray crosses this edge
            # Ray is at point.lat, going to the right (increasing lng)
            
            # Ensure v1 is the lower point
            if v1.lat > v2.lat:
                v1, v2 = v2, v1

            # Check if the ray's latitude is between the edge's endpoints
            if point.lat < v1.lat or point.lat > v2.lat:
                continue

            # Compute the lng coordinate where the edge crosses the ray
            # Line equation: lng = v1.lng + (point.lat - v1.lat) * (v2.lng - v1.lng) / (v2.lat - v1.lat)
            x_intersect = v1.lng + (point.lat - v1.lat) * (v2.lng - v1.lng) / (v2.lat - v1.lat)

            # If the intersection is to the right of the point, count it
            if point.lng < x_intersect:
                intersection_count += 1

        return intersection_count % 2 == 1


@dataclass
class Crossing:
    """Represents a geofence boundary crossing event."""
    vehicle_id: str
    boundary_name: str
    direction: str  # "in" or "out"
    timestamp: str
    lat: float
    lng: float


class GeofenceTracker:
    """
    Tracks vehicle positions and detects geofence crossings.

    A crossing fires only when a vehicle's inside/outside state for a zone
    changes, so staying inside (or outside) never re-fires the same alert.
    """

    def __init__(self, geofences: List[Polygon]):
        self.geofences = {g.name: g for g in geofences}
        self.vehicle_states: dict = {}  # vehicle_id -> {zone_name: was_inside}

    def update(
        self,
        vehicle_id: str,
        lat: float,
        lng: float,
        timestamp: str,
    ) -> List[Crossing]:
        """
        Update vehicle position and detect any boundary crossings.
        
        Args:
            vehicle_id: Vehicle identifier
            lat, lng: Current position
            timestamp: ISO timestamp
        
        Returns:
            List of new Crossing events (empty if no new crossings)
        """
        if vehicle_id not in self.vehicle_states:
            self.vehicle_states[vehicle_id] = {zone: False for zone in self.geofences}

        current_point = Point(lat=lat, lng=lng)
        crossings = []

        for zone_name, polygon in self.geofences.items():
            was_inside = self.vehicle_states[vehicle_id][zone_name]
            is_inside = RayCastingEngine.is_point_in_polygon(current_point, polygon)

            # Detect a state change (crossing)
            if is_inside != was_inside:
                crossings.append(Crossing(
                    vehicle_id=vehicle_id,
                    boundary_name=zone_name,
                    direction="in" if is_inside else "out",
                    timestamp=timestamp,
                    lat=lat,
                    lng=lng,
                ))
                self.vehicle_states[vehicle_id][zone_name] = is_inside

        return crossings