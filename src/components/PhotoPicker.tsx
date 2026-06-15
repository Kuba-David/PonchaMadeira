"use client";
import { useRef, useState } from "react";
import { Camera, ImageIcon, X, MoveVertical } from "lucide-react";

type Props = {
  displayUrl: string | null;
  onChange: (file: File | null) => void;
  objectPosition?: string;
  onReposition?: () => void;
};

export function PhotoPicker({ displayUrl, onChange, objectPosition, onReposition }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) onChange(file);
    e.target.value = "";
  }

  return (
    <div className="relative flex items-center gap-3">
      {/* Malý čtverec – stejný styl jako náhledy v kartách */}
      <button
        type="button"
        onClick={() => setShowOptions((v) => !v)}
        className="size-16 rounded-xl border border-sanddark bg-cream flex items-center justify-center overflow-hidden shrink-0 transition hover:opacity-90 cursor-pointer relative"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: objectPosition ?? "50% 50%" }}
          />
        ) : (
          <>
            <ImageIcon size={22} className="text-inksoft/40" />
            <span className="absolute top-1 right-1 size-4 rounded-full bg-inksoft/40 text-white text-[10px] font-bold flex items-center justify-center leading-none">+</span>
          </>
        )}
      </button>

      {/* Akce vedle čtverce */}
      {displayUrl ? (
        <div className="flex items-center gap-2">
          {onReposition && (
            <button
              type="button"
              onClick={onReposition}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-cream border border-sanddark text-[13px] font-semibold text-inksoft transition hover:border-brandlight"
            >
              <MoveVertical size={14} /> Position
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-cream border border-sanddark text-[13px] font-semibold text-inksoft transition hover:text-pinred hover:border-pinred/40"
          >
            <X size={14} /> Remove
          </button>
        </div>
      ) : (
        <span className="text-[14px] text-inksoft/70">Add a photo</span>
      )}

      {/* Volba zdroje fotky */}
      {showOptions && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
          <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-48 bg-white border border-sanddark rounded-2xl shadow-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); cameraRef.current?.click(); }}
            >
              <Camera size={18} className="text-inksoft shrink-0" />
              Camera
            </button>
            <div className="h-px bg-sanddark" />
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); galleryRef.current?.click(); }}
            >
              <ImageIcon size={18} className="text-inksoft shrink-0" />
              Gallery
            </button>
          </div>
        </>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
