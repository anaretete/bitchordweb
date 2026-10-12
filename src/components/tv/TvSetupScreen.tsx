import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Headphones,
  Palette,
  User,
  Tv,
  Play,
  Key,
  QrCode,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Volume2
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function TvSetupScreen() {
  const {
    setSetupCompleted,
    setTvNickname,
    setTvTheme,
    setAutomix,
    setSkipSilence,
    loginWithCookies,
    isSignedIn,
    userProfile
  } = usePlayerStore();

  const [step, setStep] = useState<'WELCOME' | 'LOGIN' | 'NICKNAME' | 'THEME' | 'CUSTOMIZATION' | 'COMPLETE'>('WELCOME');
  const [nickname, setNickname] = useState('Living Room TV');
  const [selectedTheme, setSelectedTheme] = useState('dynamic');
  const [automixEnabled, setAutomixState] = useState(true);
  const [spatialAudioEnabled, setSpatialAudioState] = useState(true);
  const [skipSilenceEnabled, setSkipSilenceState] = useState(true);

  // Login form state
  const [cookieInput, setCookieInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('Imo-Kenpi');
  const [loginTab, setLoginTab] = useState<'cookie' | 'qr'>('cookie');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const presets = ['Living Room TV', 'Bedroom TV', 'Studio TV', 'Family Room', 'Theater', 'Listener'];

  const themeOptions = [
    { id: 'dynamic', name: 'Dynamic Artwork', bg: '#0b0a10', accent: '#e53935', desc: 'Adapts UI palette to current album cover' },
    { id: 'midnight', name: 'Midnight Indigo', bg: '#0c0e1a', accent: '#3b82f6', desc: 'Deep calm sapphire and indigo dark tones' },
    { id: 'oled', name: 'OLED Pure Black', bg: '#000000', accent: '#ffffff', desc: 'Zero luminescence infinite contrast for OLED' },
    { id: 'graphite', name: 'Graphite Dark', bg: '#18181b', accent: '#a1a1aa', desc: 'Neutral studio dark reference tones' },
    { id: 'ember', name: 'Ember Red', bg: '#120a0a', accent: '#ef4444', desc: 'Vibrant signature BitChord warm glow' },
  ];

  const handleVerifyLogin = async () => {
    if (!cookieInput.trim()) {
      setAuthError('Please paste your YouTube Music cookie string (must include SAPISID).');
      return;
    }
    setIsVerifying(true);
    setAuthError(null);

    const ok = await loginWithCookies(cookieInput, usernameInput.trim() || 'Imo-Kenpi');
    setIsVerifying(false);
    if (ok) {
      setAuthSuccess(true);
      setTimeout(() => {
        setStep('NICKNAME');
      }, 1000);
    } else {
      setAuthError('Authentication failed: Could not find SAPISID token in the provided cookies. Please copy all cookies from music.youtube.com.');
    }
  };

  const finishSetup = () => {
    setTvNickname(nickname.trim() || 'Living Room TV');
    setTvTheme(selectedTheme);
    setAutomix(automixEnabled);
    setSkipSilence(skipSilenceEnabled);
    setSetupCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08070d] text-white flex flex-col justify-between p-8 md:p-14 overflow-y-auto selection:bg-red-500">
      {/* Step 1: Welcome Step */}
      {step === 'WELCOME' && (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto w-full">
          {/* Left Column: Branding */}
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg border border-white/10">
              {/* BitChord 3-curved-waves Logo */}
              <svg className="w-10 h-10 fill-white" viewBox="0 0 24 24">
                <path d="M4 6c5-2 11-2 16 0M4 11c5-2 11-2 16 0M4 16c5-2 11-2 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Welcome to BitChord TV
            </h1>

            <p className="text-lg text-white/70 leading-relaxed max-w-lg">
              Experience YouTube Music crafted exclusively for television screens with smooth animations, high-bitrate OPUS audio, and synchronized lyrics.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => setStep('LOGIN')}
                className="px-8 py-3.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-neutral-200 transition-transform active:scale-95 shadow-lg cursor-pointer"
              >
                <span>Start Setup</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  finishSetup();
                }}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all cursor-pointer"
              >
                Use Defaults
              </button>
            </div>
          </div>

          {/* Right Column: Highlights Card */}
          <div className="w-full md:w-[420px] bg-white/[0.06] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold text-white/50 tracking-widest uppercase">Setup Highlights</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">TV Nickname</h4>
                  <p className="text-xs text-white/60">Personalized greeting on your TV home screen</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Visual Themes</h4>
                  <p className="text-xs text-white/60">Dynamic Artwork, Midnight, and OLED Pure Black</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Spatial Audio</h4>
                  <p className="text-xs text-white/60">3D Virtualizer soundstage and lossless streams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Login Step */}
      {step === 'LOGIN' && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Sign in to YouTube Music</h2>
            <p className="text-white/70 text-base">
              Link your Google Account to access your library, liked tracks, playlists, and listening history on this TV.
            </p>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 my-6 shadow-2xl">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
              <button
                onClick={() => setLoginTab('cookie')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginTab === 'cookie' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Session Cookie</span>
              </button>
              <button
                onClick={() => setLoginTab('qr')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  loginTab === 'qr' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Remote TV Pairing</span>
              </button>
            </div>

            {loginTab === 'cookie' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/60 mb-1.5 block">Account / Channel Name</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. Imo-Kenpi"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60 mb-1.5 block">
                    YouTube Music Cookie Header (includes SAPISID)
                  </label>
                  <textarea
                    rows={4}
                    value={cookieInput}
                    onChange={(e) => setCookieInput(e.target.value)}
                    placeholder="Paste cookies from music.youtube.com (e.g. SAPISID=...; __Secure-3PAPISID=...)"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-white/40 resize-none"
                  />
                  <p className="text-[11px] text-white/40 mt-1">
                    Your credentials stay in your browser local storage and are hashed locally with SHA-1.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-950/50 border border-red-700/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-green-950/50 border border-green-700/50 rounded-xl text-green-200 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-green-400" />
                    <span>Authentication verified successfully!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
                  {/* High fidelity QR Code SVG representation */}
                  <div className="w-full h-full bg-neutral-900 rounded-lg p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-4 border-white bg-black"></div>
                      <div className="w-8 h-8 border-4 border-white bg-black"></div>
                    </div>
                    <div className="text-[10px] text-white text-center font-mono font-bold tracking-widest">
                      TV-PAIR-8492
                    </div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-4 border-white bg-black"></div>
                      <div className="w-4 h-4 bg-white"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/80 font-medium">Scan with your phone to pair YouTube Music account</p>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Open BitChord Mobile or navigate to the pairing portal on your phone on the same Wi-Fi network.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep('WELCOME')}
              className="px-6 py-3 text-white/60 hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('NICKNAME')}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Skip for Now
              </button>
              {loginTab === 'cookie' && (
                <button
                  onClick={handleVerifyLogin}
                  disabled={isVerifying}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Sign In & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Nickname Step */}
      {step === 'NICKNAME' && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Choose TV Nickname</h2>
            <p className="text-white/70 text-base">
              Type a custom name or pick a preset so BitChord can personalize your TV experience.
            </p>
          </div>

          <div className="space-y-6 my-auto">
            <div>
              <label className="text-xs font-bold text-white/50 tracking-wider uppercase mb-2 block">Custom Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter TV nickname..."
                className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 focus:border-white rounded-2xl text-lg text-white font-semibold focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/50 tracking-wider uppercase mb-3 block">Or Choose a Preset</label>
              <div className="flex flex-wrap gap-2.5">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setNickname(p)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      nickname === p
                        ? 'bg-white text-black font-bold shadow-md scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep('LOGIN')}
              className="px-6 py-3 text-white/60 hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep('THEME')}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Theme Step */}
      {step === 'THEME' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Select Visual Theme</h2>
            <p className="text-white/70 text-base">
              Choose the television ambient background styling and accent colors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
            {themeOptions.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${
                  selectedTheme === t.id
                    ? 'bg-white/15 border-white shadow-xl scale-[1.02]'
                    : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 border border-white/20 shadow-md flex items-center justify-center"
                  style={{ backgroundColor: t.bg }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }}></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-base">{t.name}</h4>
                    {selectedTheme === t.id && <Check className="w-5 h-5 text-white" />}
                  </div>
                  <p className="text-xs text-white/60 mt-1">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep('NICKNAME')}
              className="px-6 py-3 text-white/60 hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep('CUSTOMIZATION')}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Customization Step */}
      {step === 'CUSTOMIZATION' && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Playback & Sound Preferences</h2>
            <p className="text-white/70 text-base">
              Fine-tune intelligent audio features engineered for home audio systems.
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {/* Automix */}
            <div className="p-5 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Smart Automix</h4>
                <p className="text-xs text-white/60 mt-0.5">Smoothly crossfade tracks at optimal harmonic transition points</p>
              </div>
              <button
                onClick={() => setAutomixState(!automixEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                  automixEnabled ? 'bg-red-600' : 'bg-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${automixEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Spatial Audio */}
            <div className="p-5 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Spatial Audio Virtualizer</h4>
                <p className="text-xs text-white/60 mt-0.5">Expands stereo field into wide cinematic 3D soundstage</p>
              </div>
              <button
                onClick={() => setSpatialAudioState(!spatialAudioEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                  spatialAudioEnabled ? 'bg-red-600' : 'bg-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${spatialAudioEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Skip Silence */}
            <div className="p-5 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Skip Silence</h4>
                <p className="text-xs text-white/60 mt-0.5">Automatically trims dead gaps at track beginnings and endings</p>
              </div>
              <button
                onClick={() => setSkipSilenceState(!skipSilenceEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                  skipSilenceEnabled ? 'bg-red-600' : 'bg-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${skipSilenceEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep('THEME')}
              className="px-6 py-3 text-white/60 hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep('COMPLETE')}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Complete Step */}
      {step === 'COMPLETE' && (
        <div className="flex-1 flex flex-col max-w-xl mx-auto w-full items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shadow-2xl">
            <Check className="w-10 h-10 text-green-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white">All Set!</h2>
            <p className="text-white/70 text-base">
              Your BitChord TV experience is fully configured and ready for playback.
            </p>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 w-full text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">TV Nickname:</span>
              <span className="text-white font-semibold">{nickname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Theme:</span>
              <span className="text-white font-semibold capitalize">{selectedTheme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">YouTube Music:</span>
              <span className="text-white font-semibold">{isSignedIn ? userProfile?.name || 'Imo-Kenpi' : 'Guest'}</span>
            </div>
          </div>

          <button
            onClick={finishSetup}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-95 shadow-xl cursor-pointer text-base"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Start Listening</span>
          </button>
        </div>
      )}
    </div>
  );
}
