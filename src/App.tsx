import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Video } from './types';
import { PlayerContext } from './store/playerStore';
import type { PlayerContextType } from './store/playerStore';
import HomePage from './components/HomePage';
import VideoPlayer from './components/VideoPlayer';
import MiniPlayer from './components/MiniPlayer';

function App() {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = useCallback((video: Video) => {
    setCurrentVideo(video);
    setIsMinimized(false);
    setIsPlaying(true);
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizePlayer = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentVideo(null);
    setIsMinimized(false);
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const contextValue: PlayerContextType = useMemo(
    () => ({
      currentVideo,
      isMinimized,
      isPlaying,
      playVideo,
      minimizePlayer,
      maximizePlayer,
      closePlayer,
      togglePlayPause,
      setIsPlaying,
    }),
    [currentVideo, isMinimized, isPlaying, playVideo, minimizePlayer, maximizePlayer, closePlayer, togglePlayPause]
  );

  return (
    <PlayerContext.Provider value={contextValue}>
        <div className="h-full w-full bg-dark-950 relative overflow-hidden">
        <HomePage />

        <AnimatePresence>
          {currentVideo && !isMinimized && (
            <VideoPlayer key="video-player" />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentVideo && isMinimized && (
            <MiniPlayer key="mini-player" />
          )}
        </AnimatePresence>
      </div>
    </PlayerContext.Provider>
  );
}

export default App;
