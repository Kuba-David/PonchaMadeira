// Reverse geocoding via Mapbox – přemění souřadnice na název místa a adresu

export type GeocodeResult = {
  placeName: string;
  address: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  if (!TOKEN) return { placeName: "", address: "" };

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${TOKEN}&language=cs&types=poi,address&limit=5`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { placeName: "", address: "" };

    const data = await res.json();
    const features: Array<{
      text?: string;
      place_name?: string;
      place_type?: string[];
    }> = data.features ?? [];

    const poi = features.find((f) => f.place_type?.includes("poi"));
    const addr = features.find((f) => f.place_type?.includes("address"));

    // Název podniku – z POI, pokud nějaký poblíž je
    const placeName = poi?.text ?? "";

    // Adresa – ideálně samostatný address feature, jinak celý popis POI.
    // Odřízneme koncovou ", Portugalsko" pro přehlednost.
    const raw =
      addr?.place_name ?? poi?.place_name ?? features[0]?.place_name ?? "";
    const address = raw.replace(/,\s*Portugalsko\s*$/i, "").trim();

    return { placeName, address };
  } catch {
    return { placeName: "", address: "" };
  }
}
