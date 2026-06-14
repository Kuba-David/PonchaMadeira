"use client";
import { SlidersHorizontal } from "lucide-react";

type View = "map" | "list";

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  onFilter?: () => void;
  filterActive?: boolean;
};

export function BottomNav({ view, onViewChange, onFilter, filterActive }: Props) {
  return (
    <div className="flex items-center gap-2 bg-cream/95 backdrop-blur border border-sanddark rounded-full p-1.5 shadow-lg">
      <button
        onClick={() => onViewChange("map")}
        className={`px-7 py-3 rounded-full text-sm font-semibold transition ${
          view === "map" ? "bg-white text-brand shadow-sm" : "text-inksoft"
        }`}
      >
        Mapa
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`px-7 py-3 rounded-full text-sm font-semibold transition ${
          view === "list" ? "bg-white text-brand shadow-sm" : "text-inksoft"
        }`}
      >
        Seznam
      </button>
      <button
        onClick={onFilter}
        aria-label="Filtrovat"
        className={`size-11 rounded-full flex items-center justify-center transition ${
          filterActive ? "text-brand" : "text-inksoft hover:text-brand"
        }`}
      >
        <SlidersHorizontal size={17} />
      </button>
    </div>
  );
}
