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

  // Generate consistent pseudo-random views/time for each video
  const viewCount = useMemoViewCount(video.slug);
  const timeAgo = useMemoTimeAgo(video.slug);

  /* ─── Compact variant (related videos in player) ─── */
  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`w-full flex gap-2 p-1.5 rounded-lg text-left group transition-colors ${
          isActive ? 'bg-yt-hover' : 'hover:bg-yt-hover'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative w-[168px] h-[94px] flex-shrink-0 rounded-lg overflow-hidden bg-yt-card">
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
          {/* Duration badge */}
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
          <p className={`text-[13px] font-medium leading-snug line-clamp-2 ${
            isActive ? 'text-yt-text' : 'text-yt-text'
          }`}>
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

  /* ─── Full card (YouTube mobile home feed) ─── */
  return (
    <button onClick={handleClick} className="w-full text-left group mb-3 sm:mb-4">
      {/* Edge-to-edge thumbnail */}
      <div className="relative w-full aspect-video bg-yt-card overflow-hidden">
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
        <div className="absolute bottom-2 right-2">
          <span className="text-[12px] font-medium bg-black/80 text-white px-1 py-0.5 rounded">
            {video.duration || '0:00'}
          </span>
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Video info row */}
      <div className="flex gap-3 px-3 sm:px-4 pt-3 pb-1">
        {/* Channel avatar */}
        <div className="w-9 h-9 rounded-full bg-yt-chip flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
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
            {video.categoryName} &middot; {viewCount} views &middot; {timeAgo}
          </p>
        </div>

        {/* Three-dot menu */}
        <button
          className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5"
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

// Pseudo-random but deterministic values based on slug hash
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function useMemoViewCount(slug: string): string {
  const h = hashCode(slug);
  const num = (h % 900) + 100; // 100-999
  const suffix = h % 3 === 0 ? 'K' : h % 3 === 1 ? 'K' : 'K';
  return `${num}${suffix}`;
}

function useMemoTimeAgo(slug: string): string {
  const h = hashCode(slug);
  const units = ['hours', 'days', 'weeks', 'months'];
  const unit = units[h % units.length];
  const num = (h % 11) + 1;
  return `${num} ${unit} ago`;
}

export default memo(VideoCard);
