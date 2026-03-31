import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function YourVideos() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="yt-page-empty">
        <div className="yt-page-empty-icon"></div>
        <h2>Sign in to see your videos</h2>
        <p>Track your videos and channel activity.</p>
        <button className="yt-sign-in-btn" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="yt-page">
      <div className="yt-page-header">
        <h1 className="yt-page-title">Your videos</h1>
      </div>
      <div className="yt-page-empty" style={{ paddingTop: 40 }}>
        <div className="yt-page-empty-icon">📹</div>
        <h2>Upload your first video</h2>
        <p>Share your story with the world.</p>
        <button
          className="yt-sign-in-btn"
          style={{ marginTop: 16 }}
          onClick={() => alert('Video upload requires a full YouTube account. This is a YouTube Explorer app.')}
        >
          <UploadIcon />
          Upload video
        </button>
      </div>
    </div>
  );
}

function UploadIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>;
}
