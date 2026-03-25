import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shirt, Sparkles, ArrowRight, Plus, UserCircle, Wand2 } from 'lucide-react';
import { getWardrobe } from '../api/wardrobe';
import { getProfile } from '../api/profile';
import { getTodayRecommendations } from '../api/recommendations';
import { getWeather } from '../api/weather';
import WeatherBadge from '../components/recommendation/WeatherBadge';
import OutfitCard from '../components/outfit/OutfitCard';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: wardrobe = [] } = useQuery({
    queryKey: ['wardrobe'],
    queryFn: () => getWardrobe(),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: weather } = useQuery({
    queryKey: ['weather', profile?.location],
    queryFn: () => getWeather(profile!.location!),
    enabled: !!profile?.location,
  });

  const { data: todayOutfits = [] } = useQuery({
    queryKey: ['recommendations', 'today'],
    queryFn: getTodayRecommendations,
  });

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 18
      ? 'Good afternoon'
      : 'Good evening';

  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Category counts
  const counts: Record<string, number> = {};
  wardrobe.forEach((item) => {
    const cat = item.category || 'other';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{greeting}!</h2>
        <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      {/* Weather */}
      {weather && <WeatherBadge weather={weather} />}

      {/* Main CTA */}
      <button
        onClick={() => navigate('/recommend')}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-5 text-left shadow-lg shadow-primary-500/20 hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-5 h-5" />
              <span className="font-semibold text-lg">Get Today's Outfit</span>
            </div>
            <p className="text-sm text-primary-100">
              AI-powered recommendations based on weather & style
            </p>
          </div>
          <ArrowRight className="w-6 h-6" />
        </div>
      </button>

      {/* Today's recommendations */}
      {todayOutfits.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Today's Picks</h3>
          <div className="space-y-3">
            {todayOutfits.slice(0, 2).map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onClick={() => navigate(`/outfits/${outfit.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Wardrobe stats */}
      {wardrobe.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">My Wardrobe</h3>
            <button
              onClick={() => navigate('/wardrobe')}
              className="text-xs text-primary-500 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([cat, count]) => (
                <div key={cat} className="card p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                  <p className="text-xs text-gray-400 capitalize">{cat}s</p>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <Shirt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">Your wardrobe is empty</p>
          <p className="text-xs text-gray-400 mb-4">
            Start by adding your favorite clothes
          </p>
          <button onClick={() => navigate('/wardrobe/add')} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4 inline mr-1" />
            Add First Item
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {!profile?.body_photo_path && (
          <button
            onClick={() => navigate('/profile')}
            className="card p-4 text-left hover:shadow-md transition-shadow"
          >
            <UserCircle className="w-6 h-6 text-primary-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Set Up Profile</p>
            <p className="text-xs text-gray-400 mt-0.5">Add your photo for try-on</p>
          </button>
        )}
        <button
          onClick={() => navigate('/inspirations')}
          className="card p-4 text-left hover:shadow-md transition-shadow"
        >
          <Sparkles className="w-6 h-6 text-warm-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Style Inspiration</p>
          <p className="text-xs text-gray-400 mt-0.5">Save looks you love</p>
        </button>
      </div>
    </div>
  );
}
