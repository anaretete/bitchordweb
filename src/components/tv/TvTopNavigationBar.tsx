import React from 'react';
import { Search, Settings, Music, User } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface TvTopNavigationBarProps {
  activeTab: 'home' | 'explore' | 'library' | 'settings' | 'search';
  onSelectTab: (tab: 'home' | 'explore' | 'library' | 'settings' | 'search') => void;
  onOpenNowPlaying: () => void;
}

export function TvTopNavigationBar({
  activeTab,
  onSelectTab,
  onOpenNowPlaying,
}: TvTopNavigationBarProps) {
  const { isSignedIn, userProfile, setAuthModalOpen } = usePlayerStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-8 md:px-12 pt-6 pb-4 flex items-center justify-between pointer-events-none">
      {/* Left: BitChord Logo (3 Curved Waves) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          {/* Logo 3 waves matching ic_logo */}
          <div className="w-9 h-9 flex items-center justify-center">
            <svg className="w-8 h-8 text-white transition-transform group-hover:scale-105" viewBox="0 0 24 24">
              <path
                d="M4 6.5c5-2.2 11-2.2 16 0M4 11.5c5-2.2 11-2.2 16 0M4 16.5c5-2.2 11-2.2 16 0"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Center: Floating Capsule Navigation Pill Bar */}
      <nav className="pointer-events-auto bg-[#1b1924]/85 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 flex items-center gap-1 shadow-2xl">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#3e3b4a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Home
        </button>

        {/* Explore */}
        <button
          onClick={() => onSelectTab('explore')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-[#3e3b4a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Explore
        </button>

        {/* Library */}
        <button
          onClick={() => onSelectTab('library')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'bg-[#3e3b4a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Library
        </button>

        {/* Now Playing */}
        <button
          onClick={onOpenNowPlaying}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
        >
          Now Playing
        </button>

        {/* Search Icon */}
        <button
          onClick={() => onSelectTab('search')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-[#3e3b4a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings Gear Icon in Circle */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#3e3b4a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>

      {/* Right: User Avatar */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setAuthModalOpen(true)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all cursor-pointer shadow-lg active:scale-95 bg-[#252332] flex items-center justify-center"
          title={isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Sign in to YouTube Music'}
        >
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            // Anime boy with cap default avatar matching screenshot
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          )}
        </button>
      </div>
    </header>
  );
}
