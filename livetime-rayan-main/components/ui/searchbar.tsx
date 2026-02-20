'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, MapPin, Users, X, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: number;
  host: string;
  eventTitle: string;
  location: string;
  date: string;
  rsvps: number;
  status: string;
  eventType: string;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ 
  className = '', 
  placeholder = 'Search events, hosts, locations...' 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // API search with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Search failed:', errorData);
          setResults([]);
          return;
        }
        
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          inputRef.current?.focus();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    router.push(`/requests`);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      social: 'bg-purple-100 text-purple-700',
      academic: 'bg-blue-100 text-blue-700',
      athletic: 'bg-green-100 text-green-700',
      career: 'bg-orange-100 text-orange-700',
      leadership: 'bg-pink-100 text-pink-700',
    };
    return colors[eventType] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    return status === 'approved' 
      ? 'bg-green-100 text-green-700' 
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                  idx === selectedIndex 
                    ? 'bg-blue-50 border-l-2 border-blue-500' 
                    : 'hover:bg-gray-50 border-l-2 border-transparent'
                } ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className={`mt-1 ${idx === selectedIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {result.eventTitle}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {result.host}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{result.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(result.eventType)}`}>
                      {result.eventType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    {result.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {result.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Users className="w-3 h-3" />
                      {result.rsvps} RSVPs
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && !isLoading && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-8 text-center z-50">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No events found</p>
          <p className="text-sm text-gray-500 mt-1">
            Try searching for event titles, hosts, or locations
          </p>
        </div>
      )}
    </div>
  );
}