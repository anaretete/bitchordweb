import type { AudioQuality, RepeatMode, ShuffleMode, ThemeMode } from '../types';

const STORAGE_KEYS = {
  THEME: 'bitchord_theme',
  AUDIO_QUALITY: 'bitchord_audio_quality',
  PIPED_INSTANCE: 'bitchord_piped_instance',
  VOLUME: 'bitchord_volume',
  MUTED: 'bitchord_muted',
  REPEAT_MODE: 'bitchord_repeat_mode',
  SHUFFLE_MODE: 'bitchord_shuffle_mode',
  AUTH_COOKIES: 'bitchord_auth_cookies',
  SAPISID: 'bitchord_sapisid',
  VISITOR_ID: 'bitchord_visitor_id',
  CORS_PROXY: 'bitchord_cors_proxy',
  CUSTOM_SETTINGS: 'bitchord_settings_',
} as const;

export class StorageService {
  private isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    try {
      const val = window.localStorage.getItem(key);
      if (val === null) return defaultValue;
      return JSON.parse(val) as T;
    } catch {
      return (window.localStorage.getItem(key) as unknown as T) || defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isAvailable()) return;
    try {
      if (typeof value === 'string') {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`Failed to save to localStorage (${key}):`, e);
    }
  }

  private removeItem(key: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove item (${key}):`, e);
    }
  }

  // --- Theme Mode ---
  public getTheme(): ThemeMode {
    return this.getItem<ThemeMode>(STORAGE_KEYS.THEME, 'dark');
  }

  public setTheme(theme: ThemeMode): void {
    this.setItem(STORAGE_KEYS.THEME, theme);
  }

  // --- Audio Quality ---
  public getAudioQuality(): AudioQuality {
    return this.getItem<AudioQuality>(STORAGE_KEYS.AUDIO_QUALITY, 'high');
  }

  public setAudioQuality(quality: AudioQuality): void {
    this.setItem(STORAGE_KEYS.AUDIO_QUALITY, quality);
  }

  // --- Piped Instance ---
  public getPipedInstance(): string {
    return this.getItem<string>(STORAGE_KEYS.PIPED_INSTANCE, 'https://pipedapi.kavin.rocks');
  }

  public setPipedInstance(url: string): void {
    this.setItem(STORAGE_KEYS.PIPED_INSTANCE, url);
  }

  // --- Volume & Mute ---
  public getVolume(): number {
    const vol = this.getItem<number>(STORAGE_KEYS.VOLUME, 1);
    return Math.max(0, Math.min(1, vol));
  }

  public setVolume(volume: number): void {
    this.setItem(STORAGE_KEYS.VOLUME, Math.max(0, Math.min(1, volume)));
  }

  public getMuted(): boolean {
    return this.getItem<boolean>(STORAGE_KEYS.MUTED, false);
  }

  public setMuted(muted: boolean): void {
    this.setItem(STORAGE_KEYS.MUTED, muted);
  }

  // --- Repeat & Shuffle ---
  public getRepeatMode(): RepeatMode {
    return this.getItem<RepeatMode>(STORAGE_KEYS.REPEAT_MODE, 'off');
  }

  public setRepeatMode(mode: RepeatMode): void {
    this.setItem(STORAGE_KEYS.REPEAT_MODE, mode);
  }

  public getShuffleMode(): ShuffleMode {
    return this.getItem<ShuffleMode>(STORAGE_KEYS.SHUFFLE_MODE, 'off');
  }

  public setShuffleMode(mode: ShuffleMode): void {
    this.setItem(STORAGE_KEYS.SHUFFLE_MODE, mode);
  }

  // --- Auth & Cookies ---
  public getAuthCookies(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.AUTH_COOKIES, null);
  }

  public setAuthCookies(cookies: string): void {
    this.setItem(STORAGE_KEYS.AUTH_COOKIES, cookies);
  }

  public clearAuthCookies(): void {
    this.removeItem(STORAGE_KEYS.AUTH_COOKIES);
  }

  public getSapisid(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.SAPISID, null);
  }

  public setSapisid(sapisid: string): void {
    this.setItem(STORAGE_KEYS.SAPISID, sapisid);
  }

  // --- Visitor ID ---
  public getVisitorId(): string | null {
    return this.getItem<string | null>(STORAGE_KEYS.VISITOR_ID, null);
  }

  public setVisitorId(id: string): void {
    this.setItem(STORAGE_KEYS.VISITOR_ID, id);
  }

  // --- CORS Proxy ---
  public getCorsProxy(): string {
    return this.getItem<string>(STORAGE_KEYS.CORS_PROXY, 'https://api.allorigins.win/raw?url=');
  }

  public setCorsProxy(proxy: string): void {
    this.setItem(STORAGE_KEYS.CORS_PROXY, proxy);
  }

  // --- Generic Setting ---
  public getSetting<T>(key: string, defaultValue: T): T {
    return this.getItem<T>(`${STORAGE_KEYS.CUSTOM_SETTINGS}${key}`, defaultValue);
  }

  public setSetting<T>(key: string, value: T): void {
    this.setItem(`${STORAGE_KEYS.CUSTOM_SETTINGS}${key}`, value);
  }
}

export const storage = new StorageService();
