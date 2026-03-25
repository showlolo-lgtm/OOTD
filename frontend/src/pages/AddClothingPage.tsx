import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { addClothingItem, updateClothingItem } from '../api/wardrobe';
import { ClothingItem, CATEGORIES } from '../types';
import ImageUpload from '../components/common/ImageUpload';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AddClothingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ClothingItem | null>(null);
  const [editFields, setEditFields] = useState<Partial<ClothingItem>>({});

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return addClothingItem(formData);
    },
    onSuccess: (data) => {
      setResult(data);
      setEditFields({
        category: data.category,
        name: data.name,
        color_primary: data.color_primary,
        subcategory: data.subcategory,
      });
    },
    onError: () => {
      toast.error('Upload failed');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateClothingItem(result!.id, editFields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      toast.success('Saved to wardrobe!');
      navigate('/wardrobe');
    },
  });

  const handleImageSelect = (file: File) => {
    setFile(file);
    setResult(null);
    uploadMutation.mutate(file);
  };

  const handleSave = () => {
    if (result) {
      updateMutation.mutate();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Add to Wardrobe</h2>

      <ImageUpload
        onImageSelect={handleImageSelect}
        label="Take a photo or upload"
        className="mb-4"
      />

      {uploadMutation.isPending && (
        <LoadingSpinner message="AI is analyzing your clothing..." />
      )}

      {result && !uploadMutation.isPending && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">AI analysis complete! Review and save.</span>
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
              <input
                type="text"
                value={editFields.name || ''}
                onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={editFields.category || ''}
                  onChange={(e) => setEditFields({ ...editFields, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Primary Color</label>
                <input
                  type="text"
                  value={editFields.color_primary || ''}
                  onChange={(e) =>
                    setEditFields({ ...editFields, color_primary: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Subcategory</label>
                <input
                  type="text"
                  value={editFields.subcategory || ''}
                  onChange={(e) =>
                    setEditFields({ ...editFields, subcategory: e.target.value })
                  }
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {result.ai_description && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  AI Description
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                  {result.ai_description}
                </p>
              </div>
            )}

            {result.seasons && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Seasons</label>
                <div className="flex gap-1.5">
                  {result.seasons.map((s) => (
                    <span key={s} className="badge bg-blue-50 text-blue-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.occasions && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Occasions</label>
                <div className="flex flex-wrap gap-1.5">
                  {result.occasions.map((o) => (
                    <span key={o} className="badge bg-green-50 text-green-600">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary w-full"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save to Wardrobe'}
          </button>
        </div>
      )}
    </div>
  );
}
