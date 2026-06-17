import csv
from datetime import datetime, timezone
from typing import Dict, List

class FleetDataLoader:
    """Loads fleet data from CSV and simulates playback with jitter + gaps."""

    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.readings: List[Dict] = []
        self.current_index: Dict[str, int] = {}
        self.load_csv()

    def load_csv(self):
        """Parse the CSV and organize readings by vehicle."""
        with open(self.csv_path, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.readings.append({
                    "vehicle_id": row["vehicle_id"],
                    "timestamp": datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")),
                    "lat": float(row["lat"]),
                    "lng": float(row["lng"]),
                    "speed_kmh": int(row["speed_kmh"]),
                    "status": row["status"],
                    "stream": row["dashcam_stream_url"],
                })
        
        # Sort by timestamp to ensure chronological order
        self.readings.sort(key=lambda r: r["timestamp"])

        # Initialize position in the reading list for each vehicle
        for vehicle_id in set(r["vehicle_id"] for r in self.readings):
            self.current_index[vehicle_id] = 0

    def get_vehicle_state(self, vehicle_id: str) -> dict:
        """Get the current reading for a vehicle, advancing the index."""
        if vehicle_id not in self.current_index:
            return None
        
        idx = self.current_index[vehicle_id]
        
        # Find the next reading for this vehicle
        while idx < len(self.readings):
            reading = self.readings[idx]
            if reading["vehicle_id"] == vehicle_id:
                self.current_index[vehicle_id] = idx + 1
                return {
                    "id": reading["vehicle_id"],
                    "lat": reading["lat"],
                    "lng": reading["lng"],
                    "speed": reading["speed_kmh"],
                    "status": reading["status"],
                    "stream": reading["stream"],
                    "timestamp": reading["timestamp"],
                }
            idx += 1
        
        # If we've exhausted readings, loop back to the start for this vehicle
        self.current_index[vehicle_id] = 0
        return self.get_vehicle_state(vehicle_id)

    def get_all_vehicles(self) -> List[str]:
        """Return list of unique vehicle IDs in the dataset."""
        return sorted(set(r["vehicle_id"] for r in self.readings))