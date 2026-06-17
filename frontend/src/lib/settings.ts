const KEY = "fleetview.settings";

export interface Settings {
  maptilerKey: string;
}

const DEFAULTS: Settings = { maptilerKey: "" };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

// No key = free OpenFreeMap tiles. Key = premium MapTiler tiles.
export function mapStyleFor(s: Settings): string {
  return s.maptilerKey
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(s.maptilerKey)}`
    : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
}
