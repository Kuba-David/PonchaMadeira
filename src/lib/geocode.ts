export type GeocodeResult = {
  placeName: string;
  address: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Tilequery API vrací přímo data z mapových vrstev – spolehlivější pro POI.
async function fetchNearbyPOIName(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json` +
    `?radius=80&limit=10&access_token=${TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return "";

  const data = await res.json();
  const features: Array<{
    properties?: {
      name?: string;
      tilequery?: { layer?: string };
    };
  }> = data.features ?? [];

  // poi_label vrstva = bary, restaurace, kavárny, obchody ...
  const poi = features.find(
    (f) =>
      f.properties?.tilequery?.layer === "poi_label" && f.properties?.name
  );

  return poi?.properties?.name ?? "";
}

// Reverse geocoding pro adresu (ulice + čtvrť + město)
async function fetchAddress(lat: number, lng: number): Promise<string> {
  // Bez omezení typů – necháme Mapbox vrátit vše a vybereme nejlepší výsledek.
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${TOKEN}&limit=6`;

  const res = await fetch(url);
  if (!res.ok) return "";

  const data = await res.json();
  const features: Array<{
    text?: string;
    place_name?: string;
    place_type?: string[];
  }> = data.features ?? [];

  const byType = (t: string) =>
    features.find((f) => f.place_type?.includes(t));

  // Od nejpřesnějšího po nejobecnější. POI použijeme taky – jeho place_name
  // obsahuje plnou adresu.
  const best =
    byType("address") ??
    byType("poi") ??
    byType("neighborhood") ??
    byType("locality") ??
    byType("place") ??
    features[0];

  if (!best?.place_name) return "";

  let raw = best.place_name;

  // U POI place_name začíná názvem podniku – ten odřízneme, ať zbyde adresa
  if (best.place_type?.includes("poi") && best.text) {
    const prefix = `${best.text}, `;
    if (raw.startsWith(prefix)) raw = raw.slice(prefix.length);
  }

  // Odstraníme PSČ, Madeiru a Portugalsko – zbyde ulice + město
  return raw
    .replace(/,\s*\d{4}-\d{3}/g, "")
    .replace(/,\s*Madeira\s*,\s*Portugal\s*$/i, "")
    .replace(/,\s*Portugal\s*$/i, "")
    .replace(/,\s*Madeira\s*$/i, "")
    .trim();
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  if (!TOKEN) return { placeName: "", address: "" };

  try {
    const [placeName, address] = await Promise.all([
      fetchNearbyPOIName(lat, lng),
      fetchAddress(lat, lng),
    ]);
    return { placeName, address };
  } catch {
    return { placeName: "", address: "" };
  }
}
