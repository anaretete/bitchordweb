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
  Activity,
  Tv,
  Check,
  Film
} from 'lucide-react';
import { usePlayerStore, trackToSong } from '../../stores/playerStore';

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
    fetchCanvasForCurrentTrack
  } = usePlayerStore();

  const [isLyricsMode, setIsLyricsMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Auto-fetch canvas when track changes
  useEffect(() => {
    setVideoError(false);
    fetchCanvasForCurrentTrack();
  }, [currentTrack.id]);

  // Keyboard navigation (Escape to back, Space to toggle play)
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
      } else if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOptionsModal, showQueue, isLyricsMode, onBack, togglePlay]);

  // Auto-scroll synchronized karaoke lyrics
  useEffect(() => {
    if (!isLyricsMode || !lyrics?.lines || !lyricsContainerRef.current) return;
    const currentMs = currentTime * 1000;
    const activeIdx = lyrics.lines.findIndex((line, i) => {
      const next = lyrics.lines[i + 1];
      return currentMs >= line.startTimeMs && (!next || currentMs < next.startTimeMs);
    });

    if (activeIdx >= 0) {
      const el = lyricsContainerRef.current.children[activeIdx] as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const handleShare = () => {
    const url = `https://music.youtube.com/watch?v=${currentTrack.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasCanvasVideo = liveCanvasEnabled && currentCanvas?.url && !videoError;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0a10] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Ambient Dynamic Artwork Backdrop Blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.thumbnail}
          alt=""
          className="w-full h-full object-cover scale-150 blur-3xl opacity-30 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a10] via-black/50 to-[#0c0a10]/80" />
      </div>

      {/* 2. Top Bar with back button */}
      <div className="relative z-10 px-6 sm:px-12 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white/80 hover:text-white shadow-lg backdrop-blur-md border border-white/5"
          aria-label="Back"
          title="Back to Browser (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {hasCanvasVideo && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/80">
            <Film className="w-3.5 h-3.5 text-red-400" />
            <span className="capitalize">{currentCanvas.source} Canvas</span>
          </div>
        )}
      </div>

      {/* 3. Center Section: 1:1 Album Artwork or Synced Lyrics */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 my-auto">
        {isLyricsMode ? (
          /* Synced Karaoke Lyrics View */
          <div
            ref={lyricsContainerRef}
            className="w-full max-w-2xl h-[400px] overflow-y-auto space-y-6 text-center py-20 px-4 scrollbar-none"
          >
            {lyrics && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line, idx) => {
                const isCurrent =
                  currentMs >= line.startTimeMs &&
                  (!lyrics.lines[idx + 1] || currentMs < lyrics.lines[idx + 1].startTimeMs);

                return (
                  <p
                    key={idx}
                    onClick={() => setCurrentTime(line.startTimeMs / 1000)}
                    className={`cursor-pointer transition-all duration-300 ${
                      isCurrent
                        ? 'text-white font-extrabold text-2xl md:text-3xl scale-105 drop-shadow-[0_0_24px_rgba(255,255,255,0.7)]'
                        : 'text-white/35 font-semibold text-lg md:text-xl hover:text-white/70'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <div className="py-24 text-white/40 text-base font-medium">
                {lyrics ? 'No synchronized lyrics available for this track' : 'Loading synchronized lyrics...'}
              </div>
            )}
          </div>
        ) : (
          /* Centered Album Artwork matching Screenshot 1 */
          <div
            className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 cursor-pointer group relative"
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
        )}
      </div>

      {/* 4. Bottom Controls matching Screenshot 1 */}
      <div className="relative z-10 px-6 sm:px-12 md:px-16 pb-8 space-y-4">
        {/* Track Title/Artist on Left, 4 Circular Frosted Buttons on Right */}
        <div className="flex items-end justify-between gap-6">
          {/* Left: Title & Artist */}
          <div className="space-y-1 min-w-0 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate drop-shadow-md">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base font-medium text-white/60 truncate">
              {currentTrack.artist} — {currentTrack.album}
            </p>
          </div>

          {/* Right: 4 Frosted Circular Action Buttons matching Screenshot 1 */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Button 1: Like / Heart */}
            <button
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 ${
                isFavorite
                  ? 'bg-red-600/30 text-red-400 border-red-500/50'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white/80 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from Liked Songs' : 'Like Song'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            {/* Button 2: Synced Lyrics (Speech Bubble with quotes) */}
            <button
              onClick={() => setIsLyricsMode(!isLyricsMode)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 ${
                isLyricsMode
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white/80 hover:text-white'
              }`}
              title="Synchronized Lyrics"
            >
              <MessageSquareQuote className="w-5 h-5" />
            </button>

            {/* Button 3: Queue / Up Next (List icon) */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 ${
                showQueue
                  ? 'bg-white/30 text-white border-white/50'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white/80 hover:text-white'
              }`}
              title="Up Next Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* Button 4: More Options (•••) */}
            <button
              onClick={() => setShowOptionsModal(true)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full-Width Progress Scrubber Bar matching Screenshot 1 */}
        <div className="space-y-1.5 pt-1">
          <div
            ref={scrubberRef}
            onMouseDown={handleMouseDown}
            className="group relative w-full h-4 flex items-center cursor-pointer"
          >
            {/* Background Rail */}
            <div className="w-full h-1 bg-white/20 group-hover:h-1.5 rounded-full overflow-hidden transition-all">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Circular Scrubber Knob matching Screenshot 1 */}
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -translate-x-1/2 group-hover:scale-125 transition-transform"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Time Display underneath progress bar on left matching Screenshot 1 */}
          <div className="flex items-center justify-between text-xs font-semibold text-white/55 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/40">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Queue Drawer Overlay */}
      {showQueue && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-md bg-[#12101b]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
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
          <div className="bg-[#12101b] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
