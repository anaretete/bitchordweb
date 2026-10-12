import { create } from 'zustand';
import type { Song, Lyrics, RepeatMode, ShuffleMode } from '../types';
import { repository } from '../services/repository';
import { addToHistory, saveSong, removeSong, isSongSaved } from '../services/db';
import { storage } from '../services/storage';
import { ytController } from '../services/youtubePlayer';

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
    `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;

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

// Exact curated tracks from Screenshots 1, 3, 4 with real playable YouTube video IDs
export const SCREENSHOT_TRACKS: Track[] = [
  {
    id: '4IKHox-DKrM',
    title: 'モンストロ - Monstruo',
    artist: 'Ado',
    album: 'Monstruo',
    duration: 225,
    thumbnail: 'https://i.ytimg.com/vi/4IKHox-DKrM/hqdefault.jpg',
  },
  {
    id: 'sLgtJA8NYSA',
    title: '空に架かる君の声。 - Sora ni kakaru kiminokoe. (feat. Nano, Nozomu, F9 & Lon)',
    artist: 'nayuta',
    album: 'Sora ni kakaru kiminokoe',
    duration: 223,
    thumbnail: 'https://i.ytimg.com/vi/sLgtJA8NYSA/hqdefault.jpg',
  },
  {
    id: 'jCryi2MWEBw',
    title: 'Every Day, rain or shine',
    artist: 'kinoue64',
    album: 'The Time Machine School',
    duration: 188,
    thumbnail: 'https://i.ytimg.com/vi/jCryi2MWEBw/hqdefault.jpg',
  },
  {
    id: 'D1GgNZKpfUc',
    title: 'Roots of Tranquil Eternity',
    artist: 'HOYO-MiX',
    album: 'Genshin Impact The Shimmering Voyage Vol. 2',
    duration: 126,
    thumbnail: 'https://i.ytimg.com/vi/D1GgNZKpfUc/hqdefault.jpg',
  },
  {
    id: 'bF3-gwXKdwI',
    title: 'Pray',
    artist: 'Eve',
    album: 'Under Blue',
    duration: 185,
    thumbnail: 'https://i.ytimg.com/vi/bF3-gwXKdwI/hqdefault.jpg',
  },
  {
    id: 'n2mmYLXM1Ig',
    title: 'look at the sea / cover',
    artist: 'xea',
    album: 'look at the sea',
    duration: 206,
    thumbnail: 'https://i.ytimg.com/vi/n2mmYLXM1Ig/hqdefault.jpg',
  },
  {
    id: 'rEme1MzWWvs',
    title: '捨てる - suteru',
    artist: 'kinoue64',
    album: 'The Time Machine School',
    duration: 264,
    thumbnail: 'https://i.ytimg.com/vi/rEme1MzWWvs/hqdefault.jpg',
  },
  {
    id: 'X0ni2nefOWo',
    title: '花の画 - flower painting',
    artist: 'aminos',
    album: 'flower painting',
    duration: 201,
    thumbnail: 'https://i.ytimg.com/vi/X0ni2nefOWo/hqdefault.jpg',
  },
];

interface PlayerState {
  currentTrack: Track;
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
  playTrackDirect: (track: Track, newQueue?: Track[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
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

function parseCookies(str: string): { sapisid?: string } {
  let sapisid: string | undefined;
  const matches = str.match(/(?:__Secure-3PAPISID|SAPISID)=([^;]+)/);
  if (matches && matches[1]) {
    sapisid = matches[1].trim();
  }
  return { sapisid };
}

// Update MediaSession
function updateMediaSession(track: Track) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [
        { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  } catch {}
}

const initialTrack = SCREENSHOT_TRACKS[0];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: initialTrack,
  isPlaying: false,
  currentTime: 0,
  duration: initialTrack.duration,
  buffered: 0,
  volume: typeof window !== 'undefined' ? storage.getVolume() : 1,
  isMuted: false,
  isBuffering: false,
  playbackRate: 1,
  queue: SCREENSHOT_TRACKS,
  queueIndex: 0,
  repeatMode: (typeof window !== 'undefined' ? storage.getRepeatMode() : 'off') as RepeatMode,
  shuffleMode: (typeof window !== 'undefined' ? storage.getShuffleMode() : 'off') as ShuffleMode,
  autoplayEnabled: true,
  originalQueue: SCREENSHOT_TRACKS,
  isFullPlayerOpen: false,
  isLyricsOpen: false,
  lyrics: null,
  isFavorite: false,
  streamError: null,

  // Setup state - Defaults to true so the real TV UI loads instantly
  isSetupCompleted: true,
  tvNickname: (typeof window !== 'undefined' && localStorage.getItem('bitchord_tv_nickname')) || 'Living Room TV',
  tvTheme: (typeof window !== 'undefined' && localStorage.getItem('bitchord_tv_theme')) || 'dynamic',
  automix: true,
  crossfadeSeconds: 3,
  skipSilence: true,

  // Authentication State - Defaults to logged in user from Screenshot 2
  isSignedIn: true,
  userProfile: { name: 'Imo-Kenpi' },
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
    set({ automix: enabled });
  },

  setCrossfadeSeconds: (sec: number) => {
    set({ crossfadeSeconds: sec });
  },

  setSkipSilence: (enabled: boolean) => {
    set({ skipSilence: enabled });
  },

  runSetupAgain: () => {
    set({ isSetupCompleted: false });
  },

  setCurrentTrack: async (track: Track) => {
    set({ currentTrack: track, isBuffering: true, streamError: null, lyrics: null });
    updateMediaSession(track);

    addToHistory(trackToSong(track)).catch(() => {});
    isSongSaved(track.id).then((isFav) => set({ isFavorite: isFav })).catch(() => {});

    // 1. Play real audio via YouTube Player Controller
    ytController.loadAndPlay(track.id);

    // 2. Fetch lyrics asynchronously
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

  playTrackDirect: (track: Track, newQueue?: Track[]) => {
    const queue = newQueue || [track];
    const idx = queue.findIndex((t) => t.id === track.id);
    set({
      queue,
      originalQueue: [...queue],
      queueIndex: idx >= 0 ? idx : 0,
    });
    get().setCurrentTrack(track);
  },

  play: () => {
    ytController.play();
    set({ isPlaying: true });
  },

  pause: () => {
    ytController.pause();
    set({ isPlaying: false });
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
    ytController.seek(time);
    set({ currentTime: time });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    ytController.setVolume(clamped);
    storage.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      ytController.setVolume(volume || 1);
      set({ isMuted: false });
    } else {
      ytController.setVolume(0);
      set({ isMuted: true });
    }
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
    set({ queue: [currentTrack], queueIndex: 0 });
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
        throw new Error('Could not find SAPISID token in cookies.');
      }

      storage.setSapisid(sapisid);
      repository.syncSettings();

      const profile: UserProfile = {
        name: customUsername || 'Imo-Kenpi',
      };

      set({
        isSignedIn: true,
        userProfile: profile,
        isAuthModalOpen: false,
      });

      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      return false;
    }
  },

  logout: () => {
    storage.removeSapisid();
    repository.syncSettings();
    set({
      isSignedIn: false,
      userProfile: null,
    });
  },
}));
