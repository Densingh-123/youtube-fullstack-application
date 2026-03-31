import { useApi } from '../hooks/useApi';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

export default function Music() {
  const { data, loading, error } = useApi('/api/trending?type=music');
  return <CategoryPage title="Music" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#1db954" />;
}

export function CategoryPage({ title, icon, loading, error, videos, accentColor = 'var(--yt-red)' }) {
  if (loading) return (
    <div className="yt-page">
      <div className="yt-page-header"><h1 className="yt-page-title">{icon} {title}</h1></div>
      <div style={{ padding: '0 24px' }}><VideoGridSkeleton count={12} /></div>
    </div>
  );
  if (error) return (
    <div className="yt-page">
      <div className="yt-page-header"><h1 className="yt-page-title">{icon} {title}</h1></div>
      <div style={{ padding: 24, color: 'var(--yt-red)' }}>{error}</div>
    </div>
  );
  return (
    <div className="yt-page">
      <div className="yt-category-hero" style={{ background: `linear-gradient(135deg, ${accentColor}22, transparent)` }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{icon}</div>
        <h1 className="yt-page-title">{title}</h1>
        <p style={{ color: 'var(--yt-text-secondary)', fontSize: 14, marginTop: 4 }}>
          Discover the best {title.toLowerCase()} content on YouTube
        </p>
      </div>
      <div className="yt-video-grid" style={{ padding: '24px' }}>
        {videos.map(v => <VideoCard key={v.id} video={v} />)}
      </div>
      {!videos.length && (
        <div className="yt-page-empty"><div className="yt-page-empty-icon">📭</div><p>No videos found</p></div>
      )}
    </div>
  );
}
