import React from 'react';
import { ChevronRight } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function TvSettingsScreen() {
  const {
    isSignedIn,
    userProfile,
    setAuthModalOpen,
    automix,
    setAutomix,
    crossfadeSeconds,
    setCrossfadeSeconds,
    autoplayEnabled,
    toggleAutoplay,
    skipSilence,
    setSkipSilence,
  } = usePlayerStore();

  const crossfadeOptions = [0, 3, 5, 8];
  const nextCrossfade = () => {
    const curIdx = crossfadeOptions.indexOf(crossfadeSeconds);
    const nextVal = crossfadeOptions[(curIdx + 1) % crossfadeOptions.length];
    setCrossfadeSeconds(nextVal);
  };

  return (
    <div className="pt-28 pb-16 px-8 md:px-16 max-w-5xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-start select-none">
      {/* Left Column matching Screenshot 2 */}
      <div className="w-full md:w-72 flex flex-col items-center md:items-start text-center md:text-left shrink-0">
        {/* Large red rounded squircle with BitChord waves */}
        <div className="w-32 h-32 bg-[#e53935] rounded-3xl flex items-center justify-center shadow-xl shadow-red-600/20 mb-6">
          <svg className="w-18 h-18 text-white" viewBox="0 0 24 24">
            <path
              d="M4 6.5c5-2.2 11-2.2 16 0M4 11.5c5-2.2 11-2.2 16 0M4 16.5c5-2.2 11-2.2 16 0"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
          Playback, sound and display preferences for BitChord on this TV.
        </p>
      </div>

      {/* Right Column matching Screenshot 2 */}
      <div className="flex-1 w-full space-y-6">
        {/* Account */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Account
          </h3>
          <div
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#201d2a] hover:bg-[#262332] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-md"
          >
            <span className="text-base font-medium text-white">YouTube Music</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/90">
                {isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Sign In'}
              </span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Playback */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Playback
          </h3>
          <div className="bg-[#201d2a] rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden">
            {/* Automix */}
            <div
              onClick={() => setAutomix(!automix)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-base font-medium text-white">Automix</span>
              <span className="text-sm font-bold text-white">
                {automix ? 'On' : 'Off'}
              </span>
            </div>

            {/* Crossfade */}
            <div
              onClick={nextCrossfade}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-base font-medium text-white">Crossfade</span>
              <span className="text-sm font-bold text-white">
                {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds} s`}
              </span>
            </div>

            {/* Autoplay */}
            <div
              onClick={toggleAutoplay}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-base font-medium text-white">Autoplay</span>
              <span className="text-sm font-bold text-white">
                {autoplayEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Skip Silence */}
            <div
              onClick={() => setSkipSilence(!skipSilence)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-base font-medium text-white">Skip Silence</span>
              <span className="text-sm font-bold text-white">
                {skipSilence ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Sound */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Sound
          </h3>
          <div className="bg-[#201d2a] rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <span className="text-base font-medium text-white">Spatial Audio</span>
              <span className="text-sm font-bold text-white">On</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
