import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { usePlayer } from '../store/playerStore';
import { getVideosByCategory, getNextVideo, formatTime } from '../data/videos';
import type { Video } from '../types';
import VideoCard from './VideoCard';

export default function VideoPlayer() {
  const {
    currentVideo, isPlaying, videoRef, currentTime, duration, buffered,
    minimizePlayer, closePlayer, playVideo, togglePlayPause, seekTo, skipForward, skipBackward,
  } = usePlayer();

  const [showControls, setShowControls] = useState(true);
  const [showRelatedList, setShowRelatedList] = useState(false);
  const [skipFeedback, setSkipFeedback] = useState<'forward' | 'backward' | null>(null);
  const [showAutoplayCountdown, setShowAutoplayCountdown] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(5);
  const [nextVideo, setNextVideo] = useState<Video | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const relatedVideos = currentVideo
    ? getVideosByCategory(currentVideo.categorySlug).filter((v) => v.slug !== currentVideo.slug)
    : [];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  // Auto-play: load video src and start playing when video changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentVideo) return;
    vid.src = currentVideo.mp4Url;
    vid.load();
    vid.play().catch(() => {});
  }, [currentVideo, videoRef]);

  // Move the hidden video into our visible container so it renders on screen
  useEffect(() => {
    const vid = videoRef.current;
    const container = videoContainerRef.current;
    if (!vid || !container) return;

    // Style and move the video into the player container
    vid.className = 'w-full h-full object-contain';
    vid.style.display = 'block';
    container.appendChild(vid);

    return () => {
      // Move back to hidden and hide
      vid.className = 'hidden';
      vid.style.display = '';
      document.getElementById('root')?.querySelector('.bg-dark-950')?.appendChild(vid);
    };
  }, [videoRef]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && !showRelatedList && !isSeeking) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, showRelatedList, isSeeking]);

  // Compute next video
  useEffect(() => {
    if (currentVideo) {
      setNextVideo(getNextVideo(currentVideo));
    }
  }, [currentVideo]);

  // Auto-play next video on end
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnded = () => {
      const next = currentVideo ? getNextVideo(currentVideo) : null;
      if (next) {
        startAutoplayCountdown(next);
      }
    };
    vid.addEventListener('ended', onEnded);
    return () => vid.removeEventListener('ended', onEnded);
  }, [currentVideo, videoRef]);

  const startAutoplayCountdown = useCallback((next?: Video | null) => {
    const targetVideo = next || nextVideo;
    if (!targetVideo) return;
    setShowAutoplayCountdown(true);
    setAutoplayCountdown(5);
    countdownRef.current = setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          playVideo(targetVideo);
          setShowAutoplayCountdown(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  }, [nextVideo, playVideo]);

  const cancelAutoplay = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowAutoplayCountdown(false);
    setAutoplayCountdown(5);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
  }, []);

  const handleTap = () => {
    if (!isDragging) {
      setShowControls((prev) => !prev);
    }
  };

  const handleSkip = (direction: 'forward' | 'backward') => {
    if (direction === 'forward') skipForward();
    else skipBackward();
    setSkipFeedback(direction);
    resetControlsTimer();
    setTimeout(() => setSkipFeedback(null), 700);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seekTo(newTime);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.y > 120 && info.velocity.y > 20) minimizePlayer();
  };

  const handleDragStart = () => setIsDragging(true);

  const toggleRelatedList = () => {
    setShowRelatedList((prev) => !prev);
    setShowControls(true);
  };

  if (!currentVideo) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ y: '100%', opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* ── Video Area ── */}
      <motion.div
        className="relative w-full bg-black"
        style={{ height: showRelatedList ? '35vh' : '100vh', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Native video element container */}
        <div ref={videoContainerRef} className="absolute inset-0 bg-black flex items-center justify-center" />

        {/* ── Controls Overlay ── */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleTap}
            >
              {/* Gradient scrim */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />
              </div>

              {/* ─ Top bar ─ */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 pt-[env(safe-area-inset-top,16px)] pb-4 z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); minimizePlayer(); }}
                  className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center hover:bg-white/15 transition-all duration-200 active:scale-90"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0 text-center">
                  <h2 className="text-sm font-bold text-white line-clamp-1 drop-shadow-lg">
                    {currentVideo.title}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow" />
                    <p className="text-[11px] text-white/50 font-medium">{currentVideo.categoryName}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                  className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center hover:bg-white/15 transition-all duration-200 active:scale-90"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ─ Center controls ─ */}
              <div className="absolute inset-0 flex items-center justify-center gap-16 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Skip backward -10s */}
                <button
                  onClick={() => handleSkip('backward')}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl glass-strong flex items-center justify-center hover:bg-white/15 transition-all active:scale-75 duration-200 group-active:shadow-accent">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-white/40 font-bold">-10s</span>
                </button>

                {/* Play / Pause toggle */}
                <button onClick={togglePlayPause} className="relative group">
                  <div className="w-[76px] h-[76px] rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/15 shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all group-hover:bg-white/15 group-active:scale-90">
                    {isPlaying ? (
                      <svg className="w-9 h-9 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-9 h-9 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="absolute -inset-2 rounded-full border border-white/[0.06] animate-pulse pointer-events-none" />
                </button>

                {/* Skip forward +10s */}
                <button
                  onClick={() => handleSkip('forward')}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl glass-strong flex items-center justify-center hover:bg-white/15 transition-all active:scale-75 duration-200 group-active:shadow-accent">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-white/40 font-bold">+10s</span>
                </button>
              </div>

              {/* ─ Bottom bar: seekable progress + time + action buttons ─ */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-[env(safe-area-inset-bottom,16px)] z-20" onClick={(e) => e.stopPropagation()}>
                {/* Progress bar area */}
                <div className="mb-3">
                  {/* Time row */}
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[11px] font-bold text-white/70 tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-[11px] font-bold text-white/40 tabular-nums">{formatTime(duration)}</span>
                  </div>

                  {/* Seekable progress bar */}
                  <div className="relative h-6 flex items-center group/seek">
                    {/* Track background */}
                    <div className="absolute left-0 right-0 h-1 group-hover/seek:h-1.5 rounded-full bg-white/10 transition-all duration-200 overflow-hidden">
                      {/* Buffered */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/15 rounded-full"
                        style={{ width: `${bufferedProgress}%` }}
                      />
                      {/* Played */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-accent to-accent-hover rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Range input (transparent, overlaid for interaction) */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      onChange={handleSeekChange}
                      onMouseDown={() => setIsSeeking(true)}
                      onMouseUp={() => setIsSeeking(false)}
                      onTouchStart={() => setIsSeeking(true)}
                      onTouchEnd={() => setIsSeeking(false)}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    />
                    {/* Seek thumb (visual) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,59,59,0.5)] opacity-0 group-hover/seek:opacity-100 scale-75 group-hover/seek:scale-100 transition-all duration-200 pointer-events-none"
                      style={{ left: `calc(${progress}% - 7px)` }}
                    />
                  </div>
                </div>

                {/* Action pills */}
                <div className="flex items-center justify-center gap-2.5 mb-4">
                  <button
                    onClick={toggleRelatedList}
                    className="flex items-center gap-2 text-xs font-semibold text-white/90 glass-strong px-5 py-2.5 rounded-xl hover:bg-white/15 transition-all active:scale-95 shadow-lg"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${showRelatedList ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    {showRelatedList ? 'Hide' : 'Related'}
                  </button>

                  {nextVideo && (
                    <button
                      onClick={() => startAutoplayCountdown()}
                      className="flex items-center gap-2 text-xs font-semibold text-white/90 bg-accent/20 border border-accent/20 backdrop-blur-xl px-5 py-2.5 rounded-xl hover:bg-accent/30 transition-all active:scale-95 shadow-lg"
                    >
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                      </svg>
                      <span className="text-accent">Next</span>
                    </button>
                  )}
                </div>

                {/* Drag handle */}
                <div className="flex justify-center">
                  <div className="w-12 h-1.5 bg-white/15 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Skip feedback ripples ── */}
        <AnimatePresence>
          {skipFeedback && (
            <motion.div
              key={skipFeedback + Date.now()}
              className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none ${
                skipFeedback === 'forward' ? 'right-12' : 'left-12'
              }`}
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="text-white font-extrabold text-sm drop-shadow-lg">
                  {skipFeedback === 'forward' ? '+10' : '-10'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-tap areas for skip */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-[5]" onDoubleClick={() => handleSkip('backward')} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-[5]" onDoubleClick={() => handleSkip('forward')} />

        {/* ── Autoplay countdown ── */}
        <AnimatePresence>
          {showAutoplayCountdown && nextVideo && (
            <motion.div
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Up Next</p>

              <div className="glass-strong rounded-2xl p-4 mx-8 mb-6 max-w-sm">
                <div className="flex gap-3 items-center">
                  <img src={nextVideo.thumbnailUrl} alt="" className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm line-clamp-2 leading-snug">{nextVideo.title}</p>
                    <p className="text-white/30 text-[11px] mt-1 font-medium">{nextVideo.categoryName}</p>
                  </div>
                </div>
              </div>

              <div className="relative mb-8">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" stroke="url(#countdownGrad)" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                  <defs>
                    <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff3b3b" />
                      <stop offset="100%" stopColor="#ff8c3b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-black text-white drop-shadow-lg">{autoplayCountdown}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelAutoplay}
                  className="px-7 py-3 glass-strong text-white rounded-xl text-sm font-semibold hover:bg-white/15 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { cancelAutoplay(); playVideo(nextVideo); }}
                  className="px-7 py-3 bg-gradient-to-r from-accent to-accent-hover text-white rounded-xl text-sm font-semibold shadow-accent hover:shadow-accent-lg transition-all active:scale-95"
                >
                  Play Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap area when controls hidden */}
        {!showControls && <div className="absolute inset-0 z-[5]" onClick={handleTap} />}
      </motion.div>

      {/* ── Related Videos Panel ── */}
      <AnimatePresence>
        {showRelatedList && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-dark-950 z-40 rounded-t-3xl overflow-hidden border-t border-white/[0.06]"
            style={{ height: '65vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-white/10 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-base font-bold text-white">Related Videos</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <p className="text-[11px] text-white/30 font-medium">
                    {currentVideo?.categoryName} &middot; {relatedVideos.length} videos
                  </p>
                </div>
              </div>
              <button
                onClick={toggleRelatedList}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
              >
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-3 py-2" style={{ height: 'calc(65vh - 78px)' }}>
              {relatedVideos.map((video, idx) => (
                <motion.div
                  key={video.slug}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                >
                  <VideoCard video={video} index={0} compact isActive={video.slug === currentVideo?.slug} />
                </motion.div>
              ))}
              {relatedVideos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-36 text-white/15">
                  <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm font-medium">No related videos</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
