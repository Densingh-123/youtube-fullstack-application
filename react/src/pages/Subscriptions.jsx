import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useNavigate, Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Subscriptions() {
  const { subscriptions } = useApp();
  // Only include valid subscriptions with real UC channel IDs and valid names
  const validSubscriptions = subscriptions.filter(ch => ch && ch.id && typeof ch.id === 'string' && ch.id.startsWith('UC'));
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (validSubscriptions.length === 0) {
    if (!currentUser) {
      return (
        <div className="yt-page-empty">
          <div className="yt-page-empty-icon">📺</div>
          <h2>Don't miss new videos</h2>
          <p>Sign in to see updates from your favourite YouTube channels</p>
          <button className="yt-sign-in-btn" onClick={() => navigate('/login')}>
            <UserIcon />
            Sign in
          </button>
          <div className="yt-subscriptions-hint">
            <p>Not subscribed to anyone yet?</p>
            <Link to="/" style={{ color: 'var(--yt-input-focus-border)' }}>Browse YouTube to find channels you love</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="yt-page-empty">
        <div className="yt-page-empty-icon">📺</div>
        <h2>No subscriptions yet</h2>
        <p>You haven't subscribed to any channels.</p>
        <button className="yt-sign-in-btn" onClick={() => navigate('/')}>
          Browse channels
        </button>
      </div>
    );
  }

  return (
    <div className="yt-page">
      <div className="yt-page-header">
        <h1 className="yt-page-title">Subscriptions</h1>
      </div>

      {/* Channel avatars row */}
      <div className="yt-subscriptions-channels">
        {validSubscriptions.map(ch => (
          <div key={ch.id} className="yt-sub-channel-chip" onClick={() => navigate(`/channel/${ch.id}`)}>
            <div className="yt-sub-channel-avatar">
              {ch.thumbnail ? (
                <img src={ch.thumbnail} alt={ch.name} />
              ) : (
                <div className="yt-sub-channel-avatar-placeholder">{(ch.name || ch.id || '?')[0].toUpperCase()}</div>
              )}
            </div>
            <span className="yt-sub-channel-name">{ch.name}</span>
          </div>
        ))}
      </div>

      {/* Latest videos from subscribed channels */}
      <div className="yt-page-section-title" style={{ padding: '16px 24px 8px', fontSize: 18, fontWeight: 600 }}>Latest</div>
      <div style={{ padding: '0 24px' }}>
        {validSubscriptions.map(ch => (
          <ChannelLatestVideos key={ch.id} channel={ch} />
        ))}
      </div>
    </div>
  );
}

function ChannelLatestVideos({ channel }) {
  const { data, loading } = useApi(`/api/channel/${channel.id}/videos`);
  const navigate = useNavigate();
  const videos = (data?.videos || []).slice(0, 4);

  if (loading) return <VideoGridSkeleton count={4} />;
  if (!videos.length) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          className="yt-sub-channel-avatar"
          style={{ width: 32, height: 32, cursor: 'pointer' }}
          onClick={() => navigate(`/channel/${channel.id}`)}
        >
          {channel.thumbnail ? (
            <img src={channel.thumbnail} alt={channel.name} />
          ) : (
            <div className="yt-sub-channel-avatar-placeholder" style={{ fontSize: 13 }}>
              {(channel.name || channel.id || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <span
          style={{ fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
          onClick={() => navigate(`/channel/${channel.id}`)}
        >
          {channel.name}
        </span>
      </div>
      <div className="yt-video-grid" style={{ padding: 0 }}>
        {videos.map(v => <VideoCard key={v.id} video={{ ...v, author: channel.name, channelId: channel.id }} />)}
      </div>
    </div>
  );
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>;
}
