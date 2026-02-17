import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCategories, getAllVideos } from '../data/videos';
import { usePlayer } from '../store/playerStore';
import VideoCard from './VideoCard';
import type { CategoryGroup } from '../types';

export default function HomePage() {
  const { isMinimized } = usePlayer();
  const categories = useMemo(() => getCategories(), []);
  const allVideos = useMemo(() => getAllVideos(), []);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  // Flatten all videos, apply category + search filters
  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let videos = activeFilter
      ? allVideos.filter((v) => v.categorySlug === activeFilter)
      : allVideos;
    if (query) {
      videos = videos.filter((v) => v.title.toLowerCase().includes(query));
    }
    return videos;
  }, [allVideos, activeFilter, searchQuery]);

  return (
    <div
      className="h-full w-full overflow-y-auto scroll-smooth bg-yt-black"
      style={{ paddingBottom: isMinimized ? '68px' : '0' }}
    >
      {/* ── YouTube-style Header ── */}
      <header className="sticky top-0 z-30 bg-yt-black">
        <div className="flex items-center justify-between h-12 px-3 sm:px-4">
          {/* Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-7 h-5 bg-yt-red rounded-[3px] flex items-center justify-center mr-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-[18px] font-bold tracking-tight text-yt-text ml-0.5">
                Dino<span className="font-normal text-yt-text-secondary text-[10px] align-top ml-px">Player</span>
              </span>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full h-8 px-3 rounded-full bg-yt-card border border-yt-border text-sm text-yt-text placeholder-yt-text-muted outline-none focus:border-blue-500 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search icon */}
            <button
              onClick={toggleSearch}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-yt-hover active:bg-yt-chip transition-colors"
            >
              {isSearchOpen ? (
                <svg className="w-5 h-5 text-yt-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yt-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>

            {/* Notifications icon */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-yt-hover active:bg-yt-chip transition-colors">
              <svg className="w-5 h-5 text-yt-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>

            {/* Profile avatar */}
            <button className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-medium text-white ml-1">
              D
            </button>
          </div>
        </div>

        {/* ── Filter Chips ── */}
        <div className="flex gap-2 px-3 sm:px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              activeFilter === null
                ? 'bg-yt-chip-active text-yt-black'
                : 'bg-yt-chip text-yt-text hover:bg-yt-hover'
            }`}
          >
            All
          </button>
          {categories.map((g) => (
            <button
              key={g.category.slug}
              onClick={() => setActiveFilter(activeFilter === g.category.slug ? null : g.category.slug)}
              className={`flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === g.category.slug
                  ? 'bg-yt-chip-active text-yt-black'
                  : 'bg-yt-chip text-yt-text hover:bg-yt-hover'
              }`}
            >
              {g.category.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Video Feed ── */}
      <main>
        {/* Search results count */}
        {searchQuery.trim() && filteredVideos.length > 0 && (
          <div className="px-3 sm:px-4 py-2">
            <p className="text-xs text-yt-text-muted">
              {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''} for "{searchQuery.trim()}"
            </p>
          </div>
        )}

        {/* No results */}
        {filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg className="w-14 h-14 text-yt-text-muted mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-yt-text-secondary text-sm font-medium mb-1">No results found</p>
            <p className="text-yt-text-muted text-xs">
              {searchQuery.trim()
                ? `Try different keywords`
                : 'No videos in this category'}
            </p>
          </div>
        )}

        {/* Video list — single column feed like YouTube mobile */}
        <div className="flex flex-col">
          {filteredVideos.map((video, idx) => (
            <VideoCard key={video.slug} video={video} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}
