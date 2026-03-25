import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWardrobe, updateClothingItem, deleteClothingItem } from '../api/wardrobe';
import { ClothingItem, CATEGORIES } from '../types';
import ClothingGrid from '../components/clothing/ClothingGrid';
import Modal from '../components/common/Modal';

export default function WardrobePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['wardrobe'],
    queryFn: () => getWardrobe(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClothingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      setSelectedItem(null);
      toast.success('Item deleted');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (item: ClothingItem) =>
      updateClothingItem(item.id, { is_favorite: !item.is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Wardrobe</h2>
          <p className="text-sm text-gray-400">{items.length} items</p>
        </div>
        <button
          onClick={() => navigate('/wardrobe/add')}
          className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ClothingGrid
          items={items}
          onItemClick={setSelectedItem}
          onToggleFavorite={(item) => favoriteMutation.mutate(item)}
        />
      )}

      {/* Item detail modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || 'Item Details'}
      >
        {selectedItem && (
          <div className="space-y-4">
            <img
              src={`/uploads/${selectedItem.image_path}`}
              alt={selectedItem.name || ''}
              className="w-full h-64 object-cover rounded-xl"
            />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedItem.category && (
                  <span className="badge bg-primary-50 text-primary-600">
                    {selectedItem.category}
                  </span>
                )}
                {selectedItem.subcategory && (
                  <span className="badge bg-gray-100 text-gray-600">
                    {selectedItem.subcategory}
                  </span>
                )}
                {selectedItem.pattern && (
                  <span className="badge bg-gray-100 text-gray-600">
                    {selectedItem.pattern}
                  </span>
                )}
              </div>

              {selectedItem.color_primary && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: selectedItem.color_primary }}
                  />
                  <span className="text-sm text-gray-600">{selectedItem.color_primary}</span>
                  {selectedItem.color_secondary && (
                    <>
                      <div
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: selectedItem.color_secondary }}
                      />
                      <span className="text-sm text-gray-600">{selectedItem.color_secondary}</span>
                    </>
                  )}
                </div>
              )}

              {selectedItem.ai_description && (
                <p className="text-sm text-gray-500">{selectedItem.ai_description}</p>
              )}

              {selectedItem.seasons && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Seasons</p>
                  <div className="flex gap-1">
                    {selectedItem.seasons.map((s) => (
                      <span key={s} className="badge bg-blue-50 text-blue-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.occasions && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Occasions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.occasions.map((o) => (
                      <span key={o} className="badge bg-green-50 text-green-600">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => deleteMutation.mutate(selectedItem.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
