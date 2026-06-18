// Slidery hodnocení: hodnoty 0..1. Balance má vrchol uprostřed (vyvážené =
// nejlepší), freshness roste lineárně doprava. Výsledné hodnocení 1..10 se
// počítá z těchto čtyř hodnot a je read-only.

export const BALANCE_STEPS = 7; // oboustranné – víc úrovní pro škálování
export const FRESHNESS_STEPS = 5;

// Váhy obou sekcí (sčítají do 1).
const BALANCE_WEIGHT = 0.7;
const FRESHNESS_WEIGHT = 0.3;

export type Sliders = {
  sourness: number;
  sweetness: number;
  booziness: number;
  freshness: number;
};

// Vrchol uprostřed: 1 v 0.5, 0 na krajích.
export function tentScore(x: number): number {
  return 1 - 2 * Math.abs(x - 0.5);
}

export function computeRating(s: Sliders): number {
  const balanceAvg =
    (tentScore(s.sourness) + tentScore(s.sweetness) + tentScore(s.booziness)) / 3;
  const score01 = BALANCE_WEIGHT * balanceAvg + FRESHNESS_WEIGHT * s.freshness;
  return Math.round(score01 * 9) + 1; // → 1..10
}

// Výchozí: balance uprostřed, freshness mírně vpravo.
export const DEFAULT_SLIDERS: Sliders = {
  sourness: 0.5,
  sweetness: 0.5,
  booziness: 0.5,
  freshness: 0.75,
};

// Načte slidery z uloženého hodnocení; chybějící (legacy řádky) → výchozí.
export function slidersFrom(r: {
  sourness: number | null;
  sweetness: number | null;
  booziness: number | null;
  freshness: number | null;
}): Sliders {
  return {
    sourness: r.sourness ?? DEFAULT_SLIDERS.sourness,
    sweetness: r.sweetness ?? DEFAULT_SLIDERS.sweetness,
    booziness: r.booziness ?? DEFAULT_SLIDERS.booziness,
    freshness: r.freshness ?? DEFAULT_SLIDERS.freshness,
  };
}

// Má hodnocení vyplněné nové slidery (vs. starý chipový balance text)?
export function hasSliderData(r: { sourness: number | null }): boolean {
  return r.sourness != null;
}
