"use client";
import { CameraOff, MapPin, Trash2, SquarePen } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import type { PonchaRating } from "@/lib/supabase";
import { deleteRating } from "@/lib/ratings";
import { cityFromAddress } from "@/lib/geocode";

type Props = {
  rating: PonchaRating;
  onDelete: (id: string) => void;
  onEdit: (r: PonchaRating) => void;
  onClick?: () => void;
};

export function RatingCard({ rating, onDelete, onEdit, onClick }: Props) {
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete rating for "${rating.place_name}"?`)) return;
    await deleteRating(rating.id);
    onDelete(rating.id);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(rating);
  }

  return (
    <div
        onClick={onClick}
        className="bg-white rounded-2xl shadow-sm p-4 flex gap-3 items-start cursor-pointer hover:shadow-md transition"
      >
        <div className="size-14 rounded-xl overflow-hidden bg-cream flex items-center justify-center text-inksoft shrink-0">
          {rating.photo_url ? (
            <img src={rating.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <CameraOff size={20} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-[17px] text-ink truncate">
              {rating.place_name}
            </h3>
            <RatingBadge value={rating.rating} />
          </div>

          {rating.address && (
            <p className="flex items-center gap-1 text-[13px] text-inksoft mt-0.5 truncate">
              <MapPin size={12} className="shrink-0 text-brand" />
              <span className="truncate">{cityFromAddress(rating.address)}</span>
            </p>
          )}

          {rating.poncha_type && (
            <p className="text-xs text-brand font-medium mt-1">
              {rating.poncha_type}
            </p>
          )}

          {rating.notes && (
            <p className="text-[13px] text-inksoft italic mt-1 line-clamp-2">
              “{rating.notes}”
            </p>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={handleEdit}
              aria-label="Edit"
              className="text-inksoft/60 hover:text-brand transition"
            >
              <SquarePen size={18} />
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete"
              className="text-inksoft/60 hover:text-pinred transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
  );
}
