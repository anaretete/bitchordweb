import Dexie, { type Table } from 'dexie';
import type {
  ListeningHistoryItem,
  RecentSearchItem,
  SavedSongItem,
  SettingItem,
  Song,
} from '../types';

export class BitChordDatabase extends Dexie {
  savedSongs!: Table<SavedSongItem, string>;
  recentSearches!: Table<RecentSearchItem, string>;
  listeningHistory!: Table<ListeningHistoryItem, number>;
  settings!: Table<SettingItem, string>;

  constructor() {
    super('BitChordTVDB');
    this.version(1).stores({
      savedSongs: 'videoId, title, savedAt',
      recentSearches: 'query, timestamp',
      listeningHistory: '++id, videoId, playedAt',
      settings: 'key',
    });
  }
}

export const db = new BitChordDatabase();

// --- Database Helper Methods ---

/**
 * Save a song to Favorites/Library
 */
export async function saveSong(song: Song): Promise<void> {
  const item: SavedSongItem = {
    ...song,
    savedAt: Date.now(),
  };
  await db.savedSongs.put(item);
}

/**
 * Remove a song from Favorites/Library
 */
export async function removeSong(videoId: string): Promise<void> {
  await db.savedSongs.delete(videoId);
}

/**
 * Check if a song is saved in library
 */
export async function isSongSaved(videoId: string): Promise<boolean> {
  const count = await db.savedSongs.where('videoId').equals(videoId).count();
  return count > 0;
}

/**
 * Retrieve all saved songs, newest first
 */
export async function getSavedSongs(): Promise<SavedSongItem[]> {
  return await db.savedSongs.orderBy('savedAt').reverse().toArray();
}

/**
 * Add a played song to listening history
 */
export async function addToHistory(song: Song, completed = false): Promise<void> {
  // Remove existing entries for this videoId to keep history deduplicated if desired, or keep recents
  const existing = await db.listeningHistory.where('videoId').equals(song.videoId).toArray();
  if (existing.length > 0) {
    const ids = existing.map((item) => item.id!).filter(Boolean);
    await db.listeningHistory.bulkDelete(ids);
  }

  const record: ListeningHistoryItem = {
    videoId: song.videoId,
    song,
    playedAt: Date.now(),
    completed,
  };
  await db.listeningHistory.add(record);

  // Maintain a maximum of 500 history items
  const count = await db.listeningHistory.count();
  if (count > 500) {
    const oldest = await db.listeningHistory.orderBy('playedAt').limit(count - 500).toArray();
    const idsToDelete = oldest.map((item) => item.id!).filter(Boolean);
    await db.listeningHistory.bulkDelete(idsToDelete);
  }
}

/**
 * Get listening history items, ordered most recent first
 */
export async function getHistory(limit = 100): Promise<ListeningHistoryItem[]> {
  return await db.listeningHistory.orderBy('playedAt').reverse().limit(limit).toArray();
}

/**
 * Clear all listening history
 */
export async function clearHistory(): Promise<void> {
  await db.listeningHistory.clear();
}

/**
 * Add a query to recent searches
 */
export async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  await db.recentSearches.put({
    query: trimmed,
    timestamp: Date.now(),
  });

  // Keep up to 30 recent searches
  const count = await db.recentSearches.count();
  if (count > 30) {
    const oldest = await db.recentSearches.orderBy('timestamp').limit(count - 30).toArray();
    const queries = oldest.map((item) => item.query);
    await db.recentSearches.bulkDelete(queries);
  }
}

/**
 * Get recent search queries, newest first
 */
export async function getRecentSearches(limit = 10): Promise<string[]> {
  const items = await db.recentSearches.orderBy('timestamp').reverse().limit(limit).toArray();
  return items.map((item) => item.query);
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  await db.recentSearches.clear();
}
