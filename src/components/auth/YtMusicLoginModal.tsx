import React, { useState } from 'react';
import { X, Key, QrCode, LogIn, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function YtMusicLoginModal() {
  const { isAuthModalOpen, setAuthModalOpen, loginWithCookies, isSignedIn, userProfile, logout } = usePlayerStore();
  const [tab, setTab] = useState<'cookie' | 'qr'>('cookie');
  const [cookieInput, setCookieInput] = useState('');
  const [usernameInput, setUsernameInput] = useState(userProfile?.name || 'Imo-Kenpi');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLogin = async () => {
    if (!cookieInput.trim()) {
      setError('Please paste your YouTube Music cookie string.');
      return;
    }
    setLoading(true);
    setError(null);

    const ok = await loginWithCookies(cookieInput, usernameInput.trim() || 'Imo-Kenpi');
    setLoading(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAuthModalOpen(false);
      }, 1500);
    } else {
      setError('Could not find a valid SAPISID or __Secure-3PAPISID token in the provided cookie string. Please verify you copied from music.youtube.com.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12101b] border border-white/10 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">YouTube Music Account</h3>
              <p className="text-xs text-white/50">In-App Google Authentication</p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card if already signed in */}
        {isSignedIn && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                {userProfile?.name ? userProfile.name[0] : 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">{userProfile?.name || 'Imo-Kenpi'}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated & Connected
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
          <button
            onClick={() => setTab('cookie')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'cookie' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cookie Importer</span>
          </button>
          <button
            onClick={() => setTab('qr')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'qr' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>TV Remote Pairing</span>
          </button>
        </div>

        {/* Tab 1: Cookie Importer */}
        {tab === 'cookie' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">
                Channel / Profile Name
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. Imo-Kenpi"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 mb-1.5 block">
                Paste Cookie String
              </label>
              <textarea
                rows={4}
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="SAPISID=xxx; __Secure-3PAPISID=xxx; SSID=xxx..."
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Obtain your cookies by inspecting network requests on{' '}
                <a
                  href="https://music.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 hover:underline inline-flex items-center gap-0.5"
                >
                  music.youtube.com <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-950/60 border border-green-800 rounded-xl text-green-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                <span>Successfully authenticated! Syncing account...</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Validating Token...' : 'Authenticate Google Session'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: TV Remote QR Code */}
        {tab === 'qr' && (
          <div className="space-y-4 text-center py-3">
            <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
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

            <div className="space-y-1">
              <h4 className="font-bold text-sm">Smart TV Quick Pair</h4>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Scan the QR code with your mobile camera or enter pairing code <strong>8492</strong> in BitChord Companion.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
