import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, X, Clock, Flame } from 'lucide-react';
import { usePlayerStore, SCREENSHOT_TRACKS } from '../../stores/playerStore';
import { repository } from '../../services/repository';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../services/db';
import type { Song, SearchResult } from '../../types';

// Fast in-memory cache for 0ms instant repeated lookups
const clientSearchCache = new Map<string, SearchResult>();

export function TvSearchScreen() {
  const { playSong, playTrackDirect, setFullPlayerOpen } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'songs' | 'albums' | 'artists' | 'playlists' | undefined>(undefined);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getRecentSearches(10).then((items) => {
      setRecentQueries(items.map((i) => i.query));
    }).catch(console.error);

    // Auto-focus search input
    inputRef.current?.focus();
  }, []);

  // Live Typeahead & Debounced Search as user types
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSuggestions([]);
      setResults(null);
      setIsLoading(false);
      abortControllerRef.current?.abort();
      return;
    }

    const cacheKey = `${trimmed.toLowerCase()}:${activeFilter || 'all'}`;
    if (clientSearchCache.has(cacheKey)) {
      setResults(clientSearchCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // Fast typeahead suggestions query (~100ms)
    repository.getSearchSuggestions(trimmed).then((suggs) => {
      setSuggestions(suggs.map((s) => s.text));
    }).catch(() => {});

    // Live search debounced at 160ms for near-instant responsiveness
    const timer = setTimeout(() => {
      executeSearch(trimmed);
    }, 160);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

  const executeSearch = async (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;

    const cacheKey = `${trimmed.toLowerCase()}:${activeFilter || 'all'}`;
    if (clientSearchCache.has(cacheKey)) {
      setResults(clientSearchCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // Cancel prior in-flight search request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    addRecentSearch(trimmed).catch(() => {});

    try {
      const res = await repository.search(trimmed, activeFilter);
      clientSearchCache.set(cacheKey, res);
      setResults(res);
      setSuggestions([]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search failed:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = (song: Song) => {
    playSong(song, results?.songs);
    setFullPlayerOpen(true);
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 px-4 sm:px-8 md:px-14 max-w-6xl mx-auto space-y-6 select-none">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                executeSearch(query);
                setSuggestions([]);
              }
            }}
            placeholder="Search songs, artists, albums, or lyrics..."
            className="w-full pl-14 pr-12 py-4 bg-[#1f1d2a] border border-white/10 rounded-2xl text-white placeholder-white/30 text-base focus:outline-none focus:border-white/40 shadow-xl transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-4 p-1.5 rounded-full text-white/40 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live Typeahead Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1926]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-100">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => {
                  setQuery(s);
                  executeSearch(s);
                  setSuggestions([]);
                }}
                className="px-5 py-3 hover:bg-white/10 flex items-center gap-3 cursor-pointer text-sm text-white/90 transition-colors"
              >
                <Search className="w-4 h-4 text-white/40" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'songs', 'albums', 'artists', 'playlists'] as const).map((filter) => {
          const isSelected = (filter === 'all' && !activeFilter) || activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter === 'all' ? undefined : filter);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Results View */}
      {isLoading && !results ? (
        <div className="py-20 text-center text-white/50 animate-pulse flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-sm font-medium">Searching YouTube Music...</span>
        </div>
      ) : results && results.songs.length > 0 ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-white/50 tracking-wider uppercase pl-1">
            <span>Results ({results.songs.length})</span>
            {isLoading && <span className="animate-pulse text-white/60">Updating...</span>}
          </div>

          <div className="divide-y divide-white/5 bg-[#1a1724] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            {results.songs.map((song) => {
              const thumb =
                song.thumbnails?.[song.thumbnails.length - 1]?.url ||
                song.thumbnails?.[0]?.url ||
                '';
              const artist = song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';

              return (
                <div
                  key={song.videoId}
                  onClick={() => handleSelectSong(song)}
                  className="p-3.5 flex items-center justify-between hover:bg-white/10 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <img
                      src={thumb}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-neutral-900 border border-white/5 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm md:text-base font-semibold text-white truncate">{song.title}</p>
                      <p className="text-xs text-white/55 truncate mt-0.5">{artist}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums shrink-0">
                    {song.durationText || '3:30'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : results && results.songs.length === 0 ? (
        <div className="py-20 text-center text-white/40 text-sm">
          No songs found matching "{query}". Try a different search term.
        </div>
      ) : (
        /* Empty State: Recent Searches & Quick Recommendations */
        <div className="space-y-8 pt-2">
          {recentQueries.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-white/50 tracking-wider uppercase">
                <span>Recent Searches</span>
                <button
                  onClick={() => {
                    clearRecentSearches();
                    setRecentQueries([]);
                  }}
                  className="hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(q);
                      executeSearch(q);
                    }}
                    className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/10 border border-white/5 rounded-xl text-xs font-medium text-white/80 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Picks / Featured Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white/50 tracking-wider uppercase">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Trending Quick Picks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SCREENSHOT_TRACKS.slice(0, 6).map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    playTrackDirect(track, SCREENSHOT_TRACKS);
                    setFullPlayerOpen(true);
                  }}
                  className="p-3 bg-[#1a1724]/80 hover:bg-[#252132] border border-white/5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  <img src={track.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-neutral-900" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                    <p className="text-xs text-white/50 truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
