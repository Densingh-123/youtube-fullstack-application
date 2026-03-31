import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Shorts() {
  const navigate = useNavigate();
  const { data, loading, error } = useApi('/api/shorts');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const shorts = data?.shorts || [];

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex(i => {
          if (e.key === 'ArrowDown') return Math.min(i + 1, shorts.length - 1);
          return Math.max(i - 1, 0);
        });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [shorts.length]);

  // Scroll into view on index change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.children[currentIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  if (loading) return (
    <div className="yt-shorts-page">
      <div className="yt-shorts-header">
        <ShortsIconRed />
        <h1>Shorts</h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <VideoGridSkeleton count={4} />
      </div>
    </div>
  );

  if (error) return (
    <div className="yt-shorts-page">
      <div className="yt-shorts-header"><ShortsIconRed /><h1>Shorts</h1></div>
      <div style={{ padding: 24, color: 'var(--yt-red)' }}>{error}</div>
    </div>
  );

  return (
    <div className="yt-shorts-page" style={{ background: 'var(--yt-bg)' }}>
      <div className="yt-shorts-header">
        <ShortsIconRed />
        <h1>Shorts</h1>
      </div>

      <div className="yt-shorts-feed" ref={containerRef}>
        {shorts.map((short, i) => (
          <ShortItem
            key={short.id}
            short={short}
            isActive={i === currentIndex}
            onNext={() => setCurrentIndex(j => Math.min(j + 1, shorts.length - 1))}
            onPrev={() => setCurrentIndex(j => Math.max(j - 1, 0))}
            onPlay={() => navigate(`/video/${short.id}`)}
            index={i}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="yt-shorts-nav">
        <button
          className="yt-shorts-nav-btn"
          onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          aria-label="Previous"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
        </button>
        <button
          className="yt-shorts-nav-btn"
          onClick={() => setCurrentIndex(i => Math.min(i + 1, shorts.length - 1))}
          disabled={currentIndex >= shorts.length - 1}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
        </button>
      </div>
    </div>
  );
}

function ShortItem({ short, isActive, onNext, onPrev, onPlay, index }) {
  const { likeVideo, isLiked, subscribe, unsubscribe, isSubscribed } = useApp();
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = useRef(null);
  
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const liked = isLiked(short.id);
  const channelId = short.channelId || short.authorId || null;
  const isChannelValid = channelId && typeof channelId === 'string' && channelId.startsWith('UC');
  const subscribed = isChannelValid ? isSubscribed(channelId) : false;

  const handleSubscribe = (e) => {
    e.stopPropagation();
    if (!isChannelValid) return;
    if (subscribed) {
      unsubscribe(channelId);
    } else {
      subscribe({
        id: channelId,
        name: short.author || 'Unknown',
        thumbnail: short.thumbnail || null
      });
    }
  };

  useEffect(() => {
    if (isActive) setIsPlaying(true);
  }, [isActive]);

  const togglePlay = () => {
    if (!isActive || !iframeRef.current) return;
    const cmd = isPlaying ? 'pauseVideo' : 'playVideo';
    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`yt-short-item${isActive ? ' active' : ''}`} id={`short-item-${index}`}>
      <div className="yt-short-player-wrap">
        {/* Thumbnail/Video */}
        <div className="yt-short-player" onClick={!isActive ? onPlay : undefined}>
          {isActive ? (
            <>
              <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${short.id}?autoplay=1&mute=0&controls=0&loop=1&playlist=${short.id}&enablejsapi=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ pointerEvents: 'none' }}
              />
              <div 
                style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                {!isPlaying && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 16 }}>
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                )}
              </div>
            </>
          ) : short.thumbnail ? (
            <img src={short.thumbnail} alt={short.title} className="yt-short-thumb-img" />
          ) : (
            <div className="yt-short-no-thumb" />
          )}
          {!isActive && (
            <div className="yt-short-play-overlay">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          )}
          {/* Bottom gradient */}
          <div className="yt-short-gradient" />
          {/* Info overlay */}
          <div className="yt-short-info-overlay">
            <div className="yt-short-channel-row">
              <div className="yt-short-channel-avatar">{(short.author || '?')[0].toUpperCase()}</div>
              <span className="yt-short-channel-name">{short.author}</span>
              {isChannelValid && (
                <button 
                  className={`yt-short-subscribe${subscribed ? ' subscribed' : ''}`}
                  onClick={handleSubscribe}
                >
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>
            <div className="yt-short-title">{short.title}</div>
            <div className="yt-short-music-row">
              <MusicNoteIcon />
              <span>Original audio</span>
            </div>
          </div>
          
          {/* Overlays */}
          {showComments && <ShortsCommentsPanel shortId={short.id} onClose={() => setShowComments(false)} />}
          {showMore && <ShortsMorePanel onClose={() => setShowMore(false)} />}
        </div>

        <div className="yt-short-actions">
          <button className={`yt-short-action-btn${liked ? ' liked' : ''}`} onClick={() => likeVideo({
            id: short.id,
            title: typeof short.title === 'string' ? short.title : String(short.title?.text || short.title || 'Short'),
            thumbnail: short.thumbnail || short.thumbnails?.[0]?.url,
            author: typeof short.author === 'string' ? short.author : String(short.author?.name || short.author?.text || short.author || 'Unknown'),
            isShort: true
          })}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>
            <span style={{ fontSize: 12 }}>{liked ? '1' : '0'}</span>
          </button>
          <button className="yt-short-action-btn" onClick={() => alert('Thanks for the feedback!')}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" style={{ transform: 'rotate(180deg)' }}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>
            
          </button>
          <button className="yt-short-action-btn" onClick={() => setShowComments(true)}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            
          </button>
          <button className="yt-short-action-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({ title: short.title, url: `https://www.youtube.com/watch?v=${short.id}` });
            } else {
              navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${short.id}`);
              alert('Link copied to clipboard!');
            }
          }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
            
          </button>
          <button className="yt-short-action-btn" onClick={() => setShowMore(true)}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          
          </button>
          {/* Up/Down nav */}
          <button className="yt-short-action-btn" onClick={onPrev}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
          <button className="yt-short-action-btn" onClick={onNext}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortsIconRed() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#ff0000">
      <path d="M17.77 10.32l-1.2-.5L18 9c1.07-.43 1.58-1.67 1.15-2.74-.43-1.07-1.67-1.58-2.74-1.15l-8 3.26c-1.07.43-1.58 1.67-1.15 2.74.43.92 1.37 1.44 2.34 1.3l1.2.5L9 13c-1.07.43-1.58 1.67-1.15 2.74.4.96 1.38 1.54 2.38 1.38l1.5.62v1.26c0 1.1.9 2 2 2h.54c1.1 0 2-.9 2-2v-1.76c.91-.37 1.54-1.26 1.54-2.24 0-.72-.31-1.37-.81-1.82l-.76-.31L16 14c1.07-.43 1.58-1.67 1.15-2.74-.2-.48-.56-.86-1.38-1.06v.12z"/>
    </svg>
  );
}

function ShortsCommentsPanel({ shortId, onClose }) {
  const { data, loading } = useApi(`/api/video/${shortId}/comments`);
  
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontWeight: 'bold' }}>Comments</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading && <p>Loading comments...</p>}
        {!loading && data?.comments?.length === 0 && <p>No comments available</p>}
        {!loading && data?.comments?.map((c, i) => (
          <div key={i} style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              {c.author?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>{c.author}</div>
              <div style={{ fontSize: 14 }}>{c.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortsMorePanel({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--yt-surface)', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '16px 0', animation: 'slideUp 0.2s ease-out' }}>
        <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => console.log('Description')}>
          <span style={{ fontSize: 24, margin: '-4px 0 0' }}>📄</span> <span>Description</span>
        </div>
        <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => console.log('Save to playlist')}>
          <span style={{ fontSize: 24, margin: '-4px 0 0' }}>➕</span> <span>Save to playlist</span>
        </div>
        <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => console.log('Report')}>
          <span style={{ fontSize: 24, margin: '-4px 0 0' }}>🚩</span> <span>Report</span>
        </div>
      </div>
    </div>
  );
}

function MusicNoteIcon() {
  return <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;
}
