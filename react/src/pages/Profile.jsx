import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { subscriptions, history, likedVideos, watchLater } = useApp();
  const navigate = useNavigate();

  const initial = currentUser
    ? (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
    : 'G';

  const stats = [
    { label: 'Subscriptions', count: subscriptions.length, path: '/feed/subscriptions' },
    { label: 'Watch later', count: watchLater.length, path: '/feed/watch_later' },
    { label: 'Liked videos', count: likedVideos.length, path: '/feed/liked' },
    { label: 'History', count: history.length, path: '/feed/history' },
  ];

  const menuItems = [
    { icon: <PersonIcon />, label: 'Your channel', path: currentUser ? '/feed/my_videos' : '/login' },
    { icon: <HistoryIcon />, label: 'Your history', path: '/feed/history' },
    { icon: <PlaylistsIcon />, label: 'Playlists', path: '/feed/playlists' },
    { icon: <VideoIcon />, label: 'Your videos', path: '/feed/my_videos' },
    { icon: <WatchLaterIcon />, label: 'Watch later', path: '/feed/watch_later' },
    { icon: <LikeIcon />, label: 'Liked videos', path: '/feed/liked' },
  ];

  return (
    <div className="yt-page">
      {/* Profile header */}
      <div className="yt-profile-header">
        <div className="yt-profile-avatar">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="yt-profile-info">
          <h1 className="yt-profile-name">
            {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest'}
          </h1>
          {currentUser?.email && (
            <p className="yt-profile-email">{currentUser.email}</p>
          )}
          {!currentUser && (
            <button className="yt-sign-in-btn" onClick={() => navigate('/login')}>
              <PersonIcon />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {currentUser && (
        <div className="yt-profile-stats">
          {stats.map(s => (
            <div key={s.label} className="yt-profile-stat" onClick={() => navigate(s.path)}>
              <div className="yt-profile-stat-count">{s.count}</div>
              <div className="yt-profile-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="yt-profile-menu">
        {menuItems.map(item => (
          <div key={item.label} className="yt-profile-menu-item" onClick={() => navigate(item.path)}>
            <span className="yt-profile-menu-icon">{item.icon}</span>
            <span className="yt-profile-menu-label">{item.label}</span>
            <ChevronIcon />
          </div>
        ))}

        {currentUser && (
          <>
            <div className="yt-profile-menu-divider" />
            <div
              className="yt-profile-menu-item"
              onClick={() => { logout(); navigate('/'); }}
              style={{ color: 'var(--yt-red)' }}
            >
              <span className="yt-profile-menu-icon"><SignOutIcon /></span>
              <span className="yt-profile-menu-label">Sign out</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersonIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>; }
function HistoryIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v4l4-4-4-4v2zm1 10H12V8h-2v7h4v-2z" /></svg>; }
function PlaylistsIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z" /></svg>; }
function VideoIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>; }
function WatchLaterIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>; }
function LikeIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" /></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginLeft: 'auto', opacity: 0.5 }}><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>; }
function SignOutIcon() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>; }
