import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { usePlayer } from '../store/playerStore';

export default function MiniPlayer() {
  const { currentVideo, maximizePlayer, closePlayer } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentVideo) return null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -50 && info.velocity.y < -100) maximizePlayer();
    if (info.offset.y > 50 && info.velocity.y > 100) closePlayer();
  };

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[env(safe-area-inset-bottom,8px)]"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
    >
      <div className="relative rounded-2xl overflow-hidden bg-dark-800/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
        {/* Animated gradient progress bar */}
        <div className="h-[3px] bg-white/[0.04]">
          <motion.div
            className="h-full bg-gradient-to-r from-accent via-accent-hover to-accent rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 45, ease: 'linear' }}
          />
        </div>

        <div className="flex items-center h-[72px] px-3 gap-3.5">
          {/* Thumbnail with expand overlay */}
          <button
            onClick={maximizePlayer}
            className="relative w-[108px] h-[60px] flex-shrink-0 rounded-xl overflow-hidden bg-dark-700 group"
          >
            <img
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Expand icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </div>

            {/* Now-playing bars */}
            <div className="absolute bottom-1.5 left-1.5 flex gap-[3px] items-end h-4">
              <div className="w-[3px] bg-accent rounded-full animate-bar1" style={{ height: 6 }} />
              <div className="w-[3px] bg-accent rounded-full animate-bar2" style={{ height: 12 }} />
              <div className="w-[3px] bg-accent rounded-full animate-bar3" style={{ height: 8 }} />
            </div>

            {/* Accent border glow */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-accent/20" />
          </button>

          {/* Video info */}
          <button onClick={maximizePlayer} className="flex-1 min-w-0 text-left py-1">
            <p className="text-[13px] font-semibold text-white/90 line-clamp-1 leading-tight">
              {currentVideo.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <p className="text-[11px] text-white/30 font-medium line-clamp-1">{currentVideo.categoryName}</p>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Expand button */}
            <button
              onClick={maximizePlayer}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition-all active:scale-90"
            >
              <svg className="w-[18px] h-[18px] text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); closePlayer(); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition-all active:scale-90"
            >
              <svg className="w-[18px] h-[18px] text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom accent glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>
    </motion.div>
  );
}
