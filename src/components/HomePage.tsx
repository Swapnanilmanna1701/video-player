import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, getAllVideos } from '../data/videos';
import { usePlayer } from '../store/playerStore';
import VideoCard from './VideoCard';
import type { CategoryGroup } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  'social-media-ai': 'from-purple to-blue',
  'ai-income':       'from-emerald to-blue',
  'ai-essentials':   'from-amber to-accent',
};

export default function HomePage() {
  const { isMinimized } = usePlayer();
  const categories = useMemo(() => getCategories(), []);
  const totalVideos = useMemo(() => getAllVideos().length, []);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (prev) {
        // Closing search — clear query
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  // Filter by category chip first, then by search query within each category
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Step 1: filter by category
    let result: CategoryGroup[] = activeFilter
      ? categories.filter((g) => g.category.slug === activeFilter)
      : categories;

    // Step 2: filter videos within each category by search query
    if (query) {
      result = result
        .map((group) => ({
          ...group,
          contents: group.contents.filter((video) =>
            video.title.toLowerCase().includes(query)
          ),
        }))
        .filter((group) => group.contents.length > 0);
    }

    return result;
  }, [categories, activeFilter, searchQuery]);

  // Count total visible videos for the "no results" state
  const visibleVideoCount = useMemo(
    () => filteredCategories.reduce((sum, g) => sum + g.contents.length, 0),
    [filteredCategories]
  );

  return (
    <div
      className="h-full w-full overflow-y-auto scroll-smooth"
      style={{ paddingBottom: isMinimized ? '88px' : '0' }}
    >
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          {/* Brand row */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-accent via-accent-hover to-amber rounded-2xl flex items-center justify-center shadow-accent animate-gradient">
                  <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {/* Glow behind logo */}
                <div className="absolute -inset-1 bg-accent/20 rounded-2xl blur-lg -z-10" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight leading-none">
                  <span className="text-gradient">Dino</span>{' '}
                  <span className="text-white">Player</span>
                </h1>
                <p className="text-[10px] text-white/30 font-medium mt-0.5 tracking-wide uppercase">
                  {totalVideos} videos available
                </p>
              </div>
            </div>

            {/* Search / action area */}
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search videos..."
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.08] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-accent/50 focus:bg-white/[0.1] transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={toggleSearch}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
                  isSearchOpen
                    ? 'bg-white/[0.1] text-white'
                    : 'glass text-white/50 hover:bg-white/[0.08]'
                }`}
              >
                {isSearchOpen ? (
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 px-5 pb-3.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter(null)}
              className={`flex-shrink-0 text-xs font-semibold px-5 py-2 rounded-xl transition-all duration-300 ${
                activeFilter === null
                  ? 'bg-white text-dark-900 shadow-lg shadow-white/10'
                  : 'glass text-white/50 hover:text-white/80 hover:bg-white/[0.08]'
              }`}
            >
              All
            </button>
            {categories.map((g) => (
              <button
                key={g.category.slug}
                onClick={() => setActiveFilter(activeFilter === g.category.slug ? null : g.category.slug)}
                className={`flex-shrink-0 flex items-center gap-2 text-xs font-semibold px-5 py-2 rounded-xl transition-all duration-300 ${
                  activeFilter === g.category.slug
                    ? 'bg-white text-dark-900 shadow-lg shadow-white/10'
                    : 'glass text-white/50 hover:text-white/80 hover:bg-white/[0.08]'
                }`}
              >
                <img src={g.category.iconUrl} alt="" className="w-4 h-4 rounded-md" loading="lazy" />
                {g.category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Featured Hero Banner ── */}
      {!activeFilter && !searchQuery.trim() && (
        <div className="max-w-7xl mx-auto px-5 pt-5 pb-2">
          <motion.div
            className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-dark-800 to-purple/20 p-6 sm:p-8 border border-white/[0.06]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <p className="text-accent text-xs font-bold uppercase tracking-widest mb-2">Discover & Learn</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
                Explore AI-Powered<br />Video Content
              </h2>
              <p className="text-sm text-white/40 max-w-md mb-5">
                {totalVideos} curated videos across {categories.length} categories.
                Learn about AI tools, income strategies, and essential skills.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {categories.slice(0, 3).map((g) => (
                    <img
                      key={g.category.slug}
                      src={g.category.iconUrl}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-dark-800"
                      loading="lazy"
                    />
                  ))}
                </div>
                <span className="text-xs text-white/30">{categories.length} Categories</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Category Sections ── */}
      <main className="max-w-7xl mx-auto px-5 py-5">
        {/* Search results header */}
        {searchQuery.trim() && (
          <div className="mb-5">
            <p className="text-sm text-white/50">
              {visibleVideoCount > 0
                ? `Found ${visibleVideoCount} result${visibleVideoCount !== 1 ? 's' : ''} for "${searchQuery.trim()}"`
                : null}
            </p>
          </div>
        )}

        {/* No results state */}
        {visibleVideoCount === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-16 h-16 text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-white/40 text-base font-medium mb-1">No videos found</p>
            <p className="text-white/20 text-sm">
              {searchQuery.trim()
                ? `No results for "${searchQuery.trim()}". Try a different search term.`
                : 'No videos match the selected filter.'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {filteredCategories.map((group, groupIdx) => (
            <motion.section
              key={group.category.slug}
              className="mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, delay: groupIdx * 0.08 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-5">
                {/* Icon with gradient ring */}
                <div className={`relative p-0.5 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[group.category.slug] || 'from-accent to-amber'}`}>
                  <div className="w-10 h-10 rounded-[10px] bg-dark-900 flex items-center justify-center">
                    <img
                      src={group.category.iconUrl}
                      alt={group.category.name}
                      className="w-6 h-6"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white leading-tight">{group.category.name}</h2>
                  <p className="text-[11px] text-white/25 font-medium mt-0.5">
                    {group.contents.length} videos
                  </p>
                </div>
                {/* See-all pill */}
                <button className="text-[11px] font-semibold text-accent/80 hover:text-accent bg-accent/[0.06] hover:bg-accent/10 px-3.5 py-1.5 rounded-lg transition-all">
                  See all
                </button>
              </div>

              {/* Divider line with gradient */}
              <div className={`h-px mb-5 bg-gradient-to-r ${CATEGORY_COLORS[group.category.slug] || 'from-accent to-amber'} opacity-15`} />

              {/* Video Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {group.contents.map((video, idx) => (
                  <VideoCard
                    key={video.slug}
                    video={video}
                    index={idx}
                    categoryColor={CATEGORY_COLORS[group.category.slug]}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-5 pb-8 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/15 font-medium">Dino Ventures &middot; Frontend Assignment</p>
          <p className="text-[11px] text-white/15 font-medium">{totalVideos} videos</p>
        </div>
      </footer>
    </div>
  );
}
