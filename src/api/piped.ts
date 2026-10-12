import type { Artist, Song, StreamFormat } from '../types';

export interface PipedStreamResponse {
  title: string;
  description: string;
  uploadDate: string;
  uploader: string;
  uploaderUrl: string;
  uploaderAvatar: string;
  thumbnailUrl: string;
  hls?: string;
  dash?: string;
  duration: number;
  audioStreams: {
    url: string;
    format: string;
    quality: string;
    mimeType: string;
    codec: string;
    audioTrackName: string;
    audioTrackId: string;
    bitrate: number;
    contentLength: number;
  }[];
  videoStreams: {
    url: string;
    format: string;
    quality: string;
    mimeType: string;
    codec: string;
    videoOnly: boolean;
    bitrate: number;
    initStart: number;
    initEnd: number;
    indexStart: number;
    indexEnd: number;
    width: number;
    height: number;
    fps: number;
  }[];
  relatedStreams: {
    url: string;
    type: string;
    title: string;
    thumbnail: string;
    uploaderName: string;
    uploaderUrl: string;
    uploaderAvatar: string;
    uploadedDate: string;
    shortDescription: string;
    duration: number;
    views: number;
  }[];
}

export class PipedClient {
  private instanceUrl: string;
  private readonly fallbackInstances = [
    'https://api.piped.private.coffee',
    'https://pipedapi.colins.link',
    'https://piped.video',
    'https://api.piped.privacy.com.de',
    'https://pipedapi.kavin.rocks',
  ];

  constructor(instanceUrl = 'https://api.piped.private.coffee') {
    this.instanceUrl = instanceUrl.replace(/\/+$/, '');
  }

  public setInstanceUrl(url: string): void {
    this.instanceUrl = url.replace(/\/+$/, '');
  }

  public getInstanceUrl(): string {
    return this.instanceUrl;
  }

  private async fetchWithFallback<T>(path: string): Promise<T> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const instances = [this.instanceUrl, ...this.fallbackInstances.filter((u) => u !== this.instanceUrl)];

    let lastError: Error | null = null;
    for (const inst of instances) {
      try {
        const url = `${inst}${cleanPath}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          return (await res.json()) as T;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Failed to fetch from all Piped instances for ${path}`);
  }

  public async getStreams(videoId: string): Promise<{
    title: string;
    audioFormats: StreamFormat[];
    bestAudioUrl?: string;
    thumbnailUrl?: string;
  }> {
    const data = await this.fetchWithFallback<PipedStreamResponse>(`/streams/${videoId}`);

    const audioFormats: StreamFormat[] = (data.audioStreams || []).map((stream, idx) => ({
      url: stream.url,
      mimeType: stream.mimeType,
      bitrate: stream.bitrate,
      audioQuality: stream.quality,
      contentLength: stream.contentLength ? String(stream.contentLength) : undefined,
      itag: 140 + idx,
    }));

    // Sort by highest bitrate descending
    audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    return {
      title: data.title,
      audioFormats,
      bestAudioUrl: audioFormats[0]?.url,
      thumbnailUrl: data.thumbnailUrl,
    };
  }

  public async search(query: string, filter: 'all' | 'videos' | 'music_songs' = 'music_songs'): Promise<Song[]> {
    const data = await this.fetchWithFallback<{
      items: {
        url: string;
        type: string;
        title: string;
        thumbnail: string;
        uploaderName: string;
        uploaderUrl: string;
        duration: number;
        isShort: boolean;
      }[];
    }>(`/search?q=${encodeURIComponent(query)}&filter=${filter}`);

    const songs: Song[] = [];
    for (const item of data.items || []) {
      const videoId = item.url ? item.url.replace('/watch?v=', '') : '';
      if (!videoId) continue;

      const duration = item.duration > 0 ? item.duration : undefined;
      let durationText: string | undefined;
      if (duration) {
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        durationText = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      songs.push({
        videoId,
        title: item.title,
        artists: [{ name: item.uploaderName || 'Unknown Artist' }],
        thumbnails: [{ url: item.thumbnail, width: 320, height: 180 }],
        duration,
        durationText,
      });
    }

    return songs;
  }

  public async getTrending(region = 'US'): Promise<Song[]> {
    const data = await this.fetchWithFallback<{
      url: string;
      type: string;
      title: string;
      thumbnail: string;
      uploaderName: string;
      uploaderUrl: string;
      duration: number;
    }[]>(`/trending?region=${region}`);

    return (data || []).map((item) => {
      const videoId = item.url ? item.url.replace('/watch?v=', '') : '';
      const duration = item.duration > 0 ? item.duration : undefined;
      let durationText: string | undefined;
      if (duration) {
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        durationText = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      return {
        videoId,
        title: item.title,
        artists: [{ name: item.uploaderName || 'Unknown Artist' }],
        thumbnails: [{ url: item.thumbnail, width: 320, height: 180 }],
        duration,
        durationText,
      };
    });
  }
}

export const piped = new PipedClient();
