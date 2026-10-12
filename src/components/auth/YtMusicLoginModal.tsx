import React, { useState } from 'react';
import {
  X,
  Key,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  User,
  Image as ImageIcon,
  Tv,
  ArrowRight
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function YtMusicLoginModal() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    loginWithCookies,
    isSignedIn,
    userProfile,
    updateUserProfile,
    fetchGoogleProfile,
    logout
  } = usePlayerStore();

  const [cookieInput, setCookieInput] = useState('');
  const [usernameInput, setUsernameInput] = useState(userProfile?.name || 'Imo-Kenpi');
  const [avatarUrlInput, setAvatarUrlInput] = useState(userProfile?.avatarUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [webViewOpened, setWebViewOpened] = useState(false);

  if (!isAuthModalOpen) return null;

  // Open Google Sign-In WebView / Popup Window
  const handleOpenGoogleWebView = () => {
    setWebViewOpened(true);
    const loginUrl = 'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fmusic.youtube.com%2F';
    const popup = window.open(
      loginUrl,
      'GoogleSignIn',
      'width=540,height=680,menubar=no,toolbar=no,location=yes,status=no'
    );

    if (!popup) {
      // If popup was blocked, fallback to tab
      window.open(loginUrl, '_blank');
    }
  };

  const handleLogin = async () => {
    if (!cookieInput.trim()) {
      setError('Please paste your YouTube Music / Google session cookie string.');
      return;
    }
    setLoading(true);
    setError(null);

    const ok = await loginWithCookies(
      cookieInput,
      usernameInput.trim() || 'Imo-Kenpi',
      avatarUrlInput.trim() || undefined
    );
    setLoading(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAuthModalOpen(false);
      }, 1500);
    } else {
      setError('Could not find a valid SAPISID or __Secure-3PAPISID in the provided cookie string. Please verify you copied from music.youtube.com.');
    }
  };

  const handleDemoLogin = () => {
    updateUserProfile({
      name: 'Imo-Kenpi',
      channelHandle: '@imokenpi_tv',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAuthModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#13111c] border border-white/10 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Exit Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Google "G" logo */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Google & YouTube Music</h3>
              <p className="text-xs text-white/50">Google Account Authentication Flow</p>
            </div>
          </div>
          {/* Prominent Exit Button */}
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Exit / Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Status */}
        {isSignedIn && userProfile && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={userProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt=""
                className="w-11 h-11 rounded-full object-cover border border-white/20 shadow"
              />
              <div>
                <p className="font-semibold text-sm text-white">{userProfile.name}</p>
                <p className="text-xs text-white/50">{userProfile.channelHandle || '@google_user'}</p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated & Connected
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* 1. Google Login WebView Launcher Button */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-blue-200">Open Google Sign-In Window</h4>
              <p className="text-xs text-blue-300/70">
                Opens the real Google authentication portal in an isolated window.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenGoogleWebView}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Google Login WebView</span>
          </button>

          {webViewOpened && (
            <p className="text-[11px] text-white/50 text-center">
              Window launched! After completing sign-in on Google, your cookies authenticate your account below.
            </p>
          )}
        </div>

        {/* 2. Session Cookie Importer */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-white/70 mb-1.5 block">
              Google Account Display Name
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
              Google Profile Photo URL (Optional)
            </label>
            <input
              type="text"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              placeholder="https://lh3.googleusercontent.com/..."
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 mb-1.5 block">
              Google Session Cookies
            </label>
            <textarea
              rows={3}
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              placeholder="SAPISID=xxx; __Secure-3PAPISID=xxx; SSID=xxx..."
              className="w-full px-3.5 py-2 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
            <p className="text-[11px] text-white/40 mt-1">
              Copied from DevTools Network headers on{' '}
              <a
                href="https://music.youtube.com"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:underline"
              >
                music.youtube.com
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
              <span>Authenticated successfully! Updating profile...</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Validating Token...' : 'Authenticate & Sync'}</span>
            </button>

            <button
              onClick={handleDemoLogin}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Quickly test with demo Google account"
            >
              Set Demo Profile
            </button>
          </div>
        </div>

        {/* Exit Button at Bottom */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Exit / Close
          </button>
        </div>
      </div>
    </div>
  );
}
