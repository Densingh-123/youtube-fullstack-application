import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { apiFetch } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const debouncedQ = useDebounce(query, 280);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const langRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAllNotificationsRead, preferredLanguages, setPreferredLanguage, theme, setTheme, logSearch, setMiniPlayerVideo } = useApp();
  const themeRef = useRef(null);

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'te', label: 'Telugu' },
    { code: 'ta', label: 'Tamil' },
    { code: 'kn', label: 'Kannada' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'bn', label: 'Bengali' },
    { code: 'mr', label: 'Marathi' },
    { code: 'pa', label: 'Punjabi' },
  ];

  const THEMES = [
    { id: 'green', label: 'Olive' },
    { id: 'rose', label: 'Rose' },
    { id: 'cyan', label: 'Ocean' },
    { id: 'sunset', label: 'Sunset' },
    { id: 'amethyst', label: 'Amethyst' },
    { id: 'monochrome', label: 'Monochrome' },
    { id: 'olive', label: 'Forest' },
    { id: 'gold', label: 'Gold' },
  ];

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQ.trim()) { setSuggestions([]); return; }
    apiFetch(`/api/suggestions?q=${encodeURIComponent(debouncedQ)}`)
      .then(d => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [debouncedQ]);

  // Sync query with URL
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowThemeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function doSearch(q) {
    if (!q.trim()) return;
    logSearch(q);
    setShowSug(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  function handleNotifClick() {
    setShowNotifications(p => !p);
    setShowProfileMenu(false);
    setShowLangMenu(false);
    if (!showNotifications) markAllNotificationsRead();
  }

  function handleProfileClick() {
    setShowProfileMenu(p => !p);
    setShowNotifications(false);
    setShowLangMenu(false);
    setShowThemeMenu(false);
  }

  function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search is not supported in your browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = (preferredLanguages && preferredLanguages[0]) ? preferredLanguages[0] : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      doSearch(transcript);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }

  const initial = currentUser
    ? (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
    : null;

  return (
    <header className="yt-navbar">
      {/* Left */}
      <div className="yt-navbar-left">
        <button className="yt-icon-btn" onClick={onMenuClick} title="Menu" aria-label="Menu" id="menu-btn">
          <HamburgerIcon />
        </button>
        <div className="yt-logo" onClick={() => {
          if (location.pathname.startsWith('/video/')) {
            const vidId = location.pathname.split('/')[2];
            if (vidId) setMiniPlayerVideo({ id: vidId, start: Math.floor(window.__yt_current_time || 0) });
          }
          navigate('/');
        }} id="logo-btn">
          {/* <YTLogoSVG /> */}
          <span className="yt-logo-text">YouTube</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="yt-navbar-center">
        <div className="yt-search-form" ref={wrapRef}>
          <div className="yt-search-input-wrap">
            <input
              ref={inputRef}
              className="yt-search-input"
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSug(true); }}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              onFocus={() => query && setShowSug(true)}
              placeholder="Search"
              autoComplete="off"
              spellCheck={false}
              id="search-input"
            />
            {query && (
              <button
                className="yt-search-clear"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            )}
            {/* Suggestions dropdown */}
            {showSug && suggestions.length > 0 && (
              <div className="yt-suggestions">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="yt-suggestion-item"
                    style={{ marginBottom: 4 }}
                    onMouseDown={() => { setQuery(s); doSearch(s); }}
                    id={`suggestion-${i}`}
                  >
                    <SearchIcon size={16} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="yt-search-btn" onClick={() => doSearch(query)} aria-label="Search" id="search-btn">
            <SearchIcon size={20} />
          </button>
          <button 
            className="yt-icon-btn" 
            aria-label="Voice search" 
            id="voice-search-btn" 
            style={{ marginLeft: 4, background: isListening ? 'rgba(255, 0, 0, 0.2)' : 'transparent' }}
            onClick={startVoiceSearch}
          >
            <MicIcon style={{ color: isListening ? 'var(--yt-red)' : 'inherit' }} />
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="yt-navbar-right">
        {/* Create */}
        <button className="yt-icon-btn" aria-label="Create" id="create-btn" title="Create">
          {/* <CreateIcon /> */}
        </button>

        {/* Theme Selector */}
        <div style={{ position: 'relative' }} ref={themeRef}>
          <button
            className="yt-icon-btn"
            aria-label="Theme"
            onClick={() => { setShowThemeMenu(p => !p); setShowLangMenu(false); setShowNotifications(false); setShowProfileMenu(false); }}
            title="Theme"
          >
            <PaletteIcon />
          </button>
          
          {showThemeMenu && (
            <div className="yt-profile-dropdown" style={{ right: 0, top: 48, width: 220, zIndex: 100 }}>
              <div style={{ padding: '12px 16px', fontWeight: 600 }}>Choose Theme</div>
              <div className="yt-profile-dropdown-divider" />
              {THEMES.map(t => (
                <div 
                  key={t.id}
                  className="yt-profile-dropdown-item"
                  onClick={() => {
                    setTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                >
                  <span style={{ minWidth: 24, fontSize: 16, display: 'inline-block', color: 'var(--yt-blue)' }}>
                    {theme === t.id ? '✓' : ''}
                  </span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div style={{ position: 'relative' }} ref={langRef}>
          <button
            className="yt-icon-btn"
            aria-label="Language"
            onClick={() => { setShowLangMenu(p => !p); setShowThemeMenu(false); setShowNotifications(false); setShowProfileMenu(false); }}
            title="Language"
          >
            <LanguageIcon />
          </button>
          
          {showLangMenu && (
            <div className="yt-profile-dropdown" style={{ right: 0, top: 48, width: 220, zIndex: 100 }}>
              <div style={{ padding: '12px 16px', fontWeight: 600 }}>Choose Languages</div>
              <div className="yt-profile-dropdown-divider" />
              {LANGUAGES.map(lang => {
                const isSelected = preferredLanguages?.includes(lang.code);
                return (
                  <div 
                    key={lang.code}
                    className="yt-profile-dropdown-item"
                    onClick={() => {
                      let newLangs = [...(preferredLanguages || [])];
                      if (isSelected) {
                        newLangs = newLangs.filter(l => l !== lang.code);
                        if (newLangs.length === 0) newLangs = ['en'];
                      } else {
                        newLangs.push(lang.code);
                      }
                      setPreferredLanguage(newLangs);
                    }}
                  >
                    <span style={{ minWidth: 24, fontSize: 16, display: 'inline-block', color: 'var(--yt-blue)' }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    <span>{lang.label}</span>
                  </div>
                );
              })}
              <div className="yt-profile-dropdown-divider" />
              <div style={{ padding: '8px 16px' }}>
                <button 
                  style={{ width: '100%', padding: '8px', background: 'var(--yt-blue)', color: 'white', borderRadius: '18px', fontWeight: 500 }}
                  onClick={() => window.location.reload()}
                >
                  Apply & Reload
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="yt-icon-btn"
            aria-label="Notifications"
            id="notifications-btn"
            onClick={handleNotifClick}
            title="Notifications"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="yt-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="yt-notification-panel" id="notification-panel">
              <div className="yt-notification-header">
                <span>Notifications</span>
                <button className="yt-notif-settings" aria-label="Notification settings">
                  <SettingsIcon />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="yt-notification-empty">
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
                  <p>Your notifications live here</p>
                  <p style={{ fontSize: 12, color: 'var(--yt-text-disabled)', marginTop: 4 }}>
                    Subscribe to channels to get notified about new videos
                  </p>
                </div>
              ) : (
                <div className="yt-notification-list">
                  {notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={`yt-notification-item${n.read ? '' : ' unread'}`}>
                      <div className="yt-notif-avatar">
                        {n.channelThumbnail ? (
                          <img src={n.channelThumbnail} alt="" />
                        ) : (
                          <span>{(n.channelName || 'Y')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="yt-notif-content">
                        <div className="yt-notif-title">{n.title}</div>
                        <div className="yt-notif-time">{formatTime(n.timestamp)}</div>
                      </div>
                      {!n.read && <div className="yt-notif-dot" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile / Sign in */}
        {currentUser ? (
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              className="yt-avatar-btn"
              onClick={handleProfileClick}
              id="profile-btn"
              title={currentUser.displayName || currentUser.email}
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="yt-avatar-img" />
              ) : (
                <span className="yt-avatar-initial">{initial}</span>
              )}
            </button>
            {showProfileMenu && (
              <div className="yt-profile-dropdown" id="profile-dropdown">
                <div className="yt-profile-dropdown-header">
                  <div className="yt-profile-dropdown-avatar">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{currentUser.displayName || 'User'}</div>
                    <div style={{ fontSize: 13, color: 'var(--yt-text-secondary)' }}>{currentUser.email}</div>
                    <button
                      className="yt-view-channel-link"
                      onClick={() => { setShowProfileMenu(false); navigate('/you'); }}
                    >
                      View your channel
                    </button>
                  </div>
                </div>
                <div className="yt-profile-dropdown-divider" />
                {[
                  { icon: <PersonIcon />, label: 'Your channel', action: () => navigate('/you') },
                  { icon: <SwitchIcon />, label: 'Switch account', action: async () => {
                    try { await logout(); } catch(e) {}
                    setShowProfileMenu(false);
                    navigate('/login');
                  }},
                  { icon: <SignOutIcon />, label: 'Sign out', action: () => { logout(); setShowProfileMenu(false); } },
                ].map(item => (
                  <div
                    key={item.label}
                    className="yt-profile-dropdown-item"
                    onClick={() => { item.action(); setShowProfileMenu(false); }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
                <div className="yt-profile-dropdown-divider" />
                <div
                  className="yt-profile-dropdown-item"
                  onClick={() => { setShowProfileMenu(false); setShowThemeMenu(t => !t); }}
                >
                  <span><DarkModeIcon /></span>
                  <span>Appearance: <strong style={{ color: 'var(--yt-blue)' }}>{THEMES.find(t => t.id === theme)?.label || 'Gold'}</strong></span>
                  <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 12 }}>›</span>
                </div>
                <div
                  className="yt-profile-dropdown-item"
                  onClick={() => { setShowProfileMenu(false); setShowLangMenu(t => !t); }}
                >
                  <span><LanguageIcon /></span>
                  <span>Language: <strong style={{ color: 'var(--yt-blue)', fontSize: 12 }}>{preferredLanguages.map(c => LANGUAGES.find(l => l.code === c)?.label || c).join(', ')}</strong></span>
                  <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 12 }}>›</span>
                </div>
                <div
                  className="yt-profile-dropdown-item"
                  onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                >
                  <span><SettingsIcon /></span>
                  <span>Settings</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="yt-signin-btn"
            onClick={() => navigate('/login')}
            id="signin-btn"
          >
            <PersonIcon />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

function HamburgerIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;
}
function YTLogoSVG() {
  return (
    <svg viewBox="0 0 90 20" width="28" height="20" fill="none">
      <rect x="0" y="0" width="28" height="20" rx="4" fill="#FF0000"/>
      <polygon points="11,6 11,14 19,10" fill="white"/>
    </svg>
  );
}
function SearchIcon({ size = 24 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
}
function MicIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>;
}
function CreateIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8l-4-4h-2v2h1l3 3H3V8h12V6h2zM3 20V10h14v10H3z"/></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>;
}
function PersonIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>;
}
function SignOutIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>;
}
function SwitchIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/></svg>;
}
function DarkModeIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>;
}
function LanguageIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>;
}
function PaletteIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>;
}
