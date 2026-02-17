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
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-yt-black">
        <div className="max-w-[2200px] mx-auto flex items-center justify-between h-14 px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-6 bg-yt-red rounded-[4px] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-yt-text ml-1">
              Dino<span className="font-normal text-yt-text-secondary text-[10px] align-top ml-px">Player</span>
            </span>
          </div>

          {/* Center search bar — visible on md+ */}
          <div className="hidden md:flex items-center flex-1 max-w-[600px] mx-8">
            <div className="flex flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 h-10 px-4 rounded-l-full bg-yt-black border border-yt-border text-sm text-yt-text placeholder-yt-text-muted outline-none focus:border-blue-500 transition-colors"
              />
              <button className="w-16 h-10 bg-yt-card border border-l-0 border-yt-border rounded-r-full flex items-center justify-center hover:bg-yt-hover transition-colors">
                <svg className="w-5 h-5 text-yt-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Mobile search toggle — hidden on md+ */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden md:hidden"
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

            {/* Mobile search icon — hidden on md+ */}
            <button
              onClick={toggleSearch}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-yt-hover active:bg-yt-chip transition-colors"
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

            {/* Notifications */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-yt-hover active:bg-yt-chip transition-colors">
              <svg className="w-5 h-5 text-yt-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>

            {/* Profile avatar */}
            <button className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-medium text-white ml-0.5">
              D
            </button>
          </div>
        </div>

        {/* ── Filter Chips ── */}
        <div className="max-w-[2200px] mx-auto flex gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 pb-3 pt-0.5 overflow-x-auto no-scrollbar">
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
      <main className="max-w-[2200px] mx-auto">
        {/* Search results count */}
        {searchQuery.trim() && filteredVideos.length > 0 && (
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2">
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

        {/* Responsive video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-5 sm:gap-y-8 px-0 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pt-1">
          {filteredVideos.map((video, idx) => (
            <VideoCard key={video.slug} video={video} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}
