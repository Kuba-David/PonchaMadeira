export type GeocodeResult = {
  placeName: string;
  address: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Tilequery queries rendered map tiles directly – works even when a POI
// is not in Mapbox's search index.
async function fetchNearbyPOIName(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json` +
    `?radius=80&limit=10&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const poi = (data.features ?? []).find(
      (f: { properties?: { name?: string; tilequery?: { layer?: string } } }) =>
        f.properties?.tilequery?.layer === "poi_label" && f.properties?.name
    );
    return poi?.properties?.name ?? "";
  } catch {
    return "";
  }
}

type GeoFeature = {
  text?: string;
  place_name?: string;
  place_type?: string[];
};

// Vyčistí place_name: rozdělí podle čárek a odstraní zemi, kraj a PSČ.
function cleanAddress(placeName: string, poiText?: string): string {
  let raw = placeName;

  // Pokud řetězec začíná názvem podniku, odřízneme ho (ať se neduplikuje)
  if (poiText && raw.startsWith(poiText + ",")) {
    raw = raw.slice(poiText.length + 1);
  }

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (p) =>
        !/^portugal$/i.test(p) &&
        !/^madeira$/i.test(p) &&
        !/^\d{4}-\d{3}$/.test(p) // samostatné PSČ
    )
    // PSČ uvnitř segmentu ("9370-133 Calheta" → "Calheta")
    .map((p) => p.replace(/\b\d{4}-\d{3}\b/g, "").trim())
    .filter(Boolean)
    .join(", ");
}

async function fetchAddress(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const features: GeoFeature[] = (await res.json()).features ?? [];
    if (features.length === 0) return "";

    const byType = (t: string) =>
      features.find((f) => f.place_type?.includes(t));

    // Od nejpřesnějšího po nejobecnější. U POI použijeme jeho place_name,
    // jen z něj seškrtneme úvodní název podniku.
    const chosen =
      byType("address") ??
      byType("poi") ??
      byType("neighborhood") ??
      byType("locality") ??
      byType("place") ??
      features[0];

    if (!chosen.place_name) return "";

    const poiText = chosen.place_type?.includes("poi") ? chosen.text : undefined;
    return cleanAddress(chosen.place_name, poiText);
  } catch {
    return "";
  }
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
