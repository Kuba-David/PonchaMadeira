"use client";
import { useCallback, useEffect, useRef } from "react";
import Map, {
  Marker,
  GeolocateControl,
  type GeolocateControlInstance,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PonchaRating } from "@/lib/supabase";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Vlastní styl mapy z Mapbox Studio (lze přepsat přes env proměnnou)
const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE ||
  "mapbox://styles/kubadavid/cmqe0hsjo005n01qz0n6f1m6u";

// Madeira center – výchozí pohled, než zjistíme polohu uživatele
const INITIAL_VIEW = { longitude: -16.9, latitude: 32.75, zoom: 10 };

type Props = {
  ratings: PonchaRating[];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (r: PonchaRating) => void;
  selectedId?: string | null;
  focusedId?: string | null;
  focusNonce?: number;
};

function pinColor(r: number) {
  if (r >= 8) return "#4a7c59";
  if (r >= 5) return "#e8824a";
  return "#c0392b";
}

export function PonchaMap({
  ratings,
  onMapClick,
  onPinClick,
  selectedId,
  focusedId,
  focusNonce = 0,
}: Props) {
  const geolocateRef = useRef<GeolocateControlInstance | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const handleClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    },
    [onMapClick]
  );

  const handleLoad = useCallback(() => {
    geolocateRef.current?.trigger();
  }, []);

  // Přelet na místo po kliknutí na kartu v seznamu
  useEffect(() => {
    if (!focusNonce || !focusedId) return;
    const target = ratings.find((r) => r.id === focusedId);
    if (!target) return;
    mapRef.current?.flyTo({
      center: [target.longitude, target.latitude],
      zoom: 15,
      duration: 1200,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={INITIAL_VIEW}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAPBOX_STYLE}
      onClick={handleClick}
      onLoad={handleLoad}
      cursor="crosshair"
    >
      <GeolocateControl
        ref={geolocateRef}
        position="top-right"
        trackUserLocation
        positionOptions={{ enableHighAccuracy: true }}
      />

      {ratings.map((r) => {
        const size = Math.min(44, Math.max(28, 22 + r.rating * 2));
        const selected = selectedId === r.id;
        return (
          <Marker
            key={r.id}
            longitude={r.longitude}
            latitude={r.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPinClick(r);
            }}
          >
            <div
              className="flex items-center justify-center rounded-full border-2 border-white text-white font-extrabold font-sans cursor-pointer transition-transform hover:scale-110"
              style={{
                width: size,
                height: size,
                fontSize: size * 0.4,
                backgroundColor: pinColor(r.rating),
                boxShadow: selected
                  ? "0 0 0 4px rgba(211,84,0,0.4)"
                  : "0 2px 6px rgba(0,0,0,0.3)",
                fontFamily: "var(--font-geist-sans, var(--font-sans))",
              }}
            >
              {r.rating}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
