import React from 'react';
import { Home, Compass, Library, Search, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'explore' | 'library' | 'settings' | 'search';
  onSelectTab: (tab: 'home' | 'explore' | 'library' | 'settings' | 'search') => void;
}

export function MobileBottomNav({ activeTab, onSelectTab }: MobileBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161422]/95 backdrop-blur-2xl border-t border-white/10 px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-2xl select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/80 active:scale-95'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/15 shadow-sm scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
