import React, { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { usePlayerStore, SCREENSHOT_TRACKS } from '../../stores/playerStore';

interface MoodGenreTile {
  title: string;
  subtitle: string;
  color: string;
  image: string;
  trackIndex: number;
}

export function TvExploreScreen() {
  const { playTrackDirect } = usePlayerStore();
  const [activeContextTile, setActiveContextTile] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Exact 12 tiles matching Screenshot 5
  const tiles: MoodGenreTile[] = [
    {
      title: 'Chill',
      subtitle: 'Coffee Shop Blend',
      color: '#466882',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
      trackIndex: 1,
    },
    {
      title: 'Commute',
      subtitle: 'Feel-Good Hip-Hop and R&B',
      color: '#b68700',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
      trackIndex: 2,
    },
    {
      title: 'Energize',
      subtitle: 'pump-up pop',
      color: '#c49c36',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
      trackIndex: 0,
    },
    {
      title: 'Feel good',
      subtitle: 'Sunshine Indie',
      color: '#5b9d57',
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
      trackIndex: 3,
    },
    {
      title: 'Focus',
      subtitle: 'Lofi Loft',
      color: '#535b63',
      image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
      trackIndex: 4,
    },
    {
      title: 'Gaming',
      subtitle: 'GAMING HITS',
      color: '#343a40',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
      trackIndex: 0,
    },
    {
      title: 'Party',
      subtitle: 'Turn Up Time',
      color: '#583c84',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80',
      trackIndex: 2,
    },
    {
      title: 'Romance',
      subtitle: 'Sweetheart Pop',
      color: '#8b1c1c',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop&q=80',
      trackIndex: 5,
    },
    {
      title: 'Sad',
      subtitle: 'Burn the Photos',
      color: '#3d4047',
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
      trackIndex: 6,
    },
    {
      title: 'Sleep',
      subtitle: 'Classical for Sleeping',
      color: '#3d296d',
      image: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?w=500&auto=format&fit=crop&q=80',
      trackIndex: 7,
    },
    {
      title: 'Workout',
      subtitle: 'Power Heavy Beats',
      color: '#8f4b1e',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80',
      trackIndex: 0,
    },
    {
      title: 'African',
      subtitle: 'Afrobeats & Amapiano',
      color: '#1e5922',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
      trackIndex: 1,
    },
  ];

  return (
    <div className="pt-20 sm:pt-24 pb-12 px-4 sm:px-8 md:px-14 max-w-7xl mx-auto select-none">
      {/* 2-column on mobile, 4-column on desktop matching Screenshot 5 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-4.5">
        {tiles.map((tile) => {
          const isContextMenuOpen = activeContextTile === tile.title;

          return (
            <div
              key={tile.title}
              onContextMenu={(e) => {
                e.preventDefault();
                setActiveContextTile(tile.title);
              }}
              onClick={() => {
                const targetTrack = SCREENSHOT_TRACKS[tile.trackIndex] || SCREENSHOT_TRACKS[0];
                playTrackDirect(targetTrack, SCREENSHOT_TRACKS);
              }}
              className="group relative h-28 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{ backgroundColor: tile.color }}
            >
              {/* Left Color Stripe / Title */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-10 p-3.5 flex flex-col justify-start">
                <span className="text-white font-extrabold text-base tracking-wide drop-shadow-sm">
                  {tile.title}
                </span>
              </div>

              {/* Right Duotone Blended Image with Subtitle */}
              <div className="absolute inset-y-0 right-0 w-[72%] overflow-hidden">
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="w-full h-full object-cover mix-blend-luminosity opacity-55 transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${tile.color} 0%, transparent 60%)`,
                  }}
                />
                <div className="absolute bottom-2.5 right-3 text-right max-w-[80%] z-10">
                  <span className="text-xs md:text-sm font-semibold text-white/90 drop-shadow-md line-clamp-2">
                    {tile.subtitle}
                  </span>
                </div>
              </div>

              {/* Context Menu Capsule matching Screenshot 5 */}
              {isContextMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md rounded-2xl flex items-center justify-center p-2 animate-in fade-in zoom-in-95"
                >
                  <div className="bg-[#121118] border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2.5 shadow-2xl text-xs text-white">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(tile.subtitle);
                        setCopiedNotification(true);
                        setTimeout(() => setCopiedNotification(false), 1500);
                      }}
                      className="hover:text-white/80 font-medium cursor-pointer"
                    >
                      {copiedNotification ? 'Copied!' : 'Copied'}
                    </button>
                    <span className="text-white/30">|</span>
                    <button
                      onClick={() => setActiveContextTile(null)}
                      className="px-2.5 py-0.5 bg-white text-black font-bold rounded-full cursor-pointer hover:bg-neutral-200"
                    >
                      Save
                    </button>
                    <span className="text-white/30">|</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        setActiveContextTile(null);
                      }}
                      className="hover:text-white/80 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveContextTile(null)}
                      className="hover:text-white/80 ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
