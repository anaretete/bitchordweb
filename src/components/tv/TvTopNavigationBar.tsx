import React from 'react';
import { Search, Settings } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface TvTopNavigationBarProps {
  activeTab: 'home' | 'explore' | 'library' | 'settings' | 'search';
  isNowPlayingOpen: boolean;
  onSelectTab: (tab: 'home' | 'explore' | 'library' | 'settings' | 'search') => void;
  onToggleNowPlaying: () => void;
}

export function TvTopNavigationBar({
  activeTab,
  isNowPlayingOpen,
  onSelectTab,
  onToggleNowPlaying,
}: TvTopNavigationBarProps) {
  const { isSignedIn, userProfile, setAuthModalOpen } = usePlayerStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-10 md:px-14 pt-3.5 sm:pt-5 pb-3 flex items-center justify-between pointer-events-none select-none">
      {/* Left: BitChord Wave Logo (3 Curved White Waves) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => {
            onSelectTab('home');
          }}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          title="BitChord TV"
        >
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
          <span className="md:hidden text-base font-black tracking-tight text-white/90">
            BitChord
          </span>
        </button>
      </div>

      {/* Center: Floating Capsule Navigation Pill Bar matching Screenshot 4 (Desktop/TV/Landscape) */}
      <nav className="pointer-events-auto hidden md:flex bg-[#262432]/90 backdrop-blur-2xl border border-white/5 rounded-full px-2 py-1.5 items-center gap-1 shadow-2xl">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            !isNowPlayingOpen && activeTab === 'home'
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Home
        </button>

        {/* Explore */}
        <button
          onClick={() => onSelectTab('explore')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            !isNowPlayingOpen && activeTab === 'explore'
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Explore
        </button>

        {/* Library */}
        <button
          onClick={() => onSelectTab('library')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            !isNowPlayingOpen && activeTab === 'library'
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Library
        </button>

        {/* Now Playing */}
        <button
          onClick={onToggleNowPlaying}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            isNowPlayingOpen
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Now Playing
        </button>

        {/* Search Icon */}
        <button
          onClick={() => onSelectTab('search')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            !isNowPlayingOpen && activeTab === 'search'
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
          aria-label="Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings Gear Icon in Circle */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            !isNowPlayingOpen && activeTab === 'settings'
              ? 'bg-[#4a475a] text-white shadow-md'
              : 'text-white/70 hover:text-white'
          }`}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>

      {/* Right: User Avatar & Mobile Now Playing button */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <button
          onClick={onToggleNowPlaying}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 active:scale-95 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>Playing</span>
        </button>

        <button
          onClick={() => setAuthModalOpen(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all cursor-pointer shadow-lg active:scale-95 bg-[#252332] flex items-center justify-center"
          title={isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Google & YouTube Music Sign-In'}
        >
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
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
