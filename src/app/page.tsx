"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { EmptyListIcon, SearchIcon, CloseIcon } from "@/components/icons";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AddRatingModal } from "@/components/AddRatingModal";
import { EditRatingModal } from "@/components/EditRatingModal";
import { DetailRatingModal } from "@/components/DetailRatingModal";
import { FilterSheet } from "@/components/FilterSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RatingCard } from "@/components/RatingCard";
import { ReviewPreviewCard } from "@/components/ReviewPreviewCard";
import { SplashScreen } from "@/components/SplashScreen";
import { getRatings, deleteRating } from "@/lib/ratings";
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
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [selected, setSelected] = useState<PonchaRating | null>(null);
  const [detail, setDetail] = useState<PonchaRating | null>(null);
  const [editing, setEditing] = useState<PonchaRating | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PonchaRating | null>(null);

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

  // seznam: filtr + textové hledání, seřazeno od nejlepšího hodnocení
  const listRatings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mapRatings
      .filter((r) => {
        if (!q) return true;
        return (
          r.place_name.toLowerCase().includes(q) ||
          (r.address?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => b.rating - a.rating);
  }, [mapRatings, searchQuery]);

  useEffect(() => {
    getRatings()
      .then(setRatings)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      setSplashFading(true);
      const t = setTimeout(() => setSplashVisible(false), 500);
      return () => clearTimeout(t);
    }
  }, [loading]);

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

  // Klik na seznamovou kartu: otevře detail (roll-up) a tiše vycentruje mapu
  // na pozadí, takže po přechodu na mapu už je místo zaměřené.
  function handleCardOpen(r: PonchaRating) {
    setDetail(r);
    setSelected(r);
    setFocus((prev) => ({ id: r.id, nonce: (prev?.nonce ?? 0) + 1 }));
  }

  // Přechod z detailu na mapu (klik na název/adresu).
  function handleGoToMap(r: PonchaRating) {
    setFocus((prev) => ({ id: r.id, nonce: (prev?.nonce ?? 0) + 1 }));
    setSelected(r);
    setView("map");
    setDetail(null);
  }

  // Swipe doprava v seznamu = alternativa k tlačítku Mapa ve spodní navigaci.
  // Karty samy o sobě s tímto gestem nic nedělají (jen svoje vlastní
  // doleva/doprava k odhalení/zavření koše) – sledujeme dotyk na úrovni
  // celé obrazovky seznamu, ne na jednotlivých kartách.
  const listTouchRef = useRef<{ x: number; y: number } | null>(null);
  const listAxisRef = useRef<"x" | "y" | null>(null);
  const LIST_SWIPE_THRESHOLD = 110;

  function handleListTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    listTouchRef.current = { x: t.clientX, y: t.clientY };
    listAxisRef.current = null;
  }

  function handleListTouchMove(e: React.TouchEvent) {
    const start = listTouchRef.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (listAxisRef.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      listAxisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
  }

  function handleListTouchEnd(e: React.TouchEvent) {
    const start = listTouchRef.current;
    listTouchRef.current = null;
    if (!start || listAxisRef.current !== "x") return;
    const t = e.changedTouches[0];
    if (t.clientX - start.x > LIST_SWIPE_THRESHOLD) setView("map");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await deleteRating(id);
    handleDelete(id);
  }

  const filterActive = filterTypes.length > 0 || filterBalance.length > 0;

  return (
    <div className="flex flex-col h-dvh bg-sand">
      <main className="flex-1 relative overflow-hidden">
        {/* Mapa se mountuje okamžitě, splash krije načítání */}
        <div className="absolute inset-0">
          <PonchaMap
            ratings={mapRatings}
            onMapClick={handleMapClick}
            onPinClick={handlePinClick}
            selectedId={selected?.id}
            focusedId={focus?.id ?? null}
            focusNonce={focus?.nonce ?? 0}
          />
        </div>

        {/* Titulní obrazovka – mizí s fade-out po načtení dat */}
        {splashVisible && <SplashScreen fading={splashFading} />}

        {/* Seznam jako překryv – hlavička scrolluje spolu s obsahem */}
        {view === "list" && (
          <div
            className="absolute inset-0 z-10 bg-cream overflow-y-auto pb-28"
            onTouchStart={handleListTouchStart}
            onTouchMove={handleListTouchMove}
            onTouchEnd={handleListTouchEnd}
          >
            <AppHeader className="mb-3" />
            <div className="px-4">
            {/* Vyhledávací pole */}
            <div className="flex items-center gap-3 bg-white border border-sanddark rounded-xl h-12 px-4 mb-5">
              <SearchIcon size={18} className="text-inksoft shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="flex-1 text-[15px] text-ink placeholder:text-inktertiary bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear"
                  className="text-inksoft hover:text-ink transition"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>

            <h2 className="font-display font-bold text-xl text-ink mb-4 px-1">
              Rated places
            </h2>
            {loading && (
              <div className="text-center text-inktertiary py-8">Loading...</div>
            )}
            {!loading && listRatings.length === 0 && (
              <div className="text-center py-16">
                <EmptyListIcon size={40} className="mx-auto text-brand/40 mb-3" />
                {ratings.length === 0 ? (
                  <>
                    <p className="text-inksoft font-medium">No poncha yet</p>
                    <p className="text-inktertiary text-sm mt-1">
                      Switch to the map and tap a spot where you had poncha
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-inksoft font-medium">No results</p>
                    <p className="text-inktertiary text-sm mt-1">
                      Try adjusting your search or filter
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
                  onRequestDelete={setDeleteTarget}
                  onEdit={setEditing}
                  onOpen={() => handleCardOpen(r)}
                />
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Plovoucí hlavička – jen nad mapou (v seznamu scrolluje s obsahem) */}
        {view === "map" && (
          <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
            <AppHeader />
          </div>
        )}

        {/* Náhledová karta vybraného místa (na mapě) */}
        {view === "map" && selected && (
          <div className="absolute inset-x-0 z-20 flex justify-center px-4" style={{ bottom: 96 }}>
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
          onGoToMap={() => handleGoToMap(detail)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this rating?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
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
