import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { ClothingItem, CATEGORIES } from '../../types';
import Modal from '../common/Modal';
import ClothingGrid from '../clothing/ClothingGrid';

interface OutfitBuilderProps {
  wardrobe: ClothingItem[];
  onSave: (name: string, itemIds: number[], occasion?: string) => void;
  saving?: boolean;
}

const SLOTS = [
  { category: 'top', label: 'Top' },
  { category: 'bottom', label: 'Bottom' },
  { category: 'shoes', label: 'Shoes' },
  { category: 'outerwear', label: 'Outerwear' },
  { category: 'accessory', label: 'Accessory' },
];

export default function OutfitBuilder({ wardrobe, onSave, saving }: OutfitBuilderProps) {
  const [slots, setSlots] = useState<Record<string, ClothingItem | null>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleSelectItem = (item: ClothingItem) => {
    if (activeSlot) {
      setSlots((prev) => ({ ...prev, [activeSlot]: item }));
      setActiveSlot(null);
    }
  };

  const handleRemoveSlot = (category: string) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const selectedItems = Object.values(slots).filter(Boolean) as ClothingItem[];
  const canSave = selectedItems.length >= 2 && name.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave(
      name,
      selectedItems.map((i) => i.id)
    );
    setSlots({});
    setName('');
  };

  const filteredForSlot = activeSlot
    ? wardrobe.filter((item) => item.category === activeSlot)
    : [];

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-800 mb-3">DIY Outfit Builder</h3>

      <input
        type="text"
        placeholder="Outfit name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />

      <div className="grid grid-cols-5 gap-2 mb-4">
        {SLOTS.map((slot) => {
          const item = slots[slot.category];
          return (
            <div key={slot.category} className="text-center">
              {item ? (
                <div className="relative">
                  <img
                    src={`/uploads/${item.image_path}`}
                    alt={item.name || ''}
                    className="w-full aspect-square rounded-xl object-cover border-2 border-primary-200"
                  />
                  <button
                    onClick={() => handleRemoveSlot(slot.category)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveSlot(slot.category)}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-300" />
                </button>
              )}
              <p className="text-[10px] text-gray-500 mt-1">{slot.label}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
      >
        <Save className="w-4 h-4" />
        Save Outfit
      </button>

      <Modal
        isOpen={!!activeSlot}
        onClose={() => setActiveSlot(null)}
        title={`Pick ${activeSlot}`}
      >
        {filteredForSlot.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No {activeSlot} items in your wardrobe yet.
          </p>
        ) : (
          <ClothingGrid
            items={filteredForSlot}
            onItemClick={handleSelectItem}
            compact
          />
        )}
      </Modal>
    </div>
  );
}
