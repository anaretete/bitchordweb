import React from 'react';
import { usePlayerStore, SCREENSHOT_TRACKS } from '../../stores/playerStore';

export function TvHomeScreen() {
  const { playTrackDirect, currentTrack, isPlaying, setFullPlayerOpen } = usePlayerStore();

  // Curated recent cards from screenshot tracks
  const recents = SCREENSHOT_TRACKS.slice(0, 5);

  // Albums & Singles row matching lower portion of Screenshot 4
  const albumsAndSingles = [
    {
      id: 'alb-1',
      title: '空に架かる君の声。',
      artist: 'nayuta',
      thumbnail: SCREENSHOT_TRACKS[1].thumbnail,
      track: SCREENSHOT_TRACKS[1],
    },
    {
      id: 'alb-2',
      title: 'The Time Machine School',
      artist: 'kinoue64',
      thumbnail: SCREENSHOT_TRACKS[2].thumbnail,
      track: SCREENSHOT_TRACKS[2],
    },
    {
      id: 'alb-3',
      title: 'The Shimmering Voyage Vol. 2',
      artist: 'HOYO-MiX',
      thumbnail: SCREENSHOT_TRACKS[3].thumbnail,
      track: SCREENSHOT_TRACKS[3],
    },
    {
      id: 'alb-4',
      title: 'Under Blue',
      artist: 'Eve',
      thumbnail: SCREENSHOT_TRACKS[4].thumbnail,
      track: SCREENSHOT_TRACKS[4],
    },
    {
      id: 'alb-5',
      title: 'look at the sea',
      artist: 'xea',
      thumbnail: SCREENSHOT_TRACKS[5].thumbnail,
      track: SCREENSHOT_TRACKS[5],
    },
    {
      id: 'alb-6',
      title: 'The Time Machine School II',
      artist: 'kinoue64',
      thumbnail: SCREENSHOT_TRACKS[6].thumbnail,
      track: SCREENSHOT_TRACKS[6],
    },
  ];

  return (
    <div className="pt-24 pb-16 px-8 md:px-14 max-w-7xl mx-auto space-y-8 select-none">
      {/* 1. Recents Row matching Screenshot 4 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white tracking-tight">Recents</h2>

        <div className="flex gap-4.5 overflow-x-auto pb-4 scrollbar-none pt-1">
          {recents.map((track) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  playTrackDirect(track, SCREENSHOT_TRACKS);
                  setFullPlayerOpen(true);
                }}
                className="group w-[210px] shrink-0 rounded-2xl overflow-hidden bg-[#24212f] hover:bg-[#2c283a] cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg flex flex-col"
              >
                {/* Artwork Upper Portion */}
                <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isCurrent && isPlaying && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      Playing
                    </div>
                  )}
                </div>

                {/* Tinted Lower Caption matching Screenshot 4 */}
                <div className="p-3.5 flex flex-col justify-center bg-[#292535]">
                  <h4 className="text-sm font-semibold text-white truncate drop-shadow-sm">
                    {track.title}
                  </h4>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Albums & Singles Row matching Screenshot 4 */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white tracking-tight">Albums & singles</h2>

        <div className="flex gap-4.5 overflow-x-auto pb-4 scrollbar-none pt-1">
          {albumsAndSingles.map((alb) => (
            <div
              key={alb.id}
              onClick={() => {
                playTrackDirect(alb.track, SCREENSHOT_TRACKS);
                setFullPlayerOpen(true);
              }}
              className="group w-[210px] shrink-0 rounded-2xl overflow-hidden bg-[#24212f] hover:bg-[#2c283a] cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg flex flex-col"
            >
              <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                <img
                  src={alb.thumbnail}
                  alt={alb.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-3.5 flex flex-col justify-center bg-[#292535]">
                <h4 className="text-sm font-semibold text-white truncate">{alb.title}</h4>
                <p className="text-xs text-white/60 truncate mt-0.5">{alb.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
