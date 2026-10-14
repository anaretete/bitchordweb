import React, { useState, useEffect } from 'react';
import { usePlayerStore } from './stores/playerStore';
import { TvTopNavigationBar } from './components/tv/TvTopNavigationBar';
import { TvHomeScreen } from './components/tv/TvHomeScreen';
import { TvExploreScreen } from './components/tv/TvExploreScreen';
import { TvLibraryScreen } from './components/tv/TvLibraryScreen';
import { TvSettingsScreen } from './components/tv/TvSettingsScreen';
import { TvSearchScreen } from './components/tv/TvSearchScreen';
import { TvNowPlayingScreen } from './components/tv/TvNowPlayingScreen';
import { MiniPlayer } from './components/tv/MiniPlayer';
import { MobileBottomNav } from './components/tv/MobileBottomNav';
import { YtMusicLoginModal } from './components/auth/YtMusicLoginModal';

export default function App() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    isFullPlayerOpen,
    setFullPlayerOpen,
    ambientPalette,
    ambientLightingEnabled,
    ambientIntensity,
    tvTheme,
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

  // Determine dynamic background styling based on active theme
  const getBackgroundStyle = () => {
    if (tvTheme === 'oled') return { backgroundColor: '#000000' };
    if (tvTheme === 'midnight') return { backgroundColor: '#0c0e1a' };
    if (tvTheme === 'graphite') return { backgroundColor: '#18181b' };
    if (tvTheme === 'ember') {
      return {
        backgroundColor: '#120a0a',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.22) 0%, transparent 60%)',
      };
    }
    // Dynamic theme with ambient glow
    if (ambientLightingEnabled && ambientIntensity !== 'off' && ambientPalette?.backgroundGlow) {
      const opacity = ambientIntensity === 'vibrant' ? '0.35' : '0.18';
      return {
        backgroundColor: '#14121b',
        backgroundImage: `radial-gradient(circle at 50% -10%, ${ambientPalette.primary}${Math.round(parseFloat(opacity) * 255).toString(16).padStart(2, '0')} 0%, transparent 55%)`,
      };
    }
    return { backgroundColor: '#14121b' };
  };

  return (
    <div
      style={getBackgroundStyle()}
      className="min-h-screen text-white flex flex-col justify-between overflow-x-hidden relative selection:bg-red-500 transition-colors duration-700"
    >
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
      <main className="flex-1 w-full pb-36 md:pb-24">
        {activeTab === 'home' && <TvHomeScreen />}
        {activeTab === 'explore' && <TvExploreScreen />}
        {activeTab === 'library' && <TvLibraryScreen />}
        {activeTab === 'settings' && <TvSettingsScreen />}
        {activeTab === 'search' && <TvSearchScreen />}
      </main>

      {/* Persistent Floating Mini-Player */}
      {!isNowPlayingViewOpen && currentTrack && <MiniPlayer />}

      {/* Dedicated Mobile Bottom Tab Dock (< 768px) */}
      {!isNowPlayingViewOpen && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsNowPlayingViewOpen(false);
            setFullPlayerOpen(false);
          }}
        />
      )}

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
