import { Heart } from 'lucide-react';
import { ClothingItem } from '../../types';

interface ClothingCardProps {
  item: ClothingItem;
  onClick?: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  top: 'bg-blue-100 text-blue-700',
  bottom: 'bg-green-100 text-green-700',
  dress: 'bg-purple-100 text-purple-700',
  outerwear: 'bg-orange-100 text-orange-700',
  shoes: 'bg-yellow-100 text-yellow-700',
  accessory: 'bg-pink-100 text-pink-700',
};

export default function ClothingCard({ item, onClick, onToggleFavorite, compact }: ClothingCardProps) {
  if (compact) {
    return (
      <button onClick={onClick} className="card p-1 hover:shadow-md transition-shadow">
        <img
          src={`/uploads/${item.image_path}`}
          alt={item.name || 'Clothing'}
          className="w-full aspect-square object-cover rounded-xl"
        />
        <p className="text-xs text-gray-600 mt-1 px-1 truncate">{item.name}</p>
      </button>
    );
  }

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative">
        <img
          src={`/uploads/${item.image_path}`}
          alt={item.name || 'Clothing'}
          className="w-full aspect-square object-cover"
        />
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Heart
              className={`w-4 h-4 ${
                item.is_favorite ? 'fill-primary-500 text-primary-500' : 'text-gray-400'
              }`}
            />
          </button>
        )}
        {item.category && (
          <span
            className={`absolute bottom-2 left-2 badge ${
              categoryColors[item.category] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {item.category}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 truncate">
          {item.name || 'Unnamed item'}
        </p>
        {item.color_primary && (
          <p className="text-xs text-gray-400 mt-0.5">{item.color_primary}</p>
        )}
      </div>
    </div>
  );
}
