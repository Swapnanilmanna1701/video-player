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

  // Move the hidden video into our visible container
  useEffect(() => {
    const vid = videoRef.current;
    const container = videoContainerRef.current;
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

  // Auto-hide controls
  useEffect(() => {
    if (showControls && !isSeeking) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isSeeking]);

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
      if (next) startAutoplayCountdown(next);
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
    if (!isDragging) setShowControls((prev) => !prev);
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
    if (info.offset.y > 100 && info.velocity.y > 20) minimizePlayer();
  };

  const handleDragStart = () => setIsDragging(true);

  if (!currentVideo) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-yt-black flex flex-col"
      initial={{ y: '100%', opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* ── Video Area (16:9 at top) ── */}
      <motion.div
        className="relative w-full bg-black flex-shrink-0"
        style={{ aspectRatio: '16/9', maxHeight: '35vh' }}
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
              transition={{ duration: 0.2 }}
              onClick={handleTap}
            >
              {/* Gradient scrims */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
              </div>

              {/* ─ Top bar ─ */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-2 pt-2 z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); minimizePlayer(); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-[13px] font-medium text-white line-clamp-1 drop-shadow">
                    {currentVideo.title}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ─ Center controls ─ */}
              <div className="absolute inset-0 flex items-center justify-center gap-14 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Skip backward */}
                <button onClick={() => handleSkip('backward')} className="w-12 h-12 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button onClick={togglePlayPause} className="w-16 h-16 flex items-center justify-center">
                  {isPlaying ? (
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Skip forward */}
                <button onClick={() => handleSkip('forward')} className="w-12 h-12 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                  </svg>
                </button>
              </div>

              {/* ─ Bottom: YouTube-style progress bar ─ */}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Seekable progress bar */}
                <div className="relative h-7 flex items-end group/seek">
                  {/* Track */}
                  <div className="absolute left-0 right-0 bottom-2 h-[3px] group-hover/seek:h-1 rounded-full bg-white/30 transition-all duration-150 overflow-hidden">
                    {/* Buffered */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-white/40 rounded-full"
                      style={{ width: `${bufferedProgress}%` }}
                    />
                    {/* Played — YouTube red */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-yt-red rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Range input */}
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
                  {/* Seek thumb — red circle */}
                  <div
                    className="absolute bottom-[5px] w-3 h-3 rounded-full bg-yt-red opacity-0 group-hover/seek:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>

                {/* Time display */}
                <div className="flex items-center justify-between px-0.5 pb-0.5">
                  <span className="text-[11px] text-white/80 font-medium tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[11px] text-white/50 font-medium tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always-visible thin progress bar when controls hidden */}
        {!showControls && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-10">
            <div className="h-full bg-yt-red" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Skip feedback */}
        <AnimatePresence>
          {skipFeedback && (
            <motion.div
              key={skipFeedback + Date.now()}
              className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none ${
                skipFeedback === 'forward' ? 'right-8' : 'left-8'
              }`}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {skipFeedback === 'forward' ? '+10' : '-10'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-tap skip zones */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-[5]" onDoubleClick={() => handleSkip('backward')} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-[5]" onDoubleClick={() => handleSkip('forward')} />

        {/* Autoplay countdown */}
        <AnimatePresence>
          {showAutoplayCountdown && nextVideo && (
            <motion.div
              className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Up Next in {autoplayCountdown}</p>
              <div className="flex gap-3 items-center bg-yt-card rounded-lg p-3 mx-6 mb-4">
                <img src={nextVideo.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{nextVideo.title}</p>
                  <p className="text-yt-text-muted text-[11px] mt-0.5">{nextVideo.categoryName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelAutoplay}
                  className="px-5 py-2 bg-yt-chip text-white rounded-full text-sm font-medium hover:bg-yt-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { cancelAutoplay(); playVideo(nextVideo); }}
                  className="px-5 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-yt-red-hover transition-colors"
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

      {/* ── Scrollable Info + Related Videos (YouTube style below video) ── */}
      <div className="flex-1 overflow-y-auto bg-yt-black overscroll-contain">
        {/* Video info section */}
        <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-yt-border/50">
          <h1 className="text-base font-medium text-yt-text leading-snug line-clamp-2">
            {currentVideo.title}
          </h1>
          <p className="text-xs text-yt-text-muted mt-1.5">
            {currentVideo.categoryName}
          </p>

          {/* Action buttons row */}
          <div className="flex items-center gap-4 mt-3 pb-1 overflow-x-auto no-scrollbar">
            <ActionButton icon="like" label="Like" />
            <ActionButton icon="dislike" label="Dislike" />
            <ActionButton icon="share" label="Share" />
            <ActionButton icon="download" label="Download" />
            <ActionButton icon="save" label="Save" />
          </div>
        </div>

        {/* Channel row */}
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-yt-border/50">
          <div className="w-10 h-10 rounded-full bg-yt-chip flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={currentVideo.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yt-text">{currentVideo.categoryName}</p>
            <p className="text-xs text-yt-text-muted">AI Content</p>
          </div>
          <button className="px-4 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-yt-red-hover transition-colors flex-shrink-0">
            Subscribe
          </button>
        </div>

        {/* Next up / autoplay */}
        {nextVideo && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-yt-border/50">
            <p className="text-sm font-medium text-yt-text">Up next</p>
            <button
              onClick={() => playVideo(nextVideo)}
              className="text-xs text-yt-text-muted hover:text-yt-text transition-colors"
            >
              Autoplay
            </button>
          </div>
        )}

        {/* Related videos */}
        <div className="pb-4">
          {relatedVideos.map((video, idx) => (
            <div key={video.slug} className="px-2 sm:px-3">
              <VideoCard video={video} index={idx} compact isActive={video.slug === currentVideo?.slug} />
            </div>
          ))}
          {relatedVideos.length === 0 && (
            <div className="flex items-center justify-center py-12 text-yt-text-muted">
              <p className="text-sm">No related videos</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Action Button Component ── */
function ActionButton({ icon, label }: { icon: string; label: string }) {
  const iconPath: Record<string, JSX.Element> = {
    like: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48a4.53 4.53 0 01-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.228.22.442.396.632a2.25 2.25 0 002.808.393l.073-.037M5.904 18.75c-.53-1.402-2.083-2.375-3.654-2.375h-.25A.75.75 0 011.25 15.6V9.574c0-.372.272-.694.64-.75a2.25 2.25 0 002.014-2.213V6a.75.75 0 01.75-.75h.5" />
      </svg>
    ),
    dislike: (
      <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48a4.53 4.53 0 01-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.228.22.442.396.632a2.25 2.25 0 002.808.393l.073-.037M5.904 18.75c-.53-1.402-2.083-2.375-3.654-2.375h-.25A.75.75 0 011.25 15.6V9.574c0-.372.272-.694.64-.75a2.25 2.25 0 002.014-2.213V6a.75.75 0 01.75-.75h.5" />
      </svg>
    ),
    share: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    download: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    save: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
  };

  return (
    <button className="flex flex-col items-center gap-1.5 min-w-[56px] flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-yt-card flex items-center justify-center text-yt-text hover:bg-yt-hover transition-colors">
        {iconPath[icon]}
      </div>
      <span className="text-[10px] text-yt-text-secondary font-medium">{label}</span>
    </button>
  );
}
