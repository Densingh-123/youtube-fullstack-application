import { Link } from 'react-router-dom';
import { memo } from 'react';

function ChannelCard({ channel }) {
  if (!channel) return null;
  const initial = (channel.name || 'C')[0].toUpperCase();

  return (
    <Link
      to={`/channel/${channel.id}`}
      className="channel-card"
      id={`channel-card-${channel.id}`}
    >
      {channel.thumbnail ? (
        <img
          className="channel-avatar"
          src={channel.thumbnail}
          alt={channel.name}
          loading="lazy"
          onError={e => { e.target.style.display='none'; }}
        />
      ) : (
        <div className="channel-avatar-placeholder">{initial}</div>
      )}
      <div className="channel-info">
        <p className="channel-name">{channel.name}</p>
        {channel.subscribers && (
          <p className="channel-subs">{channel.subscribers} subscribers</p>
        )}
        {channel.videoCount && (
          <p className="channel-subs">{channel.videoCount} videos</p>
        )}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  );
}

export default memo(ChannelCard);
