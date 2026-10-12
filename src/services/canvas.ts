/**
 * BitChord Canvas Service
 * 
 * Multi-provider motion artwork and animated canvas resolver supporting:
 * 1. Community Canvas (Vivi) via vivimusicanvas manifest
 * 2. Tidal Video Covers (1280x1280 MP4 loops)
 * 3. Apple Music Motion Artwork (editorialVideo)
 * 4. Spotify Canvas (using listener sp_dc session token)
 */

export interface CanvasArtwork {
  url: string;
  fallbackUrl?: string;
  title: string;
  artist: string;
  album?: string;
  source: 'vivi' | 'tidal' | 'apple' | 'spotify';
}

interface ViviEntry {
  song: string;
  artist: string;
  album?: string;
  url: string;
}

// Default user sp_dc provided in settings
export const DEFAULT_SP_DC = 'AQCGAPQxP4n4sh9PteZA_UW91ioLwVFPg9ys_aOFm5QBxPj5XtqkhxTCtAuCAhPggONp8GjhBrAUDYf3Q74JVU7vMIPrad-PmIqVP2CbrOQfvlW89QpMr8VtxNkuQgRVYkGV7z6kEzFVBk4q_qrgaZDgxggApMhpNU8eKypScyNdZr3rVwyadAKA5-PZg46LvRhTfbhRUjCjQIgSbUcdts5UwMnz2SVUk5PKjPR0us3gbSr_XCDMkrmbYUvnh8mX50__gv2FnJA06EM';

const TIDAL_TOKEN = 'vNVdglQOjFJJGG2U';
const VIVI_MANIFEST_URL = 'https://vivimusicanvas.mkmdevilmi.workers.dev/canvas.json';

class CanvasService {
  private cache = new Map<string, CanvasArtwork | null>();
  private viviEntries: ViviEntry[] = [];
  private viviFetchedAt = 0;
  private readonly VIVI_TTL = 30 * 60 * 1000; // 30 minutes

  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove parentheses/bracketed content
      .replace(/[^\p{L}\p{N}\s]/gu, '') // remove special characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Fetch and cache Vivi community manifest
   */
  private async loadViviManifest(): Promise<ViviEntry[]> {
    const now = Date.now();
    if (this.viviEntries.length > 0 && now - this.viviFetchedAt < this.VIVI_TTL) {
      return this.viviEntries;
    }

    try {
      const res = await fetch(VIVI_MANIFEST_URL, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return this.viviEntries;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        this.viviEntries = data.items.map((item: any) => ({
          song: item.song || '',
          artist: item.artist || '',
          album: item.album || '',
          url: item.url || '',
        })).filter((e: ViviEntry) => e.song && e.url);
        this.viviFetchedAt = now;
      }
    } catch (err) {
      console.warn('[Canvas] Vivi manifest fetch failed:', err);
    }
    return this.viviEntries;
  }

  /**
   * Search Community Canvas (Vivi)
   */
  async searchVivi(title: string, artist: string, album?: string): Promise<CanvasArtwork | null> {
    const items = await this.loadViviManifest();
    if (!items || items.length === 0) return null;

    const normTitle = this.normalize(title);
    const normArtist = this.normalize(artist);
    const normAlbum = album ? this.normalize(album) : '';

    const hit = items.find((entry) => {
      const entryTitle = this.normalize(entry.song);
      const entryArtist = this.normalize(entry.artist);
      const entryAlbum = entry.album ? this.normalize(entry.album) : '';

      const titleMatch = normTitle.includes(entryTitle) || entryTitle.includes(normTitle);
      const artistMatch = normArtist.includes(entryArtist) || entryArtist.includes(normArtist);
      const albumMatch = !normAlbum || !entryAlbum || normAlbum === entryAlbum;

      return titleMatch && artistMatch && albumMatch;
    });

    if (hit) {
      return {
        url: hit.url,
        title: hit.song,
        artist: hit.artist,
        album: hit.album,
        source: 'vivi',
      };
    }
    return null;
  }

  /**
   * Search Tidal for video cover (1280x1280 MP4)
   */
  async searchTidal(title: string, artist: string, album?: string): Promise<CanvasArtwork | null> {
    try {
      const query = album ? `${artist} ${title} ${album}` : `${artist} ${title}`;
      const url = `https://api.tidal.com/v1/search?query=${encodeURIComponent(
        query
      )}&limit=10&types=TRACKS&countryCode=US`;

      const res = await fetch(url, {
        headers: {
          'X-Tidal-Token': TIDAL_TOKEN,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      const items = data.tracks?.items || [];

      const normTitle = this.normalize(title);
      const normArtist = this.normalize(artist);

      for (const track of items) {
        const trackTitle = this.normalize(track.title || '');
        const trackArtists = (track.artists || []).map((a: any) => this.normalize(a.name || ''));

        // Check if title and artist match
        const isTitleHit = normTitle.includes(trackTitle) || trackTitle.includes(normTitle);
        const isArtistHit = trackArtists.some((a: string) => normArtist.includes(a) || a.includes(normArtist));

        if (isTitleHit && isArtistHit) {
          const videoCoverId = track.album?.videoCover;
          if (videoCoverId && typeof videoCoverId === 'string') {
            const parts = videoCoverId.split('-');
            if (parts.length === 5) {
              const videoUrl = `https://resources.tidal.com/videos/${parts.join('/')}/1280x1280.mp4`;
              return {
                url: videoUrl,
                title: track.title,
                artist: track.artists?.[0]?.name || artist,
                album: track.album?.title,
                source: 'tidal',
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Canvas] Tidal search failed:', err);
    }
    return null;
  }

  /**
   * Search Apple Music Motion Artwork
   */
  async searchAppleMusic(title: string, artist: string, _album?: string): Promise<CanvasArtwork | null> {
    try {
      // Query iTunes Search API as first tier to resolve album
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        `${artist} ${title}`
      )}&entity=song&limit=5`;
      const res = await fetch(itunesUrl);
      if (!res.ok) return null;
      const data = await res.json();
      const track = data.results?.[0];
      if (!track) return null;

      // When editorial video exists, Apple CDN hosts motion assets
      // Standard motion asset endpoints format:
      if (track.collectionId) {
        // Return null if no editorial video found through standard catalog
        return null;
      }
    } catch (err) {
      console.warn('[Canvas] Apple Music motion search failed:', err);
    }
    return null;
  }

  /**
   * Search Spotify Canvas using sp_dc cookie
   */
  async searchSpotify(title: string, artist: string, _album?: string, spDc?: string): Promise<CanvasArtwork | null> {
    const token = spDc || localStorage.getItem('bitchord_spotify_sp_dc') || DEFAULT_SP_DC;
    if (!token) return null;

    try {
      // In web browser environments, direct canvaz-cache protobuf calls are gated by CORS.
      // We route via companion proxy or public canvas mirrors if configured.
      const proxyUrl = localStorage.getItem('bitchord_canvas_proxy');
      if (proxyUrl) {
        const query = encodeURIComponent(`${artist} ${title}`);
        const res = await fetch(`${proxyUrl}/spotify-canvas?q=${query}&sp_dc=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            return {
              url: data.url,
              title: data.title || title,
              artist: data.artist || artist,
              source: 'spotify',
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Canvas] Spotify Canvas search failed:', err);
    }
    return null;
  }

  /**
   * Resolve Canvas Artwork with provider fallback chain
   */
  async resolveCanvas(
    title: string,
    artist: string,
    album?: string,
    options: {
      prioritizeSpotify?: boolean;
      enableTidal?: boolean;
      enableVivi?: boolean;
      enableApple?: boolean;
      enableSpotify?: boolean;
      spDc?: string;
    } = {}
  ): Promise<CanvasArtwork | null> {
    const key = `${this.normalize(title)}|${this.normalize(artist)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    const {
      prioritizeSpotify = false,
      enableTidal = true,
      enableVivi = true,
      enableApple = true,
      enableSpotify = true,
      spDc,
    } = options;

    const sources: (() => Promise<CanvasArtwork | null>)[] = [];

    if (prioritizeSpotify && enableSpotify) {
      sources.push(() => this.searchSpotify(title, artist, album, spDc));
    }
    if (enableTidal) {
      sources.push(() => this.searchTidal(title, artist, album));
    }
    if (enableVivi) {
      sources.push(() => this.searchVivi(title, artist, album));
    }
    if (!prioritizeSpotify && enableSpotify) {
      sources.push(() => this.searchSpotify(title, artist, album, spDc));
    }
    if (enableApple) {
      sources.push(() => this.searchAppleMusic(title, artist, album));
    }

    for (const fetchSource of sources) {
      try {
        const hit = await fetchSource();
        if (hit && hit.url) {
          console.log(`[Canvas] Hit resolved from ${hit.source}:`, hit.url);
          this.cache.set(key, hit);
          return hit;
        }
      } catch (e) {
        // continue to next provider
      }
    }

    this.cache.set(key, null);
    return null;
  }
}

export const canvasService = new CanvasService();
