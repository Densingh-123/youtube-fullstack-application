import { useParams, Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import CommentCard from '../components/CommentCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';
import PlaylistModal from '../components/PlaylistModal';

function formatNumber(n) {
  if (!n) return 'N/A';
  if (typeof n === 'number') {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }
  const str = String(n).replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  }
  return String(n);
}

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDesc, setShowDesc] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentActions, setShowCommentActions] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolume, setShowVolume] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(null); // null | 'downloading' | 'done'
  const volumeTimerRef = useRef(null);
  const settingsRef = useRef(null);

  const {
    isSubscribed, subscribe, unsubscribe,
    isLiked, likeVideo,
    isInWatchLater, addToWatchLater, removeFromWatchLater,
    addToHistory, addDownload, setMiniPlayerVideo
  } = useApp();

  const { data: video, loading: vLoading, error: vError } = useApi(id ? `/api/video/${id}` : null);
  const { data: commentsData, loading: cLoading } = useApi(id ? `/api/video/${id}/comments` : null);
  const { data: transcriptData } = useApi(showTranscript && id ? `/api/video/${id}/transcript` : null);
  // Fetch recommendations in parallel — do NOT gate on video?.title to avoid race condition
  const { data: related, loading: rLoading, error: rError } = useApi(id ? `/api/video/${id}/recommendations` : null);

  useEffect(() => {
    if (video) addToHistory(video);
  }, [video]);

  useEffect(() => {
    // Hide global miniplayer when entering a video page
    setMiniPlayerVideo && setMiniPlayerVideo(null);
    window.__yt_current_time = 0; // reset
  }, [id, setMiniPlayerVideo]);

  // Track YouTube time for Miniplayer Handoff
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      window.__yt_player = new window.YT.Player(`player-${id}`, {
        events: {
          onReady: (e) => {
            window.__yt_player_timer = setInterval(() => {
              if (e.target && e.target.getCurrentTime) {
                window.__yt_current_time = e.target.getCurrentTime();
              }
            }, 1000);
          }
        }
      });
    };

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = initPlayer;
      document.body.appendChild(tag);
    } else {
      setTimeout(initPlayer, 500);
    }

    return () => {
      clearInterval(window.__yt_player_timer);
    };
  }, [id]);

  // Close settings on outside click
  useEffect(() => {
    function handler(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePiP = useCallback(() => {
    setIsPiP(p => !p);
  }, []);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    const iframe = document.getElementById(`player-${id}`);
    if (iframe) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [newVol] }), '*');
    }
  };

  const handleVolumeHover = () => { clearTimeout(volumeTimerRef.current); setShowVolume(true); };
  const handleVolumeLeave = () => { volumeTimerRef.current = setTimeout(() => setShowVolume(false), 900); };

  // Download: Use ytdl-proxy via a backend link or fallback to anchor download
  async function handleDownload() {
    if (!video) return;
    setDownloadStatus('downloading');
    try {
      // Try backend streaming download
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const url = `${API_BASE}/api/video/${id}/download`;
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `${video.title || id}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        // Save to downloads list in AppContext
        addDownload && addDownload({
          id, title: video.title, thumbnail: normThumb,
          author: normAuthor, duration: video.duration,
          downloadedAt: new Date().toISOString(),
          localPath: a.download,
        });
        setDownloadStatus('done');
      } else {
        // fallback: open YouTube for manual download
        window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
        setDownloadStatus(null);
      }
    } catch {
      // fallback
      const a = document.createElement('a');
      a.href = `https://www.youtube.com/watch?v=${id}`;
      a.target = '_blank';
      a.click();
      setDownloadStatus(null);
    }
  }

  if (vLoading) return (
    <div className="yt-watch-page">
      <div className="yt-watch-primary">
        <div style={{ aspectRatio: '16/9', background: 'var(--yt-chip-bg)', borderRadius: 12, marginBottom: 16 }} />
        <VideoGridSkeleton count={2} />
      </div>
      <div className="yt-watch-secondary"><VideoGridSkeleton count={5} /></div>
    </div>
  );

  if (vError) return (
    <div style={{ padding: '24px', color: 'var(--yt-red)' }}>
      <h3>Failed to load video</h3><p>{vError}</p>
    </div>
  );

  if (!video) return null;

  const normTitle = typeof video.title === 'string' ? video.title : String(video.title?.text || video.title?.runs?.[0]?.text || video.title || 'Unknown Video');
  const normAuthor = typeof video.author === 'string' && video.author ? video.author : String(video.author?.name || video.author?.text || video.author || 'Unknown Channel');
  const normThumb = Array.isArray(video.thumbnail) ? video.thumbnail[0]?.url : (video.thumbnail?.url || video.thumbnail);
  // Only use real UC channel IDs — never generate fake fallbacks
  const rawChannelId = video.channelId || video.author?.id || video.authorId || null;
  const normChannelId = (rawChannelId && rawChannelId.startsWith('UC')) ? rawChannelId : null;
  const isValidChannel = !!normChannelId;
  const rawDur = video.duration || '';
  const normDuration = typeof rawDur === 'object' ? (rawDur.text || rawDur.simple_text || '') : String(rawDur);
  const initial = normAuthor[0]?.toUpperCase() || '?';
  const subscribed = normChannelId ? isSubscribed(normChannelId) : false;
  const liked = isLiked(id);
  const inWatchLater = isInWatchLater(id);

  function handleSubscribe() {
    if (!normChannelId) return; // Don't subscribe to unknown channels
    if (subscribed) unsubscribe(normChannelId);
    else subscribe({ id: normChannelId, name: normAuthor, thumbnail: normThumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
  }

  function handleLike() {
    likeVideo({ id, title: normTitle, thumbnail: normThumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, author: normAuthor, channelId: normChannelId || '', views: video.views, duration: normDuration, isShort: video.isShort || false });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: video.title, url: `https://www.youtube.com/watch?v=${id}` });
    } else {
      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${id}`).then(() => alert('Link copied!'));
    }
  }

  const relatedVideos = (related?.videos || []).filter(v => v.id !== id).slice(0, 50);
  // Debug (remove in prod)
  // console.log('[VideoDetail] related:', related, 'rLoading:', rLoading, 'rError:', rError, 'count:', relatedVideos.length);

  return (
    <div className={`yt-watch-page${cinemaMode ? ' yt-cinema-mode' : ''}`}>
      {/* Primary Column */}
      <div className="yt-watch-primary">
        {/* Player */}
        <div className={`yt-watch-player-wrap${cinemaMode ? ' cinema' : ''}${isPiP ? ' floating-pip' : ''}`}>
          <div className="yt-watch-player">
            <iframe
              id={`player-${id}`}
              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&controls=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          {isPiP && (
            <button className="yt-action-btn" onClick={() => setIsPiP(false)} title="Close Miniplayer" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              X
            </button>
          )}
        </div>

        {/* Title */}
        <h1 className="yt-watch-title">{video.title}</h1>

        {/* Channel row + Actions */}
        <div className="yt-watch-below-title">
          <div className="yt-watch-channel-row">
            {isValidChannel ? (
              <Link to={`/channel/${normChannelId}`} className="yt-watch-channel-avatar" title={normAuthor}>
                <div className="yt-watch-avatar-inner">{initial}</div>
              </Link>
            ) : (
              <div className="yt-watch-channel-avatar" style={{ cursor: 'default' }}>
                <div className="yt-watch-avatar-inner">{initial}</div>
              </div>
            )}
            <div className="yt-watch-channel-info">
              {isValidChannel ? (
                <Link to={`/channel/${normChannelId}`} className="yt-watch-channel-name">{normAuthor}</Link>
              ) : (
                <span className="yt-watch-channel-name" style={{ color: 'var(--yt-text)' }}>{normAuthor}</span>
              )}
              <div className="yt-watch-subs">{video.channel_subscribers || (isValidChannel ? 'Click to view channel' : '')}</div>
            </div>
            <button
              className={`yt-subscribe-btn${subscribed ? ' subscribed' : ''}${!isValidChannel ? ' disabled' : ''}`}
              onClick={handleSubscribe}
              disabled={!isValidChannel}
              id={`subscribe-${normChannelId || 'unknown'}`}
              title={isValidChannel ? (subscribed ? 'Unsubscribe' : 'Subscribe') : 'Channel not available'}
            >
              {subscribed ? (<><BellIcon />Subscribed</>) : 'Subscribe'}
            </button>
          </div>

          {/* Action buttons row */}
          <div className="yt-watch-actions" style={{ flexWrap: 'wrap' }}>
            {/* Like/Dislike */}
            <div className="yt-like-dislike-group">
              <button className={`yt-like-btn${liked ? ' liked' : ''}`} onClick={handleLike} id={`like-btn-${id}`} aria-label="Like">
                <ThumbUpIcon filled={liked} /><span>{formatNumber(video.likes)}</span>
              </button>
              <div className="yt-like-divider" />
              <button className="yt-dislike-btn" aria-label="Dislike"><ThumbDownIcon /></button>
            </div>

            <button className="yt-action-btn" onClick={handleShare} id="share-btn">
              <ShareIcon />Share
            </button>

            {/* Download */}
            <button
              className={`yt-action-btn${downloadStatus === 'done' ? ' active-btn' : ''}`}
              onClick={handleDownload}
              disabled={downloadStatus === 'downloading'}
              id={`download-btn-${id}`}
              title="Download video"
            >
              {downloadStatus === 'downloading' ? <SpinnerIcon /> : downloadStatus === 'done' ? <CheckIcon /> : <DownloadIcon />}
              {downloadStatus === 'downloading' ? 'Downloading...' : downloadStatus === 'done' ? 'Downloaded' : 'Download'}
            </button>

            {/* Watch Later / Save */}
            <button className={`yt-action-btn${inWatchLater ? ' active-btn' : ''}`} onClick={() => addToWatchLater({ id, title: normTitle, thumbnail: normThumb, author: normAuthor, duration: normDuration })} title="Quick add to Watch Later">
              {inWatchLater ? <CheckIcon /> : <WatchLaterIcon />} Watch Later
            </button>
            <button className="yt-action-btn" onClick={() => setShowPlaylistModal(true)} title="Save to playlist" id="save-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg> Save
            </button>

            {/* Cinema Mode */}
            <button className={`yt-action-btn${cinemaMode ? ' active-btn' : ''}`} onClick={() => setCinemaMode(c => !c)} title={cinemaMode ? 'Exit Cinema Mode' : 'Cinema Mode'}>
              <CinemaModeIcon active={cinemaMode} /> Cinema
            </button>

            {/* Miniplayer */}
            <button className={`yt-action-btn${isPiP ? ' active-btn' : ''}`} onClick={handlePiP} title="Miniplayer / Pop out">
              <PopOutIcon /> Miniplayer
            </button>

            {/* Custom Volume */}
            {/* <div className="yt-vol-group" onMouseEnter={handleVolumeHover} onMouseLeave={handleVolumeLeave} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button className="yt-action-btn yt-vol-trigger" title="Volume">
                {volume === 0 ? <VolumeMuteIcon /> : volume < 50 ? <VolumeDownIcon /> : <VolumeUpIcon />} Vol
              </button>
              <div className={`yt-volume-controls${showVolume ? ' visible' : ''}`} style={{ position: 'absolute', bottom: '110%', background: 'var(--yt-chip-bg)', padding: '8px 16px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <button className="yt-vol-btn" onClick={() => handleVolumeChange(Math.min(100, volume + 10))} title="Vol +"><VolumeUpIcon /></button>
                <div className="yt-vol-track" style={{ width: 100, height: 4, background: '#444', borderRadius: 2, cursor: 'pointer' }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); handleVolumeChange(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))); }}>
                  <div className="yt-vol-fill" style={{ width: `${volume}%`, background: 'var(--yt-red)', height: '100%', borderRadius: 2 }} />
                </div>
                <button className="yt-vol-btn" onClick={() => handleVolumeChange(Math.max(0, volume - 10))} title="Vol -"><VolumeDownIcon /></button>
              </div>
            </div> */}

            <button className="yt-action-btn" onClick={() => {}} id="more-btn">
              <MoreHorizIcon />
            </button>
          </div>
        </div>

        {showPlaylistModal && (
          <PlaylistModal
            video={{ id, title: normTitle, thumbnail: normThumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, author: normAuthor, channelId: normChannelId || '', views: video.views, duration: normDuration, isShort: video.isShort || false }}
            onClose={() => setShowPlaylistModal(false)}
          />
        )}

        {/* Description */}
        <div className={`yt-watch-description-box${showDesc ? ' expanded' : ''}`} onClick={() => setShowDesc(p => !p)} id="description-box">
          <div className="yt-watch-desc-meta">
            <span>{formatNumber(video.views)} views</span>
            <span>{video.publishedAt || ''}</span>
          </div>
          <div className={`yt-watch-desc-text${showDesc ? ' show' : ''}`}>{video.description || 'No description available.'}</div>
          <div className="yt-watch-desc-toggle">{showDesc ? 'Show less' : 'Show more'}</div>
        </div>

        {/* Transcript */}
        <button className="yt-transcript-toggle" onClick={() => setShowTranscript(p => !p)} id="transcript-btn">
          <TranscriptIcon />{showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
        {showTranscript && transcriptData?.segments?.length > 0 && (
          <div className="yt-transcript-box">
            {transcriptData.segments.map((seg, i) => (
              <div key={i} className="yt-transcript-line">
                <span className="yt-transcript-time">{formatMs(seg.startMs)}</span>
                <span className="yt-transcript-text">{seg.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comments (hidden in cinema mode, replaced by recommendations) */}
        {!cinemaMode && (
          <div className="yt-watch-comments-section">
            <div className="yt-comments-header">
              <h2 className="yt-comments-count">{commentsData?.comments?.length ? `${commentsData.comments.length} Comments` : 'Comments'}</h2>
              <button className="yt-action-btn" style={{ gap: 6 }}><SortIcon />Sort by</button>
            </div>
            <div className="yt-add-comment">
              <div className="yt-comment-avatar-self"><div className="yt-comment-avatar-inner">Y</div></div>
              <div className="yt-add-comment-input-wrap">
                <input
                  className="yt-add-comment-input"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onFocus={() => setShowCommentActions(true)}
                />
                {showCommentActions && (
                  <div className="yt-comment-actions">
                    <button className="yt-comment-cancel" onClick={() => { setShowCommentActions(false); setCommentInput(''); }}>Cancel</button>
                    <button className="yt-comment-submit" disabled={!commentInput.trim()}>Comment</button>
                  </div>
                )}
              </div>
            </div>
            {cLoading && <VideoGridSkeleton count={3} />}
            {commentsData?.comments?.map(c => <CommentCard key={c.id} comment={c} />)}
            {!cLoading && !commentsData?.comments?.length && (
              <p style={{ color: 'var(--yt-text-secondary)', padding: '16px 0' }}>No comments available</p>
            )}
          </div>
        )}

        {/* Cinema mode: show recommended videos below (replacing comments) */}
        {cinemaMode && (
          <div className="yt-cinema-inline-recs">
            <h2 className="yt-cinema-recs-title">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z" /></svg>
              Recommended videos
            </h2>
            <div className="yt-cinema-recs-grid">
              {rLoading ? <VideoGridSkeleton count={8} /> : relatedVideos.map(v => <RelatedVideoCard key={v.id} video={v} />)}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Column — Recommendations */}
      <div className={`yt-watch-secondary${cinemaMode ? ' cinema-hidden' : ''}`}>
        <div className="yt-related-list">
          {rLoading && <VideoGridSkeleton count={8} />}
          {!rLoading && rError && (
            <p style={{ color: 'var(--yt-text-secondary)', fontSize: 13, padding: '12px 0' }}>Could not load recommendations.</p>
          )}
          {!rLoading && !rError && relatedVideos.length === 0 && (
            <p style={{ color: 'var(--yt-text-secondary)', fontSize: 13, padding: '12px 0' }}>No recommendations found.</p>
          )}
          {!rLoading && relatedVideos.map(v => <RelatedVideoCard key={v.id} video={v} />)}
        </div>
      </div>
    </div>
  );
}

function RelatedVideoCard({ video }) {
  const navigate = useNavigate();
  function formatViews(views) {
    if (!views) return '';
    const str = String(views).replace(/[^0-9]/g, '');
    const n = parseInt(str, 10);
    if (isNaN(n)) return views;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M views';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K views';
    return n + ' views';
  }
  return (
    <div className="yt-related-card" onClick={() => navigate(`/video/${video.id}`)}>
      <div className="yt-related-thumb-wrap">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} loading="lazy" className="yt-related-thumb" />
        ) : <div className="yt-related-thumb-placeholder" />}
        {video.duration && <span className="yt-video-duration">{video.duration}</span>}
      </div>
      <div className="yt-related-info">
        <div className="yt-related-title">{video.title}</div>
        <div className="yt-related-channel">{video.author}</div>
        <div className="yt-related-stats">
          {formatViews(video.views)}{video.views && video.publishedAt ? ' • ' : ''}{video.publishedAt || ''}
        </div>
      </div>
    </div>
  );
}

function formatMs(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ThumbUpIcon({ filled }) {
  return filled ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" /></svg>
  );
}
function ThumbDownIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ transform: 'rotate(180deg)' }}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" /></svg>; }
function ShareIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>; }
function WatchLaterIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23 3H1v18h22V3zm-2 16H3V5h18v14zm-7-9h-2V7h-2v5h4v-2z" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>; }
function MoreHorizIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>; }
function BellIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>; }
function TranscriptIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z" /></svg>; }
function SortIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" /></svg>; }
function CinemaModeIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" /></svg>
  );
}
function PopOutIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1zm1-8H4c-1.1 0-2 .9-2 2v4c0 .55.45 1 1 1s1-.45 1-1V6h16v12H5v-1c0-.55-.45-1-1-1s-1 .45-1 1v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" /></svg>; }
function GearIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></svg>; }
function VolumeUpIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>; }
function VolumeDownIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>; }
function VolumeMuteIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>; }
function SubtitleIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" /></svg>; }
function QualityIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H8V7h2v10zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>; }
function SpeedIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.27-8.1-8.1 5.27a2 2 0 0 0 0 2.83z" /></svg>; }
function LoopIcon() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>; }
function SpinnerIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" /></svg>; }
