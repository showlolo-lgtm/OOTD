import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Star, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOutfit, deleteOutfit } from '../api/outfits';
import { rateRecommendation } from '../api/recommendations';
import { generateTryOn } from '../api/tryon';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: outfit, isLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () => getOutfit(Number(id)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOutfit(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      toast.success('Outfit deleted');
      navigate('/outfits');
    },
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => rateRecommendation(Number(id), rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfit', id] });
    },
  });

  const tryOnMutation = useMutation({
    mutationFn: () => generateTryOn(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfit', id] });
      toast.success('Try-on complete!');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!outfit) return <p className="text-center text-gray-400 py-12">Outfit not found</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">{outfit.name}</h2>
          {outfit.occasion && (
            <span className="badge bg-primary-50 text-primary-600">{outfit.occasion}</span>
          )}
        </div>
        {outfit.source === 'ai_recommended' && (
          <span className="badge bg-warm-100 text-warm-500">AI Pick</span>
        )}
      </div>

      {/* Try-on image */}
      {outfit.tryon_image_path ? (
        <div className="card overflow-hidden">
          <img
            src={`/uploads/${outfit.tryon_image_path}`}
            alt="Virtual try-on"
            className="w-full object-cover"
          />
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
            AI-generated virtual try-on
          </div>
        </div>
      ) : (
        <button
          onClick={() => tryOnMutation.mutate()}
          disabled={tryOnMutation.isPending}
          className="w-full card p-6 text-center hover:shadow-md transition-shadow"
        >
          {tryOnMutation.isPending ? (
            <LoadingSpinner message="Generating try-on image... (15-30 seconds)" />
          ) : (
            <>
              <Wand2 className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Generate Virtual Try-On</p>
              <p className="text-xs text-gray-400 mt-1">See yourself wearing this outfit</p>
            </>
          )}
        </button>
      )}

      {/* Clothing items */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Items in this outfit</h3>
        <div className="grid grid-cols-3 gap-2">
          {outfit.items.map((oi) => (
            <div key={oi.id} className="card p-1">
              <img
                src={`/uploads/${oi.clothing_item.image_path}`}
                alt={oi.clothing_item.name || ''}
                className="w-full aspect-square object-cover rounded-xl"
              />
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {oi.clothing_item.name}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">
                  {oi.clothing_item.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather info */}
      {outfit.weather_data && (
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-600">
            Recommended for {outfit.weather_data.temp_celsius}°C, {outfit.weather_data.description}
          </p>
        </div>
      )}

      {/* Rating */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Rate this outfit</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => rateMutation.mutate(star)}
              className="p-1"
            >
              <Star
                className={`w-6 h-6 ${
                  outfit.rating && star <= outfit.rating
                    ? 'fill-warm-400 text-warm-400'
                    : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteMutation.mutate()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Delete Outfit
      </button>
    </div>
  );
}
