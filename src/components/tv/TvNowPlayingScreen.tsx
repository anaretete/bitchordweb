import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  ListMusic,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Share2,
  Plus
} from 'lucide-react';
import { usePlayerStore, trackToSong } from '../../stores/playerStore';
import type { Song } from '../../types';

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
    nextTrack,
    previousTrack,
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
    playSong
  } = usePlayerStore();

  const [isLyricsMode, setIsLyricsMode] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  if (!currentTrack) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0a10] flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-6">
          <ListMusic className="w-12 h-12 text-white/50" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2">No Track Playing</h2>
        <p className="text-white/60 mb-6 max-w-md">Select any song from Home, Explore, or Library to start playback.</p>
        <button
          onClick={onBack}
          className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all cursor-pointer"
        >
          Explore Music
        </button>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentMs = currentTime * 1000;

  return (
    <div className="fixed inset-0 z-50 bg-[#09080e] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Dynamic Fullscreen Ambient Backdrop Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.thumbnail}
          alt=""
          className="w-full h-full object-cover scale-125 blur-3xl opacity-35 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-radial from-transparent to-black/70" />
      </div>

      {/* 2. Top Bar with Back Button */}
      <div className="relative z-10 px-8 md:px-12 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-white shadow-lg"
          aria-label="Back"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-sm font-semibold text-white/60 uppercase tracking-widest">
          Now Playing
        </div>

        <div className="w-10" />
      </div>

      {/* 3. Main Center Area: Album Cover OR Synchronized Lyrics */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 md:px-16 my-auto">
        {isLyricsMode ? (
          /* Synchronized Karaoke Lyrics View */
          <div
            ref={lyricsContainerRef}
            className="w-full max-w-2xl h-[420px] overflow-y-auto space-y-6 text-center py-20 px-4 scrollbar-none"
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
              <div className="py-24 text-white/50 text-lg">
                Lyrics unavailable for this track.
              </div>
            )}
          </div>
        ) : (
          /* Large Album Artwork matching Screenshot 1 */
          <div className="relative group cursor-pointer" onClick={togglePlay}>
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Ambient Shadow glow */}
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-40 -z-10 transition-opacity"
              style={{
                background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Section: Track Info (Left), 4 Frosted Buttons (Right), and Scrubber (Full Width) */}
      <div className="relative z-10 px-8 md:px-14 pb-8 space-y-5">
        {/* Track Title/Artist on Left, 4 Circular Frosted Buttons on Right */}
        <div className="flex items-end justify-between gap-6">
          {/* Left: Title & Artist */}
          <div className="space-y-1.5 max-w-xl">
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
              onClick={() => setShowMenu(!showMenu)}
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

          {/* Time Display underneath progress bar on left */}
          <div className="flex justify-between text-xs font-semibold text-white/60 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
                  playSong(trackToSong(t), queue.map(trackToSong));
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

      {/* Song Action Menu Dialog (•••) */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1726] border border-white/15 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <img src={currentTrack.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{currentTrack.title}</h4>
                <p className="text-xs text-white/50 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <button
                onClick={() => {
                  toggleFavorite();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-white transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                <span>{isFavorite ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-white transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Song Link</span>
              </button>
            </div>

            <button
              onClick={() => setShowMenu(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
