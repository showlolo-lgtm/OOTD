import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOutfits, createOutfit } from '../api/outfits';
import { getWardrobe } from '../api/wardrobe';
import { rateRecommendation } from '../api/recommendations';
import OutfitCard from '../components/outfit/OutfitCard';
import OutfitBuilder from '../components/outfit/OutfitBuilder';

export default function OutfitsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');

  const { data: outfits = [] } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => getOutfits(),
  });

  const { data: wardrobe = [] } = useQuery({
    queryKey: ['wardrobe'],
    queryFn: () => getWardrobe(),
  });

  const createMutation = useMutation({
    mutationFn: ({
      name,
      itemIds,
      occasion,
    }: {
      name: string;
      itemIds: number[];
      occasion?: string;
    }) => createOutfit({ name, clothing_item_ids: itemIds, occasion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      toast.success('Outfit saved!');
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number }) =>
      rateRecommendation(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });

  const filtered = outfits.filter((o) => {
    if (filter === 'ai') return o.source === 'ai_recommended';
    if (filter === 'manual') return o.source === 'user_created';
    return true;
  });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">My Outfits</h2>

      {/* DIY Builder */}
      {wardrobe.length >= 2 && (
        <OutfitBuilder
          wardrobe={wardrobe}
          onSave={(name, itemIds, occasion) =>
            createMutation.mutate({ name, itemIds, occasion })
          }
          saving={createMutation.isPending}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'ai', label: 'AI Picks' },
          { value: 'manual', label: 'My Creations' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Outfits grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">
            {outfits.length === 0
              ? 'No outfits yet. Use the builder above or get AI recommendations!'
              : 'No outfits match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onClick={() => navigate(`/outfits/${outfit.id}`)}
              onRate={(rating) => rateMutation.mutate({ id: outfit.id, rating })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
