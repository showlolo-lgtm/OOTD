import { useState } from 'react';
import { ClothingItem, CATEGORIES } from '../../types';
import ClothingCard from './ClothingCard';

interface ClothingGridProps {
  items: ClothingItem[];
  onItemClick?: (item: ClothingItem) => void;
  onToggleFavorite?: (item: ClothingItem) => void;
  compact?: boolean;
}

export default function ClothingGrid({
  items,
  onItemClick,
  onToggleFavorite,
  compact,
}: ClothingGridProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {!compact && (
        <>
          <input
            type="text"
            placeholder="Search your wardrobe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 mb-3"
          />

          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat.value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No items found</p>
        </div>
      ) : (
        <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-2 gap-3'}`}>
          {filtered.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
