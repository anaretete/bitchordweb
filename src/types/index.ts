export interface Song {
  videoId: string;
  title: string;
  artists: Artist[];
  album?: Album;
  thumbnails: Thumbnail[];
  duration?: number; // seconds
  durationText?: string;
  isExplicit?: boolean;
  feedbackTokens?: { like?: string; dislike?: string };
  playlistId?: string;
}

export interface Artist {
  id?: string;
  name: string;
  thumbnails?: Thumbnail[];
}

export interface Album {
  id?: string;
  name: string;
  thumbnails?: Thumbnail[];
  year?: string;
}

export interface Playlist {
  id: string;
  name: string;
  thumbnails: Thumbnail[];
  songCount?: number;
  author?: string;
  description?: string;
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface SearchResult {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface BrowseResult {
  title: string;
  contents: BrowseItem[];
}

export interface BrowseItem {
  type: 'song' | 'album' | 'artist' | 'playlist' | 'video';
  data: Song | Album | Artist | Playlist;
}

export interface BrowseShelf {
  title: string;
  items: BrowseItem[];
  browseId?: string;
}

export interface PlayerResponse {
  streamingData?: {
    formats: StreamFormat[];
    adaptiveFormats: StreamFormat[];
  };
  videoDetails?: {
    videoId: string;
    title: string;
    lengthSeconds: string;
    thumbnail: { thumbnails: Thumbnail[] };
    author?: string;
    channelId?: string;
  };
}

export interface StreamFormat {
  url?: string;
  signatureCipher?: string;
  mimeType: string;
  bitrate: number;
  audioQuality?: string;
  approxDurationMs?: string;
  contentLength?: string;
  itag: number;
}

export interface LyricLine {
  startTimeMs: number;
  endTimeMs?: number;
  text: string;
}

export interface Lyrics {
  lines: LyricLine[];
  source: string;
  isSynced: boolean;
  plainText?: string;
}

export interface AlbumDetail {
  id: string;
  name: string;
  artists: Artist[];
  thumbnails: Thumbnail[];
  year?: string;
  tracks: Song[];
  description?: string;
  duration?: string;
}

export interface ArtistDetail {
  id: string;
  name: string;
  thumbnails: Thumbnail[];
  description?: string;
  topSongs: Song[];
  albums: Album[];
  singles: Album[];
  similarArtists: Artist[];
  subscribers?: string;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  thumbnails: Thumbnail[];
  author?: string;
  description?: string;
  tracks: Song[];
  trackCount?: number;
  duration?: string;
}

export interface MoodCategory {
  title: string;
  params: string;
}

export interface MoodGenre {
  title: string;
  subtitle?: string;
  browseId?: string;
  params?: string;
  stripeColor: string;
  thumbnailUrl: string;
}

export interface MoodGenreSection {
  title: string;
  items: MoodGenre[];
}

export interface Chart {
  title: string;
  items: Song[];
  playlist?: string;
}

export interface SearchSuggestion {
  text: string;
}

export type RepeatMode = 'off' | 'one' | 'all';
export type ShuffleMode = 'off' | 'on';
export type AudioQuality = 'auto' | 'low' | 'medium' | 'high';
export type ThemeMode = 'dark' | 'light' | 'system';

export type SetupStep = 'WELCOME' | 'LOGIN' | 'NICKNAME' | 'THEME' | 'CUSTOMIZATION' | 'COMPLETE';

export interface AppThemeOption {
  id: string;
  name: string;
  bgHex: string;
  accentHex: string;
}

export interface SavedSongItem extends Song {
  savedAt: number;
}

export interface ListeningHistoryItem {
  id?: number;
  videoId: string;
  song: Song;
  playedAt: number;
  completed?: boolean;
}

export interface RecentSearchItem {
  query: string;
  timestamp: number;
}

export interface SettingItem {
  key: string;
  value: unknown;
}
