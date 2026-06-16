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
import type mapboxgl from "mapbox-gl";
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
  return "#d30000";
}

// Bílé ikonky POI vykreslené synchronně na canvas přes Path2D (lucide cesty).
// Synchronní přístup zaručuje, že jsou ikony dostupné v momentě registrace vrstvy.
const POI_ICON_PATHS: Record<string, string[]> = {
  "poi-bar": [
    "M8 22h8",
    "M7 10h10",
    "M12 15v7",
    "M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z",
  ],
  "poi-restaurant": [
    "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
    "M7 2v20",
    "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  ],
  "poi-cafe": [
    "M10 2v2",
    "M14 2v2",
    "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
    "M6 2v2",
  ],
  "poi-beer": [
    "M17 11h1a3 3 0 0 1 0 6h-1",
    "M9 12v6",
    "M13 12v6",
    "M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 3 11 3s2 .5 3 .5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z",
    "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8",
  ],
};

function loadPoiIcons(map: mapboxgl.Map) {
  for (const [id, paths] of Object.entries(POI_ICON_PATHS)) {
    if (map.hasImage(id)) continue;
    // Kreslíme oranžový kruh + bílou ikonu do jednoho canvas obrazu,
    // aby Mapbox vždy renderoval kruh a ikonu jako jeden atomický celek.
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Oranžový kruh s bílým okrajem
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#d35400";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Bílá ikona centrovaná uvnitř kruhu (lucide 24x24 → škála na 32px)
    const iconPx = 32;
    const offset = (size - iconPx) / 2;
    const iconScale = iconPx / 24;
    ctx.save();
    ctx.translate(offset, offset);
    ctx.scale(iconScale, iconScale);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2 / iconScale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const d of paths) ctx.stroke(new Path2D(d));
    ctx.restore();

    map.addImage(id, ctx.getImageData(0, 0, size, size), { pixelRatio: 2 });
  }
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

  // Debounce: ignore the first click if a second follows within 280ms (= double-tap to zoom).
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickTimeRef = useRef(0);

  // Touch state for double-tap-drag-to-zoom (Google Maps single-finger zoom).
  const touchStateRef = useRef({ lastTapTime: 0, zoomActive: false, startY: 0, startZoom: 10 });
  const cleanupTouchRef = useRef<(() => void) | null>(null);

  const handleClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < 300 && clickTimerRef.current) {
        // Second click within 300ms = double-tap → cancel modal, let Mapbox zoom
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        lastClickTimeRef.current = 0;
        return;
      }
      lastClickTimeRef.current = now;
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        onMapClick(lat, lng);
      }, 280);
    },
    [onMapClick]
  );

  const handleLoad = useCallback(() => {
    geolocateRef.current?.trigger();
    const map = mapRef.current?.getMap();
    try {
      map?.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    } catch {
      /* styl není Standard nebo má jiný import id – ignorujeme */
    }
    if (map) loadPoiIcons(map);

    // Double-tap-and-drag-to-zoom: detect second tap within 300ms, then track vertical drag.
    const container = mapRef.current?.getContainer();
    if (!container) return;
    const ts = touchStateRef.current;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const now = Date.now();
      if (now - ts.lastTapTime < 300) {
        ts.zoomActive = true;
        ts.startY = e.touches[0].clientY;
        ts.startZoom = mapRef.current?.getMap()?.getZoom() ?? 10;
        // Cancel any pending single-tap modal open
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        e.preventDefault(); // prevent click from firing on this second tap
      }
      ts.lastTapTime = now;
    }

    function onTouchMove(e: TouchEvent) {
      if (!ts.zoomActive || e.touches.length !== 1) return;
      e.preventDefault();
      const deltaY = ts.startY - e.touches[0].clientY; // drag up = zoom in
      mapRef.current?.getMap()?.setZoom(Math.max(0, Math.min(22, ts.startZoom + deltaY / 60)));
    }

    function onTouchEnd() {
      ts.zoomActive = false;
    }

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    cleanupTouchRef.current = () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // Cleanup touch listeners and pending click timer on unmount
  useEffect(() => {
    return () => {
      cleanupTouchRef.current?.();
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
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
          id="poi-fd-markers"
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
              "bar", "poi-bar",
              "cafe", "poi-cafe",
              "beer", "poi-beer",
              "restaurant", "poi-restaurant",
              "fast-food", "poi-restaurant",
              "poi-restaurant",
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13,
              0.48,
              16,
              0.82,
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
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
