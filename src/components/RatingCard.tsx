"use client";
import { MapPin, Trash2, Calendar } from "lucide-react";
import { StarRating } from "./StarRating";
import type { PonchaRating } from "@/lib/supabase";
import { deleteRating } from "@/lib/ratings";

type Props = {
  rating: PonchaRating;
  onDelete: (id: string) => void;
  onClick?: () => void;
};

export function RatingCard({ rating, onDelete, onClick }: Props) {
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Smazat hodnocení pro "${rating.place_name}"?`)) return;
    await deleteRating(rating.id);
    onDelete(rating.id);
  }

  const date = new Date(rating.created_at).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{rating.place_name}</h3>
          {rating.address && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {rating.address}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
          aria-label="Smazat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <StarRating value={rating.rating} size={14} max={10} />
        <span className="text-xs text-gray-400 flex-shrink-0">
          {rating.rating}/10
        </span>
      </div>

      {rating.poncha_type && (
        <p className="text-xs text-amber-600 mt-1.5 font-medium">{rating.poncha_type}</p>
      )}

      {rating.notes && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{rating.notes}</p>
      )}

      <p className="text-xs text-gray-300 mt-2 flex items-center gap-1">
        <Calendar size={11} />
        {date}
      </p>
    </div>
  );
}
