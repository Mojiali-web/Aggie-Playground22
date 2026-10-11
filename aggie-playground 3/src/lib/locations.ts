// Public, joinable meeting spots on the UC Davis campus.
// Coordinates are approximate building/area centers (WGS84) — we only ever show these
// public spots, never a student's personal location.
export interface CampusLocation {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { key: "mu", name: "Memorial Union (MU)", lat: 38.54175, lng: -121.74935 },
  { key: "quad", name: "The Quad", lat: 38.54213, lng: -121.74935 },
  { key: "arc", name: "Activities & Recreation Center (ARC)", lat: 38.54300, lng: -121.75915 },
  { key: "shields", name: "Shields Library", lat: 38.53976, lng: -121.74928 },
  { key: "arboretum", name: "UC Davis Arboretum", lat: 38.53180, lng: -121.75080 },
  { key: "silo", name: "The Silo", lat: 38.53933, lng: -121.75550 },
  // Added for demo content. Coordinates: US Census geocoder (street addresses) and the
  // UC Davis Student Community Center page's map link (397 Hutchison Dr).
  { key: "scc", name: "Student Community Center", lat: 38.5393, lng: -121.7519 },
  { key: "downtown", name: "Downtown Davis (Central Park)", lat: 38.54419, lng: -121.74372 },
  { key: "mishkas", name: "Mishka's Cafe (2nd St)", lat: 38.54321, lng: -121.74089 },
  { key: "innout", name: "In-N-Out (Olive Dr)", lat: 38.54096, lng: -121.73822 },
];

export const CAMPUS_CENTER: [number, number] = [38.5395, -121.7525];

export const LOCATION_BY_KEY: Record<string, CampusLocation> = Object.fromEntries(
  CAMPUS_LOCATIONS.map((l) => [l.key, l]),
);
