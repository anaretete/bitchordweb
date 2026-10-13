import React, { useState, useEffect } from 'react';
import { usePlayerStore } from './stores/playerStore';
import { TvTopNavigationBar } from './components/tv/TvTopNavigationBar';
import { TvHomeScreen } from './components/tv/TvHomeScreen';
import { TvExploreScreen } from './components/tv/TvExploreScreen';
import { TvLibraryScreen } from './components/tv/TvLibraryScreen';
import { TvSettingsScreen } from './components/tv/TvSettingsScreen';
import { TvSearchScreen } from './components/tv/TvSearchScreen';
import { TvNowPlayingScreen } from './components/tv/TvNowPlayingScreen';
import { YtMusicLoginModal } from './components/auth/YtMusicLoginModal';

export default function App() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    isFullPlayerOpen,
    setFullPlayerOpen,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'library' | 'settings' | 'search'>('home');
  const [isNowPlayingViewOpen, setIsNowPlayingViewOpen] = useState(false);

  useEffect(() => {
    setIsNowPlayingViewOpen(isFullPlayerOpen);
  }, [isFullPlayerOpen]);

  // Global Keyboard & Remote Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (isNowPlayingViewOpen) {
          setIsNowPlayingViewOpen(false);
          setFullPlayerOpen(false);
          e.preventDefault();
        }
      } else if (e.code === 'Space' || e.key === 'MediaPlayPause') {
        togglePlay();
        e.preventDefault();
      } else if (e.key === 'MediaTrackNext') {
        nextTrack();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNowPlayingViewOpen, togglePlay, nextTrack, setFullPlayerOpen]);

  return (
    <div className="min-h-screen bg-[#14121b] text-white flex flex-col justify-between overflow-x-hidden relative selection:bg-red-500">
      {/* Top Capsule Navigation Bar matching Screenshots */}
      <TvTopNavigationBar
        activeTab={activeTab}
        isNowPlayingOpen={isNowPlayingViewOpen}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsNowPlayingViewOpen(false);
          setFullPlayerOpen(false);
        }}
        onToggleNowPlaying={() => {
          const nextState = !isNowPlayingViewOpen;
          setIsNowPlayingViewOpen(nextState);
          setFullPlayerOpen(nextState);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && <TvHomeScreen />}
        {activeTab === 'explore' && <TvExploreScreen />}
        {activeTab === 'library' && <TvLibraryScreen />}
        {activeTab === 'settings' && <TvSettingsScreen />}
        {activeTab === 'search' && <TvSearchScreen />}
      </main>

      {/* Fullscreen Now Playing Screen matching Screenshot 1 */}
      {isNowPlayingViewOpen && (
        <TvNowPlayingScreen
          onBack={() => {
            setIsNowPlayingViewOpen(false);
            setFullPlayerOpen(false);
          }}
        />
      )}

      {/* Account Login Modal */}
      <YtMusicLoginModal />
    </div>
  );
}
