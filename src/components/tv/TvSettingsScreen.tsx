import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Film,
  Sliders,
  Check,
  Key,
  Sparkles,
  Palette
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { DEFAULT_SP_DC } from '../../services/canvas';

export function TvSettingsScreen() {
  const {
    isSignedIn,
    userProfile,
    setAuthModalOpen,
    tvTheme,
    setTvTheme,
    ambientLightingEnabled,
    setAmbientEnabled,
    ambientIntensity,
    setAmbientIntensity,
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
    setCanvasSettings,
  } = usePlayerStore();

  const [soundCheck, setSoundCheck] = useState(true);
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [audioQuality, setAudioQuality] = useState<'lossless' | 'high' | 'standard'>('lossless');
  const [syncedLyricsEnabled, setSyncedLyricsEnabled] = useState(true);
  const [showSpDcInput, setShowSpDcInput] = useState(false);
  const [spDcInput, setSpDcInput] = useState(spotifySpDc || DEFAULT_SP_DC);
  const [spDcSaved, setSpDcSaved] = useState(false);

  const crossfadeOptions = [0, 3, 5, 8];
  const nextCrossfade = () => {
    const curIdx = crossfadeOptions.indexOf(crossfadeSeconds);
    const nextVal = crossfadeOptions[(curIdx + 1) % crossfadeOptions.length];
    setCrossfadeSeconds(nextVal);
  };

  const handleSaveSpDc = () => {
    setCanvasSettings({ spotifySpDc: spDcInput.trim() });
    setSpDcSaved(true);
    setTimeout(() => {
      setSpDcSaved(false);
      setShowSpDcInput(false);
    }, 1500);
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 px-4 sm:px-10 md:px-16 max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-start select-none">
      {/* Left Column matching Screenshot 2 */}
      <div className="w-full md:w-80 flex flex-col items-center text-center shrink-0 md:sticky md:top-28">
        {/* Large Salmon-Red Squircle with 3-wave BitChord Logo */}
        <div className="w-32 h-32 md:w-36 md:h-36 bg-[#ff4a5a] rounded-[36px] flex items-center justify-center shadow-2xl shadow-red-500/25 mb-6 transition-transform hover:scale-105 cursor-pointer">
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

        {/* Clean explanatory caption matching Screenshot 2 */}
        <p className="text-white/75 text-sm md:text-base leading-relaxed max-w-[260px]">
          Playback, sound and display preferences for BitChord on this TV.
        </p>
      </div>

      {/* Right Column: Grouped Rounded Capsule Menus matching Screenshot 2 */}
      <div className="flex-1 w-full space-y-7">
        {/* Section: Account */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            Account
          </h3>
          <div
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#24212e] hover:bg-[#2c2938] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-md group"
          >
            <span className="text-sm md:text-base font-medium text-white">
              YouTube Music
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                {isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Sign In'}
              </span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Section: Playback matching Screenshot 2 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            Playback
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            {/* Automix */}
            <div
              onClick={() => setAutomix(!automix)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Automix
              </span>
              <span className="text-sm font-semibold text-white/80">
                {automix ? 'On' : 'Off'}
              </span>
            </div>

            {/* Crossfade */}
            <div
              onClick={nextCrossfade}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Crossfade
              </span>
              <span className="text-sm font-semibold text-white/80">
                {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds} s`}
              </span>
            </div>

            {/* Autoplay */}
            <div
              onClick={toggleAutoplay}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Autoplay
              </span>
              <span className="text-sm font-semibold text-white/80">
                {autoplayEnabled ? 'On' : 'Off'}
              </span>
            </div>

            {/* Skip Silence */}
            <div
              onClick={() => setSkipSilence(!skipSilence)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Skip Silence
              </span>
              <span className="text-sm font-semibold text-white/80">
                {skipSilence ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Sound matching Screenshot 2 lower header */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            Sound
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            {/* Sound Check */}
            <div
              onClick={() => setSoundCheck(!soundCheck)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Sound Check
              </span>
              <span className="text-sm font-semibold text-white/80">
                {soundCheck ? 'On' : 'Off'}
              </span>
            </div>

            {/* Spatial Audio Engine */}
            <div
              onClick={() => setSpatialAudio(!spatialAudio)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Spatial Audio Engine
              </span>
              <span className="text-sm font-semibold text-white/80">
                {spatialAudio ? 'On' : 'Off'}
              </span>
            </div>

            {/* Audio Quality */}
            <div
              onClick={() => {
                const modes: ('lossless' | 'high' | 'standard')[] = ['lossless', 'high', 'standard'];
                const next = modes[(modes.indexOf(audioQuality) + 1) % modes.length];
                setAudioQuality(next);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Audio Quality
              </span>
              <span className="text-sm font-semibold text-white/80">
                {audioQuality === 'lossless' ? 'Lossless (Hi-Res)' : audioQuality === 'high' ? 'High 256kbps' : 'Standard 160kbps'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Ambient Look & Themes */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ambient Look & Themes</span>
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            {/* Dynamic Ambient Glow Toggle */}
            <div
              onClick={() => setAmbientEnabled(!ambientLightingEnabled)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">
                  Dynamic Ambient Glow
                </span>
                <span className="text-xs text-white/50">
                  Luminous background aura extracted from album artwork
                </span>
              </div>
              <span className={`text-sm font-semibold ${ambientLightingEnabled ? 'text-red-400' : 'text-white/60'}`}>
                {ambientLightingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Ambient Intensity Selector */}
            <div
              onClick={() => {
                const intensities: ('vibrant' | 'subtle' | 'off')[] = ['vibrant', 'subtle', 'off'];
                const next = intensities[(intensities.indexOf(ambientIntensity) + 1) % intensities.length];
                setAmbientIntensity(next);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">
                  Ambient Intensity
                </span>
                <span className="text-xs text-white/50">
                  Aura brightness and backdrop saturation
                </span>
              </div>
              <span className="text-sm font-semibold text-white/80 capitalize">
                {ambientIntensity}
              </span>
            </div>

            {/* Active Visual Theme */}
            <div
              onClick={() => {
                const themes = ['dynamic', 'midnight', 'oled', 'graphite', 'ember'];
                const next = themes[(themes.indexOf(tvTheme) + 1) % themes.length];
                setTvTheme(next);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">
                  Visual Theme
                </span>
                <span className="text-xs text-white/50">
                  {tvTheme === 'dynamic' && 'Dynamic Artwork (Adapts to music)'}
                  {tvTheme === 'midnight' && 'Midnight Indigo (Deep sapphire)'}
                  {tvTheme === 'oled' && 'OLED Pure Black (Zero luminescence)'}
                  {tvTheme === 'graphite' && 'Graphite Dark (Neutral studio)'}
                  {tvTheme === 'ember' && 'Ember Red (BitChord signature)'}
                </span>
              </div>
              <span className="text-sm font-semibold text-white/80 capitalize">
                {tvTheme}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Animated Covers & Canvas */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            Canvas & Motion Artwork
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            <div
              onClick={() => setCanvasSettings({ liveCanvasEnabled: !liveCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">
                  Animated Canvas Videos
                </span>
                <span className="text-xs text-white/50">
                  Play looping video covers in Now Playing
                </span>
              </div>
              <span className="text-sm font-semibold text-white/80">
                {liveCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            <div
              onClick={() => setShowSpDcInput(!showSpDcInput)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <span className="text-sm md:text-base font-medium text-white block">
                  Spotify Canvas (sp_dc)
                </span>
                <span className="text-xs text-white/50">
                  {spotifyCanvasEnabled ? 'Connected & Active' : 'Off'}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full text-white/80">
                {showSpDcInput ? 'Hide' : 'Configure'}
              </span>
            </div>

            {showSpDcInput && (
              <div className="p-4 space-y-2 bg-black/30">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={spDcInput}
                    onChange={(e) => setSpDcInput(e.target.value)}
                    placeholder="sp_dc cookie..."
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white/90 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={handleSaveSpDc}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {spDcSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    <span>{spDcSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>
            )}

            <div
              onClick={() => setCanvasSettings({ tidalCanvasEnabled: !tidalCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Tidal Video Covers
              </span>
              <span className="text-sm font-semibold text-white/80">
                {tidalCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>

            <div
              onClick={() => setCanvasSettings({ viviCanvasEnabled: !viviCanvasEnabled })}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Community Vivi Canvas
              </span>
              <span className="text-sm font-semibold text-white/80">
                {viviCanvasEnabled ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Lyrics */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            Lyrics
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            <div
              onClick={() => setSyncedLyricsEnabled(!syncedLyricsEnabled)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-white">
                Synchronized Lyrics
              </span>
              <span className="text-sm font-semibold text-white/80">
                {syncedLyricsEnabled ? 'On' : 'Off'}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <span className="text-sm md:text-base font-medium text-white">
                Lyrics Provider
              </span>
              <span className="text-sm font-semibold text-white/80">
                LRCLIB (Verified)
              </span>
            </div>
          </div>
        </div>

        {/* Section: About */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-white/55 pl-1 tracking-wide">
            About
          </h3>
          <div className="bg-[#24212e] rounded-2xl divide-y divide-white/5 border border-white/5 shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm md:text-base font-medium text-white">
                BitChord TV
              </span>
              <span className="text-sm font-semibold text-white/60">
                v2.0 Web SPA
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <span className="text-sm md:text-base font-medium text-white">
                Hosting & Target
              </span>
              <span className="text-sm font-semibold text-white/60">
                {typeof window !== 'undefined' && window.location.hostname.includes('netlify')
                  ? 'Netlify (/)'
                  : typeof window !== 'undefined' && window.location.pathname.startsWith('/bitchordweb')
                  ? 'GitHub Pages (/bitchordweb/)'
                  : 'Web (/)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
