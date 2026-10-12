import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { usePlayerStore, trackToSong } from './stores/playerStore';
import { TvSetupScreen } from './components/tv/TvSetupScreen';
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
    isSetupCompleted,
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    tvTheme,
    isFullPlayerOpen,
    setFullPlayerOpen
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'library' | 'settings' | 'search'>('home');
  const [isNowPlayingViewOpen, setIsNowPlayingViewOpen] = useState(false);

  // Synchronize full player open state with Zustand store
  useEffect(() => {
    setIsNowPlayingViewOpen(isFullPlayerOpen);
  }, [isFullPlayerOpen]);

  // Global Keyboard & TV Remote Control D-Pad Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
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

  // If user has not completed onboarding setup, render mandatory Setup Screen
  if (!isSetupCompleted) {
    return (
      <div className="min-h-screen bg-[#09080e] text-white">
        <TvSetupScreen />
      </div>
    );
  }

  // Determine theme background
  const themeBg =
    tvTheme === 'oled'
      ? 'bg-black'
      : tvTheme === 'midnight'
      ? 'bg-[#0a0d1a]'
      : tvTheme === 'graphite'
      ? 'bg-[#121215]'
      : tvTheme === 'ember'
      ? 'bg-[#130b0b]'
      : 'bg-[#0c0a12]';

  return (
    <div className={`min-h-screen ${themeBg} text-white flex flex-col justify-between overflow-x-hidden relative selection:bg-red-500`}>
      {/* Dynamic Ambient Blur Backdrop if track is playing */}
      {currentTrack && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-25">
          <img
            src={currentTrack.thumbnail}
            alt=""
            className="w-full h-full object-cover scale-150 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
        </div>
      )}

      {/* Top Capsule Navigation Bar matching Screenshots 2, 3, 4, 5 */}
      <TvTopNavigationBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsNowPlayingViewOpen(false);
          setFullPlayerOpen(false);
        }}
        onOpenNowPlaying={() => {
          setIsNowPlayingViewOpen(true);
          setFullPlayerOpen(true);
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

      {/* Floating Global Mini Player Bar on bottom right (from Kotlin lines 266-276 / 307-317) */}
      {currentTrack && !isNowPlayingViewOpen && (
        <div
          onClick={() => {
            setIsNowPlayingViewOpen(true);
            setFullPlayerOpen(true);
          }}
          className="fixed bottom-6 right-8 md:right-12 z-30 bg-[#1e1b29]/90 hover:bg-[#282436] backdrop-blur-2xl border border-white/10 rounded-2xl p-3 pr-5 flex items-center gap-4 cursor-pointer shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 group max-w-sm"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-900 shadow-md">
            <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate group-hover:text-white">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-white/50 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>
        </div>
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

      {/* YouTube Music Google Login Dialog */}
      <YtMusicLoginModal />
    </div>
  );
}
