"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { WineOff, Search, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AddRatingModal } from "@/components/AddRatingModal";
import { EditRatingModal } from "@/components/EditRatingModal";
import { DetailRatingModal } from "@/components/DetailRatingModal";
import { FilterSheet } from "@/components/FilterSheet";
import { RatingCard } from "@/components/RatingCard";
import { ReviewPreviewCard } from "@/components/ReviewPreviewCard";
import { getRatings } from "@/lib/ratings";
import type { PonchaRating } from "@/lib/supabase";

const PonchaMap = dynamic(
  () => import("@/components/PonchaMap").then((m) => m.PonchaMap),
  { ssr: false }
);

type View = "map" | "list";

function matchesFilter(r: PonchaRating, types: string[], balance: string[]): boolean {
  if (types.length > 0) {
    const rTypes = r.poncha_type?.split(", ").filter(Boolean) ?? [];
    if (!types.some((t) => rTypes.includes(t))) return false;
  }
  if (balance.length > 0) {
    const rTastes = r.balance?.split(", ").filter(Boolean) ?? [];
    if (!balance.some((b) => rTastes.includes(b))) return false;
  }
  return true;
}

export default function Home() {
  const [view, setView] = useState<View>("map");
  const [ratings, setRatings] = useState<PonchaRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [selected, setSelected] = useState<PonchaRating | null>(null);
  const [detail, setDetail] = useState<PonchaRating | null>(null);
  const [editing, setEditing] = useState<PonchaRating | null>(null);

  // filtr (mapa + seznam) a hledání (jen seznam)
  const [showFilter, setShowFilter] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterBalance, setFilterBalance] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // mapa: jen filtr typ/chuť
  const mapRatings = useMemo(
    () => ratings.filter((r) => matchesFilter(r, filterTypes, filterBalance)),
    [ratings, filterTypes, filterBalance]
  );

  // seznam: filtr + textové hledání
  const listRatings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mapRatings.filter((r) => {
      if (!q) return true;
      return (
        r.place_name.toLowerCase().includes(q) ||
        (r.address?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [mapRatings, searchQuery]);

  useEffect(() => {
    getRatings()
      .then(setRatings)
      .finally(() => setLoading(false));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelected(null);
    setPendingLocation({ lat, lng });
  }, []);

  const handlePinClick = useCallback((r: PonchaRating) => {
    setSelected(r);
  }, []);

  function handleSaved(r: PonchaRating) {
    setRatings((prev) => [r, ...prev]);
    setPendingLocation(null);
  }

  function handleUpdate(updated: PonchaRating) {
    setRatings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    setDetail((prev) => (prev?.id === updated.id ? updated : prev));
  }

  function handleDelete(id: string) {
    setRatings((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => (prev?.id === id ? null : prev));
    setDetail((prev) => (prev?.id === id ? null : prev));
  }

  function handleCardClick(r: PonchaRating) {
    setFocus((prev) => ({ id: r.id, nonce: (prev?.nonce ?? 0) + 1 }));
    setSelected(r);
    setView("map");
  }

  const filterActive = filterTypes.length > 0 || filterBalance.length > 0;

  return (
    <div className="flex flex-col h-dvh bg-sand">
      <main className="flex-1 relative overflow-hidden">
        {/* Mapa zůstává trvale připojená */}
        <div className="absolute inset-0">
          {!loading && (
            <PonchaMap
              ratings={mapRatings}
              onMapClick={handleMapClick}
              onPinClick={handlePinClick}
              selectedId={selected?.id}
              focusedId={focus?.id ?? null}
              focusNonce={focus?.nonce ?? 0}
            />
          )}
        </div>

        {/* Seznam jako překryv */}
        {view === "list" && (
          <div className="absolute inset-0 z-10 bg-sand overflow-y-auto px-4 pt-20 pb-28">
            {/* Vyhledávací pole */}
            <div className="flex items-center gap-3 bg-white border border-sanddark rounded-xl h-12 px-4 mb-5">
              <Search size={18} className="text-inksoft shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat podniky..."
                className="flex-1 text-[15px] text-ink placeholder:text-inksoft/60 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Vymazat"
                  className="text-inksoft hover:text-ink transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <h2 className="font-display font-bold text-xl text-ink mb-4 px-1">
              Ohodnocené podniky
            </h2>
            {loading && (
              <div className="text-center text-inksoft/60 py-8">Načítám...</div>
            )}
            {!loading && listRatings.length === 0 && (
              <div className="text-center py-16">
                <WineOff size={40} className="mx-auto text-brand/40 mb-3" />
                {ratings.length === 0 ? (
                  <>
                    <p className="text-inksoft font-medium">Zatím žádná poncha</p>
                    <p className="text-inksoft/70 text-sm mt-1">
                      Přepni na mapu a klikni na místo, kde jsi ponchu měl/a
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-inksoft font-medium">Žádné výsledky</p>
                    <p className="text-inksoft/70 text-sm mt-1">
                      Zkus upravit hledání nebo filtr
                    </p>
                  </>
                )}
              </div>
            )}
            <div className="space-y-3">
              {listRatings.map((r) => (
                <RatingCard
                  key={r.id}
                  rating={r}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onClick={() => handleCardClick(r)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Plovoucí hlavička */}
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
          <AppHeader />
        </div>

        {/* Náhledová karta vybraného místa (na mapě) */}
        {view === "map" && selected && (
          <div className="absolute inset-x-0 z-20 flex justify-center px-4" style={{ bottom: 88 }}>
            <div className="w-full max-w-[360px]">
              <ReviewPreviewCard
                rating={selected}
                onClose={() => setSelected(null)}
                onDetail={() => setDetail(selected)}
              />
            </div>
          </div>
        )}

        {/* Spodní navigace */}
        <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center px-4">
          <BottomNav
            view={view}
            onViewChange={setView}
            onFilter={() => setShowFilter(true)}
            filterActive={filterActive}
          />
        </div>
      </main>

      {pendingLocation && (
        <AddRatingModal
          lat={pendingLocation.lat}
          lng={pendingLocation.lng}
          onClose={() => setPendingLocation(null)}
          onSaved={handleSaved}
        />
      )}

      {detail && (
        <DetailRatingModal
          rating={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
        />
      )}

      {editing && (
        <EditRatingModal
          rating={editing}
          onClose={() => setEditing(null)}
          onSaved={(r) => {
            handleUpdate(r);
            setEditing(null);
          }}
        />
      )}

      {showFilter && (
        <FilterSheet
          ratings={ratings}
          initialTypes={filterTypes}
          initialBalance={filterBalance}
          onClose={() => setShowFilter(false)}
          onApply={(types, balance) => {
            setFilterTypes(types);
            setFilterBalance(balance);
          }}
        />
      )}
    </div>
  );
}
