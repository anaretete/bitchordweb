import React, { useState, useEffect } from 'react';
import { Play, Music } from 'lucide-react';
import { usePlayerStore, trackToSong } from '../../stores/playerStore';
import { repository } from '../../services/repository';
import { getHistory } from '../../services/db';
import type { Song, BrowseShelf } from '../../types';

export function TvHomeScreen() {
  const { playSong, currentTrack, isPlaying } = usePlayerStore();
  const [recentTracks, setRecentTracks] = useState<Song[]>([]);
  const [shelves, setShelves] = useState<BrowseShelf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        // 1. Load recent tracks from IndexedDB or curated live tracks matching Screenshot 4
        const history = await getHistory(10);
        if (history.length > 0 && isMounted) {
          setRecentTracks(history.map((h) => h.song));
        } else {
          // Curate live search matching the exact artists in Screenshot 4: nayuta, kinoue64, HOYO-MiX, Eve, xea
          const res = await repository.search('nayuta kinoue64 HOYO-MiX Eve xea', 'songs');
          if (isMounted && res.songs.length > 0) {
            setRecentTracks(res.songs.slice(0, 10));
          }
        }

        // 2. Load Home Feed Shelves from InnerTube / Piped
        const homeFeed = await repository.getHomeFeed();
        if (isMounted && homeFeed.length > 0) {
          setShelves(homeFeed);
        } else {
          // Secondary fallback shelf: Albums & singles
          const albumsSearch = await repository.search('J-Pop Anime Soundtracks 2025', 'albums');
          if (isMounted) {
            setShelves([
              {
                title: 'Albums & singles',
                items: albumsSearch.albums.map((alb) => ({
                  type: 'album',
                  data: alb,
                })),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load home feed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pt-26 pb-16 px-8 md:px-14 max-w-7xl mx-auto space-y-9 overflow-y-auto">
      {/* 1. Recents Shelf matching Screenshot 4 */}
      <section className="space-y-3.5">
        <h2 className="text-xl font-bold text-white tracking-tight">Recents</h2>

        <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 scrollbar-none pt-1">
          {recentTracks.map((song) => {
            const thumb =
              song.thumbnails?.[song.thumbnails.length - 1]?.url ||
              song.thumbnails?.[0]?.url ||
              '';
            const artistName = song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';
            const isCurrent = currentTrack?.id === song.videoId;

            return (
              <div
                key={song.videoId}
                onClick={() => playSong(song, recentTracks)}
                className="group w-48 md:w-52 shrink-0 rounded-2xl overflow-hidden bg-[#221f2d] hover:bg-[#2b2738] cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg flex flex-col select-none"
              >
                {/* Artwork Upper Section */}
                <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={song.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Music className="w-10 h-10 text-white/30" />
                    </div>
                  )}

                  {/* Play Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 fill-black ml-0.5" />
                    </div>
                  </div>

                  {isCurrent && isPlaying && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      Playing
                    </div>
                  )}
                </div>

                {/* Tinted Lower Caption matching Screenshot 4 */}
                <div className="p-3.5 flex flex-col justify-center bg-[#252131]">
                  <h4 className="text-sm font-semibold text-white truncate drop-shadow-sm">
                    {song.title}
                  </h4>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {artistName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Additional Shelves (e.g. Albums & Singles, Quick Picks) */}
      {shelves.map((shelf, shelfIdx) => (
        <section key={shelfIdx} className="space-y-3.5">
          <h2 className="text-xl font-bold text-white tracking-tight">{shelf.title}</h2>

          <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 scrollbar-none pt-1">
            {shelf.items.map((item, itemIdx) => {
              const data = item.data as any;
              const title = data.title || data.name || 'Untitled';
              const subtitle =
                data.artists?.map((a: any) => a.name).join(', ') || data.author || data.year || '';
              const thumb =
                data.thumbnails?.[data.thumbnails.length - 1]?.url ||
                data.thumbnails?.[0]?.url ||
                '';

              return (
                <div
                  key={itemIdx}
                  onClick={() => {
                    if (item.type === 'song') {
                      playSong(data as Song);
                    } else if (data.id) {
                      repository.getAlbum(data.id).then((albumDetail) => {
                        if (albumDetail.tracks.length > 0) {
                          playSong(albumDetail.tracks[0], albumDetail.tracks);
                        }
                      }).catch(console.error);
                    }
                  }}
                  className="group w-44 md:w-48 shrink-0 rounded-2xl overflow-hidden bg-[#221f2d] hover:bg-[#2b2738] cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg flex flex-col select-none"
                >
                  <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Music className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-center bg-[#252131]">
                    <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                    {subtitle && <p className="text-xs text-white/50 truncate mt-0.5">{subtitle}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
