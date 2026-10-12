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
   * Search songs, albums, artists, or playlists
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

    if (!query.trim()) return emptyResult;

    try {
      this.syncSettings();
      const result = await this.innertube.searchParsed(query, filter);
      if (
        result.songs.length > 0 ||
        result.albums.length > 0 ||
        result.artists.length > 0 ||
        result.playlists.length > 0
      ) {
        return result;
      }
    } catch (err) {
      console.warn('InnerTube search failed, attempting Piped search fallback:', err);
    }

    // Fallback to Piped search for songs
    try {
      const pipedSongs = await this.piped.search(query);
      return {
        songs: pipedSongs,
        albums: [],
        artists: [],
        playlists: [],
      };
    } catch (err) {
      console.error('Search failed across all providers:', err);
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
   * Get search query autocomplete suggestions
   */
  public async searchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim()) return [];
    try {
      return await this.innertube.getSearchSuggestions(query);
    } catch {
      return [];
    }
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
}

export const repository = new MusicRepository();
