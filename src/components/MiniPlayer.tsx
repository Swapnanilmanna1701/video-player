import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { usePlayer } from '../store/playerStore';
import { formatTime } from '../data/videos';

export default function MiniPlayer() {
  const { currentVideo, isPlaying, currentTime, duration, maximizePlayer, closePlayer, togglePlayPause } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentVideo) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -50 && info.velocity.y < -100) maximizePlayer();
    if (info.offset.y > 50 && info.velocity.y > 100) closePlayer();
  };

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
    >
      {/* Centered container for desktop */}
      <div className="max-w-5xl mx-auto">
        {/* Thin red progress bar */}
        <div className="h-[2px] bg-yt-border/50">
          <div
            className="h-full bg-yt-red transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mini player content */}
        <div className="flex items-center h-[64px] bg-yt-dark border-t border-yt-border/30">
          {/* Thumbnail */}
          <button
            onClick={maximizePlayer}
            className="relative w-[112px] sm:w-[120px] h-[64px] flex-shrink-0 bg-black"
          >
            <img
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Video info */}
          <button onClick={maximizePlayer} className="flex-1 min-w-0 px-3 text-left">
            <p className="text-[13px] font-medium text-yt-text line-clamp-1 leading-tight">
              {currentVideo.title}
            </p>
            <p className="text-[11px] text-yt-text-muted mt-0.5 line-clamp-1">
              {currentVideo.categoryName}
            </p>
            {/* Time — visible on sm+ */}
            <p className="hidden sm:block text-[10px] text-yt-text-muted mt-0.5 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </button>

          {/* Controls */}
          <div className="flex items-center flex-shrink-0 pr-1 sm:pr-2 gap-0.5">
            {/* Play/Pause */}
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-yt-hover transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-yt-text" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yt-text" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next — hidden on smallest screens */}
            <button
              onClick={(e) => { e.stopPropagation(); maximizePlayer(); }}
              className="hidden sm:flex w-11 h-11 items-center justify-center rounded-full hover:bg-yt-hover transition-colors"
            >
              <svg className="w-5 h-5 text-yt-text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); closePlayer(); }}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-yt-hover transition-colors"
            >
              <svg className="w-5 h-5 text-yt-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
