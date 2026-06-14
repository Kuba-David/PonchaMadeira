"use client";
import { useState } from "react";
import { Search, X, MapPin } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import { RatingSheet } from "./AddRatingModal";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  ratings: PonchaRating[];
  initialQuery: string;
  onClose: () => void;
  onSelect: (r: PonchaRating) => void;
  onSearch: (query: string) => void;
};

export function SearchSheet({ ratings, initialQuery, onClose, onSelect, onSearch }: Props) {
  const [query, setQuery] = useState(initialQuery);

  const trimmed = query.trim();
  const results = trimmed
    ? ratings.filter(
        (r) =>
          r.place_name.toLowerCase().includes(trimmed.toLowerCase()) ||
          r.address?.toLowerCase().includes(trimmed.toLowerCase())
      )
    : ratings.slice(0, 3);

  const sectionLabel = trimmed ? "VÝSLEDKY" : "POSLEDNÍ VYHLEDÁVÁNÍ";

  return (
    <RatingSheet title="Hledat" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 bg-white border border-sanddark rounded-xl h-12 px-4">
          <Search size={18} className="text-inksoft shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat podniky..."
            className="flex-1 text-[15px] text-ink placeholder:text-inksoft/60 bg-transparent focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-inksoft hover:text-ink transition">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-inksoft">
            {sectionLabel}
          </p>
          {trimmed && results.length === 0 && (
            <p className="text-sm text-inksoft/60 py-4 text-center">Žádné výsledky</p>
          )}
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  onClose();
                }}
                className="bg-white rounded-2xl shadow-sm p-4 flex gap-3 items-start text-left hover:shadow-md transition w-full"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-[17px] text-ink truncate">
                      {r.place_name}
                    </h3>
                    <RatingBadge value={r.rating} />
                  </div>
                  {r.address && (
                    <p className="flex items-center gap-1 text-[13px] text-inksoft mt-0.5 truncate">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{r.address}</span>
                    </p>
                  )}
                  {r.notes && (
                    <p className="text-[13px] text-inksoft italic mt-1 truncate">
                      &ldquo;{r.notes}&rdquo;
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            onSearch(query);
            onClose();
          }}
          className="h-14 rounded-full bg-brand text-white font-bold text-base transition hover:opacity-90"
        >
          Zobrazit výsledky
        </button>
      </div>
    </RatingSheet>
  );
}
