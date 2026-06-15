"use client";
import { useRef, useState } from "react";

type Props = {
  imageUrl: string;
  initialY?: number;
  onConfirm: (y: number) => void;
  onCancel: () => void;
};

// Modální okno pro nastavení svislého výřezu fotky (stejná výška jako hero – 240px).
export function PhotoPositionModal({ imageUrl, initialY = 50, onConfirm, onCancel }: Props) {
  const dragRef = useRef<{ y: number; startPct: number } | null>(null);
  const [imgY, setImgY] = useState(initialY);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-cream rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full" style={{ height: 240 }}>
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover select-none"
            style={{ objectPosition: `50% ${imgY}%`, touchAction: "none", cursor: "ns-resize" }}
            onPointerDown={(e) => {
              e.preventDefault();
              dragRef.current = { y: e.clientY, startPct: imgY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              const newY = Math.max(
                0,
                Math.min(100, dragRef.current.startPct - (e.clientY - dragRef.current.y) * 0.25)
              );
              setImgY(newY);
            }}
            onPointerUp={() => { dragRef.current = null; }}
            onPointerCancel={() => { dragRef.current = null; }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 rounded-full px-2.5 py-1 pointer-events-none">
            <span className="text-white/90 text-[11px] font-medium">↕ drag to set the crop</span>
          </div>
        </div>

        <div className="flex gap-3 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-full border border-sanddark text-inksoft font-semibold text-[15px] transition hover:bg-sand"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(imgY)}
            className="flex-1 h-12 rounded-full bg-brand text-white font-bold text-[15px] transition hover:opacity-90"
          >
            Set position
          </button>
        </div>
      </div>
    </div>
  );
}
