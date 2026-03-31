import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useApp } from '../context/AppContext';

export default function SearchBar({ initialValue = '', compact = false }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const navigate = useNavigate();
  const { logSearch } = useApp();
  const debouncedQ = useDebounce(query, 280);
  const wrapRef = useRef(null);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQ.trim() || debouncedQ.length < 2) {
      setSuggestions([]);
      return;
    }
    fetch(`/api/suggestions?q=${encodeURIComponent(debouncedQ)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setSuggestions(d.suggestions);
      })
      .catch(() => {});
  }, [debouncedQ]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = (q) => {
    const term = (q || query).trim();
    if (!term) return;
    setShowSugg(false);
    logSearch(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="search-wrapper" ref={wrapRef}>
      <div className="search-input-row">
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          className="search-input"
          type="text"
          placeholder="Search videos, channels, playlists..."
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          onFocus={() => suggestions.length > 0 && setShowSugg(true)}
          autoComplete="off"
          spellCheck="false"
        />
        <button className="search-btn" onClick={() => doSearch()}>Search</button>
      </div>

      {showSugg && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="suggestion-item"
              onMouseDown={() => { setQuery(s); doSearch(s); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
