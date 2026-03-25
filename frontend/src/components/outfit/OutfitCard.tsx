import { Star, Wand2 } from 'lucide-react';
import { Outfit } from '../../types';

interface OutfitCardProps {
  outfit: Outfit;
  onTryOn?: () => void;
  onRate?: (rating: number) => void;
  onClick?: () => void;
}

export default function OutfitCard({ outfit, onTryOn, onRate, onClick }: OutfitCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow" onClick={onClick}>
      {outfit.tryon_image_path && (
        <img
          src={`/uploads/${outfit.tryon_image_path}`}
          alt={outfit.name}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-800">{outfit.name}</h3>
            {outfit.occasion && (
              <span className="badge bg-primary-50 text-primary-600 mt-1">
                {outfit.occasion}
              </span>
            )}
          </div>
          {outfit.source === 'ai_recommended' && (
            <span className="badge bg-warm-100 text-warm-500">AI</span>
          )}
        </div>

        {/* Item thumbnails */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {outfit.items.map((oi) => (
            <img
              key={oi.id}
              src={`/uploads/${oi.clothing_item.image_path}`}
              alt={oi.clothing_item.name || ''}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100"
            />
          ))}
        </div>

        {/* Weather info */}
        {outfit.weather_data && (
          <p className="text-xs text-gray-400 mt-2">
            {outfit.weather_data.temp_celsius}°C, {outfit.weather_data.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          {/* Rating */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate?.(star);
                }}
                className="p-0.5"
              >
                <Star
                  className={`w-4 h-4 ${
                    outfit.rating && star <= outfit.rating
                      ? 'fill-warm-400 text-warm-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {onTryOn && !outfit.tryon_image_path && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTryOn();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Try On
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
