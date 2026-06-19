"use client";
import { useRef, useState } from "react";

type Props = {
  imageUrl: string;
  initialX?: number;
  initialY?: number;
  initialZoom?: number;
  onConfirm: (x: number, y: number, zoom: number) => void;
  onCancel: () => void;
};

export function PhotoPositionModal({
  imageUrl,
  initialX = 50,
  initialY = 50,
  initialZoom = 1,
  onConfirm,
  onCancel,
}: Props) {
  const [imgX, setImgX] = useState(initialX);
  const [imgY, setImgY] = useState(initialY);
  const [zoom, setZoom] = useState(Math.max(1, initialZoom));

  // Tracks all active pointers (single finger pan + two-finger pinch)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ startX: number; startY: number; startXPct: number; startYPct: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  function getPinchDist(): number {
    const pts = Array.from(pointersRef.current.values());
    return Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  }

  function onPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      // Single finger → pan
      dragRef.current = { startX: e.clientX, startY: e.clientY, startXPct: imgX, startYPct: imgY };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      // Second finger → start pinch, cancel pan
      dragRef.current = null;
      pinchRef.current = { startDist: getPinchDist(), startZoom: zoom };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLImageElement>) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      // Pinch to zoom (1× minimum, 5× maximum)
      const dist = getPinchDist();
      const newZoom = Math.max(1, Math.min(5, pinchRef.current.startZoom * (dist / pinchRef.current.startDist)));
      setZoom(newZoom);
    } else if (dragRef.current) {
      // Single-finger pan
      const newX = Math.max(0, Math.min(100, dragRef.current.startXPct - (e.clientX - dragRef.current.startX) * 0.25));
      const newY = Math.max(0, Math.min(100, dragRef.current.startYPct - (e.clientY - dragRef.current.startY) * 0.25));
      setImgX(newX);
      setImgY(newY);
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLImageElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full overflow-hidden" style={{ height: 240 }}>
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover select-none"
            style={{
              objectPosition: `${imgX}% ${imgY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${imgX}% ${imgY}%`,
              touchAction: "none",
              cursor: zoom > 1 ? "move" : "grab",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 rounded-full px-2.5 py-1 pointer-events-none">
            <span className="text-white/90 text-[11px] font-medium">drag to pan · pinch to zoom</span>
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
            onClick={() => onConfirm(imgX, imgY, zoom)}
            className="flex-1 h-12 rounded-full bg-brand text-white font-bold text-[15px] transition hover:opacity-90"
          >
            Set position
          </button>
        </div>
      </div>
    </div>
  );
}
