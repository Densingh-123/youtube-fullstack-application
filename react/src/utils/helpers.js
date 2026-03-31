export function getSeconds(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  if (String(str).toLowerCase() === 'short') return 59;
  const parts = String(str).split(':').map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  return parts[0] || 0;
}

export function isLongVideo(video) {
  // We want to force videos in standard grids to be > 60s
  if (video.isShort) return false;
  return getSeconds(video.duration) >= 61;
}
