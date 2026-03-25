import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shirt, PlusCircle, Sparkles, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/wardrobe', icon: Shirt, label: 'Wardrobe' },
  { path: '/wardrobe/add', icon: PlusCircle, label: 'Add', isAction: true },
  { path: '/inspirations', icon: Sparkles, label: 'Inspire' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center -mt-4"
              >
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] mt-1 text-primary-500 font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center py-1 min-w-[60px]"
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'text-primary-500 font-medium' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
