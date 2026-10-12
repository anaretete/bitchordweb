import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Film,
  Music,
  Sliders,
  Tv,
  Check,
  Sparkles,
  Key
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { DEFAULT_SP_DC } from '../../services/canvas';

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
    liveCanvasEnabled,
    spotifyCanvasEnabled,
    spotifySpDc,
    appleCanvasEnabled,
    tidalCanvasEnabled,
    viviCanvasEnabled,
    setCanvasSettings
  } = usePlayerStore();

  const [activeCategory, setActiveCategory] = useState<'account' | 'canvas' | 'audio' | 'display' | 'about'>('canvas');
  const [spDcInput, setSpDcInput] = useState(spotifySpDc || DEFAULT_SP_DC);
  const [spDcSaved, setSpDcSaved] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'lossless' | 'high' | 'standard'>('lossless');
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [soundCheck, setSoundCheck] = useState(true);
  const [dynamicBlur, setDynamicBlur] = useState<'high' | 'medium' | 'off'>('high');

  const crossfadeOptions = [0, 3, 5, 8];
  const nextCrossfade = () => {
    const curIdx = crossfadeOptions.indexOf(crossfadeSeconds);
    const nextVal = crossfadeOptions[(curIdx + 1) % crossfadeOptions.length];
    setCrossfadeSeconds(nextVal);
  };

  const handleSaveSpDc = () => {
    setCanvasSettings({ spotifySpDc: spDcInput.trim() });
    setSpDcSaved(true);
    setTimeout(() => setSpDcSaved(false), 2000);
  };

  return (
    <div className="pt-28 pb-16 px-6 sm:px-12 md:px-16 max-w-6xl mx-auto flex flex-col md:flex-row gap-10 md:gap-14 items-start select-none">
      {/* Left Column matching Screenshot 2 & Apple TV settings */}
      <div className="w-full md:w-72 flex flex-col items-center md:items-start text-center md:text-left shrink-0">
        {/* Large red rounded squircle with BitChord waves */}
        <div className="w-28 h-28 md:w-32 md:h-32 bg-[#e53935] rounded-3xl flex items-center justify-center shadow-xl shadow-red-600/20 mb-6 transition-transform hover:scale-105">
          <svg className="w-16 h-16 md:w-18 md:h-18 text-white" viewBox="0 0 24 24">
            <path
              d="M4 6.5c5-2.2 11-2.2 16 0M4 11.5c5-2.2 11-2.2 16 0M4 16.5c5-2.2 11-2.2 16 0"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Preferences</h2>
        <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-xs mb-6">
          Sound, canvas video covers, and account controls for BitChord on this display.
        </p>

        {/* Category Pill Selector on Left */}
        <div className="w-full space-y-1 hidden md:block">
          <button
            onClick={() => setActiveCategory('canvas')}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
              activeCategory === 'canvas' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 text-red-400" />
            <span>Animated Covers & Canvas</span>
          </button>
          <button
            onClick={() => setActiveCategory('account')}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
              activeCategory === 'account' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Google Account</span>
          </button>
          <button
            onClick={() => setActiveCategory('audio')}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
              activeCategory === 'audio' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Audio & Playback</span>
          </button>
          <button
            onClick={() => setActiveCategory('display')}
            className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors text-left cursor-pointer ${
              activeCategory === 'display' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4 text-purple-400" />
            <span>Display & Ambient</span>
          </button>
        </div>
      </div>

      {/* Right Column: Grouped Settings Cards */}
      <div className="flex-1 w-full space-y-8">
        {/* Section 1: Animated Music Covers & Video Canvases */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pl-1">
            <Film className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Animated Covers & Video Canvas
            </h3>
          </div>

          <div className="bg-[#1b1825] rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden border border-white/5">
            {/* Live Canvas Master Toggle */}
            <div
              onClick={() => setCanvasSettings({ liveCanvasEnabled: !liveCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Animated Canvas Videos</span>
                <span className="text-xs text-white/50">Play looping video covers in Now Playing</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${liveCanvasEnabled ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>
                {liveCanvasEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Spotify Canvas Provider */}
            <div
              onClick={() => setCanvasSettings({ spotifyCanvasEnabled: !spotifyCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-white block">Spotify Canvas</span>
                <span className="text-xs text-white/50">Query official Spotify Canvas loops with sp_dc</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${spotifyCanvasEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                {spotifyCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Tidal Video Covers */}
            <div
              onClick={() => setCanvasSettings({ tidalCanvasEnabled: !tidalCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-white block">Tidal Video Covers</span>
                <span className="text-xs text-white/50">1280x1280 crisp square looping clips from Tidal CDN</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tidalCanvasEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
                {tidalCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Community Vivi Canvas */}
            <div
              onClick={() => setCanvasSettings({ viviCanvasEnabled: !viviCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-white block">Community Vivi Canvas</span>
                <span className="text-xs text-white/50">Curated cloud database of video loops</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${viviCanvasEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                {viviCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Apple Music Motion Artwork */}
            <div
              onClick={() => setCanvasSettings({ appleCanvasEnabled: !appleCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-white block">Apple Music Motion Artwork</span>
                <span className="text-xs text-white/50">Album motion artwork & editorialVideo</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${appleCanvasEnabled ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white/40'}`}>
                {appleCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Spotify sp_dc Token Config */}
            <div className="p-4 space-y-2 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Spotify sp_dc Session Cookie
                </span>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Configured
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={spDcInput}
                  onChange={(e) => setSpDcInput(e.target.value)}
                  placeholder="AQCGAPQx..."
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white/80 focus:outline-none focus:border-white/30 truncate"
                />
                <button
                  onClick={handleSaveSpDc}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {spDcSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  <span>{spDcSaved ? 'Saved' : 'Save Cookie'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Account */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pl-1">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Account
            </h3>
          </div>

          <div
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#1b1825] hover:bg-[#221f2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-md group"
          >
            <div className="flex items-center gap-3">
              <img
                src={userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow"
              />
              <div>
                <span className="text-base font-semibold text-white block">
                  {isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Google Account'}
                </span>
                <span className="text-xs text-white/50">
                  {isSignedIn ? 'Connected to YouTube Music' : 'Sign In via Google WebView'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/60 group-hover:text-white">
                {isSignedIn ? 'Manage' : 'Sign In'}
              </span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white" />
            </div>
          </div>
        </div>

        {/* Section 3: Playback & Sound */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pl-1">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Sound & Playback
            </h3>
          </div>

          <div className="bg-[#1b1825] rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden border border-white/5">
            {/* Audio Quality */}
            <div
              onClick={() => {
                const modes: ('lossless' | 'high' | 'standard')[] = ['lossless', 'high', 'standard'];
                const next = modes[(modes.indexOf(audioQuality) + 1) % modes.length];
                setAudioQuality(next);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Audio Quality</span>
                <span className="text-xs text-white/50">Target stream bitrate and encoding</span>
              </div>
              <span className="text-xs font-bold text-white uppercase bg-white/10 px-3 py-1 rounded-full">
                {audioQuality === 'lossless' ? 'Lossless (Hi-Res)' : audioQuality === 'high' ? 'High 256kbps' : 'Standard 160kbps'}
              </span>
            </div>

            {/* Spatial Audio */}
            <div
              onClick={() => setSpatialAudio(!spatialAudio)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Spatial Audio Engine</span>
                <span className="text-xs text-white/50">Simulated 3D surround soundstage</span>
              </div>
              <span className="text-sm font-bold text-white">
                {spatialAudio ? 'On' : 'Off'}
              </span>
            </div>

            {/* Automix */}
            <div
              onClick={() => setAutomix(!automix)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Automix</span>
                <span className="text-xs text-white/50">Smart crossfade on song transitions</span>
              </div>
              <span className="text-sm font-bold text-white">
                {automix ? 'On' : 'Off'}
              </span>
            </div>

            {/* Crossfade */}
            <div
              onClick={nextCrossfade}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Crossfade</span>
                <span className="text-xs text-white/50">Overlap duration between tracks</span>
              </div>
              <span className="text-sm font-bold text-white">
                {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds} s`}
              </span>
            </div>

            {/* Autoplay */}
            <div
              onClick={toggleAutoplay}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Continuous Autoplay</span>
                <span className="text-xs text-white/50">Queue similar tracks when playlist ends</span>
              </div>
              <span className="text-sm font-bold text-white">
                {autoplayEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Skip Silence */}
            <div
              onClick={() => setSkipSilence(!skipSilence)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Skip Silence</span>
                <span className="text-xs text-white/50">Trim lead-in and outro pauses</span>
              </div>
              <span className="text-sm font-bold text-white">
                {skipSilence ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Display & Ambient */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pl-1">
            <Tv className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Display & Ambient
            </h3>
          </div>

          <div className="bg-[#1b1825] rounded-2xl divide-y divide-white/5 shadow-md overflow-hidden border border-white/5">
            {/* Dynamic Backdrop Blur */}
            <div
              onClick={() => {
                const modes: ('high' | 'medium' | 'off')[] = ['high', 'medium', 'off'];
                const next = modes[(modes.indexOf(dynamicBlur) + 1) % modes.length];
                setDynamicBlur(next);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">Ambient Backdrop Blur</span>
                <span className="text-xs text-white/50">Background mesh lighting from album artwork</span>
              </div>
              <span className="text-xs font-bold text-white uppercase bg-white/10 px-3 py-1 rounded-full">
                {dynamicBlur}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-sm md:text-base font-medium text-white block">About BitChord TV</span>
                <span className="text-xs text-white/50">v2.0 Web SPA • Static GitHub Pages Build</span>
              </div>
              <span className="text-xs font-mono text-white/40">2026.10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
