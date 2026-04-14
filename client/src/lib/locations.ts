/**
 * Labyrinth BJJ — Franchise Location Config
 *
 * Each location has its own GAS deployment URL (points to its own
 * Google Sheet). The app stores the selected location in localStorage
 * so it persists across sessions and app restarts.
 *
 * To add a new location:
 *   1. Deploy the GAS backend for that location (see franchise_setup_guide.md)
 *   2. Add an entry here with the deployment URL
 *   3. Rebuild and push
 */

export interface Location {
  id: string;
  name: string;
  short: string;
  city: string;
  state: string;
  color: string;          // accent color used in the UI
  gasUrl: string;         // GAS web app deployment URL
  status: "active" | "coming-soon";
}

export const LOCATIONS: Location[] = [
  {
    id:     "fulshear",
    name:   "Labyrinth BJJ Fulshear",
    short:  "Fulshear",
    city:   "Fulshear",
    state:  "TX",
    color:  "#C8A24C",
    gasUrl: "https://script.google.com/macros/s/AKfycbzRTADVL6-N5M6WQBySa0Gh53DEtMOlceaHyoOx9HfKIKOSEznNdcb5BWXlTFcbztLw/exec",
    status: "active",
  },
  {
    id:     "foundations",
    name:   "Labyrinth BJJ Foundations",
    short:  "Foundations",
    city:   "Richmond",   // update when confirmed
    state:  "TX",
    color:  "#10B981",
    gasUrl: "",            // ← paste Foundations GAS deployment URL here
    status: "coming-soon",
  },
  {
    id:     "katy",
    name:   "Labyrinth BJJ Katy",
    short:  "Katy",
    city:   "Katy",
    state:  "TX",
    color:  "#3B82F6",
    gasUrl: "",
    status: "coming-soon",
  },
  {
    id:     "wharton",
    name:   "Labyrinth BJJ Wharton",
    short:  "Wharton",
    city:   "Wharton",
    state:  "TX",
    color:  "#8B5CF6",
    gasUrl: "",
    status: "coming-soon",
  },
];

// Only show active locations in the picker that have a deployed URL
export const ACTIVE_LOCATIONS = LOCATIONS.filter(l => l.status === "active" && l.gasUrl);

export const DEFAULT_LOCATION_ID = "fulshear";
const STORAGE_KEY = "lbjj_location_id";

export function getSavedLocationId(): string {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCATION_ID; }
  catch { return DEFAULT_LOCATION_ID; }
}

export function saveLocationId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id); }
  catch { /* storage unavailable */ }
}

export function getLocationById(id: string): Location {
  return LOCATIONS.find(l => l.id === id) || LOCATIONS[0];
}

export function getActiveGasUrl(locationId: string): string {
  const loc = getLocationById(locationId);
  // Fall back to Fulshear if location isn't deployed yet
  return loc.gasUrl || LOCATIONS[0].gasUrl;
}
