"use client";
import { CameraOff, MapPin, X } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onDetail: () => void;
};

export function ReviewPreviewCard({ rating, onClose, onDetail }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 flex gap-3 items-start">
      <button
        onClick={onDetail}
        className="size-14 rounded-xl overflow-hidden bg-cream shrink-0 flex items-center justify-center text-inksoft hover:opacity-90 transition"
        aria-label="View detail"
      >
        {rating.photo_url ? (
          <img src={rating.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <CameraOff size={20} />
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
            <MapPin size={12} className="shrink-0 text-brand" />
            <span className="truncate">{rating.address}</span>
          </p>
        )}

        {rating.notes && (
          <p className="text-[13px] text-inksoft italic mt-1 line-clamp-2">
            &ldquo;{rating.notes}&rdquo;
          </p>
        )}
      </button>

      <div className="shrink-0">
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-sanddark hover:text-inksoft transition"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
