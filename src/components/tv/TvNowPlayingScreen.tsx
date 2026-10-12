import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  ListMusic,
  MoreHorizontal,
  X,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1
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
    playTrackDirect
  } = usePlayerStore();

  const [isLyricsMode, setIsLyricsMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll synchronized lyrics
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentMs = currentTime * 1000;

  return (
    <div className="fixed inset-0 z-50 bg-[#09080e] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Fullscreen Ambient Dynamic Artwork Blur Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.thumbnail}
          alt=""
          className="w-full h-full object-cover scale-150 blur-3xl opacity-35 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/75" />
      </div>

      {/* 2. Top Bar with clean close / back button */}
      <div className="relative z-10 px-8 md:px-14 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white shadow-lg"
          aria-label="Back"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-10" />
      </div>

      {/* 3. Center Artwork matching Screenshot 1 */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 my-auto">
        {isLyricsMode ? (
          /* Synchronized Karaoke Lyrics Mode */
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
                        ? 'text-white font-extrabold text-2xl md:text-3xl scale-105 drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]'
                        : 'text-white/40 font-semibold text-lg md:text-xl hover:text-white/70'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <div className="py-24 text-white/50 text-base">
                Synchronized lyrics loading...
              </div>
            )}
          </div>
        ) : (
          /* Centered Album Cover matching Screenshot 1 */
          <div
            className="w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 cursor-pointer group relative"
            onClick={togglePlay}
          >
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl">
                {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Controls matching Screenshot 1 */}
      <div className="relative z-10 px-8 md:px-14 pb-8 space-y-4">
        {/* Track Title/Artist on Left, 4 Circular Frosted Buttons on Right */}
        <div className="flex items-end justify-between gap-6">
          {/* Left: Title & Artist */}
          <div className="space-y-1 max-w-xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate drop-shadow-md">
              {currentTrack.title}
            </h1>
            <p className="text-sm md:text-base font-medium text-white/70 truncate">
              {currentTrack.artist} — {currentTrack.album}
            </p>
          </div>

          {/* Right: 4 Frosted Circular Buttons matching Screenshot 1 */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Button 1: Like / Heart */}
            <button
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isFavorite
                  ? 'bg-red-600/30 text-red-400 border-red-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
              title="Like Song"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            {/* Button 2: Lyrics (Speech Bubble) */}
            <button
              onClick={() => setIsLyricsMode(!isLyricsMode)}
              className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isLyricsMode
                  ? 'bg-white/30 text-white border-white/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
              title="Lyrics"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Button 3: Queue / Playlist (List icon) */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                showQueue
                  ? 'bg-white/30 text-white border-white/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
              title="Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* Button 4: More Options (•••) */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full-Width Progress Scrubber Bar matching Screenshot 1 */}
        <div className="space-y-1.5">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setCurrentTime(pct * duration);
            }}
            className="group relative w-full h-4 flex items-center cursor-pointer"
          >
            {/* Background Rail */}
            <div className="w-full h-1 bg-white/25 group-hover:h-1.5 rounded-full overflow-hidden transition-all">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Circular Scrubber Knob matching Screenshot 1 */}
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Time Display underneath progress bar on left matching Screenshot 1 */}
          <div className="text-xs font-semibold text-white/60 px-0.5">
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* Queue Modal Overlay */}
      {showQueue && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-md bg-[#12101b]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Up Next</h3>
            <button
              onClick={() => setShowQueue(false)}
              className="p-1 rounded-lg text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {queue.map((t, idx) => (
              <div
                key={`${t.id}-${idx}`}
                onClick={() => {
                  playTrackDirect(t, queue);
                }}
                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                  idx === queueIndex ? 'bg-white/20 font-bold' : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <img src={t.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white">{t.title}</p>
                  <p className="text-xs text-white/50 truncate">{t.artist}</p>
                </div>
                {idx === queueIndex && (
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
            <span>{queue.length} Tracks in Queue</span>
            <div className="flex gap-2">
              <button onClick={toggleShuffle} className="p-2 hover:text-white">
                <Shuffle className={`w-4 h-4 ${shuffleMode === 'on' ? 'text-red-400' : ''}`} />
              </button>
              <button onClick={cycleRepeat} className="p-2 hover:text-white">
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 text-red-400" /> : <Repeat className={`w-4 h-4 ${repeatMode === 'all' ? 'text-red-400' : ''}`} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
