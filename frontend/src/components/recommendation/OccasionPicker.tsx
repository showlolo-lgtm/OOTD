import {
  Coffee,
  Briefcase,
  Heart,
  Dumbbell,
  Palmtree,
  PartyPopper,
} from 'lucide-react';

interface OccasionPickerProps {
  selected: string | null;
  onSelect: (occasion: string) => void;
}

const occasions = [
  { value: 'casual', label: 'Casual', Icon: Coffee, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'work', label: 'Work', Icon: Briefcase, color: 'bg-gray-50 text-gray-600 border-gray-200' },
  { value: 'date', label: 'Date Night', Icon: Heart, color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { value: 'sport', label: 'Sport', Icon: Dumbbell, color: 'bg-green-50 text-green-600 border-green-200' },
  { value: 'holiday', label: 'Holiday', Icon: Palmtree, color: 'bg-warm-50 text-warm-500 border-warm-200' },
  { value: 'party', label: 'Party', Icon: PartyPopper, color: 'bg-purple-50 text-purple-600 border-purple-200' },
];

export default function OccasionPicker({ selected, onSelect }: OccasionPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {occasions.map(({ value, label, Icon, color }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : `border-transparent ${color}`
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isSelected ? 'text-primary-500' : ''}`}
            />
            <span
              className={`text-xs font-medium ${
                isSelected ? 'text-primary-600' : ''
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
