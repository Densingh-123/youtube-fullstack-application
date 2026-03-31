import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Sidebar({ mode, onItemClick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { subscriptions } = useApp();
  // Only render valid UC... subscriptions in sidebar — avoids bad navigation & duplicate keys
  const validSubs = subscriptions
    .filter(ch => ch && ch.id && typeof ch.id === 'string' && ch.id.startsWith('UC'))
    .filter((ch, i, arr) => arr.findIndex(c => c.id === ch.id) === i); // deduplicate by ID

  function go(path) {
    navigate(path);
    onItemClick?.();
  }

  function isActive(path) {
    return pathname === path;
  }

  const isMini = mode === 'mini';

  return (
    <nav className={`yt-sidebar${isMini ? ' mini' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Primary */}
      <div className="yt-sidebar-section">
        <SidebarItem icon={<HomeIcon />} label="Home" active={isActive('/')} onClick={() => go('/')} mini={isMini} id="nav-home" />
        <SidebarItem icon={<ShortsIcon />} label="Shorts" active={isActive('/shorts')} onClick={() => go('/shorts')} mini={isMini} id="nav-shorts" />
        <SidebarItem icon={<SubsIcon />} label="Subscriptions" active={isActive('/feed/subscriptions')} onClick={() => go('/feed/subscriptions')} mini={isMini} id="nav-subscriptions" />
      </div>

      {/* You section */}
      {!isMini && (
        <div className="yt-sidebar-section">
          <div className="yt-sidebar-section-title">
            You
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ opacity: 0.6, marginLeft: 6 }}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
          <SidebarItem icon={<YouIcon />} label="Your channel" active={isActive('/you')} onClick={() => go('/you')} mini={isMini} id="nav-you" />
          <SidebarItem icon={<HistoryIcon />} label="History" active={isActive('/feed/history')} onClick={() => go('/feed/history')} mini={isMini} id="nav-history" />
          <SidebarItem icon={<PlaylistIcon />} label="Playlists" active={isActive('/feed/playlists')} onClick={() => go('/feed/playlists')} mini={isMini} id="nav-playlists" />
          {/* <SidebarItem icon={<VideoIcon />} label="Your videos" active={isActive('/feed/my_videos')} onClick={() => go('/feed/my_videos')} mini={isMini} id="nav-my-videos" /> */}
          <SidebarItem icon={<WatchLaterIcon />} label="Watch later" active={isActive('/feed/watch_later')} onClick={() => go('/feed/watch_later')} mini={isMini} id="nav-watch-later" />
          <SidebarItem icon={<LikedIcon />} label="Liked videos" active={isActive('/feed/liked')} onClick={() => go('/feed/liked')} mini={isMini} id="nav-liked" />
          <SidebarItem icon={<DownloadIcon />} label="Downloads" active={isActive('/feed/downloads')} onClick={() => go('/feed/downloads')} mini={isMini} id="nav-downloads" />
        </div>
      )}


      {/* Subscriptions */}
      {!isMini && (
        <div className="yt-sidebar-section">
          <div className="yt-sidebar-section-title">Subscriptions</div>
          {validSubs.length === 0 ? (
            <div style={{ padding: '8px 24px 4px', fontSize: 13, color: 'var(--yt-text-disabled)' }}>
              No subscriptions yet
            </div>
          ) : (
            validSubs.slice(0, 8).map((ch) => (
              <SidebarItem
                key={ch.id}
                icon={
                  <div className="yt-sidebar-channel-avatar">
                    {ch.thumbnail ? (
                      <img src={ch.thumbnail} alt={ch.name || ch.id} />
                    ) : (
                      <span>{(ch.name || ch.id || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                }
                label={ch.name || ch.id}
                active={pathname.includes(ch.id)}
                onClick={() => go(`/channel/${ch.id}`)}
                mini={isMini}
                id={`nav-sub-${ch.id}`}
              />
            ))
          )}
          {validSubs.length > 8 && (
            <button className="show-more-btn" onClick={() => go('/feed/subscriptions')}>
              <ArrowDownIcon />
              <span>Show {validSubs.length - 8} more</span>
            </button>
          )}
        </div>
      )}

      {/* Explore */}
      {!isMini && (
        <div className="yt-sidebar-section">
          <div className="yt-sidebar-section-title">Explore</div>
          <SidebarItem icon={<TrendingIcon />} label="Trending" active={isActive('/feed/trending')} onClick={() => go('/feed/trending')} mini={isMini} id="nav-trending" />
          <SidebarItem icon={<MusicIcon />} label="Music" active={isActive('/feed/music')} onClick={() => go('/feed/music')} mini={isMini} id="nav-music" />
          <SidebarItem icon={<GamingIcon />} label="Gaming" active={isActive('/feed/gaming')} onClick={() => go('/feed/gaming')} mini={isMini} id="nav-gaming" />
          <SidebarItem icon={<NewsIcon />} label="News" active={isActive('/feed/news')} onClick={() => go('/feed/news')} mini={isMini} id="nav-news" />
          <SidebarItem icon={<FilmIcon />} label="Films" active={isActive('/feed/films')} onClick={() => go('/feed/films')} mini={isMini} id="nav-films" />
          <SidebarItem icon={<LiveIcon />} label="Live" active={isActive('/feed/live')} onClick={() => go('/feed/live')} mini={isMini} id="nav-live" />
          <SidebarItem icon={<SportIcon />} label="Sports" active={isActive('/feed/sports')} onClick={() => go('/feed/sports')} mini={isMini} id="nav-sports" />
        </div>
      )}

      {/* Utility links (always visible even mini) */}
      <div className="yt-sidebar-section">
        <SidebarItem icon={<SettingsIcon />} label="Settings" active={isActive('/settings')} onClick={() => go('/settings')} mini={isMini} id="nav-settings" />
      </div>


      {/* Footer */}
      {!isMini && (
        <div className="yt-sidebar-section" style={{ paddingBottom: 32 }}>
          <div className="yt-sidebar-footer-links">
            {['About', 'Press', 'Copyright', 'Contact', 'Creators', 'Advertise', 'Developers'].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="yt-sidebar-footer-copy">© 2025 YouTube, LLC</div>
        </div>
      )}
    </nav>
  );
}

function SidebarItem({ icon, label, active, onClick, mini, id }) {
  return (
    <div
      className={`yt-sidebar-item${active ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      id={id}
    >
      {icon}
      {!mini && <span className="yt-sidebar-item-label">{label}</span>}
      {mini && <span className="yt-sidebar-mini-label">{label}</span>}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>; }
function ShortsIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.77 10.32l-1.2-.5L18 9c1.07-.43 1.58-1.67 1.15-2.74-.43-1.07-1.67-1.58-2.74-1.15l-8 3.26c-1.07.43-1.58 1.67-1.15 2.74.43.92 1.37 1.44 2.34 1.3l1.2.5L9 13c-1.07.43-1.58 1.67-1.15 2.74.4.96 1.38 1.54 2.38 1.38l1.5.62v1.26c0 1.1.9 2 2 2h.54c1.1 0 2-.9 2-2v-1.76c.91-.37 1.54-1.26 1.54-2.24 0-.72-.31-1.37-.81-1.82l-.76-.31L16 14c1.07-.43 1.58-1.67 1.15-2.74-.2-.48-.56-.86-1.38-1.06v.12zm-3.77 4.43c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>; }
function SubsIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zm-2 10H4v-8h16v8z"/></svg>; }
function YouIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>; }
function HistoryIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v4l4-4-4-4v2zm1 10H12V8h-2v7h4v-2z"/></svg>; }
function PlaylistIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z"/></svg>; }
function VideoIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>; }
function WatchLaterIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>; }
function LikedIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>; }
function TrendingIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>; }
function MusicIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>; }
function GamingIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5S16.33 15 15.5 15zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5S19.33 12 18.5 12z"/></svg>; }
function NewsIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>; }
function FilmIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>; }
function LiveIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1 7l2 2c2.76-2.76 6.57-4 10.02-4 3.84 0 7.57 1.46 10.34 4.34l1.94-2.16C21.97 3.97 17.51 2 13.01 2 9.1 2 4.98 3.51 1 7zm10 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-4.01 0c0-3.32 2.69-6.01 6.01-6.01S18.99 8.68 18.99 12 16.3 18.01 12.98 18.01 6.99 15.32 6.99 12z"/></svg>; }
function SportIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>; }
function ArrowDownIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>; }

