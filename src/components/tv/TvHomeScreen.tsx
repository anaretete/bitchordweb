import React, { useRef } from 'react';
import { usePlayerStore, SCREENSHOT_TRACKS } from '../../stores/playerStore';

export function TvHomeScreen() {
  const { playTrackDirect, currentTrack, isPlaying, setFullPlayerOpen } = usePlayerStore();

  const recentsRef = useRef<HTMLDivElement>(null);
  const albumsRef = useRef<HTMLDivElement>(null);

  // Exact 5 cards matching the Recents row in Screenshot 4
  const recents = [
    {
      track: SCREENSHOT_TRACKS[2], // nayuta
      bgColor: '#40382b',
    },
    {
      track: SCREENSHOT_TRACKS[3], // kinoue64
      bgColor: '#473636',
    },
    {
      track: SCREENSHOT_TRACKS[4], // HOYO-MiX
      bgColor: '#1b2a52',
    },
    {
      track: SCREENSHOT_TRACKS[0], // Eve - Pray
      bgColor: '#56191b',
    },
    {
      track: SCREENSHOT_TRACKS[5], // xea
      bgColor: '#203644',
    },
  ];

  // Albums & Singles row matching lower shelf of Screenshot 4
  const albumsAndSingles = [
    {
      id: 'alb-1',
      title: '空に架かる君の声。',
      artist: 'nayuta',
      thumbnail: SCREENSHOT_TRACKS[2].thumbnail,
      track: SCREENSHOT_TRACKS[2],
      bgColor: '#383228',
    },
    {
      id: 'alb-2',
      title: 'The Time Machine School',
      artist: 'kinoue64',
      thumbnail: SCREENSHOT_TRACKS[3].thumbnail,
      track: SCREENSHOT_TRACKS[3],
      bgColor: '#3d2e2e',
    },
    {
      id: 'alb-3',
      title: 'The Shimmering Voyage Vol. 2',
      artist: 'HOYO-MiX',
      thumbnail: SCREENSHOT_TRACKS[4].thumbnail,
      track: SCREENSHOT_TRACKS[4],
      bgColor: '#17223e',
    },
    {
      id: 'alb-4',
      title: 'Under Blue',
      artist: 'Eve',
      thumbnail: SCREENSHOT_TRACKS[0].thumbnail,
      track: SCREENSHOT_TRACKS[0],
      bgColor: '#421618',
    },
    {
      id: 'alb-5',
      title: 'look at the sea',
      artist: 'xea',
      thumbnail: SCREENSHOT_TRACKS[5].thumbnail,
      track: SCREENSHOT_TRACKS[5],
      bgColor: '#1a2c38',
    },
    {
      id: 'alb-6',
      title: 'The Time Machine School II',
      artist: 'kinoue64',
      thumbnail: SCREENSHOT_TRACKS[6]?.thumbnail || SCREENSHOT_TRACKS[3].thumbnail,
      track: SCREENSHOT_TRACKS[6] || SCREENSHOT_TRACKS[3],
      bgColor: '#332929',
    },
  ];

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-8 px-4 sm:px-10 md:px-14 max-w-7xl mx-auto space-y-7 sm:space-y-9 select-none">
      {/* 1. Recents Row matching Screenshot 4 */}
      <section className="space-y-3.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pl-0.5">
          Recents
        </h2>

        <div
          ref={recentsRef}
          onWheel={handleHorizontalWheel}
          className="flex gap-3.5 sm:gap-4.5 overflow-x-auto pb-4 scrollbar-none pt-1 scroll-smooth touch-pan-x"
        >
          {recents.map(({ track, bgColor }) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  playTrackDirect(track, SCREENSHOT_TRACKS);
                  setFullPlayerOpen(true);
                }}
                className="group w-[160px] sm:w-[205px] md:w-[220px] shrink-0 rounded-[18px] sm:rounded-[22px] overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-xl flex flex-col border border-white/5"
              >
                {/* Artwork Upper Portion */}
                <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isCurrent && isPlaying && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      Playing
                    </div>
                  )}
                </div>

                {/* Tinted Lower Caption matching Screenshot 4 (Centered Text) */}
                <div
                  className="p-3.5 flex flex-col items-center justify-center text-center transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  <h4 className="text-sm font-semibold text-white truncate w-full drop-shadow-sm">
                    {track.title}
                  </h4>
                  <p className="text-xs text-white/70 truncate w-full mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Albums & Singles Row matching Screenshot 4 */}
      <section className="space-y-3.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pl-0.5">
          Albums & singles
        </h2>

        <div
          ref={albumsRef}
          onWheel={handleHorizontalWheel}
          className="flex gap-3.5 sm:gap-4.5 overflow-x-auto pb-4 scrollbar-none pt-1 scroll-smooth touch-pan-x"
        >
          {albumsAndSingles.map((alb) => (
            <div
              key={alb.id}
              onClick={() => {
                playTrackDirect(alb.track, SCREENSHOT_TRACKS);
                setFullPlayerOpen(true);
              }}
              className="group w-[160px] sm:w-[205px] md:w-[220px] shrink-0 rounded-[18px] sm:rounded-[22px] overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-xl flex flex-col border border-white/5"
            >
              <div className="w-full aspect-square relative bg-neutral-900 overflow-hidden">
                <img
                  src={alb.thumbnail}
                  alt={alb.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div
                className="p-3.5 flex flex-col items-center justify-center text-center transition-colors"
                style={{ backgroundColor: alb.bgColor }}
              >
                <h4 className="text-sm font-semibold text-white truncate w-full">
                  {alb.title}
                </h4>
                <p className="text-xs text-white/70 truncate w-full mt-0.5">
                  {alb.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
