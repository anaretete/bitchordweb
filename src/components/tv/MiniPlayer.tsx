import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Maximize2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    isFavorite,
    toggleFavorite,
    setFullPlayerOpen,
    ambientPalette,
    ambientLightingEnabled,
    ambientIntensity,
  } = usePlayerStore();

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const isAmbientActive = ambientLightingEnabled && ambientIntensity !== 'off';

  return (
    <div
      className="fixed left-3 right-3 bottom-[72px] md:bottom-5 md:left-auto md:right-6 md:w-[420px] z-30 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-[#1a1726]/95 backdrop-blur-2xl border border-white/10 shadow-2xl transition-all hover:border-white/20 group"
        style={{
          boxShadow: isAmbientActive
            ? `0 12px 35px -8px ${ambientPalette.primary}35, 0 4px 12px rgba(0,0,0,0.5)`
            : '0 12px 35px -8px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top Progress Rail */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/15 overflow-hidden">
          <div
            className="h-full transition-all duration-150 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: isAmbientActive ? ambientPalette.accent : '#ffffff',
            }}
          />
        </div>

        {/* Mini Player Body */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 gap-3">
          {/* Left: Thumbnail & Info (Click to Expand Fullscreen) */}
          <div
            onClick={() => setFullPlayerOpen(true)}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            title="Open Now Playing"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 shadow">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none">
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-1 bg-white animate-bounce h-2 rounded-full" />
                    <span className="w-1 bg-white animate-bounce h-3.5 rounded-full" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 bg-white animate-bounce h-2.5 rounded-full" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-white/60 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Like Button */}
            <button
              onClick={toggleFavorite}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isFavorite
                  ? 'text-red-400 bg-red-500/15'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={isFavorite ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            {/* Skip Back (hidden on very small screens) */}
            <button
              onClick={previousTrack}
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            {/* Skip Next Button */}
            <button
              onClick={nextTrack}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Expand Button */}
            <button
              onClick={() => setFullPlayerOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
              title="Expand"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
