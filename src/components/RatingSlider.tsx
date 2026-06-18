"use client";
import { useRef } from "react";

type Props = {
  value: number; // 0..1 (snapnuté na zarážky)
  onChange?: (v: number) => void;
  steps: number; // počet zarážek
  variant: "balance" | "freshness";
  label: string; // pro přístupnost
  readOnly?: boolean;
};

// Gradient = bodová mapa na pozadí. Balance: kraje červené, střed zelený.
// Freshness: vlevo červená, vpravo zelená.
const GRADIENT: Record<Props["variant"], string> = {
  balance:
    "linear-gradient(90deg,#d30000 0%,#e8824a 25%,#4a7c59 50%,#e8824a 75%,#d30000 100%)",
  freshness: "linear-gradient(90deg,#d30000 0%,#e8824a 50%,#4a7c59 100%)",
};

const THUMB = 28; // px – průměr knobu

export function RatingSlider({
  value,
  onChange,
  steps,
  variant,
  label,
  readOnly = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // Osa gesta: null = nerozhodnuto, "x" = horizontální (slider), "y" = svislé
  // (zavírací tah karty) – rozhoduje se podle prvního výraznějšího pohybu.
  const axisRef = useRef<"x" | "y" | null>(null);

  function snap(raw: number): number {
    const n = steps - 1;
    return Math.round(raw * n) / n;
  }

  function setFromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el || !onChange) return;
    const rect = el.getBoundingClientRect();
    // Střed knobu se pohybuje jen v dráze zmenšené o jeho průměr.
    const usable = rect.width - THUMB;
    const raw = (clientX - rect.left - THUMB / 2) / usable;
    onChange(snap(Math.max(0, Math.min(1, raw))));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (readOnly) return;
    draggingRef.current = true;
    axisRef.current = null;
    startRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    // Záměrně neměníme hodnotu na pouhý dotyk – knob se hýbe jen tažením,
    // aby klepnutí nezpůsobilo skok po škále a neblokovalo svislé gesto karty.
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !startRef.current) return;
    if (axisRef.current === null) {
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        axisRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
    }
    // Dokud tah není rozpoznán jako svislý (= zavírání karty), slider reaguje.
    if (axisRef.current !== "y") setFromClientX(e.clientX);
  }
  function onPointerUp() {
    draggingRef.current = false;
    axisRef.current = null;
    startRef.current = null;
  }
  // Tah po slideru nesmí spustit zavírací gesto karty (běží na touch
  // událostech rodiče) – ale jen pokud je tah převážně horizontální. Svislý
  // tah (i přes slider) propustíme dál, ať lze kartu zavřít odkudkoli.
  function stopTouch(e: React.TouchEvent) {
    if (!readOnly && axisRef.current === "x") e.stopPropagation();
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (readOnly || !onChange) return;
    const stepSize = 1 / (steps - 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      onChange(snap(Math.max(0, value - stepSize)));
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      onChange(snap(Math.min(1, value + stepSize)));
      e.preventDefault();
    }
  }

  const inset = { left: THUMB / 2, right: THUMB / 2 };

  return (
    <div
      ref={trackRef}
      role={readOnly ? undefined : "slider"}
      aria-label={readOnly ? undefined : label}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : steps - 1}
      aria-valuenow={readOnly ? undefined : Math.round(value * (steps - 1))}
      tabIndex={readOnly ? undefined : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={stopTouch}
      onTouchMove={stopTouch}
      onKeyDown={onKeyDown}
      className={`relative h-7 flex items-center select-none outline-none ${
        readOnly ? "" : "cursor-pointer touch-pan-y"
      }`}
    >
      {/* track */}
      <div
        className="absolute h-1.5 rounded-full"
        style={{ ...inset, background: GRADIENT[variant] }}
      />
      {/* zarážky */}
      <div className="absolute flex justify-between" style={inset}>
        {Array.from({ length: steps }).map((_, i) => (
          <span key={i} className="w-0.5 h-2 rounded-full bg-white/60" />
        ))}
      </div>
      {/* knob */}
      <div
        className="absolute rounded-full bg-white border border-sanddark shadow-md"
        style={{
          width: THUMB,
          height: THUMB,
          left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${value})`,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}
