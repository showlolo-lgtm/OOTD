import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfile } from '../api/profile';
import { getWeather } from '../api/weather';
import { generateRecommendations, rateRecommendation } from '../api/recommendations';
import { generateTryOn } from '../api/tryon';
import { Outfit } from '../types';
import WeatherBadge from '../components/recommendation/WeatherBadge';
import OccasionPicker from '../components/recommendation/OccasionPicker';
import OutfitCard from '../components/outfit/OutfitCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LOADING_MESSAGES = [
  'Analyzing your wardrobe...',
  'Checking the weather forecast...',
  'Matching colors and styles...',
  'Creating the perfect outfits...',
  'Almost ready...',
];

export default function RecommendationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [occasion, setOccasion] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [tryingOn, setTryingOn] = useState<number | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: weather } = useQuery({
    queryKey: ['weather', profile?.location],
    queryFn: () => getWeather(profile!.location!),
    enabled: !!profile?.location,
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      // Cycle loading messages
      const interval = setInterval(() => {
        setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);

      return generateRecommendations({
        occasion: occasion!,
        location: profile?.location || undefined,
      }).finally(() => clearInterval(interval));
    },
    onSuccess: (data) => {
      setOutfits(data);
      setLoadingMsg(0);
    },
    onError: () => {
      setLoadingMsg(0);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number }) =>
      rateRecommendation(id, rating),
    onSuccess: (updated) => {
      setOutfits((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
    },
  });

  const tryOnMutation = useMutation({
    mutationFn: (outfitId: number) => {
      setTryingOn(outfitId);
      return generateTryOn(outfitId);
    },
    onSuccess: (updated) => {
      setOutfits((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      setTryingOn(null);
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      toast.success('Try-on complete!');
    },
    onError: () => {
      setTryingOn(null);
    },
  });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">Get Outfit Recommendations</h2>

      {/* Weather */}
      {weather ? (
        <WeatherBadge weather={weather} />
      ) : profile?.location ? (
        <p className="text-sm text-gray-400">Loading weather...</p>
      ) : (
        <div className="bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-500">
          Set your location in Profile for weather-based recommendations.
        </div>
      )}

      {/* Occasion picker */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">What's the occasion?</h3>
        <OccasionPicker selected={occasion} onSelect={setOccasion} />
      </div>

      {/* Generate button */}
      <button
        onClick={() => generateMutation.mutate()}
        disabled={!occasion || generateMutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Wand2 className="w-5 h-5" />
        {generateMutation.isPending ? 'Generating...' : 'Generate Outfits'}
      </button>

      {/* Loading state */}
      {generateMutation.isPending && (
        <LoadingSpinner message={LOADING_MESSAGES[loadingMsg]} />
      )}

      {/* Results */}
      {outfits.length > 0 && !generateMutation.isPending && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">
            Your Outfits ({outfits.length})
          </h3>
          {outfits.map((outfit) => (
            <div key={outfit.id}>
              <OutfitCard
                outfit={outfit}
                onClick={() => navigate(`/outfits/${outfit.id}`)}
                onTryOn={() => tryOnMutation.mutate(outfit.id)}
                onRate={(rating) => rateMutation.mutate({ id: outfit.id, rating })}
              />
              {tryingOn === outfit.id && (
                <LoadingSpinner message="Generating virtual try-on... This may take 15-30 seconds" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
