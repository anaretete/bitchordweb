import React from 'react';
import {
  User,
  Music,
  Headphones,
  Sliders,
  Tv,
  RotateCcw,
  Check,
  ChevronRight,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function TvSettingsScreen() {
  const {
    isSignedIn,
    userProfile,
    setAuthModalOpen,
    logout,
    automix,
    setAutomix,
    crossfadeSeconds,
    setCrossfadeSeconds,
    autoplayEnabled,
    toggleAutoplay,
    skipSilence,
    setSkipSilence,
    tvNickname,
    tvTheme,
    runSetupAgain
  } = usePlayerStore();

  const crossfadeOptions = [0, 3, 5, 8, 12];
  const nextCrossfade = () => {
    const curIdx = crossfadeOptions.indexOf(crossfadeSeconds);
    const nextVal = crossfadeOptions[(curIdx + 1) % crossfadeOptions.length];
    setCrossfadeSeconds(nextVal);
  };

  return (
    <div className="pt-28 pb-16 px-8 md:px-16 max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-start">
      {/* Left Column matching Screenshot 2: Red squircle logo & descriptive subtitle */}
      <div className="w-full md:w-80 flex flex-col items-center md:items-start text-center md:text-left shrink-0">
        {/* Large red squircle with BitChord icon */}
        <div className="w-36 h-36 bg-[#e53935] rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30 mb-6">
          <svg className="w-20 h-20 text-white" viewBox="0 0 24 24">
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

        <div className="mt-8 pt-8 border-t border-white/10 w-full hidden md:block">
          <p className="text-xs text-white/40">BitChord TV v2.4 (Native Web SPA)</p>
          <p className="text-xs text-white/40 mt-1">High-Precision Audio Engine</p>
        </div>
      </div>

      {/* Right Column matching Screenshot 2: Grouped Settings Cards */}
      <div className="flex-1 w-full space-y-8">
        {/* Section 1: Account */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Account
          </h3>
          <div
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#201d2a] hover:bg-[#272333] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-base font-medium text-white">YouTube Music</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-sm font-semibold text-white/90">
                {isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Guest (Click to Sign In)'}
              </span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
          </div>
        </div>

        {/* Section 2: Playback */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Playback
          </h3>
          <div className="bg-[#201d2a] border border-white/5 rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden">
            {/* Automix */}
            <div
              onClick={() => setAutomix(!automix)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-base font-medium text-white">Automix</span>
              <span className={`text-sm font-bold ${automix ? 'text-white' : 'text-white/40'}`}>
                {automix ? 'On' : 'Off'}
              </span>
            </div>

            {/* Crossfade */}
            <div
              onClick={nextCrossfade}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-base font-medium text-white">Crossfade</span>
              <span className="text-sm font-bold text-white">
                {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds} s`}
              </span>
            </div>

            {/* Autoplay */}
            <div
              onClick={toggleAutoplay}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-base font-medium text-white">Autoplay</span>
              <span className={`text-sm font-bold ${autoplayEnabled ? 'text-white' : 'text-white/40'}`}>
                {autoplayEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Skip Silence */}
            <div
              onClick={() => setSkipSilence(!skipSilence)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-base font-medium text-white">Skip Silence</span>
              <span className={`text-sm font-bold ${skipSilence ? 'text-white' : 'text-white/40'}`}>
                {skipSilence ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Sound */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            Sound
          </h3>
          <div className="bg-[#201d2a] border border-white/5 rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03]">
              <span className="text-base font-medium text-white">Spatial Audio Virtualizer</span>
              <span className="text-sm font-bold text-white">On</span>
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03]">
              <span className="text-base font-medium text-white">Stream Codec</span>
              <span className="text-sm font-bold text-white">160kbps OPUS Lossless</span>
            </div>
          </div>
        </div>

        {/* Section 4: TV System & Re-Onboarding */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
            TV Personalization
          </h3>
          <div className="bg-[#201d2a] border border-white/5 rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <span className="text-base font-medium text-white">TV Nickname</span>
              <span className="text-sm font-bold text-white">{tvNickname}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-base font-medium text-white">Active Theme</span>
              <span className="text-sm font-bold text-white capitalize">{tvTheme}</span>
            </div>
            <div
              onClick={runSetupAgain}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors text-red-400"
            >
              <span className="text-base font-semibold">Run TV Setup Again</span>
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
