import React, { useState } from 'react';
import { usePlayerStore, SCREENSHOT_TRACKS } from '../../stores/playerStore';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function TvLibraryScreen() {
  const { playTrackDirect, currentTrack, isPlaying, setFullPlayerOpen } = usePlayerStore();
  const [activeCategory, setActiveCategory] = useState('Recently Played');

  const categories = [
    'Recently Played',
    'Liked Songs',
    'Songs',
    'Playlists',
    'Albums',
    'Artists',
    'Subscriptions',
    'Podcasts',
  ];

  // Exactly the songs matching Screenshot 3
  const librarySongs = [
    SCREENSHOT_TRACKS[2], // nayuta - 空に架かる君の声。
    SCREENSHOT_TRACKS[3], // kinoue64 - Every Day, rain or shine
    SCREENSHOT_TRACKS[4], // HOYO-MiX - Roots of Tranquil Eternity
    SCREENSHOT_TRACKS[0], // Eve - Pray
    SCREENSHOT_TRACKS[5], // xea - look at the sea / cover
    SCREENSHOT_TRACKS[6] || SCREENSHOT_TRACKS[1], // kinoue64 - 捨てる - suteru
    SCREENSHOT_TRACKS[7] || SCREENSHOT_TRACKS[2], // aminos - 花の画 - flower painting
  ];

  return (
    <div className="pt-24 pb-20 px-6 sm:px-10 md:px-14 flex flex-col md:flex-row gap-10 max-w-7xl mx-auto select-none">
      {/* Left Sub-Navigation Menu matching Screenshot 3 */}
      <div className="w-full md:w-56 shrink-0 flex md:flex-col gap-1.5 py-2 overflow-x-auto md:overflow-visible scrollbar-none">
        {categories.map((c) => {
          const isActive = activeCategory === c;
          return (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`text-left px-5 py-2.5 rounded-full md:rounded-2xl text-sm md:text-base font-medium transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#313040] text-white font-semibold shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Right Tracks Pane matching Screenshot 3 */}
      <div className="flex-1 py-2 space-y-1.5">
        {librarySongs.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => {
                playTrackDirect(track, librarySongs);
                setFullPlayerOpen(true);
              }}
              className={`group px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-white/15 shadow-md'
                  : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
              }`}
            >
              {/* Thumbnail & Title + Artist */}
              <div className="flex items-center gap-4 min-w-0 pr-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 relative shadow-sm">
                  <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex gap-0.5 items-end h-4">
                        <div className="w-1 bg-white animate-bounce h-2" />
                        <div className="w-1 bg-white animate-bounce h-4" />
                        <div className="w-1 bg-white animate-bounce h-3" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm md:text-base font-medium text-white truncate group-hover:text-white">
                    {track.title}
                  </h4>
                  <p className="text-xs md:text-sm text-white/50 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Right-aligned duration timestamp */}
              <div className="shrink-0 text-xs md:text-sm text-white/50 tabular-nums">
                {formatDuration(track.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
