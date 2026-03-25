import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-500">OOTD</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wider uppercase">AI Stylist</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
