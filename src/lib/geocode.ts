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

// Reverse geocoding pro adresu (ulice + město)
async function fetchAddress(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${TOKEN}&language=cs&types=address,place&limit=3`;

  const res = await fetch(url);
  if (!res.ok) return "";

  const data = await res.json();
  const features: Array<{ place_name?: string; place_type?: string[] }> =
    data.features ?? [];

  const addr = features.find((f) => f.place_type?.includes("address"));
  const raw = addr?.place_name ?? features[0]?.place_name ?? "";

  return raw.replace(/,\s*Portug[a-z]+\s*$/i, "").trim();
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
