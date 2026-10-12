import { create } from 'zustand';
import Hls from 'hls.js';
import type { Song, Lyrics, RepeatMode, ShuffleMode, StreamFormat } from '../types';
import { repository } from '../services/repository';
import { addToHistory, saveSong, removeSong, isSongSaved, getHistory, getSavedSongs } from '../services/db';
import { storage } from '../services/storage';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  thumbnail: string;
  streamUrl?: string;
  songData?: Song;
}

export function trackToSong(track: Track): Song {
  if (track.songData) return track.songData;
  return {
    videoId: track.id,
    title: track.title,
    artists: [{ name: track.artist }],
    album: { name: track.album },
    thumbnails: [{ url: track.thumbnail, width: 300, height: 300 }],
    duration: track.duration,
  };
}

export function songToTrack(song: Song): Track {
  const artistName = song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';
  const albumName = song.album?.name || 'Single';
  const thumb =
    song.thumbnails?.[song.thumbnails.length - 1]?.url ||
    song.thumbnails?.[0]?.url ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

  return {
    id: song.videoId,
    title: song.title,
    artist: artistName,
    album: albumName,
    duration: song.duration || 180,
    thumbnail: thumb,
    songData: song,
  };
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  channelHandle?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  playbackRate: number;
  queue: Track[];
  queueIndex: number;
  repeatMode: RepeatMode;
  shuffleMode: ShuffleMode;
  autoplayEnabled: boolean;
  originalQueue: Track[];
  isFullPlayerOpen: boolean;
  isLyricsOpen: boolean;
  lyrics: Lyrics | null;
  isFavorite: boolean;
  streamError: string | null;

  // Onboarding Setup State
  isSetupCompleted: boolean;
  tvNickname: string;
  tvTheme: string;
  automix: boolean;
  crossfadeSeconds: number;
  skipSilence: boolean;

  // Authentication State
  isSignedIn: boolean;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;

  // Actions
  setCurrentTrack: (track: Track) => Promise<void>;
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleAutoplay: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  toggleFavorite: () => Promise<void>;
  setAuthModalOpen: (open: boolean) => void;
  loginWithCookies: (cookieStr: string, customUsername?: string) => Promise<boolean>;
  logout: () => void;

  // Setup Actions
  setSetupCompleted: (completed: boolean) => void;
  setTvNickname: (name: string) => void;
  setTvTheme: (themeId: string) => void;
  setAutomix: (enabled: boolean) => void;
  setCrossfadeSeconds: (sec: number) => void;
  setSkipSilence: (enabled: boolean) => void;
  runSetupAgain: () => void;
}

// Audio Engine Singleton
class WebAudioEngine {
  public audio: HTMLAudioElement;
  public hls: Hls | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      usePlayerStore.setState({ currentTime: this.audio.currentTime });
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        usePlayerStore.setState({ duration: this.audio.duration });
      }
    });

    this.audio.addEventListener('progress', () => {
      if (this.audio.buffered.length > 0) {
        const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
        usePlayerStore.setState({ buffered: bufferedEnd });
      }
    });

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.setState({ isBuffering: true });
    });

    this.audio.addEventListener('playing', () => {
      usePlayerStore.setState({ isPlaying: true, isBuffering: false, streamError: null });
    });

    this.audio.addEventListener('pause', () => {
      usePlayerStore.setState({ isPlaying: false });
    });

    this.audio.addEventListener('ended', () => {
      const state = usePlayerStore.getState();
      if (state.repeatMode === 'one') {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      } else {
        state.nextTrack();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('HTMLAudioElement stream playback error:', e);
      usePlayerStore.setState({ isBuffering: false, streamError: 'Playback stream failed or was rate-limited.' });
    });

    this.setupMediaSession();
  }

  public setupMediaSession(): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        usePlayerStore.getState().play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        usePlayerStore.getState().pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        usePlayerStore.getState().previousTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        usePlayerStore.getState().nextTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          usePlayerStore.getState().setCurrentTime(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('Failed to register mediaSession handlers:', e);
    }
  }

  public updateMediaSession(track: Track): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: [
          { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (e) {
      console.warn('Failed to update mediaSession metadata:', e);
    }
  }

  public loadTrack(url: string, playImmediately = true): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        this.hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        this.hls.loadSource(url);
        this.hls.attachMedia(this.audio);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (playImmediately) this.audio.play().catch(() => {});
        });
      } else if (this.audio.canPlayType('application/vnd.apple.mpegurl')) {
        this.audio.src = url;
        if (playImmediately) this.audio.play().catch(() => {});
      }
    } else {
      this.audio.src = url;
      if (playImmediately) {
        this.audio.play().catch((err) => {
          console.warn('Audio auto-play failed or was blocked:', err);
        });
      }
    }
  }
}

let audioEngine: WebAudioEngine | null = null;
function getAudioEngine(): WebAudioEngine {
  if (!audioEngine) {
    audioEngine = new WebAudioEngine();
  }
  return audioEngine;
}

function parseCookies(str: string): { sapisid?: string; ppid?: string } {
  let sapisid: string | undefined;
  let ppid: string | undefined;

  const matches1 = str.match(/(?:__Secure-3PAPISID|SAPISID)=([^;]+)/);
  if (matches1 && matches1[1]) {
    sapisid = matches1[1].trim();
  }

  const matches2 = str.match(/PPID=([^;]+)/);
  if (matches2 && matches2[1]) {
    ppid = matches2[1].trim();
  }

  return { sapisid, ppid };
}

// Read saved state
const initialSapisid = typeof window !== 'undefined' ? storage.getSapisid() : null;
const savedProfileStr = typeof window !== 'undefined' ? localStorage.getItem('bitchord_user_profile') : null;
let savedProfile: UserProfile | null = null;
try {
  if (savedProfileStr) savedProfile = JSON.parse(savedProfileStr);
} catch {
  savedProfile = null;
}

const initialSetupCompleted = typeof window !== 'undefined' ? localStorage.getItem('bitchord_setup_completed') === 'true' : false;
const initialNickname = (typeof window !== 'undefined' && localStorage.getItem('bitchord_tv_nickname')) || 'Living Room TV';
const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('bitchord_tv_theme')) || 'dynamic';
const initialAutomix = typeof window !== 'undefined' ? localStorage.getItem('bitchord_automix') !== 'false' : true;
const initialCrossfade = typeof window !== 'undefined' ? Number(localStorage.getItem('bitchord_crossfade') || 3) : 3;
const initialSkipSilence = typeof window !== 'undefined' ? localStorage.getItem('bitchord_skip_silence') !== 'false' : true;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: typeof window !== 'undefined' ? storage.getVolume() : 1,
  isMuted: false,
  isBuffering: false,
  playbackRate: 1,
  queue: [],
  queueIndex: -1,
  repeatMode: (typeof window !== 'undefined' ? storage.getRepeatMode() : 'off') as RepeatMode,
  shuffleMode: (typeof window !== 'undefined' ? storage.getShuffleMode() : 'off') as ShuffleMode,
  autoplayEnabled: true,
  originalQueue: [],
  isFullPlayerOpen: false,
  isLyricsOpen: false,
  lyrics: null,
  isFavorite: false,
  streamError: null,

  // Setup state
  isSetupCompleted: initialSetupCompleted,
  tvNickname: initialNickname,
  tvTheme: initialTheme,
  automix: initialAutomix,
  crossfadeSeconds: initialCrossfade,
  skipSilence: initialSkipSilence,

  // Authentication State
  isSignedIn: Boolean(initialSapisid),
  userProfile: savedProfile || (initialSapisid ? { name: 'Imo-Kenpi' } : null),
  isAuthModalOpen: false,

  setSetupCompleted: (completed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_setup_completed', completed ? 'true' : 'false');
    }
    set({ isSetupCompleted: completed });
  },

  setTvNickname: (name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_tv_nickname', name);
    }
    set({ tvNickname: name });
  },

  setTvTheme: (themeId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_tv_theme', themeId);
    }
    set({ tvTheme: themeId });
  },

  setAutomix: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_automix', enabled ? 'true' : 'false');
    }
    set({ automix: enabled });
  },

  setCrossfadeSeconds: (sec: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_crossfade', String(sec));
    }
    set({ crossfadeSeconds: sec });
  },

  setSkipSilence: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitchord_skip_silence', enabled ? 'true' : 'false');
    }
    set({ skipSilence: enabled });
  },

  runSetupAgain: () => {
    set({ isSetupCompleted: false });
  },

  setCurrentTrack: async (track: Track) => {
    const engine = getAudioEngine();
    set({ currentTrack: track, isBuffering: true, streamError: null, lyrics: null });
    engine.updateMediaSession(track);

    // Record to history and check favorite
    addToHistory(trackToSong(track)).catch(console.error);
    isSongSaved(track.id).then((isFav) => set({ isFavorite: isFav })).catch(() => {});

    try {
      // 1. Resolve real audio stream URL from InnerTube or Piped
      const streamInfo = await repository.getStreamingUrl(track.id);
      if (!streamInfo.url) {
        throw new Error('No playable stream URL returned');
      }

      track.streamUrl = streamInfo.url;
      engine.loadTrack(streamInfo.url, true);
    } catch (err: any) {
      console.error('Failed to load streaming URL for track:', err);
      set({ isBuffering: false, streamError: err.message || 'Stream fetch failed' });
    }

    // 2. Fetch synchronized lyrics in background
    repository.getLyrics(track.id).then((l) => {
      if (l) set({ lyrics: l });
    }).catch(() => {});
  },

  playSong: async (song: Song, newQueue?: Song[]) => {
    const track = songToTrack(song);
    let queueTracks: Track[];

    if (newQueue && newQueue.length > 0) {
      queueTracks = newQueue.map(songToTrack);
    } else {
      queueTracks = [track];
    }

    const targetIdx = queueTracks.findIndex((t) => t.id === track.id);
    const finalIdx = targetIdx >= 0 ? targetIdx : 0;

    set({
      queue: queueTracks,
      originalQueue: [...queueTracks],
      queueIndex: finalIdx,
    });

    await get().setCurrentTrack(queueTracks[finalIdx]);
  },

  play: () => {
    const engine = getAudioEngine();
    engine.audio.play().catch((e) => console.warn('Audio play request failed:', e));
  },

  pause: () => {
    const engine = getAudioEngine();
    engine.audio.pause();
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  setCurrentTime: (time: number) => {
    const engine = getAudioEngine();
    engine.audio.currentTime = time;
    set({ currentTime: time });
  },

  setVolume: (volume: number) => {
    const engine = getAudioEngine();
    const clamped = Math.max(0, Math.min(1, volume));
    engine.audio.volume = clamped;
    storage.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const engine = getAudioEngine();
    const { isMuted, volume } = get();
    if (isMuted) {
      engine.audio.muted = false;
      set({ isMuted: false });
    } else {
      engine.audio.muted = true;
      set({ isMuted: true });
    }
  },

  setPlaybackRate: (rate: number) => {
    const engine = getAudioEngine();
    engine.audio.playbackRate = rate;
    set({ playbackRate: rate });
  },

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, autoplayEnabled, currentTrack } = get();
    if (queue.length === 0) return;

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      set({ queueIndex: nextIdx });
      get().setCurrentTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      set({ queueIndex: 0 });
      get().setCurrentTrack(queue[0]);
    } else if (autoplayEnabled && currentTrack) {
      // Autoplay: fetch next recommended songs from YouTube Music
      repository.getQueue(currentTrack.id).then((nextSongs) => {
        if (nextSongs.length > 0) {
          const nextTrack = songToTrack(nextSongs[0]);
          get().addToQueue(nextTrack);
          set({ queueIndex: queue.length });
          get().setCurrentTrack(nextTrack);
        } else {
          set({ isPlaying: false });
        }
      }).catch(() => {
        set({ isPlaying: false });
      });
    } else {
      set({ isPlaying: false });
    }
  },

  previousTrack: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;

    if (get().currentTime > 3) {
      get().setCurrentTime(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      set({ queueIndex: prevIdx });
      get().setCurrentTrack(queue[prevIdx]);
    } else {
      get().setCurrentTime(0);
    }
  },

  addToQueue: (track: Track) => {
    set((state) => ({ queue: [...state.queue, track], originalQueue: [...state.originalQueue, track] }));
  },

  removeFromQueue: (index: number) => {
    const { queue, queueIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;
    if (index < queueIndex) {
      newIndex--;
    } else if (index === queueIndex && newIndex >= newQueue.length) {
      newIndex = Math.max(0, newQueue.length - 1);
    }
    set({ queue: newQueue, queueIndex: newIndex });
  },

  clearQueue: () => {
    const { currentTrack } = get();
    if (currentTrack) {
      set({ queue: [currentTrack], queueIndex: 0 });
    } else {
      set({ queue: [], queueIndex: 0 });
    }
  },

  toggleShuffle: () => {
    const { shuffleMode, queue, originalQueue, currentTrack } = get();
    if (shuffleMode === 'off') {
      const remaining = queue.filter((t) => t.id !== currentTrack?.id);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      const shuffled = currentTrack ? [currentTrack, ...remaining] : remaining;
      set({ shuffleMode: 'on', queue: shuffled, queueIndex: 0 });
    } else {
      const newIndex = originalQueue.findIndex((t) => t.id === currentTrack?.id);
      set({ shuffleMode: 'off', queue: originalQueue, queueIndex: newIndex >= 0 ? newIndex : 0 });
    }
  },

  cycleRepeat: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  toggleAutoplay: () => {
    set((s) => ({ autoplayEnabled: !s.autoplayEnabled }));
  },

  setFullPlayerOpen: (open: boolean) => {
    set({ isFullPlayerOpen: open });
  },

  setLyricsOpen: (open: boolean) => {
    set({ isLyricsOpen: open });
  },

  toggleFavorite: async () => {
    const { currentTrack, isFavorite } = get();
    if (!currentTrack) return;
    const song = trackToSong(currentTrack);
    if (isFavorite) {
      await removeSong(song.videoId);
      set({ isFavorite: false });
    } else {
      await saveSong(song);
      set({ isFavorite: true });
    }
  },

  setAuthModalOpen: (open: boolean) => {
    set({ isAuthModalOpen: open });
  },

  loginWithCookies: async (cookieStr: string, customUsername?: string): Promise<boolean> => {
    try {
      const { sapisid } = parseCookies(cookieStr);
      if (!sapisid) {
        throw new Error('Could not find SAPISID or __Secure-3PAPISID in the provided cookie string.');
      }

      storage.setSapisid(sapisid);
      repository.syncSettings();

      const profile: UserProfile = {
        name: customUsername || 'Imo-Kenpi',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('bitchord_user_profile', JSON.stringify(profile));
      }

      set({
        isSignedIn: true,
        userProfile: profile,
        isAuthModalOpen: false,
      });

      return true;
    } catch (err: any) {
      console.error('Login with cookie failed:', err);
      return false;
    }
  },

  logout: () => {
    storage.removeSapisid();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bitchord_user_profile');
    }
    repository.syncSettings();
    set({
      isSignedIn: false,
      userProfile: null,
    });
  },
}));
