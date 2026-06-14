"use client";
import { useState } from "react";
import { Chip } from "./Chip";
import { RatingSheet, Section } from "./AddRatingModal";
import { PONCHA_TYPES, BALANCE_OPTIONS } from "@/lib/options";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  ratings: PonchaRating[];
  initialTypes: string[];
  initialBalance: string[];
  onClose: () => void;
  onApply: (types: string[], balance: string[]) => void;
};

function matchCount(ratings: PonchaRating[], types: string[], balance: string[]): number {
  return ratings.filter((r) => {
    if (types.length > 0) {
      const rTypes = r.poncha_type?.split(", ").filter(Boolean) ?? [];
      if (!types.some((t) => rTypes.includes(t))) return false;
    }
    if (balance.length > 0) {
      const rTastes = r.balance?.split(", ").filter(Boolean) ?? [];
      if (!balance.some((b) => rTastes.includes(b))) return false;
    }
    return true;
  }).length;
}

function countLabel(n: number): string {
  if (n === 1) return "1 podnik odpovídá filtru";
  if (n < 5) return `${n} podniky odpovídají filtru`;
  return `${n} podniků odpovídá filtru`;
}

export function FilterSheet({
  ratings,
  initialTypes,
  initialBalance,
  onClose,
  onApply,
}: Props) {
  const [types, setTypes] = useState<string[]>(initialTypes);
  const [balance, setBalance] = useState<string[]>(initialBalance);

  function toggleType(t: string) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function toggleBalance(b: string) {
    setBalance((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  const count = matchCount(ratings, types, balance);
  const hasFilters = types.length > 0 || balance.length > 0;

  return (
    <RatingSheet
      title="Filtrovat"
      onClose={onClose}
      action={
        hasFilters ? (
          <button
            onClick={() => {
              setTypes([]);
              setBalance([]);
            }}
            className="text-sm font-semibold text-inksoft/60 hover:text-inksoft transition"
          >
            Vymazat vše
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-8">
        <Section label="Typ ponchy">
          <div className="flex flex-wrap gap-2">
            {PONCHA_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                active={types.includes(t)}
                onClick={() => toggleType(t)}
              />
            ))}
          </div>
        </Section>

        <Section label="Chuť">
          <div className="flex flex-wrap gap-2">
            {BALANCE_OPTIONS.map((b) => (
              <Chip
                key={b}
                label={b}
                color="green"
                active={balance.includes(b)}
                onClick={() => toggleBalance(b)}
              />
            ))}
          </div>
        </Section>

        <div className="flex flex-col gap-3 items-center">
          <p className="text-[13px] text-inksoft">{countLabel(count)}</p>
          <button
            onClick={() => {
              onApply(types, balance);
              onClose();
            }}
            className="w-full h-14 rounded-full bg-brand text-white font-bold text-base transition hover:opacity-90"
          >
            Zobrazit výsledky
          </button>
        </div>
      </div>
    </RatingSheet>
  );
}
