import { useState } from 'react';

export default function CommentCard({ comment }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const initial = (comment.authorName || 'U')[0].toUpperCase();

  function formatTime(str) {
    if (!str) return '';
    // If it's something like "2 days ago", just use it
    if (str.includes('ago')) return str;
    return str;
  }

  return (
    <div className="yt-comment-card">
      <div className="yt-comment-avatar">
        {comment.authorThumbnail ? (
          <img src={comment.authorThumbnail} alt={comment.authorName} loading="lazy" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="yt-comment-content" style={{ flex: 1 }}>
        <div className="yt-comment-author">
          <span>{comment.authorName}</span>
          <span className="yt-comment-time">{formatTime(comment.publishedTimeText)}</span>
        </div>
        
        <div className="yt-comment-text">
          {comment.content}
        </div>

        <div className="yt-comment-actions-bar">
          <button 
            className="yt-icon-btn" 
            style={{ width: 32, height: 32 }}
            onClick={() => { setLiked(!liked); setDisliked(false); }}
          >
            {liked ? <LikeFilled /> : <LikeOutline />}
          </button>
          <span style={{ fontSize: 12, color: 'var(--yt-text-secondary)', marginRight: 8, marginLeft: -4 }}>
            {liked ? (parseInt(comment.likeCount || 0) + 1) : (comment.likeCount || '')}
          </span>
          
          <button 
            className="yt-icon-btn" 
            style={{ width: 32, height: 32 }}
            onClick={() => { setDisliked(!disliked); setLiked(false); }}
          >
            {disliked ? <DislikeFilled /> : <DislikeOutline />}
          </button>
          
          <button className="yt-icon-btn" style={{ width: 'auto', padding: '0 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, marginLeft: 8 }}>
            Reply
          </button>
        </div>
        
        {comment.replyCount > 0 && (
          <div style={{ marginTop: 8, color: 'var(--yt-blue)', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ marginRight: 8 }}><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
            {comment.replyCount} replies
          </div>
        )}
      </div>
      
      <button className="yt-icon-btn" style={{ alignSelf: 'flex-start', opacity: 0 }} className="more-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>
      <style>{`
        .yt-comment-card:hover .more-btn { opacity: 1; }
      `}</style>
    </div>
  );
}

function LikeOutline() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>; }
function LikeFilled() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>; }
function DislikeOutline() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ transform: 'rotate(180deg)' }}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>; }
function DislikeFilled() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ transform: 'rotate(180deg)' }}><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>; }
