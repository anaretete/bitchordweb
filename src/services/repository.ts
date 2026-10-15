import { innertube, InnerTubeClient } from '../api/innertube';
import { lyricsService } from '../api/lyrics';
import { piped, PipedClient } from '../api/piped';
import type {
  AlbumDetail,
  ArtistDetail,
  BrowseShelf,
  Chart,
  Lyrics,
  MoodCategory,
  PlaylistDetail,
  SearchResult,
  SearchSuggestion,
  Song,
  StreamFormat,
} from '../types';
import { storage } from './storage';

export class MusicRepository {
  private innertube: InnerTubeClient;
  private piped: PipedClient;
  private searchCache = new Map<string, SearchResult>();
  private suggestionCache = new Map<string, SearchSuggestion[]>();

  constructor() {
    this.innertube = innertube;
    this.piped = piped;

    // Initialize with stored preferences
    this.syncSettings();
  }

  public syncSettings(): void {
    const corsProxy = storage.getCorsProxy();
    const pipedUrl = storage.getPipedInstance();
    const sapisid = storage.getSapisid() || undefined;
    const visitorId = storage.getVisitorId() || undefined;

    this.innertube.setConfig({
      corsProxy,
      sapisid,
      visitorData: visitorId,
    });

    this.piped.setInstanceUrl(pipedUrl);
  }

  /**
   * Fetch home feed shelves (Recommended, Quick picks, Forgotten favorites, etc.)
   */
  public async getHomeFeed(): Promise<BrowseShelf[]> {
    try {
      this.syncSettings();
      const shelves = await this.innertube.getHomeFeed();
      if (shelves && shelves.length > 0) {
        return shelves;
      }
    } catch (err) {
      console.warn('InnerTube getHomeFeed failed, falling back to Piped trending:', err);
    }

    // Fallback: Piped trending songs mapped into a BrowseShelf
    try {
      const trending = await this.piped.getTrending();
      return [
        {
          title: 'Trending Songs',
          items: trending.map((song) => ({
            type: 'song',
            data: song,
          })),
        },
      ];
    } catch (pipedErr) {
      console.error('All home feed sources failed:', pipedErr);
      return [];
    }
  }

  /**
   * Ultra-fast search with in-memory caching and multi-provider racing
   */
  public async search(
    query: string,
    filter?: 'songs' | 'albums' | 'artists' | 'playlists'
  ): Promise<SearchResult> {
    const emptyResult: SearchResult = {
      songs: [],
      albums: [],
      artists: [],
      playlists: [],
    };

    const trimmed = (query || '').trim();
    if (!trimmed) return emptyResult;

    const cacheKey = `${trimmed.toLowerCase()}:${filter || 'all'}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    this.syncSettings();
    const sapisid = storage.getSapisid();

    // Strategy 1: If authenticated with SAPISID, try InnerTube with short timeout
    if (sapisid) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('InnerTube timeout')), 2200)
        );
        const result = (await Promise.race([
          this.innertube.searchParsed(trimmed, filter),
          timeoutPromise,
        ])) as SearchResult | null;

        if (result && (result.songs.length > 0 || result.albums.length > 0)) {
          this.searchCache.set(cacheKey, result);
          return result;
        }
      } catch {
        // Fallback to fast multi-provider search
      }
    }

    // Strategy 2: Fast Parallel Search via Piped & iTunes
    try {
      const searchTasks: Promise<SearchResult>[] = [];

      // Task A: Fast Piped Search (multi-instance fallback)
      searchTasks.push(
        (async () => {
          const pipedSongs = await this.piped.search(trimmed);
          return {
            songs: pipedSongs,
            albums: [],
            artists: [],
            playlists: [],
          };
        })()
      );

      // Task B: Fast iTunes Search API (instant global response ~150ms, full CORS)
      searchTasks.push(
        (async () => {
          const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
            trimmed
          )}&entity=song&limit=15`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(itunesUrl, { signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) throw new Error('iTunes failed');
          const data = await res.json();
          const songs: Song[] = (data.results || []).map((item: any) => ({
            videoId: item.previewUrl ? `itunes_${item.trackId}` : `${trimmed}`,
            title: item.trackName || '',
            artists: [{ name: item.artistName || 'Unknown Artist' }],
            album: { name: item.collectionName || 'Single' },
            thumbnails: [
              {
                url: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
                width: 600,
                height: 600,
              },
            ],
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
          }));
          return {
            songs,
            albums: [],
            artists: [],
            playlists: [],
          };
        })()
      );

      // Race or resolve fastest
      const firstValidResult = await Promise.any(
        searchTasks.map(async (t) => {
          const r = await t;
          if (r.songs.length > 0) return r;
          throw new Error('Empty');
        })
      );

      if (firstValidResult && firstValidResult.songs.length > 0) {
        this.searchCache.set(cacheKey, firstValidResult);
        return firstValidResult;
      }
    } catch (err) {
      console.warn('[Search] Fast parallel search failed, attempting piped fallback:', err);
    }

    // Final fallback
    try {
      const pipedSongs = await this.piped.search(trimmed);
      const res: SearchResult = {
        songs: pipedSongs,
        albums: [],
        artists: [],
        playlists: [],
      };
      if (res.songs.length > 0) {
        this.searchCache.set(cacheKey, res);
      }
      return res;
    } catch {
      return emptyResult;
    }
  }

  /**
   * Get direct playable streaming URL
   * Tries InnerTube first, falls back to Piped
   */
  public async getStreamingUrl(
    videoId: string
  ): Promise<{ url: string; format?: StreamFormat }> {
    this.syncSettings();

    // 1. Try InnerTube Player API
    try {
      const playerResp = await this.innertube.player(videoId);
      const streamingData = playerResp.streamingData;

      if (streamingData) {
        // Collect audio formats
        const audioFormats = [
          ...(streamingData.adaptiveFormats || []).filter((f) => f.mimeType?.startsWith('audio/')),
          ...(streamingData.formats || []).filter((f) => f.mimeType?.startsWith('audio/')),
        ];

        // Filter formats that have direct URLs (not signature cipher)
        const directFormats = audioFormats.filter((f) => Boolean(f.url));

        if (directFormats.length > 0) {
          // Sort by bitrate according to preferred quality
          directFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          const chosenFormat = directFormats[0];
          if (chosenFormat.url) {
            return {
              url: chosenFormat.url,
              format: chosenFormat,
            };
          }
        }
      }
    } catch (innerTubeErr) {
      console.warn('InnerTube player fetch failed, trying Piped streams:', innerTubeErr);
    }

    // 2. Fallback to Piped
    try {
      const pipedStreams = await this.piped.getStreams(videoId);
      if (pipedStreams.audioFormats.length > 0) {
        const best = pipedStreams.audioFormats[0];
        if (best.url) {
          return {
            url: best.url,
            format: best,
          };
        }
      }
    } catch (pipedErr) {
      console.error('Piped stream fetch failed:', pipedErr);
    }

    throw new Error(`Unable to resolve playable audio stream for videoId: ${videoId}`);
  }

  /**
   * Get Album Detail with tracks
   */
  public async getAlbum(id: string): Promise<AlbumDetail> {
    this.syncSettings();
    try {
      return await this.innertube.getAlbum(id);
    } catch (err) {
      console.error(`Failed to get album (${id}):`, err);
      throw err;
    }
  }

  /**
   * Get Artist Detail with top songs, albums, singles
   */
  public async getArtist(id: string): Promise<ArtistDetail> {
    this.syncSettings();
    try {
      return await this.innertube.getArtist(id);
    } catch (err) {
      console.error(`Failed to get artist (${id}):`, err);
      throw err;
    }
  }

  /**
   * Get Playlist Detail with tracks
   */
  public async getPlaylist(id: string): Promise<PlaylistDetail> {
    this.syncSettings();
    try {
      return await this.innertube.getPlaylist(id);
    } catch (err) {
      console.error(`Failed to get playlist (${id}):`, err);
      throw err;
    }
  }

  /**
   * Get queue / up next / radio tracks based on current videoId
   */
  public async getQueue(videoId: string): Promise<Song[]> {
    this.syncSettings();
    try {
      const queue = await this.innertube.getQueue(videoId);
      if (queue && queue.length > 0) {
        return queue;
      }
    } catch (err) {
      console.warn(`InnerTube getQueue failed for ${videoId}:`, err);
    }

    // Fallback: search similar songs via piped or return empty
    try {
      return await this.piped.getTrending();
    } catch {
      return [];
    }
  }

  /**
   * Get lyrics (tries LRCLIB synced first, falls back to InnerTube)
   */
  public async getLyrics(
    title: string,
    artist?: string,
    duration?: number,
    videoId?: string
  ): Promise<Lyrics> {
    // 1. Try LRCLIB for synced lyrics
    try {
      const lrcLyrics = await lyricsService.getLyrics(title, artist, duration);
      if (lrcLyrics && (lrcLyrics.lines.length > 0 || lrcLyrics.plainText)) {
        return lrcLyrics;
      }
    } catch (err) {
      console.warn('LRCLIB fetch error:', err);
    }

    // 2. Fallback to InnerTube native lyrics if videoId is provided
    if (videoId) {
      try {
        const itLyrics = await this.innertube.getLyrics(videoId);
        if (itLyrics && itLyrics.lines.length > 0) {
          return itLyrics;
        }
      } catch (itErr) {
        console.warn('InnerTube lyrics fetch error:', itErr);
      }
    }

    // Default empty lyrics
    return {
      lines: [],
      source: 'Not available',
      isSynced: false,
      plainText: 'No lyrics available for this song.',
    };
  }

  /**
   * Get search query autocomplete suggestions (instant caching & multi-instance fallback)
   */
  public async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const cacheKey = trimmed.toLowerCase();
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    try {
      const instances = [
        'https://api.piped.private.coffee',
        'https://pipedapi.colins.link',
        'https://pipedapi.kavin.rocks',
      ];

      for (const inst of instances) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`${inst}/suggestions?query=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const list: string[] = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              const suggestions = list.slice(0, 8).map((s) => ({ text: s }));
              this.suggestionCache.set(cacheKey, suggestions);
              return suggestions;
            }
          }
        } catch {
          // try next instance
        }
      }
    } catch {
      // fallback
    }

    return [];
  }

  public async searchSuggestions(query: string): Promise<SearchSuggestion[]> {
    return this.getSearchSuggestions(query);
  }

  /**
   * Get explore page: Moods & Genres + Top Charts
   */
  public async getExplore(): Promise<{ moods: MoodCategory[]; charts: Chart[] }> {
    const defaultMoods: MoodCategory[] = [
      { title: 'Chill', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Workout', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Focus', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Party', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Romance', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Sleep', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Energy Boost', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
      { title: 'Commute', params: 'ggMPOg1uX3Byb2RfdmVsZXZhdA%3D%3D' },
    ];

    try {
      this.syncSettings();
      const raw = await this.innertube.browse('FEmusic_explore');
      const tabs = raw?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

      const parsedMoods: MoodCategory[] = [];
      const parsedCharts: Chart[] = [];

      for (const section of tabs) {
        // Moods and genres shelf
        const moodShelf = section?.musicMoodAndGenresShelfRenderer;
        if (moodShelf?.items) {
          for (const item of moodShelf.items) {
            const btn = item?.musicNavigationButtonRenderer;
            const title = btn?.buttonText?.runs?.[0]?.text;
            const params = btn?.clickCommand?.browseEndpoint?.params;
            if (title) {
              parsedMoods.push({ title, params: params || '' });
            }
          }
        }

        // Charts carousel
        const carousel = section?.musicCarouselShelfRenderer;
        if (carousel) {
          const title = carousel?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || 'Charts';
          const items: Song[] = [];
          for (const cItem of carousel.contents || []) {
            const song = cItem?.musicResponsiveListItemRenderer;
            if (song) {
              const videoId =
                song.playlistItemData?.videoId ||
                song.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
              const songTitle = song.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
              if (videoId && songTitle) {
                items.push({
                  videoId,
                  title: songTitle,
                  artists: [{ name: song.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Various' }],
                  thumbnails: song.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [],
                });
              }
            }
          }
          if (items.length > 0) {
            parsedCharts.push({ title, items });
          }
        }
      }

      return {
        moods: parsedMoods.length > 0 ? parsedMoods : defaultMoods,
        charts: parsedCharts,
      };
    } catch (err) {
      console.warn('InnerTube explore failed, using defaults:', err);
      return {
        moods: defaultMoods,
        charts: [],
      };
    }
  }

  public async getAccountInfo() {
    this.syncSettings();
    return this.innertube.getAccountInfo();
  }
}

export const repository = new MusicRepository();
