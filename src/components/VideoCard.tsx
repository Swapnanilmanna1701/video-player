import { useState, memo } from 'react';
import type { Video } from '../types';
import { usePlayer } from '../store/playerStore';

interface VideoCardProps {
  video: Video;
  index: number;
  compact?: boolean;
  isActive?: boolean;
}

function VideoCard({ video, compact = false, isActive = false }: VideoCardProps) {
  const { playVideo } = usePlayer();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    playVideo(video);
  };

  const viewCount = getViewCount(video.slug);
  const timeAgo = getTimeAgo(video.slug);

  /* ─── Compact variant (related videos in player sidebar) ─── */
  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`w-full flex gap-2 p-1.5 rounded-lg text-left group transition-colors ${
          isActive ? 'bg-yt-hover' : 'hover:bg-yt-hover'
        }`}
      >
        {/* Thumbnail — responsive width */}
        <div className="relative w-[140px] sm:w-[168px] aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-yt-card">
          {!imageError ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-yt-card">
              <svg className="w-8 h-8 text-yt-text-muted" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-1 right-1">
            <span className="text-[11px] font-medium bg-black/80 text-white px-1 py-0.5 rounded">
              {video.duration || '0:00'}
            </span>
          </div>
          {isActive && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex gap-[3px] items-end h-5">
                <div className="w-[3px] bg-white rounded-full animate-bar1" style={{ height: 6 }} />
                <div className="w-[3px] bg-white rounded-full animate-bar2" style={{ height: 12 }} />
                <div className="w-[3px] bg-white rounded-full animate-bar3" style={{ height: 8 }} />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[13px] font-medium leading-snug line-clamp-2 text-yt-text">
            {video.title}
          </p>
          <p className="text-[11px] text-yt-text-muted mt-1 leading-tight">
            {video.categoryName}
          </p>
          <p className="text-[11px] text-yt-text-muted leading-tight">
            {viewCount} views &middot; {timeAgo}
          </p>
        </div>
      </button>
    );
  }

  /* ─── Full card (YouTube grid — mobile + desktop) ─── */
  return (
    <button onClick={handleClick} className="w-full text-left group">
      {/* Thumbnail — edge-to-edge on mobile, rounded on sm+ */}
      <div className="relative w-full aspect-video bg-yt-card overflow-hidden sm:rounded-xl">
        {!imageError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-yt-card">
            <svg className="w-12 h-12 text-yt-text-muted" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Shimmer skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-yt-card via-yt-hover to-yt-card animate-shimmer" />
        )}

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
          <span className="text-[11px] sm:text-[12px] font-medium bg-black/80 text-white px-1 py-0.5 rounded">
            {video.duration || '0:00'}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Video info row */}
      <div className="flex gap-3 px-3 sm:px-0 pt-2.5 sm:pt-3 pb-1">
        {/* Channel avatar */}
        <div className="w-9 h-9 rounded-full bg-yt-chip flex-shrink-0 flex items-center justify-center overflow-hidden">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-medium text-yt-text-muted">
              {video.categoryName.charAt(0)}
            </span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yt-text leading-snug line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-yt-text-muted mt-1 leading-tight">
            {video.categoryName}
          </p>
          <p className="text-xs text-yt-text-muted leading-tight">
            {viewCount} views &middot; {timeAgo}
          </p>
        </div>

        {/* Three-dot menu */}
        <button
          className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5 text-yt-text-secondary" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
    </button>
  );
}

// Deterministic pseudo-random values from slug hash
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getViewCount(slug: string): string {
  const h = hashCode(slug);
  const num = (h % 900) + 100;
  return `${num}K`;
}

function getTimeAgo(slug: string): string {
  const h = hashCode(slug);
  const units = ['hours', 'days', 'weeks', 'months'];
  const unit = units[h % units.length];
  const num = (h % 11) + 1;
  return `${num} ${unit} ago`;
}

export default memo(VideoCard);
