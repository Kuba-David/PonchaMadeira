"use client";
import { useRef, useState } from "react";
import { ratingColorClass } from "./RatingBadge";
import { PinIcon, RemoveIcon, EditIcon } from "./icons";
import type { PonchaRating } from "@/lib/supabase";
import { cityFromAddress } from "@/lib/geocode";

type Props = {
  rating: PonchaRating;
  onRequestDelete: (r: PonchaRating) => void;
  onEdit: (r: PonchaRating) => void;
  onOpen: () => void;
  onSwipeToMap?: () => void;
};

const REVEAL = 96; // šířka červeného panelu s košem
const THRESHOLD = 48; // hranice pro otevření/zavření
const SWIPE_TO_MAP = 90; // tah doprava ze zavřené karty → přechod na mapu
const RIGHT_GIVE = 28; // max. „gumové" vizuální posunutí doprava (jen feedback)

// Po otevření roll-upu prohlížeč ještě vyšle „duchový" click na souřadnici
// dotyku. Ten by propadl do čerstvě vykresleného detailu (a omylem např.
// spustil přechod na mapu). Jednorázově ho v capture fázi polkneme.
function swallowNextClick() {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    cleanup();
  };
  const cleanup = () => {
    window.removeEventListener("click", swallow, true);
    clearTimeout(t);
  };
  const t = setTimeout(cleanup, 700);
  window.addEventListener("click", swallow, true);
}

export function RatingCard({ rating, onRequestDelete, onEdit, onOpen, onSwipeToMap }: Props) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const baseRef = useRef(0);
  const draggedRef = useRef(false);
  // Skutečný (neomezený) posun doprava – dragX je vizuálně přiškrcený, ale
  // pro rozhodnutí "swipe to map" potřebujeme vědět, jak daleko prst došel.
  const rawDxRef = useRef(0);

  function clamp(x: number) {
    // Doleva odhaluje koš (až REVEAL). Doprava jen drobné gumové gesto jako
    // potvrzení, že se táhne – skutečný přechod na mapu řeší rawDxRef.
    if (x > 0) return Math.min(RIGHT_GIVE, x / 3);
    return Math.max(-REVEAL, x);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    baseRef.current = openRef.current ? -REVEAL : 0;
    draggedRef.current = false;
    rawDxRef.current = 0;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!draggedRef.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      draggedRef.current = true;
    }
    if (draggedRef.current) {
      rawDxRef.current = dx;
      setDragX(clamp(baseRef.current + dx));
    }
  }

  // genuineTap: true jen u skutečného pointerup (ne pointercancel). Scroll
  // seznamem totiž často zruší dotyk jako "cancel" – to nesmí otevřít detail.
  function finishGesture(genuineTap: boolean) {
    startRef.current = null;
    setDragging(false);
    if (draggedRef.current) {
      const wasClosed = baseRef.current === 0;
      // Swipe doprava ze zavřené karty → mapa. Z otevřené karty (koš odhalen)
      // doprava jen zavírá, ať se obě gesta nepřou.
      if (wasClosed && rawDxRef.current > SWIPE_TO_MAP && onSwipeToMap) {
        setDragX(0);
        onSwipeToMap();
        return;
      }
      const open = dragX < -THRESHOLD;
      openRef.current = open;
      setDragX(open ? -REVEAL : 0);
    } else if (openRef.current) {
      // klepnutí na otevřenou kartu → zavřít
      openRef.current = false;
      setDragX(0);
    } else if (genuineTap) {
      swallowNextClick();
      onOpen();
    }
  }
  function onPointerUp() {
    finishGesture(true);
  }
  function onPointerCancel() {
    finishGesture(false);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(rating);
  }

  function handleTrash() {
    openRef.current = false;
    setDragX(0);
    onRequestDelete(rating);
  }

  return (
    <div className="relative">
      {/* červený panel s košem pod kartou */}
      <div className="absolute inset-0 rounded-2xl bg-pinred flex justify-end overflow-hidden">
        <button
          onClick={handleTrash}
          aria-label="Delete"
          className="flex items-center justify-center text-white active:bg-black/10 transition"
          style={{ width: REVEAL }}
        >
          <RemoveIcon size={22} />
        </button>
      </div>

      {/* posuvná karta */}
      <div
        className="relative bg-white rounded-2xl shadow-sm p-4 flex gap-3 items-start cursor-pointer"
        style={{
          transform: `translateX(${dragX}px)`,
          // Zavírání (→0) se animuje pro hezký efekt; otevření je okamžité,
          // aby rychlé "swipe + tap na koš" netrefilo ještě animující kartu.
          transition:
            dragging || dragX !== 0
              ? "none"
              : "transform 0.24s cubic-bezier(0.32,0.72,0,1)",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className={`flex items-center justify-center size-[52px] rounded-2xl text-white font-extrabold text-2xl shrink-0 ${ratingColorClass(
            rating.rating
          )}`}
        >
          {rating.rating}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-[17px] text-ink truncate">
                {rating.place_name}
              </h3>
              {rating.address && (
                <p className="flex items-center gap-1 text-[13px] text-inksoft mt-0.5 truncate">
                  <PinIcon size={12} className="shrink-0 text-brand" />
                  <span className="truncate">{cityFromAddress(rating.address)}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleEdit}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              aria-label="Edit"
              className="-m-2 p-2 text-inksoft/60 hover:text-brand transition shrink-0"
            >
              <EditIcon size={18} />
            </button>
          </div>

          {rating.notes && (
            <p className="text-[13px] text-inksoft italic mt-2 line-clamp-2">
              &ldquo;{rating.notes}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
