import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePlayer } from '../store/playerStore';
import { formatTime } from '../data/videos';

export default function PipPlayer() {
  const {
    currentVideo, isPlaying, videoRef, currentTime, duration,
    exitPip, closePlayer, togglePlayPause,
  } = usePlayer();

  const pipContainerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Move the shared <video> element into the PiP container
  useEffect(() => {
    const vid = videoRef.current;
    const container = pipContainerRef.current;
    if (!vid || !container) return;

    vid.className = 'w-full h-full object-contain bg-black';
    vid.style.display = 'block';
    container.appendChild(vid);

    return () => {
      vid.className = 'hidden';
      vid.style.display = '';
      document.getElementById('root')?.querySelector('.bg-yt-black')?.appendChild(vid);
    };
  }, [videoRef]);

  // Auto-hide controls after hover
  const handleMouseEnter = () => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    controlsTimeout.current = setTimeout(() => setShowControls(false), 1500);
  };

  const handleTap = () => {
    setShowControls((prev) => !prev);
    if (!showControls) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleClose = () => {
    const vid = videoRef.current;
    if (vid) {
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    closePlayer();
  };

  if (!currentVideo) return null;

  return (
    <motion.div
      className="fixed z-[70] shadow-2xl shadow-black/60 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        // Bottom-right corner with padding
        bottom: 24,
        right: 24,
        // Responsive: 280px on mobile, 360px on desktop
        width: 'clamp(260px, 30vw, 380px)',
      }}
      initial={{ opacity: 0, scale: 0.6, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 60 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        top: -(window.innerHeight - 200),
        left: -(window.innerWidth - 200),
        right: 0,
        bottom: 0,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video container */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        <div ref={pipContainerRef} className="absolute inset-0 bg-black" />

        {/* Controls overlay */}
        <motion.div
          className="absolute inset-0 z-10"
          initial={false}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleTap}
          style={{ pointerEvents: showControls ? 'auto' : 'auto' }}
        >
          {/* Gradient overlays */}
          {showControls && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          )}

          {showControls && (
            <>
              {/* Top-right: Expand + Close */}
              <div className="absolute top-1 right-1 flex items-center gap-0.5 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Expand back to full player */}
                <button
                  onClick={exitPip}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  title="Expand"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
                {/* Close */}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  title="Close"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Center: Play / Pause */}
              <div className="absolute inset-0 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Bottom: Time */}
              <div className="absolute bottom-1 left-2 z-20 pointer-events-none">
                <span className="text-[10px] text-white/80 font-medium tabular-nums drop-shadow">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </>
          )}
        </motion.div>

        {/* Progress bar — always visible */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-20">
          <div className="h-full bg-yt-red transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="bg-yt-dark px-2.5 py-2 flex items-center gap-2 border-t border-yt-border/30">
        <button onClick={exitPip} className="flex-1 min-w-0 text-left">
          <p className="text-[11px] sm:text-xs font-medium text-yt-text line-clamp-1 leading-tight">
            {currentVideo.title}
          </p>
          <p className="text-[10px] text-yt-text-muted line-clamp-1 mt-0.5">
            {currentVideo.categoryName}
          </p>
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yt-hover transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-yt-text" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yt-text" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yt-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-yt-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
