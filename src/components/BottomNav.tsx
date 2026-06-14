"use client";
import { Search, SlidersHorizontal } from "lucide-react";

type View = "map" | "list";

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  onSearch?: () => void;
  onFilter?: () => void;
};

export function BottomNav({ view, onViewChange, onSearch, onFilter }: Props) {
  return (
    <div className="flex items-center gap-2">
      {/* Přepínač Mapa / Seznam */}
      <div className="flex bg-cream/95 backdrop-blur border border-sanddark rounded-full p-1 shadow-lg">
        <button
          onClick={() => onViewChange("map")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            view === "map" ? "bg-white text-brand shadow-sm" : "text-inksoft"
          }`}
        >
          Mapa
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
            view === "list" ? "bg-white text-brand shadow-sm" : "text-inksoft"
          }`}
        >
          Seznam
        </button>
      </div>

      <button
        onClick={onSearch}
        aria-label="Hledat"
        className="size-11 rounded-full bg-cream/95 backdrop-blur border border-sanddark shadow-lg flex items-center justify-center text-inksoft hover:text-brand transition"
      >
        <Search size={20} />
      </button>
      <button
        onClick={onFilter}
        aria-label="Filtrovat"
        className="size-11 rounded-full bg-cream/95 backdrop-blur border border-sanddark shadow-lg flex items-center justify-center text-inksoft hover:text-brand transition"
      >
        <SlidersHorizontal size={18} />
      </button>
    </div>
  );
}
