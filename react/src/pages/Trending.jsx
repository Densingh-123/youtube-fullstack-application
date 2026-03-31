import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSpinner';

const TABS = [
  { key: 'default', label: 'Now', icon: <TrendingIcon /> },
  { key: 'music', label: 'Music', icon: <MusicIcon /> },
  { key: 'gaming', label: 'Gaming', icon: <GamingIcon /> },
  { key: 'news', label: 'News', icon: <NewsIcon /> },
  { key: 'films', label: 'Films', icon: <FilmIcon /> },
  { key: 'live', label: 'Live', icon: <LiveIcon /> },
  { key: 'sports', label: 'Sports', icon: <SportIcon /> },
];

import { isLongVideo } from '../utils/helpers';
import ShortsShelf from '../components/ShortsShelf';

export default function Trending() {
  const [activeTab, setActiveTab] = useState('default');
  const { data, loading, error } = useApi(`/api/trending?type=${activeTab}`);
  const { data: shortsData } = useApi(`/api/shorts`);
  
  const rawVideos = data?.videos || [];
  const videos = rawVideos.filter(isLongVideo);
  const shorts = shortsData?.shorts || [];

  return (
    <div className="yt-page">
      <div className="yt-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex' }}><TrendingIcon size={32} /></span>
          <h1 className="yt-page-title">Trending</h1>
        </div>
      </div>

      <div className="yt-category-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`yt-category-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            id={`trending-tab-${tab.key}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <CategoryVideoList loading={loading} error={error} videos={videos} shorts={shorts} />
    </div>
  );
}

export function CategoryVideoList({ loading, error, videos, shorts = [] }) {
  if (loading) return <div style={{ padding: '0 24px' }}><VideoGridSkeleton count={12} /></div>;
  if (error) return <div style={{ padding: 24, color: 'var(--yt-red)' }}>{error}</div>;
  if (!videos.length) return (
    <div className="yt-page-empty" style={{ paddingTop: 40 }}>
      <div className="yt-page-empty-icon">📭</div>
      <p>No videos found</p>
    </div>
  );
  const firstHalf = videos.slice(0, 10);
  const secondHalf = videos.slice(10);
  const displayShorts = shorts.slice(0, 16);

  return (
    <div style={{ padding: '0 0 24px' }}>
      {firstHalf.map((video, i) => (
        <div key={`t1-${video.id}`} className="yt-trending-item">
          <div className="yt-trending-rank">{i + 1}</div>
          <VideoCard video={video} layout="list" />
        </div>
      ))}
      
      {displayShorts.length > 0 && (
         <div style={{ marginTop: 24, marginBottom: 24 }}>
           <ShortsShelf shorts={displayShorts} />
         </div>
      )}

      {secondHalf.map((video, i) => (
        <div key={`t2-${video.id}`} className="yt-trending-item">
          <div className="yt-trending-rank">{i + 11}</div>
          <VideoCard video={video} layout="list" />
        </div>
      ))}
    </div>
  );
}

function TrendingIcon({ size = 24 }) { return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>; }
function MusicIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>; }
function GamingIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5S16.33 15 15.5 15zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5S19.33 12 18.5 12z"/></svg>; }
function NewsIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>; }
function FilmIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>; }
function LiveIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1 7l2 2c2.76-2.76 6.57-4 10.02-4 3.84 0 7.57 1.46 10.34 4.34l1.94-2.16C21.97 3.97 17.51 2 13.01 2 9.1 2 4.98 3.51 1 7zm10 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-4.01 0c0-3.32 2.69-6.01 6.01-6.01S18.99 8.68 18.99 12 16.3 18.01 12.98 18.01 6.99 15.32 6.99 12z"/></svg>; }
function SportIcon() { return <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>; }
