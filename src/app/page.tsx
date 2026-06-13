"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Plus, Wine } from "lucide-react";

import { AddRatingModal } from "@/components/AddRatingModal";
import { RatingCard } from "@/components/RatingCard";
import { getRatings } from "@/lib/ratings";
import type { PonchaRating } from "@/lib/supabase";

const PonchaMap = dynamic(
  () => import("@/components/PonchaMap").then((m) => m.PonchaMap),
  { ssr: false }
);

type View = "map" | "list";

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [ratings, setRatings] = useState<PonchaRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(
    null
  );

  useEffect(() => {
    getRatings()
      .then(setRatings)
      .finally(() => setLoading(false));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
  }, []);

  function handleSaved(r: PonchaRating) {
    setRatings((prev) => [r, ...prev]);
    setPendingLocation(null);
  }

  function handleDelete(id: string) {
    setRatings((prev) => prev.filter((r) => r.id !== id));
  }

  function handleUpdate(updated: PonchaRating) {
    setRatings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleCardClick(r: PonchaRating) {
    setFocus((prev) => ({ id: r.id, nonce: (prev?.nonce ?? 0) + 1 }));
    setView("map");
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <Wine size={22} />
          <span className="font-bold text-lg tracking-tight">Poncha Madeira</span>
        </div>
        <span className="text-white/70 text-sm">{ratings.length} míst</span>
      </header>

      {/* View toggle */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => setView("map")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
            view === "map"
              ? "text-amber-600 border-b-2 border-amber-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapIcon size={16} />
          Mapa
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium transition ${
            view === "list"
              ? "text-amber-600 border-b-2 border-amber-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <List size={16} />
          Seznam
        </button>
      </div>

      {/* Content – mapa zůstává trvale připojená (kvůli stavu a poloze),
          seznam ji jen překryje */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0">
          {!loading && (
            <PonchaMap
              ratings={ratings}
              onMapClick={handleMapClick}
              focusedId={focus?.id ?? null}
              focusNonce={focus?.nonce ?? 0}
            />
          )}
          {view === "map" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-xs text-gray-500 px-3 py-1.5 rounded-full shadow pointer-events-none">
              Klikni na mapu pro přidání ponchy
            </div>
          )}
        </div>

        {view === "list" && (
          <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center text-gray-400 py-8">Načítám...</div>
            )}
            {!loading && ratings.length === 0 && (
              <div className="text-center py-16">
                <Wine size={40} className="mx-auto text-amber-300 mb-3" />
                <p className="text-gray-500 font-medium">Zatím žádná poncha</p>
                <p className="text-gray-400 text-sm mt-1">
                  Přepni na mapu a klikni na místo, kde jsi ponchu měl/a
                </p>
              </div>
            )}
            {ratings.map((r) => (
              <RatingCard
                key={r.id}
                rating={r}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onClick={() => handleCardClick(r)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB – pro přidání z listu */}
      {view === "list" && (
        <button
          onClick={() => setView("map")}
          className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition"
          aria-label="Přidat ponchu"
        >
          <Plus size={26} />
        </button>
      )}

      {/* Modal */}
      {pendingLocation && (
        <AddRatingModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={() => setPendingLocation(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
