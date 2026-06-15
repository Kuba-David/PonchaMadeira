"use client";
import { useRef, useState } from "react";

type Props = {
  imageUrl: string;
  initialX?: number;
  initialY?: number;
  onConfirm: (x: number, y: number) => void;
  onCancel: () => void;
};

export function PhotoPositionModal({ imageUrl, initialX = 50, initialY = 50, onConfirm, onCancel }: Props) {
  const dragRef = useRef<{ startX: number; startY: number; startXPct: number; startYPct: number } | null>(null);
  const [imgX, setImgX] = useState(initialX);
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
            style={{ objectPosition: `${imgX}% ${imgY}%`, touchAction: "none", cursor: "move" }}
            onPointerDown={(e) => {
              e.preventDefault();
              dragRef.current = { startX: e.clientX, startY: e.clientY, startXPct: imgX, startYPct: imgY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              const newX = Math.max(0, Math.min(100, dragRef.current.startXPct - (e.clientX - dragRef.current.startX) * 0.25));
              const newY = Math.max(0, Math.min(100, dragRef.current.startYPct - (e.clientY - dragRef.current.startY) * 0.25));
              setImgX(newX);
              setImgY(newY);
            }}
            onPointerUp={() => { dragRef.current = null; }}
            onPointerCancel={() => { dragRef.current = null; }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 rounded-full px-2.5 py-1 pointer-events-none">
            <span className="text-white/90 text-[11px] font-medium">✥ drag to position</span>
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
            onClick={() => onConfirm(imgX, imgY)}
            className="flex-1 h-12 rounded-full bg-brand text-white font-bold text-[15px] transition hover:opacity-90"
          >
            Set position
          </button>
        </div>
      </div>
    </div>
  );
}
