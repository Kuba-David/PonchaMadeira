"use client";
import { useRef, useState } from "react";
import { RatingBadge } from "./RatingBadge";
import { NoImageIcon, PinIcon } from "./icons";
import type { PonchaRating } from "@/lib/supabase";
import { cityFromAddress } from "@/lib/geocode";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onDetail: () => void;
};

const SWIPE_THRESHOLD = 80;

export function ReviewPreviewCard({ rating, onClose, onDetail }: Props) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      draggedRef.current = true;
      setDragX(dx);
    }
  }

  function handlePointerUp() {
    if (!startRef.current) return;
    startRef.current = null;
    setDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      setClosing(true);
      setDragX(dragX > 0 ? window.innerWidth : -window.innerWidth);
      setTimeout(onClose, 220);
    } else {
      setDragX(0);
    }
  }

  // Tah stranou = swipe-to-dismiss; potlačí klik na kartu, pokud se právě táhlo.
  function handleClickCapture(e: React.MouseEvent) {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const opacity = closing ? 0 : Math.max(1 - Math.abs(dragX) / 250, 0.15);

  return (
    <div
      className="bg-white rounded-2xl shadow-xl p-4 flex gap-3 items-start"
      style={{
        transform: `translateX(${dragX}px)`,
        opacity,
        transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.32,0.72,0,1), opacity 0.22s ease",
        touchAction: "pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
    >
      <button
        onClick={onDetail}
        className="size-14 rounded-xl overflow-hidden bg-cream shrink-0 flex items-center justify-center text-inksoft hover:opacity-90 transition"
        aria-label="View detail"
      >
        {rating.photo_url ? (
          <img src={rating.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <NoImageIcon size={20} />
        )}
      </button>

      <button onClick={onDetail} className="flex-1 min-w-0 text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-[17px] text-ink truncate">
            {rating.place_name}
          </h3>
          <RatingBadge value={rating.rating} />
        </div>

        {rating.address && (
          <p className="flex items-center gap-1 text-[13px] text-inksoft mt-0.5 truncate">
            <PinIcon size={12} className="shrink-0 text-brand" />
            <span className="truncate">{cityFromAddress(rating.address)}</span>
          </p>
        )}

        {rating.notes && (
          <p className="text-[13px] text-inksoft italic mt-1 line-clamp-2">
            &ldquo;{rating.notes}&rdquo;
          </p>
        )}
      </button>
    </div>
  );
}
