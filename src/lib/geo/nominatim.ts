import "server-only";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

let lastCall = 0;

export async function geocode(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  // Politeness: 1 req/sec global throttle (Nominatim policy)
  const wait = Math.max(0, lastCall + 1100 - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();

  const url = `${ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Wholesail/1.0 (deeppatell20005@yahoo.com)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as NominatimResult[];
  if (!json.length) return null;
  const lat = parseFloat(json[0].lat);
  const lon = parseFloat(json[0].lon);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  return { lat, lon };
}
