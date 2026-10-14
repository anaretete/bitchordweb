import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageSquareQuote,
  ListMusic,
  MoreHorizontal,
  X,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  Share2,
  Film,
  Info,
  ArrowLeft,
  SkipBack,
  SkipForward,
  ChevronDown,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface TvNowPlayingScreenProps {
  onBack: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function TvNowPlayingScreen({ onBack }: TvNowPlayingScreenProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    setCurrentTime,
    previousTrack,
    nextTrack,
    isFavorite,
    toggleFavorite,
    lyrics,
    queue,
    queueIndex,
    repeatMode,
    cycleRepeat,
    shuffleMode,
    toggleShuffle,
    playTrackDirect,
    currentCanvas,
    liveCanvasEnabled,
    ambientPalette,
    ambientLightingEnabled,
    ambientIntensity,
    fetchCanvasForCurrentTrack,
    fetchLyricsForCurrentTrack,
  } = usePlayerStore();

  const [isLyricsMode, setIsLyricsMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastActiveIdxRef = useRef<number>(-1);
  const userScrolledTimeRef = useRef<number>(0);

  // Auto-fetch canvas & lyrics when track changes
  useEffect(() => {
    setVideoError(false);
    fetchCanvasForCurrentTrack();
    fetchLyricsForCurrentTrack();
    lastActiveIdxRef.current = -1;
  }, [currentTrack.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (showOptionsModal) {
          setShowOptionsModal(false);
        } else if (showQueue) {
          setShowQueue(false);
        } else if (isLyricsMode) {
          setIsLyricsMode(false);
        } else {
          onBack();
        }
      } else if (e.code === 'Space' && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOptionsModal, showQueue, isLyricsMode, onBack, togglePlay]);

  // Auto-scroll synchronized karaoke lyrics smoothly on line transition
  useEffect(() => {
    if (!isLyricsMode || !lyrics?.lines || !lyricsContainerRef.current) return;
    const currentMs = currentTime * 1000;
    const activeIdx = lyrics.lines.findIndex((line, i) => {
      const next = lyrics.lines[i + 1];
      return currentMs >= line.startTimeMs && (!next || currentMs < next.startTimeMs);
    });

    if (activeIdx >= 0 && activeIdx !== lastActiveIdxRef.current) {
      lastActiveIdxRef.current = activeIdx;
      // Only auto-scroll if user has not interacted with scroll within 3 seconds
      if (Date.now() - userScrolledTimeRef.current > 3000) {
        const el = lyricsContainerRef.current.children[activeIdx] as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, isLyricsMode, lyrics]);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const currentMs = currentTime * 1000;

  // Handle Scrubber Scrubbing
  const handleScrubberSeek = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(pct * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    handleScrubberSeek(e);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        handleScrubberSeek(moveEvent);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    const touch = e.touches[0];
    if (touch && scrubberRef.current) {
      const rect = scrubberRef.current.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      setCurrentTime(pct * duration);
    }

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingRef.current && moveEvent.touches[0] && scrubberRef.current) {
        const rect = scrubberRef.current.getBoundingClientRect();
        const clickX = moveEvent.touches[0].clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        setCurrentTime(pct * duration);
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleShare = () => {
    const url = `https://music.youtube.com/watch?v=${currentTrack.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasCanvasVideo = liveCanvasEnabled && currentCanvas?.url && !videoError;

  const isAmbientActive = ambientLightingEnabled && ambientIntensity !== 'off';

  return (
    <div className="fixed inset-0 z-50 bg-[#100e17] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Ambient Dynamic Artwork Backdrop Blur & Radial Atmosphere matching Screenshots */}
      {isAmbientActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000">
          {/* Blurred Artwork Layer */}
          <img
            src={currentTrack.thumbnail}
            alt=""
            className={`w-full h-full object-cover scale-150 blur-3xl saturate-200 transition-all duration-1000 ${
              ambientIntensity === 'vibrant' ? 'opacity-65' : 'opacity-35'
            }`}
          />
          {/* Multi-point glowing radial color meshes matching Screenshots 1 & 6 */}
          <div
            className="absolute inset-0 transition-all duration-1000 mix-blend-screen"
            style={{
              background: `
                radial-gradient(circle at 50% 40%, ${ambientPalette.backgroundGlow} 0%, transparent 62%),
                radial-gradient(ellipse at 85% 25%, ${ambientPalette.secondary}66 0%, transparent 52%),
                radial-gradient(ellipse at 15% 70%, ${ambientPalette.primary}55 0%, transparent 52%)
              `,
            }}
          />
          {/* Gentle vignette to maintain perfect contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#100e17]/95 via-[#100e17]/35 to-[#100e17]/75" />
        </div>
      )}

      {/* 2. Top Bar (Close button and canvas badge) */}
      <div className="relative z-20 px-5 sm:px-10 md:px-14 pt-4 sm:pt-6 flex items-center justify-between">
        <button
          onClick={isLyricsMode ? () => setIsLyricsMode(false) : onBack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white/80 hover:text-white shadow-lg backdrop-blur-md border border-white/5"
          aria-label="Back"
          title={isLyricsMode ? 'Return to Cover Art' : 'Back (Esc)'}
        >
          {isLyricsMode ? <ArrowLeft className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {hasCanvasVideo && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/80">
            <Film className="w-3.5 h-3.5 text-red-400" />
            <span className="capitalize">{currentCanvas.source} Canvas</span>
          </div>
        )}
      </div>

      {/* 3. Center Section */}
      {isLyricsMode ? (
        /* Full 2-Column Apple TV / BitChord TV Lyrics Overlay */
        <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-8 md:px-16 py-4 gap-12 max-w-7xl mx-auto w-full h-[calc(100vh-140px)]">
          {/* Left Column: Artwork + Title + Artist + Nerd Stats */}
          <div className="w-full md:w-[38%] flex flex-col items-center md:items-start text-center md:text-left shrink-0">
            <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/60 relative group">
              {hasCanvasVideo ? (
                <video
                  src={currentCanvas.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="mt-5 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md line-clamp-2">
                {currentTrack.title}
              </h2>
              <p className="text-base font-medium text-white/70">
                {currentTrack.artist}
              </p>
            </div>

            {/* Audio Stream Stats Pill */}
            <div className="mt-4 px-3.5 py-1.5 rounded-xl bg-black/50 border border-white/10 flex items-center gap-2 text-xs font-mono text-white/80">
              <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Opus / FLAC • 48 kHz / 24-bit • Lossless</span>
            </div>

            {/* BitChord Wave Logo Badge */}
            <div className="mt-4 flex items-center gap-2 text-white/40 text-xs font-medium">
              <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24">
                <path
                  d="M4 6.5c5-2.2 11-2.2 16 0M4 11.5c5-2.2 11-2.2 16 0M4 16.5c5-2.2 11-2.2 16 0"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span>BitChord Synchronized Lyrics</span>
            </div>
          </div>

          {/* Right Column: Fluid Auto-Scrolling Karaoke Lyrics Window */}
          <div
            ref={lyricsContainerRef}
            onScroll={() => {
              userScrolledTimeRef.current = Date.now();
            }}
            onWheel={() => {
              userScrolledTimeRef.current = Date.now();
            }}
            onTouchMove={() => {
              userScrolledTimeRef.current = Date.now();
            }}
            className="w-full md:w-[62%] h-[60vh] md:h-[70vh] overflow-y-auto space-y-7 md:space-y-8 py-32 px-4 md:px-8 text-left scrollbar-none touch-pan-y"
          >
            {lyrics && lyrics.lines && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line, idx) => {
                const isCurrent =
                  currentMs >= line.startTimeMs &&
                  (!lyrics.lines[idx + 1] || currentMs < lyrics.lines[idx + 1].startTimeMs);

                return (
                  <p
                    key={idx}
                    onClick={() => setCurrentTime(line.startTimeMs / 1000)}
                    className={`cursor-pointer transition-all duration-300 leading-snug select-text ${
                      isCurrent
                        ? 'text-white font-extrabold text-2xl sm:text-3xl md:text-4xl scale-[1.02] origin-left drop-shadow-[0_0_24px_rgba(255,255,255,0.7)]'
                        : 'text-white/35 font-semibold text-lg sm:text-xl md:text-2xl hover:text-white/70'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <div className="py-24 text-white/40 text-lg font-medium text-center">
                Loading synchronized lyrics...
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Centered Album Artwork matching Screenshot 1 */
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 my-auto">
          <div
            className="w-[74vw] max-w-[300px] h-[74vw] max-h-[300px] sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-white/10 bg-black/60 cursor-pointer group relative transition-all duration-700"
            style={{
              boxShadow: isAmbientActive
                ? ambientPalette.glowShadow
                : '0 24px 60px rgba(0,0,0,0.85)',
            }}
            onClick={togglePlay}
          >
            {hasCanvasVideo ? (
              <video
                src={currentCanvas.url}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {/* Subtle Play / Pause Overlay on Hover */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Controls matching Screenshot 1 (Desktop/Landscape) & Mobile Portrait */}
      <div className="relative z-20 px-5 sm:px-12 md:px-20 pb-6 sm:pb-8 space-y-4">
        {/* DESKTOP / TV / LANDSCAPE ROW: Track Title/Artist on Left, 4 Circular Frosted Buttons on Right */}
        <div className="hidden md:flex items-end justify-between gap-6">
          {/* Left: Title & Artist */}
          <div className="space-y-1 min-w-0 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate drop-shadow-md">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-white/60 truncate">
              {currentTrack.artist} — {currentTrack.album}
            </p>
          </div>

          {/* Right: 4 Frosted Circular Action Buttons matching Screenshot 1 */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Button 1: Like / Heart */}
            <button
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isFavorite
                  ? 'bg-red-600/30 text-red-400 border-red-500/50'
                  : 'bg-[#252230]/85 hover:bg-[#322d40] border-white/5 text-white/80 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from Liked' : 'Like'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            {/* Button 2: Synced Lyrics (Speech Bubble with quotes) */}
            <button
              onClick={() => setIsLyricsMode(!isLyricsMode)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isLyricsMode
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-[#252230]/85 hover:bg-[#322d40] border-white/5 text-white/80 hover:text-white'
              }`}
              title="Synchronized Lyrics"
            >
              <MessageSquareQuote className="w-5 h-5" />
            </button>

            {/* Button 3: Queue / Up Next (List icon) */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                showQueue
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-[#252230]/85 hover:bg-[#322d40] border-white/5 text-white/80 hover:text-white'
              }`}
              title="Up Next Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* Button 4: More Options (•••) */}
            <button
              onClick={() => setShowOptionsModal(true)}
              className="w-12 h-12 rounded-full bg-[#252230]/85 hover:bg-[#322d40] border border-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE PORTRAIT STACK: Title & Artist */}
        <div className="md:hidden space-y-1 text-left">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-md">
            {currentTrack.title}
          </h1>
          <p className="text-sm font-semibold text-white/65 truncate">
            {currentTrack.artist} — {currentTrack.album}
          </p>
        </div>

        {/* Full-Width Progress Scrubber Bar matching Screenshot 1 (with touch seeking) */}
        <div className="space-y-1.5 pt-1">
          <div
            ref={scrubberRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="group relative w-full h-5 flex items-center cursor-pointer touch-none"
          >
            {/* Background Rail */}
            <div className="w-full h-1.5 group-hover:h-2 rounded-full overflow-hidden transition-all bg-white/20">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: isAmbientActive ? ambientPalette.accent : '#ffffff',
                }}
              />
            </div>

            {/* Circular Scrubber Knob matching Screenshot 1 */}
            <div
              className="absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none -translate-x-1/2 group-hover:scale-125 transition-transform"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Time Display underneath progress bar */}
          <div className="flex items-center justify-between text-xs font-semibold text-white/55 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* MOBILE PORTRAIT PLAYBACK & ACTION ROW */}
        <div className="md:hidden pt-1 flex items-center justify-between">
          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                isFavorite
                  ? 'bg-red-600/30 text-red-400 border-red-500/50'
                  : 'bg-[#252230]/85 border-white/10 text-white/80'
              }`}
              title={isFavorite ? 'Remove from Liked' : 'Like'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsLyricsMode(!isLyricsMode)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                isLyricsMode
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-[#252230]/85 border-white/10 text-white/80'
              }`}
              title="Synchronized Lyrics"
            >
              <MessageSquareQuote className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 ${
                showQueue
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-[#252230]/85 border-white/10 text-white/80'
              }`}
              title="Up Next Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowOptionsModal(true)}
              className="w-10 h-10 rounded-full bg-[#252230]/85 border border-white/10 flex items-center justify-center text-white/80 transition-all cursor-pointer shadow-md active:scale-95"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Playback Cluster (Prev, Play/Pause, Next) */}
          <div className="flex items-center gap-2">
            <button
              onClick={previousTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-13 h-13 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow-xl"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Drawer Overlay */}
      {showQueue && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-md bg-[#13111b]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white">Up Next</h3>
              <p className="text-xs text-white/50">{queue.length} Tracks in Queue</p>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2 scrollbar-none">
            {queue.map((t, idx) => (
              <div
                key={`${t.id}-${idx}`}
                onClick={() => {
                  playTrackDirect(t, queue);
                }}
                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                  idx === queueIndex
                    ? 'bg-white/20 font-bold border border-white/20'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <img src={t.thumbnail} alt="" className="w-11 h-11 rounded-lg object-cover shadow" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white">{t.title}</p>
                  <p className="text-xs text-white/50 truncate">{t.artist}</p>
                </div>
                {idx === queueIndex && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/60">
            <span className="font-medium">Playback Controls</span>
            <div className="flex gap-2">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                  shuffleMode === 'on' ? 'text-red-400 font-bold' : ''
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={cycleRepeat}
                className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                  repeatMode !== 'off' ? 'text-red-400 font-bold' : ''
                }`}
                title="Repeat Mode"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13111b] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-base truncate">{currentTrack.title}</h3>
                <p className="text-xs text-white/50 truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-sm font-medium">
              <button
                onClick={handleShare}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-white/70" />
                  <span>Share Song Link</span>
                </div>
                {copiedLink && <span className="text-xs text-emerald-400 font-bold">Copied!</span>}
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  setIsLyricsMode(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-left transition-colors"
              >
                <MessageSquareQuote className="w-4 h-4 text-white/70" />
                <span>View Synced Lyrics</span>
              </button>

              {currentCanvas && (
                <div className="px-3 py-2.5 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-400" />
                    <span>Canvas Video Provider</span>
                  </div>
                  <span className="font-semibold text-white/80 capitalize">{currentCanvas.source}</span>
                </div>
              )}

              {/* Stats for Nerds */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px] font-mono text-white/60">
                <div className="flex justify-between">
                  <span>Track ID:</span>
                  <span className="text-white">{currentTrack.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-white">YouTube IFrame API</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Codec:</span>
                  <span className="text-white">Opus / AAC 256kbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Canvas:</span>
                  <span className="text-white">{currentCanvas ? `${currentCanvas.source} (Active)` : 'Static Artwork'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
