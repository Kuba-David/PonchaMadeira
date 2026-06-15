"use client";
import { useRef, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";

type Props = {
  displayUrl: string | null;
  onChange: (file: File | null) => void;
};

export function PhotoPicker({ displayUrl, onChange }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) onChange(file);
    e.target.value = "";
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setShowOptions((v) => !v)}
        className="w-full h-[100px] rounded-xl border border-sanddark bg-cream flex items-center justify-center overflow-hidden transition hover:opacity-90 cursor-pointer"
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={28} className="text-inksoft/50" />
        )}
      </button>

      {displayUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center"
        >
          <X size={14} className="text-white" />
        </button>
      )}

      {showOptions && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
          <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] z-20 bg-white border border-sanddark rounded-2xl shadow-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); cameraRef.current?.click(); }}
            >
              <Camera size={18} className="text-inksoft shrink-0" />
              Fotoaparát
            </button>
            <div className="h-px bg-sanddark" />
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); galleryRef.current?.click(); }}
            >
              <ImageIcon size={18} className="text-inksoft shrink-0" />
              Galerie
            </button>
          </div>
        </>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
