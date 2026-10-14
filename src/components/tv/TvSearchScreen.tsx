import React, { useState, useEffect } from 'react';
import { Search, Music, Disc, User, ListMusic, X, Clock } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { repository } from '../../services/repository';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../services/db';
import type { Song, SearchResult } from '../../types';

export function TvSearchScreen() {
  const { playSong } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'songs' | 'albums' | 'artists' | 'playlists' | undefined>(undefined);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getRecentSearches(10).then((items) => {
      setRecentQueries(items.map((i) => i.query));
    }).catch(console.error);
  }, []);

  // Fetch suggestions as query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const suggs = await repository.getSearchSuggestions(query);
        setSuggestions(suggs.map((s) => s.text));
      } catch (e) {
        console.warn('Failed to fetch suggestions:', e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setIsLoading(true);
    addRecentSearch(targetQuery.trim()).catch(() => {});

    try {
      const res = await repository.search(targetQuery, activeFilter);
      setResults(res);
      setSuggestions([]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 px-4 sm:px-8 md:px-14 max-w-6xl mx-auto space-y-6 select-none">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="Search YouTube Music songs, artists, albums..."
            className="w-full pl-14 pr-12 py-4 bg-[#1f1d2a] border border-white/10 rounded-2xl text-white placeholder-white/30 text-base focus:outline-none focus:border-white/40 shadow-xl transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                setSuggestions([]);
              }}
              className="absolute right-4 p-1 rounded-full text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live Typeahead Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1926] border border-white/10 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                className="px-5 py-3 hover:bg-white/10 flex items-center gap-3 cursor-pointer text-sm text-white/90"
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
                if (query) handleSearch(query);
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

      {/* Results or Recent Searches */}
      {isLoading ? (
        <div className="py-20 text-center text-white/50 animate-pulse">
          Searching YouTube Music...
        </div>
      ) : results ? (
        <div className="space-y-6 pt-2">
          {/* Songs List */}
          {results.songs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Songs</h3>
              <div className="divide-y divide-white/5 bg-[#1a1724] border border-white/5 rounded-2xl overflow-hidden">
                {results.songs.map((song) => {
                  const thumb =
                    song.thumbnails?.[song.thumbnails.length - 1]?.url ||
                    song.thumbnails?.[0]?.url ||
                    '';
                  const artist = song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';

                  return (
                    <div
                      key={song.videoId}
                      onClick={() => playSong(song, results.songs)}
                      className="p-3.5 flex items-center justify-between hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-4">
                        <img src={thumb} alt="" className="w-11 h-11 rounded-lg object-cover bg-neutral-900" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                          <p className="text-xs text-white/50 truncate mt-0.5">{artist}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/40 tabular-nums">
                        {song.durationText || '3:30'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Recent Searches */
        recentQueries.length > 0 && (
          <div className="space-y-3 pt-4">
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
                    handleSearch(q);
                  }}
                  className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/10 border border-white/5 rounded-xl text-xs font-medium text-white/80 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
