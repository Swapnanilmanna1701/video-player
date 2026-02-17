import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { usePlayer } from '../store/playerStore';
import { getVideosByCategory, getNextVideo, formatTime } from '../data/videos';
import type { Video } from '../types';
import VideoCard from './VideoCard';

/* ── Per-video interaction state ── */
const videoInteractions: Record<string, {
  liked: boolean;
  disliked: boolean;
  saved: boolean;
  likeCount: number;
}> = {};

function getInteraction(slug: string) {
  if (!videoInteractions[slug]) {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
    }
    videoInteractions[slug] = {
      liked: false, disliked: false, saved: false,
      likeCount: (Math.abs(hash) % 9000) + 1000,
    };
  }
  return videoInteractions[slug];
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

interface Toast { id: number; message: string; }

export default function VideoPlayer() {
  const {
    currentVideo, isPlaying, videoRef, currentTime, duration, buffered,
    minimizePlayer, closePlayer, playVideo, togglePlayPause, seekTo, skipForward, skipBackward, enterPip,
  } = usePlayer();

  const [showControls, setShowControls] = useState(true);
  const [skipFeedback, setSkipFeedback] = useState<'forward' | 'backward' | null>(null);
  const [showAutoplayCountdown, setShowAutoplayCountdown] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(5);
  const [nextVideo, setNextVideo] = useState<Video | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [, forceUpdate] = useState(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);

  const relatedVideos = currentVideo
    ? getVideosByCategory(currentVideo.categorySlug).filter((v) => v.slug !== currentVideo.slug)
    : [];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;
  const interaction = currentVideo ? getInteraction(currentVideo.slug) : null;

  /* ── Toast ── */
  const showToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  /* ── Action handlers ── */
  const handleLike = useCallback(() => {
    if (!currentVideo) return;
    const s = getInteraction(currentVideo.slug);
    if (s.liked) { s.liked = false; s.likeCount--; showToast('Like removed'); }
    else { s.liked = true; s.likeCount++; if (s.disliked) s.disliked = false; showToast('Added to Liked videos'); }
    forceUpdate((n) => n + 1);
  }, [currentVideo, showToast]);

  const handleDislike = useCallback(() => {
    if (!currentVideo) return;
    const s = getInteraction(currentVideo.slug);
    if (s.disliked) { s.disliked = false; showToast('Dislike removed'); }
    else { s.disliked = true; if (s.liked) { s.liked = false; s.likeCount--; } showToast('Video disliked'); }
    forceUpdate((n) => n + 1);
  }, [currentVideo, showToast]);

  const handleShare = useCallback(async () => {
    if (!currentVideo) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: currentVideo.title, text: `Check out: ${currentVideo.title}`, url: window.location.href });
        showToast('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard');
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        try { await navigator.clipboard.writeText(window.location.href); showToast('Link copied to clipboard'); }
        catch { showToast('Could not share'); }
      }
    }
  }, [currentVideo, showToast]);

  const handleDownload = useCallback(async () => {
    if (!currentVideo) return;
    showToast('Starting download...');
    try {
      const res = await fetch(currentVideo.mp4Url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentVideo.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Download started');
    } catch { window.open(currentVideo.mp4Url, '_blank'); showToast('Opened video in new tab'); }
  }, [currentVideo, showToast]);

  const handleSave = useCallback(() => {
    if (!currentVideo) return;
    const s = getInteraction(currentVideo.slug);
    s.saved = !s.saved;
    showToast(s.saved ? 'Saved to Watch Later' : 'Removed from saved videos');
    forceUpdate((n) => n + 1);
  }, [currentVideo, showToast]);

  const handleClose = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowAutoplayCountdown(false); setAutoplayCountdown(5);
    closePlayer();
  }, [closePlayer]);

  // Auto-play on video change
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !currentVideo) return;
    vid.src = currentVideo.mp4Url; vid.load(); vid.play().catch(() => {});
  }, [currentVideo, videoRef]);

  // Move video element into container
  useEffect(() => {
    const vid = videoRef.current;
    const container = videoContainerRef.current;
    if (!vid || !container) return;
    vid.className = 'w-full h-full object-contain bg-black';
    vid.style.display = 'block';
    container.appendChild(vid);
    return () => {
      vid.className = 'hidden'; vid.style.display = '';
      document.getElementById('root')?.querySelector('.bg-yt-black')?.appendChild(vid);
    };
  }, [videoRef]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && !isSeeking) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls, isSeeking]);

  useEffect(() => { if (currentVideo) setNextVideo(getNextVideo(currentVideo)); }, [currentVideo]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onEnded = () => { const next = currentVideo ? getNextVideo(currentVideo) : null; if (next) startAutoplayCountdown(next); };
    vid.addEventListener('ended', onEnded);
    return () => vid.removeEventListener('ended', onEnded);
  }, [currentVideo, videoRef]);

  const startAutoplayCountdown = useCallback((next?: Video | null) => {
    const target = next || nextVideo;
    if (!target) return;
    setShowAutoplayCountdown(true); setAutoplayCountdown(5);
    countdownRef.current = setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); playVideo(target); setShowAutoplayCountdown(false); return 5; }
        return prev - 1;
      });
    }, 1000);
  }, [nextVideo, playVideo]);

  const cancelAutoplay = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowAutoplayCountdown(false); setAutoplayCountdown(5);
  }, []);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
  }, []);

  const handleTap = () => { if (!isDragging) setShowControls((p) => !p); };
  const handleSkip = (dir: 'forward' | 'backward') => {
    dir === 'forward' ? skipForward() : skipBackward();
    setSkipFeedback(dir); resetControlsTimer();
    setTimeout(() => setSkipFeedback(null), 700);
  };
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => seekTo((parseFloat(e.target.value) / 100) * duration);
  const handleDragEnd = (_: unknown, info: PanInfo) => { setIsDragging(false); if (info.offset.y > 100 && info.velocity.y > 20) minimizePlayer(); };
  const handleDragStart = () => setIsDragging(true);

  if (!currentVideo) return null;

  /* ── Shared video area (used in both mobile and desktop) ── */
  const videoArea = (
    <motion.div
      className="relative w-full h-full bg-black flex-shrink-0"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={videoContainerRef} className="absolute inset-0 bg-black flex items-center justify-center" />

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={handleTap}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 pt-2 sm:pt-3 z-20">
              {/* Back to home (PiP) */}
              <button onClick={(e) => { e.stopPropagation(); enterPip(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Back to home (Picture-in-Picture)">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {/* Minimize */}
              <button onClick={(e) => { e.stopPropagation(); minimizePlayer(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Minimize">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="flex-1 min-w-0 text-center">
                <p className="text-[13px] sm:text-sm font-medium text-white line-clamp-1 drop-shadow">{currentVideo.title}</p>
              </div>
              {/* PiP icon */}
              <button onClick={(e) => { e.stopPropagation(); enterPip(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Picture-in-Picture">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <rect x="11" y="9" width="9" height="6" rx="1" fill="currentColor" />
                </svg>
              </button>
              {/* Close */}
              <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Close">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Center controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-10 sm:gap-16 z-20" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleSkip('backward')} className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
              </button>
              <button onClick={togglePlayPause} className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                {isPlaying ? (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={() => handleSkip('forward')} className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
              </button>
            </div>

            {/* Bottom progress */}
            <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-4 pb-1.5 sm:pb-2 z-20" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-7 flex items-end group/seek">
                <div className="absolute left-0 right-0 bottom-2 h-[3px] group-hover/seek:h-1 rounded-full bg-white/30 transition-all duration-150 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-white/40 rounded-full" style={{ width: `${bufferedProgress}%` }} />
                  <div className="absolute left-0 top-0 bottom-0 bg-yt-red rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeekChange}
                  onMouseDown={() => setIsSeeking(true)} onMouseUp={() => setIsSeeking(false)}
                  onTouchStart={() => setIsSeeking(true)} onTouchEnd={() => setIsSeeking(false)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
                <div className="absolute bottom-[5px] w-3 h-3 rounded-full bg-yt-red opacity-0 group-hover/seek:opacity-100 transition-opacity duration-150 pointer-events-none"
                  style={{ left: `calc(${progress}% - 6px)` }} />
              </div>
              <div className="flex items-center justify-between px-0.5 pb-0.5">
                <span className="text-[11px] text-white/80 font-medium tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-[11px] text-white/50 font-medium tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thin progress when controls hidden */}
      {!showControls && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-10">
          <div className="h-full bg-yt-red" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Skip feedback */}
      <AnimatePresence>
        {skipFeedback && (
          <motion.div key={skipFeedback + Date.now()}
            className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none ${skipFeedback === 'forward' ? 'right-8' : 'left-8'}`}
            initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{skipFeedback === 'forward' ? '+10' : '-10'}</span>
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
          <motion.div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Up Next in {autoplayCountdown}</p>
            <div className="flex gap-3 items-center bg-yt-card rounded-lg p-3 mx-6 mb-4 max-w-sm">
              <img src={nextVideo.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{nextVideo.title}</p>
                <p className="text-yt-text-muted text-[11px] mt-0.5">{nextVideo.categoryName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelAutoplay} className="px-5 py-2 bg-yt-chip text-white rounded-full text-sm font-medium hover:bg-yt-hover transition-colors">Cancel</button>
              <button onClick={() => { cancelAutoplay(); playVideo(nextVideo); }} className="px-5 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-yt-red-hover transition-colors">Play Now</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showControls && <div className="absolute inset-0 z-[5]" onClick={handleTap} />}
    </motion.div>
  );

  /* ── Info section (shared) ── */
  const infoSection = (
    <>
      <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-yt-border/50">
        <h1 className="text-base sm:text-lg font-medium text-yt-text leading-snug line-clamp-2">{currentVideo.title}</h1>
        <p className="text-xs sm:text-sm text-yt-text-muted mt-1.5">{currentVideo.categoryName}</p>

        {/* Action buttons */}
        <div className="flex items-center gap-3 sm:gap-4 mt-3 pb-1 overflow-x-auto no-scrollbar">
          <ActionBtn active={interaction?.liked} onClick={handleLike} label={interaction ? formatCount(interaction.likeCount) : 'Like'}
            icon={<svg className="w-5 h-5" fill={interaction?.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={interaction?.liked ? 0 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.694 0-1.292.494-1.427 1.175A11.96 11.96 0 004.5 11.25c0 1.875.434 3.65 1.208 5.234.115.234.39.361.64.271l.59-.22c.326-.122.567-.418.612-.764A4.466 4.466 0 017.5 15z" /></svg>} />
          <ActionBtn active={interaction?.disliked} onClick={handleDislike} label="Dislike"
            icon={<svg className="w-5 h-5 rotate-180" fill={interaction?.disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={interaction?.disliked ? 0 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.694 0-1.292.494-1.427 1.175A11.96 11.96 0 004.5 11.25c0 1.875.434 3.65 1.208 5.234.115.234.39.361.64.271l.59-.22c.326-.122.567-.418.612-.764A4.466 4.466 0 017.5 15z" /></svg>} />
          <ActionBtn onClick={handleShare} label="Share"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>} />
          <ActionBtn onClick={handleDownload} label="Download"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>} />
          <ActionBtn active={interaction?.saved} onClick={handleSave} label={interaction?.saved ? 'Saved' : 'Save'}
            icon={<svg className="w-5 h-5" fill={interaction?.saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={interaction?.saved ? 0 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>} />
        </div>
      </div>

      {/* Channel */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-yt-border/50">
        <div className="w-10 h-10 rounded-full bg-yt-chip flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={currentVideo.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yt-text">{currentVideo.categoryName}</p>
          <p className="text-xs text-yt-text-muted">AI Content</p>
        </div>
        <button className="px-4 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-yt-red-hover transition-colors flex-shrink-0">Subscribe</button>
      </div>
    </>
  );

  /* ── Related videos list ── */
  const relatedList = (
    <div className="pb-4">
      {nextVideo && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-yt-border/50">
          <p className="text-sm font-medium text-yt-text">Up next</p>
          <button onClick={() => playVideo(nextVideo)} className="text-xs text-yt-text-muted hover:text-yt-text transition-colors">Autoplay</button>
        </div>
      )}
      {relatedVideos.map((video, idx) => (
        <div key={video.slug} className="px-2 sm:px-3">
          <VideoCard video={video} index={idx} compact isActive={video.slug === currentVideo?.slug} />
        </div>
      ))}
      {relatedVideos.length === 0 && (
        <div className="flex items-center justify-center py-12 text-yt-text-muted"><p className="text-sm">No related videos</p></div>
      )}
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-yt-black overflow-hidden"
      initial={{ y: '100%', opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* ── MOBILE LAYOUT (< lg) ── */}
      <div className="flex flex-col h-full lg:hidden">
        {/* Video — aspect 16:9, max 40vh on mobile */}
        <div className="flex-shrink-0 w-full" style={{ aspectRatio: '16/9', maxHeight: '40vh' }}>
          {videoArea}
        </div>
        {/* Scrollable info + related */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {infoSection}
          {relatedList}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (>= lg) ── */}
      <div className="hidden lg:flex h-full">
        {/* Left column: video + info */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Video — bigger on desktop */}
          <div className="flex-shrink-0 w-full" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
            {videoArea}
          </div>
          {/* Scrollable info below video */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {infoSection}
          </div>
        </div>

        {/* Right sidebar: related videos */}
        <div className="w-[400px] xl:w-[420px] flex-shrink-0 border-l border-yt-border/30 overflow-y-auto overscroll-contain">
          <div className="px-3 pt-3 pb-2">
            <h3 className="text-base font-medium text-yt-text">Related Videos</h3>
          </div>
          {relatedList}
        </div>
      </div>

      {/* ── Toasts ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id}
              className="px-4 py-2.5 bg-yt-chip-active text-yt-black text-sm font-medium rounded-lg shadow-lg pointer-events-auto"
              initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }} transition={{ duration: 0.2 }}>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Action Button ── */
function ActionBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 min-w-[56px] flex-shrink-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        active ? 'bg-yt-chip-active text-yt-black' : 'bg-yt-card text-yt-text hover:bg-yt-hover'
      }`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'text-yt-text' : 'text-yt-text-secondary'}`}>{label}</span>
    </button>
  );
}
