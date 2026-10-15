/**
 * BitChord Canvas Service
 * 
 * Multi-provider motion artwork and animated canvas resolver supporting:
 * 1. Curated verified motion loops for signature tracks
 * 2. Community Canvas (Vivi) via vivimusicanvas manifest
 * 3. Tidal Video Covers (1280x1280 MP4 loops)
 * 4. Apple Music Motion Artwork & Video Previews
 * 5. Spotify Canvas (using listener sp_dc session token)
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

// Curated verified motion artwork for signature tracks from screenshots
const CURATED_CANVAS: Record<string, CanvasArtwork> = {
  // Eve - Pray (Screenshot 1: Crimson animated aesthetic)
  'bF3-gwXKdwI': {
    url: 'https://video-ssl.itunes.apple.com/itunes-assets/Video211/v4/e7/94/e6/e794e629-eb75-32d4-c3c7-0b5d65de71d4/mzvf_13072466468309216718.640x480.h264lc.U.p.m4v',
    title: 'Pray',
    artist: 'Eve',
    source: 'apple',
  },
  // Ado - モンストロ - Monstruo (Screenshot 6: Electric Violet / Neon motion loop)
  '4IKHox-DKrM': {
    url: 'https://vivimusicanvas.mkmdevilmi.workers.dev/Song/1.mp4',
    title: 'モンストロ - Monstruo',
    artist: 'Ado',
    source: 'vivi',
  },
  // Metro Boomin - Annihilate
  'Song/7.m3u8': {
    url: 'https://vivimusicanvas.mkmdevilmi.workers.dev/Song/7.m3u8',
    title: 'Annihilate',
    artist: 'Metro Boomin',
    source: 'vivi',
  },
};

class CanvasService {
  private cache = new Map<string, CanvasArtwork | null>();
  private viviEntries: ViviEntry[] = [];
  private viviFetchedAt = 0;
  private readonly VIVI_TTL = 30 * 60 * 1000; // 30 minutes

  public normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove parentheses/bracketed content
      .replace(/feat\..*/i, '')
      .replace(/ft\..*/i, '')
      .replace(/[^\p{L}\p{N}\s]/gu, '') // remove special characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  public cleanSearchTerms(title: string, artist: string): { cleanTitle: string; cleanArtist: string } {
    const cleanTitle = (title || '')
      .replace(/[\(\[\{].*?[\)\]\}]/g, '')
      .replace(/official\s*(music\s*)?video/gi, '')
      .replace(/feat\..*/gi, '')
      .replace(/ft\..*/gi, '')
      .replace(/mv$/gi, '')
      .trim();

    const cleanArtist = (artist || '')
      .split(/[,&/]/)[0]
      .replace(/[\(\[\{].*?[\)\]\}]/g, '')
      .trim();

    return {
      cleanTitle: cleanTitle || title,
      cleanArtist: cleanArtist || artist,
    };
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
  async searchVivi(title: string, artist: string): Promise<CanvasArtwork | null> {
    const items = await this.loadViviManifest();
    if (!items || items.length === 0) return null;

    const normTitle = this.normalize(title);
    const normArtist = this.normalize(artist);

    const hit = items.find((entry) => {
      const entryTitle = this.normalize(entry.song);
      const entryArtist = this.normalize(entry.artist);

      const titleMatch = normTitle.includes(entryTitle) || entryTitle.includes(normTitle);
      const artistMatch = !normArtist || !entryArtist || normArtist.includes(entryArtist) || entryArtist.includes(normArtist);

      return titleMatch && artistMatch;
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
  async searchTidal(title: string, artist: string): Promise<CanvasArtwork | null> {
    try {
      const { cleanTitle, cleanArtist } = this.cleanSearchTerms(title, artist);
      const query = `${cleanArtist} ${cleanTitle}`.trim();
      const url = `https://api.tidal.com/v1/search?query=${encodeURIComponent(
        query
      )}&limit=8&types=TRACKS,ALBUMS&countryCode=US`;

      const res = await fetch(url, {
        headers: {
          'X-Tidal-Token': TIDAL_TOKEN,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();
      const tracks = data.tracks?.items || [];
      const albums = data.albums?.items || [];

      // 1. Check tracks
      for (const track of tracks) {
        const videoCoverId = track.album?.videoCover;
        if (videoCoverId && typeof videoCoverId === 'string') {
          const parts = videoCoverId.split('-');
          if (parts.length === 5) {
            return {
              url: `https://resources.tidal.com/videos/${parts.join('/')}/1280x1280.mp4`,
              title: track.title,
              artist: track.artists?.[0]?.name || artist,
              album: track.album?.title,
              source: 'tidal',
            };
          }
        }
      }

      // 2. Check albums
      for (const album of albums) {
        const videoCoverId = album.videoCover;
        if (videoCoverId && typeof videoCoverId === 'string') {
          const parts = videoCoverId.split('-');
          if (parts.length === 5) {
            return {
              url: `https://resources.tidal.com/videos/${parts.join('/')}/1280x1280.mp4`,
              title: album.title || title,
              artist: album.artists?.[0]?.name || artist,
              album: album.title,
              source: 'tidal',
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Canvas] Tidal search failed:', err);
    }
    return null;
  }

  /**
   * Search Apple Music Motion Artwork & Video Previews
   */
  async searchAppleMusic(title: string, artist: string): Promise<CanvasArtwork | null> {
    try {
      const { cleanTitle, cleanArtist } = this.cleanSearchTerms(title, artist);
      const query = `${cleanArtist} ${cleanTitle}`.trim();

      // Query iTunes Search API for music videos or video previews
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&entity=musicVideo&limit=5`;

      const res = await fetch(itunesUrl);
      if (!res.ok) return null;
      const data = await res.json();
      const results = data.results || [];

      const normTitle = this.normalize(title);

      for (const item of results) {
        if (item.previewUrl) {
          const itemTitle = this.normalize(item.trackName || '');
          if (normTitle.includes(itemTitle) || itemTitle.includes(normTitle)) {
            return {
              url: item.previewUrl,
              title: item.trackName || title,
              artist: item.artistName || artist,
              source: 'apple',
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Canvas] Apple Music motion search failed:', err);
    }
    return null;
  }

  /**
   * Search Spotify Canvas using sp_dc cookie or canvas proxy
   */
  async searchSpotify(title: string, artist: string, trackId?: string, spDc?: string): Promise<CanvasArtwork | null> {
    const token = spDc || (typeof window !== 'undefined' ? localStorage.getItem('bitchord_spotify_sp_dc') : null) || DEFAULT_SP_DC;

    try {
      const { cleanTitle, cleanArtist } = this.cleanSearchTerms(title, artist);
      const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);

      // Tier 1: Check user-configured companion proxy
      const customProxy = typeof window !== 'undefined' ? localStorage.getItem('bitchord_canvas_proxy') : null;
      if (customProxy) {
        const res = await fetch(`${customProxy}/canvas?q=${query}&sp_dc=${encodeURIComponent(token || '')}`);
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

      // Tier 2: Query public Spotify Canvas resolver mirrors
      const publicEndpoints = [
        `https://spotify-canvas-api-nu.vercel.app/api/canvas?trackId=${encodeURIComponent(trackId || '')}`,
        `https://api.paxsenix.biz.id/api/canvas?trackId=${encodeURIComponent(trackId || '')}`,
      ];

      for (const endpoint of publicEndpoints) {
        if (!trackId) continue;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(endpoint, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data.url || data.canvas_url) {
              return {
                url: data.url || data.canvas_url,
                title: data.title || title,
                artist: data.artist || artist,
                source: 'spotify',
              };
            }
          }
        } catch {
          // continue
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
      trackId?: string;
      prioritizeSpotify?: boolean;
      enableTidal?: boolean;
      enableVivi?: boolean;
      enableApple?: boolean;
      enableSpotify?: boolean;
      spDc?: string;
    } = {}
  ): Promise<CanvasArtwork | null> {
    const { trackId } = options;

    // 1. Instant check for curated signature tracks
    if (trackId && CURATED_CANVAS[trackId]) {
      return CURATED_CANVAS[trackId];
    }

    const key = `${this.normalize(title)}|${this.normalize(artist)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    const {
      prioritizeSpotify = true,
      enableTidal = true,
      enableVivi = true,
      enableApple = true,
      enableSpotify = true,
      spDc,
    } = options;

    const sources: (() => Promise<CanvasArtwork | null>)[] = [];

    // Vivi community canvas first (instant response, highly reliable)
    if (enableVivi) {
      sources.push(() => this.searchVivi(title, artist));
    }
    // Tidal video covers (1280x1280 MP4, open CORS)
    if (enableTidal) {
      sources.push(() => this.searchTidal(title, artist));
    }
    // Apple Music motion artwork
    if (enableApple) {
      sources.push(() => this.searchAppleMusic(title, artist));
    }
    // Spotify Canvas with sp_dc
    if (enableSpotify) {
      sources.push(() => this.searchSpotify(title, artist, trackId, spDc));
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
