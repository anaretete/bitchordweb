import type {
  Album,
  AlbumDetail,
  Artist,
  ArtistDetail,
  BrowseItem,
  BrowseShelf,
  Lyrics,
  LyricLine,
  PlayerResponse,
  PlaylistDetail,
  SearchResult,
  SearchSuggestion,
  Song,
  StreamFormat,
  Thumbnail,
} from '../types';

export interface InnerTubeConfig {
  corsProxy?: string;
  baseUrl?: string;
  visitorData?: string;
  sapisid?: string;
  origin?: string;
}

const DEFAULT_CONFIG: InnerTubeConfig = {
  corsProxy: 'https://api.allorigins.win/raw?url=',
  baseUrl: 'https://music.youtube.com/youtubei/v1',
  origin: 'https://music.youtube.com',
};

// Client Context for YouTube Music (WEB_REMIX)
const WEB_REMIX_CLIENT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20250120.01.00',
    hl: 'en',
    gl: 'US',
    utcOffsetMinutes: 0,
  },
};

/**
 * Generate SAPISIDHASH for authenticated YouTube requests
 */
export async function generateSAPISIDHash(sapisid: string, origin: string = 'https://music.youtube.com'): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${timestamp} ${sapisid} ${origin}`;
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-1', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `SAPISIDHASH ${timestamp}_${hashHex}`;
}

export class InnerTubeClient {
  private config: InnerTubeConfig;

  constructor(config: Partial<InnerTubeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public setConfig(config: Partial<InnerTubeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): InnerTubeConfig {
    return { ...this.config };
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const directUrl = `${this.config.baseUrl}/${cleanEndpoint}`;
    if (!this.config.corsProxy) {
      return directUrl;
    }
    // If the proxy uses a query parameter format
    if (this.config.corsProxy.includes('url=')) {
      return `${this.config.corsProxy}${encodeURIComponent(directUrl)}`;
    }
    // Standard prefix proxy (e.g. https://cors-anywhere.com/)
    return `${this.config.corsProxy}${directUrl}`;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '67',
      'X-YouTube-Client-Version': WEB_REMIX_CLIENT.client.clientVersion,
      'X-Origin': this.config.origin || 'https://music.youtube.com',
    };

    if (this.config.visitorData) {
      headers['X-Goog-Visitor-Id'] = this.config.visitorData;
    }

    if (this.config.sapisid) {
      const authHash = await generateSAPISIDHash(this.config.sapisid, this.config.origin);
      headers['Authorization'] = authHash;
      headers['X-Goog-AuthUser'] = '0';
    }

    return headers;
  }

  private async post<T = unknown>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = await this.getHeaders();

    const payload = {
      context: {
        ...WEB_REMIX_CLIENT,
        client: {
          ...WEB_REMIX_CLIENT.client,
          visitorData: this.config.visitorData || undefined,
        },
      },
      ...body,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`InnerTube request failed (${res.status} ${res.statusText}) on ${endpoint}`);
    }

    return (await res.json()) as T;
  }

  // --- Core API Endpoints ---

  public async browse(browseId: string, params?: string): Promise<Record<string, any>> {
    return this.post('browse', {
      browseId,
      params,
    });
  }

  public async search(query: string, params?: string): Promise<Record<string, any>> {
    return this.post('search', {
      query,
      params,
    });
  }

  public async player(videoId: string, playlistId?: string): Promise<PlayerResponse> {
    const raw = await this.post<Record<string, any>>('player', {
      videoId,
      playlistId,
      contentCheckOk: true,
      racyCheckOk: true,
    });

    return normalizePlayerResponse(raw);
  }

  public async next(videoId?: string, playlistId?: string, playlistIndex?: number): Promise<Record<string, any>> {
    return this.post('next', {
      videoId,
      playlistId,
      playlistIndex,
      isAudioOnly: true,
      enablePersistentPlaylistPanel: true,
    });
  }

  public async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const raw = await this.post<Record<string, any>>('music/get_search_suggestions', {
        input: query,
      });

      const contents = raw?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents || [];
      const suggestions: SearchSuggestion[] = [];

      for (const item of contents) {
        const text =
          item?.searchSuggestionRenderer?.suggestion?.runs?.map((r: any) => r.text).join('') ||
          item?.historySuggestionRenderer?.suggestion?.runs?.map((r: any) => r.text).join('');
        if (text) {
          suggestions.push({ text });
        }
      }

      return suggestions;
    } catch {
      return [];
    }
  }

  public async getHomeFeed(): Promise<BrowseShelf[]> {
    const raw = await this.browse('FEmusic_home');
    return parseHomeFeed(raw);
  }

  public async searchParsed(query: string, filter?: 'songs' | 'albums' | 'artists' | 'playlists'): Promise<SearchResult> {
    let params: string | undefined;
    if (filter === 'songs') params = 'Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'albums') params = 'Eg-KAQwBAhABGAAgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'artists') params = 'Eg-KAQwEAxgBGAAgACgAMABqChAEEAMQCRAFEAo%3D';
    else if (filter === 'playlists') params = 'Eg-KAQwIAxAAGAAgACgAMABqChAEEAMQCRAFEAo%3D';

    const raw = await this.search(query, params);
    return parseSearchResults(raw);
  }

  public async getArtist(channelId: string): Promise<ArtistDetail> {
    const raw = await this.browse(channelId);
    return parseArtistDetail(raw, channelId);
  }

  public async getAlbum(albumId: string): Promise<AlbumDetail> {
    const browseId = albumId.startsWith('MPREb_') ? albumId : `MPREb_${albumId}`;
    const raw = await this.browse(browseId);
    return parseAlbumDetail(raw, browseId);
  }

  public async getPlaylist(playlistId: string): Promise<PlaylistDetail> {
    const browseId = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`;
    const raw = await this.browse(browseId);
    return parsePlaylistDetail(raw, playlistId);
  }

  public async getAccountInfo(): Promise<{ name: string; email?: string; channelHandle?: string; avatarUrl?: string } | null> {
    try {
      const raw = await this.post<any>('/account/account_menu', {});
      const menu = raw?.actions?.[0]?.openPopupAction?.popup?.multiPageMenuRenderer?.header?.activeAccountHeaderRenderer;
      if (!menu) return null;
      return {
        name: menu.accountName?.runs?.[0]?.text || 'Google User',
        email: menu.email?.runs?.[0]?.text,
        channelHandle: menu.channelHandle?.runs?.[0]?.text,
        avatarUrl: menu.accountPhoto?.thumbnails?.slice(-1)[0]?.url,
      };
    } catch {
      return null;
    }
  }

  public async getQueue(videoId: string): Promise<Song[]> {
    const raw = await this.next(videoId);
    return parseQueue(raw);
  }

  public async getLyrics(browseIdOrVideoId: string): Promise<Lyrics | null> {
    try {
      let lyricsBrowseId = browseIdOrVideoId;
      if (!browseIdOrVideoId.startsWith('MPLYt_')) {
        const nextRes = await this.next(browseIdOrVideoId);
        const tabs = nextRes?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
        const lyricsTab = tabs?.find((tab: any) => tab?.tabRenderer?.endpoint?.browseEndpoint?.browseId);
        lyricsBrowseId = lyricsTab?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
      }

      if (!lyricsBrowseId) {
        return null;
      }

      const raw = await this.browse(lyricsBrowseId);
      const section = raw?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer;
      const description = section?.description?.runs?.map((r: any) => r.text).join('') || '';
      const footer = section?.footer?.runs?.map((r: any) => r.text).join('') || 'YouTube Music';

      if (!description) return null;

      const lines: LyricLine[] = description.split('\n').filter(Boolean).map((line: string, index: number) => ({
        startTimeMs: index * 3000,
        text: line.trim(),
      }));

      return {
        lines,
        plainText: description,
        source: footer,
        isSynced: false,
      };
    } catch {
      return null;
    }
  }
}

// ============================================================================
// Response Parsing & Normalization Helpers
// ============================================================================

export function extractRunsText(runs?: any[]): string {
  if (!runs || !Array.isArray(runs)) return '';
  return runs.map((r) => r?.text || '').join('');
}

export function extractThumbnails(thumbnailObj?: any): Thumbnail[] {
  const list = thumbnailObj?.thumbnails || thumbnailObj?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
  if (!Array.isArray(list)) return [];
  return list.map((t: any) => ({
    url: t.url,
    width: t.width || 0,
    height: t.height || 0,
  }));
}

export function parseDuration(durationStr?: string): number | undefined {
  if (!durationStr) return undefined;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return undefined;
}

export function parseResponsiveListItem(item: any): Song | Album | Artist | Playlist | null {
  const renderer = item?.musicResponsiveListItemRenderer;
  if (!renderer) return null;

  const flexColumns = renderer.flexColumns || [];
  const titleRuns = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const title = extractRunsText(titleRuns);

  const subRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const thumbnails = extractThumbnails(renderer.thumbnail);

  const playNavigation = renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint;
  const videoId =
    playNavigation?.watchEndpoint?.videoId ||
    renderer.playlistItemData?.videoId ||
    renderer.navigationEndpoint?.watchEndpoint?.videoId;

  const isSongOrVideo = Boolean(videoId);

  if (isSongOrVideo) {
    const artists: Artist[] = [];
    let album: Album | undefined;
    let durationText: string | undefined;

    for (let i = 0; i < subRuns.length; i++) {
      const run = subRuns[i];
      const pageType = run?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
      const browseId = run?.navigationEndpoint?.browseEndpoint?.browseId;

      if (pageType === 'MUSIC_PAGE_TYPE_ARTIST' || pageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL') {
        artists.push({
          id: browseId,
          name: run.text,
        });
      } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
        album = {
          id: browseId,
          name: run.text,
        };
      } else if (/^\d+:\d+(:\d+)?$/.test(run.text.trim())) {
        durationText = run.text.trim();
      }
    }

    if (artists.length === 0 && subRuns.length > 0) {
      const firstArtistName = subRuns[0]?.text?.trim();
      if (firstArtistName && firstArtistName !== '•') {
        artists.push({ name: firstArtistName });
      }
    }

    const song: Song = {
      videoId,
      title,
      artists,
      album,
      thumbnails,
      durationText,
      duration: parseDuration(durationText),
    };
    return song;
  }

  // Browse endpoint navigation
  const browseEndpoint = renderer.navigationEndpoint?.browseEndpoint;
  const browseId = browseEndpoint?.browseId;
  const pageType = browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

  if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
    return {
      id: browseId,
      name: title,
      thumbnails,
    } as Artist;
  }

  if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
    return {
      id: browseId,
      name: title,
      thumbnails,
      year: subRuns[subRuns.length - 1]?.text,
    } as Album;
  }

  if (pageType === 'MUSIC_PAGE_TYPE_PLAYLIST') {
    return {
      id: browseId,
      name: title,
      thumbnails,
      author: subRuns[0]?.text,
    } as Playlist;
  }

  return null;
}

export function parseTwoRowItem(item: any): BrowseItem | null {
  const renderer = item?.musicTwoRowItemRenderer;
  if (!renderer) return null;

  const title = extractRunsText(renderer.title?.runs);
  const subtitleRuns = renderer.subtitle?.runs || [];
  const thumbnails = extractThumbnails(renderer.thumbnailRenderer);

  const watchEndpoint = renderer.navigationEndpoint?.watchEndpoint;
  const browseEndpoint = renderer.navigationEndpoint?.browseEndpoint;
  const pageType = browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

  if (watchEndpoint?.videoId) {
    const song: Song = {
      videoId: watchEndpoint.videoId,
      title,
      artists: [{ name: extractRunsText(subtitleRuns) }],
      thumbnails,
    };
    return { type: 'song', data: song };
  }

  if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
    const artist: Artist = {
      id: browseEndpoint.browseId,
      name: title,
      thumbnails,
    };
    return { type: 'artist', data: artist };
  }

  if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
    const album: Album = {
      id: browseEndpoint.browseId,
      name: title,
      thumbnails,
    };
    return { type: 'album', data: album };
  }

  if (pageType === 'MUSIC_PAGE_TYPE_PLAYLIST') {
    const playlist: Playlist = {
      id: browseEndpoint.browseId,
      name: title,
      thumbnails,
      author: extractRunsText(subtitleRuns),
    };
    return { type: 'playlist', data: playlist };
  }

  return null;
}

export function parseHomeFeed(raw: any): BrowseShelf[] {
  const shelves: BrowseShelf[] = [];
  const sections =
    raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

  for (const sec of sections) {
    const carousel = sec?.musicCarouselShelfRenderer;
    if (!carousel) continue;

    const title = extractRunsText(carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs);
    const browseId =
      carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const contents = carousel.contents || [];

    const items: BrowseItem[] = [];

    for (const item of contents) {
      if (item.musicTwoRowItemRenderer) {
        const parsed = parseTwoRowItem(item);
        if (parsed) items.push(parsed);
      } else if (item.musicResponsiveListItemRenderer) {
        const parsed = parseResponsiveListItem(item);
        if (parsed) {
          if ('videoId' in parsed) {
            items.push({ type: 'song', data: parsed });
          } else if ('tracks' in (parsed as any) || 'year' in parsed) {
            items.push({ type: 'album', data: parsed as Album });
          } else if ('songCount' in (parsed as any) || 'author' in parsed) {
            items.push({ type: 'playlist', data: parsed as Playlist });
          } else {
            items.push({ type: 'artist', data: parsed as Artist });
          }
        }
      }
    }

    if (items.length > 0) {
      shelves.push({
        title: title || 'Recommended',
        items,
        browseId,
      });
    }
  }

  return shelves;
}

export function parseSearchResults(raw: any): SearchResult {
  const result: SearchResult = {
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  };

  const sections =
    raw?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
    raw?.contents?.sectionListRenderer?.contents ||
    [];

  for (const section of sections) {
    const shelf = section?.musicShelfRenderer || section?.musicCardShelfRenderer;
    const contents = shelf?.contents || [];

    for (const item of contents) {
      const parsed = parseResponsiveListItem(item) || parseTwoRowItem(item)?.data;
      if (!parsed) continue;

      if ('videoId' in parsed) {
        result.songs.push(parsed as Song);
      } else if ('year' in parsed) {
        result.albums.push(parsed as Album);
      } else if ('author' in parsed || 'songCount' in parsed) {
        result.playlists.push(parsed as Playlist);
      } else if ('name' in parsed && !('videoId' in parsed)) {
        result.artists.push(parsed as Artist);
      }
    }
  }

  return result;
}

export function parseArtistDetail(raw: any, channelId: string): ArtistDetail {
  const header = raw?.header?.musicImmersiveHeaderRenderer || raw?.header?.musicVisualHeaderRenderer;
  const name = extractRunsText(header?.title?.runs) || 'Unknown Artist';
  const description = extractRunsText(header?.description?.runs);
  const thumbnails = extractThumbnails(header?.thumbnail);
  const subscribers = extractRunsText(header?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs);

  const topSongs: Song[] = [];
  const albums: Album[] = [];
  const singles: Album[] = [];
  const similarArtists: Artist[] = [];

  const sections =
    raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

  for (const section of sections) {
    const carousel = section?.musicCarouselShelfRenderer;
    const shelf = section?.musicShelfRenderer;

    const title = (
      extractRunsText(carousel?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs) ||
      extractRunsText(shelf?.title?.runs)
    ).toLowerCase();

    const items = carousel?.contents || shelf?.contents || [];

    for (const item of items) {
      const parsed = parseResponsiveListItem(item) || parseTwoRowItem(item)?.data;
      if (!parsed) continue;

      if ('videoId' in parsed) {
        topSongs.push(parsed as Song);
      } else if (title.includes('album')) {
        albums.push(parsed as Album);
      } else if (title.includes('single') || title.includes('ep')) {
        singles.push(parsed as Album);
      } else if (title.includes('fans') || title.includes('similar')) {
        similarArtists.push(parsed as Artist);
      }
    }
  }

  return {
    id: channelId,
    name,
    thumbnails,
    description,
    topSongs: topSongs.slice(0, 10),
    albums,
    singles,
    similarArtists,
    subscribers,
  };
}

export function parseAlbumDetail(raw: any, albumId: string): AlbumDetail {
  const header = raw?.header?.musicDetailHeaderRenderer || raw?.header?.musicResponsiveHeaderRenderer;
  const name = extractRunsText(header?.title?.runs) || 'Unknown Album';
  const subtitleRuns = header?.subtitle?.runs || [];
  const thumbnails = extractThumbnails(header?.thumbnail);

  const artists: Artist[] = [];
  let year: string | undefined;

  for (const run of subtitleRuns) {
    if (run.navigationEndpoint?.browseEndpoint) {
      artists.push({
        id: run.navigationEndpoint.browseEndpoint.browseId,
        name: run.text,
      });
    } else if (/^\d{4}$/.test(run.text.trim())) {
      year = run.text.trim();
    }
  }

  const tracks: Song[] = [];
  const shelf =
    raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.musicShelfRenderer;

  const contents = shelf?.contents || [];

  for (const item of contents) {
    const parsed = parseResponsiveListItem(item);
    if (parsed && 'videoId' in parsed) {
      tracks.push(parsed as Song);
    }
  }

  return {
    id: albumId,
    name,
    artists,
    thumbnails,
    year,
    tracks,
    trackCount: tracks.length,
  } as AlbumDetail;
}

export function parsePlaylistDetail(raw: any, playlistId: string): PlaylistDetail {
  const header = raw?.header?.musicDetailHeaderRenderer || raw?.header?.musicResponsiveHeaderRenderer;
  const name = extractRunsText(header?.title?.runs) || 'Unknown Playlist';
  const subtitleRuns = header?.subtitle?.runs || [];
  const thumbnails = extractThumbnails(header?.thumbnail);
  const description = extractRunsText(header?.description?.runs);

  const author = subtitleRuns[0]?.text;

  const tracks: Song[] = [];
  const shelf =
    raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.musicPlaylistShelfRenderer ||
    raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
      ?.musicShelfRenderer;

  const contents = shelf?.contents || [];

  for (const item of contents) {
    const parsed = parseResponsiveListItem(item);
    if (parsed && 'videoId' in parsed) {
      tracks.push(parsed as Song);
    }
  }

  return {
    id: playlistId,
    name,
    thumbnails,
    author,
    description,
    tracks,
    trackCount: tracks.length,
  };
}

export function parseQueue(raw: any): Song[] {
  const tracks: Song[] = [];
  const tabs = raw?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs || [];
  const queueTab = tabs[0]?.tabRenderer?.content?.musicQueueRenderer;
  const items = queueTab?.content?.playlistPanelRenderer?.contents || [];

  for (const item of items) {
    const renderer = item?.playlistPanelVideoRenderer;
    if (!renderer) continue;

    const videoId = renderer.videoId;
    const title = extractRunsText(renderer.title?.runs);
    const artists: Artist[] = [];

    const longBylineRuns = renderer.longBylineText?.runs || renderer.shortBylineText?.runs || [];
    for (const run of longBylineRuns) {
      if (run.navigationEndpoint?.browseEndpoint) {
        artists.push({
          id: run.navigationEndpoint.browseEndpoint.browseId,
          name: run.text,
        });
      }
    }

    if (artists.length === 0 && longBylineRuns.length > 0) {
      artists.push({ name: longBylineRuns[0]?.text });
    }

    const durationText = extractRunsText(renderer.lengthText?.runs);

    tracks.push({
      videoId,
      title,
      artists,
      thumbnails: extractThumbnails(renderer.thumbnail),
      durationText,
      duration: parseDuration(durationText),
    });
  }

  return tracks;
}

export function normalizePlayerResponse(raw: any): PlayerResponse {
  const formats: StreamFormat[] = (raw?.streamingData?.formats || []).map((f: any) => ({
    url: f.url,
    signatureCipher: f.signatureCipher || f.cipher,
    mimeType: f.mimeType || '',
    bitrate: f.bitrate || 0,
    audioQuality: f.audioQuality,
    approxDurationMs: f.approxDurationMs,
    contentLength: f.contentLength,
    itag: f.itag,
  }));

  const adaptiveFormats: StreamFormat[] = (raw?.streamingData?.adaptiveFormats || []).map((f: any) => ({
    url: f.url,
    signatureCipher: f.signatureCipher || f.cipher,
    mimeType: f.mimeType || '',
    bitrate: f.bitrate || 0,
    audioQuality: f.audioQuality,
    approxDurationMs: f.approxDurationMs,
    contentLength: f.contentLength,
    itag: f.itag,
  }));

  const videoDetails = raw?.videoDetails
    ? {
        videoId: raw.videoDetails.videoId,
        title: raw.videoDetails.title,
        lengthSeconds: raw.videoDetails.lengthSeconds,
        thumbnail: {
          thumbnails: extractThumbnails(raw.videoDetails.thumbnail),
        },
        author: raw.videoDetails.author,
        channelId: raw.videoDetails.channelId,
      }
    : undefined;

  return {
    streamingData: {
      formats,
      adaptiveFormats,
    },
    videoDetails,
  };
}

export const innertube = new InnerTubeClient();
