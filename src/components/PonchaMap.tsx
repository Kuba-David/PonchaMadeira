"use client";
import { useCallback, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { StarRating } from "./StarRating";
import type { PonchaRating } from "@/lib/supabase";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Madeira center
const INITIAL_VIEW = { longitude: -16.9, latitude: 32.75, zoom: 10 };

type Props = {
  ratings: PonchaRating[];
  onMapClick: (lat: number, lng: number) => void;
  focusedId?: string | null;
};

export function PonchaMap({ ratings, onMapClick, focusedId }: Props) {
  const [popup, setPopup] = useState<PonchaRating | null>(null);

  const handleClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      setPopup(null);
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    },
    [onMapClick]
  );

  function ratingColor(r: number) {
    if (r >= 4) return "#22c55e";
    if (r >= 3) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={INITIAL_VIEW}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleClick}
      cursor="crosshair"
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" trackUserLocation />

      {ratings.map((r) => (
        <Marker
          key={r.id}
          longitude={r.longitude}
          latitude={r.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setPopup(r);
          }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow-lg text-white font-bold text-sm cursor-pointer transition-transform hover:scale-110"
            style={{
              backgroundColor: ratingColor(r.rating),
              outline: focusedId === r.id ? "3px solid #f59e0b" : undefined,
            }}
          >
            {r.rating}
          </div>
        </Marker>
      ))}

      {popup && (
        <Popup
          longitude={popup.longitude}
          latitude={popup.latitude}
          anchor="bottom"
          offset={40}
          onClose={() => setPopup(null)}
          closeOnClick={false}
          className="poncha-popup"
        >
          <div className="p-1 min-w-[160px]">
            <p className="font-semibold text-gray-900 text-sm">{popup.place_name}</p>
            {popup.poncha_type && (
              <p className="text-xs text-amber-600 mt-0.5">{popup.poncha_type}</p>
            )}
            <div className="mt-1">
              <StarRating value={popup.rating} size={14} />
            </div>
            {popup.notes && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-3">{popup.notes}</p>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
