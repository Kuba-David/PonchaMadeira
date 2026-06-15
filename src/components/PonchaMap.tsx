"use client";
import { useCallback, useEffect, useRef } from "react";
import Map, {
  Marker,
  Source,
  Layer,
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
    // Skryjeme POI popisky základní mapy (Standard) – vlastní si vykreslíme níž.
    // Best-effort: pokud import nese jiný název, tiše přeskočíme (řeší se i ve Studiu).
    const map = mapRef.current?.getMap();
    try {
      map?.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    } catch {
      /* styl není Standard nebo má jiný import id – ignorujeme */
    }
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

      {/* Vlastní POI – jen bary, restaurace a kavárny z Mapbox Streets dat */}
      <Source id="poi-src" type="vector" url="mapbox://mapbox.mapbox-streets-v8">
        <Layer
          id="poi-fd-dots"
          type="circle"
          source-layer="poi_label"
          minzoom={13}
          filter={[
            "all",
            ["==", ["get", "class"], "food_and_drink"],
            [
              "match",
              ["get", "maki"],
              ["restaurant", "bar", "cafe", "beer", "fast-food"],
              true,
              false,
            ],
          ]}
          paint={{
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              7,
              16,
              13,
            ],
            "circle-color": "#d35400",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
            "circle-opacity": 0.95,
          }}
        />
        <Layer
          id="poi-fd-icons"
          type="symbol"
          source-layer="poi_label"
          minzoom={13}
          filter={[
            "all",
            ["==", ["get", "class"], "food_and_drink"],
            [
              "match",
              ["get", "maki"],
              ["restaurant", "bar", "cafe", "beer", "fast-food"],
              true,
              false,
            ],
          ]}
          layout={{
            "icon-image": [
              "match",
              ["get", "maki"],
              "restaurant", "restaurant-15",
              "bar", "bar-15",
              "cafe", "cafe-15",
              "beer", "beer-15",
              "fast-food", "fast-food-15",
              "restaurant-15",
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              0.55,
              16,
              0.85,
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
          paint={{
            "icon-color": "#ffffff",
            "icon-opacity": 1,
          }}
        />
        <Layer
          id="poi-fd-labels"
          type="symbol"
          source-layer="poi_label"
          minzoom={14}
          filter={[
            "all",
            ["==", ["get", "class"], "food_and_drink"],
            [
              "match",
              ["get", "maki"],
              ["restaurant", "bar", "cafe", "beer", "fast-food"],
              true,
              false,
            ],
          ]}
          layout={{
            "text-field": ["get", "name"],
            "text-size": 11,
            "text-offset": [0, 1.4],
            "text-anchor": "top",
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
            "text-max-width": 8,
          }}
          paint={{
            "text-color": "#d35400",
            "text-halo-color": "#fdfbf7",
            "text-halo-width": 1.4,
          }}
        />
      </Source>

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
