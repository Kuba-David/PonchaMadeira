"use client";
import { CameraIcon, GalleryIcon } from "./icons";

type Props = {
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
};

// Centrovaný modal pro výběr zdroje fotky (nahrazuje původní dropdown menu).
export function PhotoSourceModal({ onCamera, onGallery, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-8 bg-overlay/80"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full max-w-sm rounded-3xl shadow-xl p-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCamera}
          className="flex items-center justify-center gap-2 h-14 rounded-full border border-sanddark bg-cream font-bold text-inksoft transition active:scale-[0.98]"
        >
          <CameraIcon size={18} />
          Camera
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="flex items-center justify-center gap-2 h-14 rounded-full border border-sanddark bg-cream font-bold text-inksoft transition active:scale-[0.98]"
        >
          <GalleryIcon size={18} />
          Gallery
        </button>
      </div>
    </div>
  );
}
