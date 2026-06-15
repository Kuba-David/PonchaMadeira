"use client";
import { useState } from "react";
import { WineOff, MapPin, Trash2, Pencil } from "lucide-react";
import { RatingBadge } from "./RatingBadge";
import type { PonchaRating } from "@/lib/supabase";
import { deleteRating } from "@/lib/ratings";
import { EditRatingModal } from "./EditRatingModal";

type Props = {
  rating: PonchaRating;
  onDelete: (id: string) => void;
  onUpdate: (r: PonchaRating) => void;
  onClick?: () => void;
};

export function RatingCard({ rating, onDelete, onUpdate, onClick }: Props) {
  const [editing, setEditing] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete rating for "${rating.place_name}"?`)) return;
    await deleteRating(rating.id);
    onDelete(rating.id);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
  }

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-2xl shadow-sm p-4 flex gap-3 items-start cursor-pointer hover:shadow-md transition"
      >
        <div className="size-14 rounded-xl overflow-hidden bg-cream flex items-center justify-center text-brand shrink-0">
          {rating.photo_url ? (
            <img src={rating.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <WineOff size={26} />
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
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{rating.address}</span>
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
              className="text-sanddark hover:text-brand transition"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete"
              className="text-sanddark hover:text-pinred transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <EditRatingModal
          rating={rating}
          onClose={() => setEditing(false)}
          onSaved={(r) => {
            onUpdate(r);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
