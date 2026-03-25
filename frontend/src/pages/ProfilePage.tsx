import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, uploadBodyPhoto } from '../api/profile';
import { STYLE_PREFERENCES } from '../types';
import ImageUpload from '../components/common/ImageUpload';

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const [form, setForm] = useState({
    height_cm: '',
    weight_kg: '',
    body_type: '',
    location: '',
    style_preferences: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        body_type: profile.body_type || '',
        location: profile.location || '',
        style_preferences: profile.style_preferences || [],
      });
    }
  }, [profile]);

  const photoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return uploadBodyPhoto(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo uploaded!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        body_type: form.body_type || null,
        location: form.location || null,
        style_preferences: form.style_preferences,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile saved!');
    },
  });

  const togglePref = (pref: string) => {
    setForm((prev) => ({
      ...prev,
      style_preferences: prev.style_preferences.includes(pref)
        ? prev.style_preferences.filter((p) => p !== pref)
        : [...prev.style_preferences, pref],
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Profile</h2>

      {/* Body photo */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">
          Body Photo (for virtual try-on)
        </label>
        <ImageUpload
          onImageSelect={(file) => photoMutation.mutate(file)}
          preview={profile?.body_photo_path ? `/uploads/${profile.body_photo_path}` : undefined}
          label="Upload a full-body photo"
        />
        {photoMutation.isPending && (
          <p className="text-xs text-gray-400 mt-2 animate-pulse">Uploading...</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-1 block">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location (for weather)
        </label>
        <input
          type="text"
          placeholder="e.g., San Francisco, Tokyo, London"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Measurements */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Measurements (optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Height (cm)</label>
            <input
              type="number"
              placeholder="170"
              value={form.height_cm}
              onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
            <input
              type="number"
              placeholder="65"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </div>

      {/* Body type */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Body Type (optional)</label>
        <div className="flex flex-wrap gap-2">
          {['Athletic', 'Slim', 'Average', 'Curvy', 'Plus'].map((type) => (
            <button
              key={type}
              onClick={() => setForm({ ...form, body_type: form.body_type === type ? '' : type })}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                form.body_type === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Style preferences */}
      <div>
        <label className="text-sm font-medium text-gray-600 mb-2 block">Style Preferences</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_PREFERENCES.map((pref) => {
            const isSelected = form.style_preferences.includes(pref);
            return (
              <button
                key={pref}
                onClick={() => togglePref(pref)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                {pref}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
