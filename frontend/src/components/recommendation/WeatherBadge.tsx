import { Cloud, Sun, CloudRain, Snowflake, CloudSun } from 'lucide-react';
import { Weather } from '../../types';

interface WeatherBadgeProps {
  weather: Weather;
}

function WeatherIcon({ description }: { description: string }) {
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('drizzle'))
    return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (desc.includes('snow'))
    return <Snowflake className="w-5 h-5 text-blue-200" />;
  if (desc.includes('cloud') && desc.includes('clear'))
    return <CloudSun className="w-5 h-5 text-warm-400" />;
  if (desc.includes('cloud'))
    return <Cloud className="w-5 h-5 text-gray-400" />;
  return <Sun className="w-5 h-5 text-warm-400" />;
}

export default function WeatherBadge({ weather }: WeatherBadgeProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
      <WeatherIcon description={weather.description} />
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-800">{weather.temp_celsius}°</span>
          <span className="text-xs text-gray-400">feels {weather.feels_like}°</span>
        </div>
        <p className="text-xs text-gray-500 capitalize">{weather.description}</p>
      </div>
      {weather.city && (
        <span className="ml-auto text-xs text-gray-400">{weather.city}</span>
      )}
    </div>
  );
}
