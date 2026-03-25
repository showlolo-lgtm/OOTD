export interface ClothingItem {
  id: number;
  image_path: string;
  category: string | null;
  subcategory: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  pattern: string | null;
  seasons: string[] | null;
  occasions: string[] | null;
  warmth_level: number | null;
  name: string | null;
  ai_description: string | null;
  brand: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  body_photo_path: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  style_preferences: string[] | null;
  location: string | null;
  created_at: string;
}

export interface StyleInspiration {
  id: number;
  image_path: string;
  source_url: string | null;
  source_platform: string | null;
  ai_analysis: Record<string, unknown> | null;
  tags: string[] | null;
  created_at: string;
}

export interface OutfitItem {
  id: number;
  clothing_item_id: number;
  layer_order: number;
  clothing_item: ClothingItem;
}

export interface Outfit {
  id: number;
  name: string;
  occasion: string | null;
  source: string;
  tryon_image_path: string | null;
  weather_data: Weather | null;
  rating: number | null;
  created_at: string;
  items: OutfitItem[];
}

export interface Weather {
  temp_celsius: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  city?: string;
}

export interface RecommendationRequest {
  occasion: string;
  location?: string;
}

export type ClothingCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory';

export const CATEGORIES: { value: ClothingCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'top', label: 'Tops' },
  { value: 'bottom', label: 'Bottoms' },
  { value: 'dress', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessory', label: 'Accessories' },
];

export const OCCASIONS = [
  { value: 'casual', label: 'Casual', icon: 'coffee' },
  { value: 'work', label: 'Work', icon: 'briefcase' },
  { value: 'date', label: 'Date Night', icon: 'heart' },
  { value: 'sport', label: 'Sport', icon: 'dumbbell' },
  { value: 'holiday', label: 'Holiday', icon: 'palmtree' },
  { value: 'party', label: 'Party', icon: 'partyPopper' },
];

export const STYLE_PREFERENCES = [
  'Casual', 'Streetwear', 'Minimalist', 'Classic', 'Sporty',
  'Bohemian', 'Elegant', 'Vintage', 'Preppy', 'Edgy',
];
