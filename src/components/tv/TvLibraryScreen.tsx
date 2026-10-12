import React, { useState, useEffect } from 'react';
import {
  Clock,
  Heart,
  Music,
  ListMusic,
  Disc,
  Users,
  Radio,
  Podcast,
  Play
} from 'lucide-react';
import { usePlayerStore, trackToSong } from '../../stores/playerStore';
import { getSavedSongs, getHistory } from '../../services/db';
import { repository } from '../../services/repository';
import type { Song } from '../../types';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '3:20';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function TvLibraryScreen() {
  const { playSong, currentTrack, isPlaying } = usePlayerStore();
  const [activeCategory, setActiveCategory] = useState<string>('Recently Played');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { label: 'Recently Played', icon: Clock },
    { label: 'Liked Songs', icon: Heart },
    { label: 'Songs', icon: Music },
    { label: 'Playlists', icon: ListMusic },
    { label: 'Albums', icon: Disc },
    { label: 'Artists', icon: Users },
    { label: 'Subscriptions', icon: Radio },
    { label: 'Podcasts', icon: Podcast },
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (activeCategory === 'Liked Songs') {
          const saved = await getSavedSongs();
          if (isMounted) setSongs(saved);
        } else if (activeCategory === 'Recently Played') {
          const hist = await getHistory(50);
          const historySongs = hist.map((h) => h.song);
          if (historySongs.length > 0) {
            if (isMounted) setSongs(historySongs);
          } else {
            // Live fetch top/recent music if local history is clean
            const trending = await repository.search('nayuta Ado HOYO-MiX', 'songs');
            if (isMounted) setSongs(trending.songs.slice(0, 20));
          }
        } else {
          // Live search category items
          const res = await repository.search(activeCategory.toLowerCase(), 'songs');
          if (isMounted) setSongs(res.songs.slice(0, 25));
        }
      } catch (err) {
        console.error('Failed to load library category:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  return (
    <div className="pt-24 pb-16 px-8 md:px-14 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      {/* Left Sub-Navigation Menu matching Screenshot 3 */}
      <div className="w-56 shrink-0 flex flex-col gap-1.5 py-4">
        {categories.map((c) => {
          const isActive = activeCategory === c.label;
          return (
            <button
              key={c.label}
              onClick={() => setActiveCategory(c.label)}
              className={`w-full text-left px-5 py-3 rounded-2xl text-base font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#282634] text-white font-semibold shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Right Tracks Pane matching Screenshot 3 */}
      <div className="flex-1 overflow-y-auto py-2 pr-4 space-y-2 scrollbar-none">
        {loading ? (
          <div className="space-y-3 py-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.04] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="py-24 text-center text-white/50">
            <p className="text-lg">No songs in {activeCategory} yet.</p>
            <p className="text-xs text-white/40 mt-1">Play and like tracks to populate this shelf.</p>
          </div>
        ) : (
          songs.map((song) => {
            const isCurrent = currentTrack?.id === song.videoId;
            const artistName = song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';
            const thumb =
              song.thumbnails?.[song.thumbnails.length - 1]?.url ||
              song.thumbnails?.[0]?.url ||
              '';

            return (
              <div
                key={song.videoId}
                onClick={() => playSong(song, songs)}
                className={`group px-4 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-white/15 shadow-md'
                    : 'hover:bg-white/[0.06] active:bg-white/[0.08]'
                }`}
              >
                {/* Left: Thumbnail & Title + Artist */}
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 relative shadow-sm">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/10">
                        <Music className="w-5 h-5 text-white/40" />
                      </div>
                    )}
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
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-white">
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {artistName}
                    </p>
                  </div>
                </div>

                {/* Right: Right-aligned duration timestamp */}
                <div className="shrink-0 text-xs text-white/50 tabular-nums">
                  {song.durationText || formatDuration(song.duration || 180)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
