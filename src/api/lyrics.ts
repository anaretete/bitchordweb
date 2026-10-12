import type { LyricLine, Lyrics } from '../types';

export interface LrcLibTrackResponse {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

/**
 * Parses LRC format text into an array of LyricLine objects
 * Supports formats like [mm:ss.xx], [mm:ss.xxx], [mm:ss]
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const matches: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] || '0';
      const ms = fraction.length === 2 ? parseInt(fraction, 10) * 10 : parseInt(fraction, 10);
      matches.push(minutes * 60 * 1000 + seconds * 1000 + ms);
    }

    const text = trimmed.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

    for (const time of matches) {
      result.push({
        startTimeMs: time,
        text,
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.startTimeMs - b.startTimeMs);

  // Calculate endTimeMs where possible
  for (let i = 0; i < result.length - 1; i++) {
    result[i].endTimeMs = result[i + 1].startTimeMs;
  }

  return result;
}

export class LyricsService {
  private baseUrl = 'https://lrclib.net/api';

  public async getLyrics(title: string, artist?: string, duration?: number): Promise<Lyrics | null> {
    try {
      const cleanedTitle = this.cleanTitle(title);
      const cleanedArtist = artist ? this.cleanArtist(artist) : '';

      // Try exact match first if duration is provided
      if (duration && duration > 0) {
        const exactResult = await this.fetchExact(cleanedTitle, cleanedArtist, Math.round(duration));
        if (exactResult) {
          return this.formatResponse(exactResult);
        }
      }

      // Fallback to search query
      const searchResult = await this.searchLyrics(cleanedTitle, cleanedArtist);
      if (searchResult) {
        return this.formatResponse(searchResult);
      }

      return null;
    } catch {
      return null;
    }
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/\s*\(Official (Music )?Video\)/gi, '')
      .replace(/\s*\(Lyric Video\)/gi, '')
      .replace(/\s*\(Visualizer\)/gi, '')
      .replace(/\s*\[Official (Music )?Video\]/gi, '')
      .replace(/\s*\(Audio\)/gi, '')
      .replace(/\s*\[Audio\]/gi, '')
      .replace(/\s*\(feat\..*?\)/gi, '')
      .replace(/\s*\[feat\..*?\]/gi, '')
      .replace(/\s*\(with.*?\)/gi, '')
      .replace(/\s*\(Remastered.*?\)/gi, '')
      .trim();
  }

  private cleanArtist(artist: string): string {
    return artist
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .trim();
  }

  private async fetchExact(trackName: string, artistName: string, duration: number): Promise<LrcLibTrackResponse | null> {
    try {
      const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
        duration: duration.toString(),
      });

      const res = await fetch(`${this.baseUrl}/get?${params.toString()}`);
      if (!res.ok) return null;
      return (await res.json()) as LrcLibTrackResponse;
    } catch {
      return null;
    }
  }

  private async searchLyrics(trackName: string, artistName: string): Promise<LrcLibTrackResponse | null> {
    try {
      const params = new URLSearchParams({
        track_name: trackName,
      });
      if (artistName) {
        params.append('artist_name', artistName);
      }

      const res = await fetch(`${this.baseUrl}/search?${params.toString()}`);
      if (!res.ok) return null;

      const items: LrcLibTrackResponse[] = await res.json();
      if (!items || items.length === 0) return null;

      // Prefer item with synced lyrics, otherwise first item with plain lyrics
      const synced = items.find((item) => Boolean(item.syncedLyrics));
      return synced || items.find((item) => Boolean(item.plainLyrics)) || items[0] || null;
    } catch {
      return null;
    }
  }

  private formatResponse(data: LrcLibTrackResponse): Lyrics {
    if (data.syncedLyrics) {
      const lines = parseLrc(data.syncedLyrics);
      return {
        lines,
        plainText: data.plainLyrics || lines.map((l) => l.text).join('\n'),
        source: 'LRCLIB',
        isSynced: true,
      };
    }

    if (data.plainLyrics) {
      const rawLines = data.plainLyrics.split(/\r?\n/).filter(Boolean);
      const lines: LyricLine[] = rawLines.map((line, idx) => ({
        startTimeMs: idx * 4000,
        text: line.trim(),
      }));

      return {
        lines,
        plainText: data.plainLyrics,
        source: 'LRCLIB',
        isSynced: false,
      };
    }

    return {
      lines: [],
      source: 'LRCLIB',
      isSynced: false,
      plainText: '',
    };
  }
}

export const lyricsService = new LyricsService();
