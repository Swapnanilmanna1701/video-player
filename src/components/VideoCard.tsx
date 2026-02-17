import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { Video } from '../types';
import { usePlayer } from '../store/playerStore';

interface VideoCardProps {
  video: Video;
  index: number;
  compact?: boolean;
  isActive?: boolean;
  categoryColor?: string;
}

function VideoCard({ video, index, compact = false, isActive = false, categoryColor }: VideoCardProps) {
  const { playVideo } = usePlayer();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    playVideo(video);
  };

  /* ─── Compact variant (for related videos panel) ─── */
  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`w-full flex gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group ${
          isActive
            ? 'bg-accent/10 border border-accent/20 shadow-[0_0_16px_rgba(255,59,59,0.08)]'
            : 'hover:bg-white/[0.04] active:bg-white/[0.07] border border-transparent'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative w-[120px] h-[68px] flex-shrink-0 rounded-lg overflow-hidden bg-dark-700">
          {!imageError ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-700">
              <svg className="w-6 h-6 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {isActive && (
            <div className="absolute inset-0 bg-accent/25 flex items-center justify-center">
              <div className="flex gap-[3px] items-end h-5">
                <div className="w-[3px] bg-white rounded-full animate-bar1" style={{ height: 6 }} />
                <div className="w-[3px] bg-white rounded-full animate-bar2" style={{ height: 12 }} />
                <div className="w-[3px] bg-white rounded-full animate-bar3" style={{ height: 8 }} />
              </div>
            </div>
          )}
          {/* Play icon overlay */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className={`text-[13px] font-semibold leading-snug line-clamp-2 transition-colors ${isActive ? 'text-accent' : 'text-white/90 group-hover:text-white'}`}>
            {video.title}
          </p>
          <p className="text-[11px] text-white/30 mt-1.5 font-medium">{video.categoryName}</p>
        </div>
      </button>
    );
  }

  /* ─── Full card variant (for homepage grid) ─── */
  return (
    <motion.button
      onClick={handleClick}
      className="group w-full text-left"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Card container with glass + shine */}
      <div className="card-shine rounded-2xl bg-dark-800/50 border border-white/[0.04] overflow-hidden transition-all duration-300 group-hover:border-white/[0.1] group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] group-hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-dark-700">
          {!imageError ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-700">
              <svg className="w-14 h-14 text-white/10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Shimmer skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-dark-700 via-dark-600 to-dark-700 animate-shimmer" />
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Play button - center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-accent-lg">
              <svg className="w-6 h-6 text-white ml-0.5 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Category badge - top left */}
          <div className="absolute top-3 left-3 z-[2]">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gradient-to-r ${categoryColor || 'from-accent to-amber'} text-white shadow-lg`}>
              {video.categoryName}
            </span>
          </div>

          {/* Duration badge - bottom right */}
          <div className="absolute bottom-3 right-3 z-[2]">
            <span className="text-[11px] font-bold bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md tracking-wide">
              {video.duration || 'VIDEO'}
            </span>
          </div>

          {/* Watch indicator - bottom left */}
          <div className="absolute bottom-3 left-3 z-[2] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] text-white/70 font-semibold">Watch now</span>
          </div>
        </div>

        {/* Info section */}
        <div className="p-3.5 pb-4">
          <h3 className="text-[14px] font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
            {video.title}
          </h3>
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-[11px] text-white/25 font-medium">{video.categoryName}</p>
            {/* Accent dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition-colors duration-200" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default memo(VideoCard);
