import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Video } from './types';
import { PlayerContext } from './store/playerStore';
import type { PlayerContextType } from './store/playerStore';
import HomePage from './components/HomePage';
import VideoPlayer from './components/VideoPlayer';
import MiniPlayer from './components/MiniPlayer';
import PipPlayer from './components/PipPlayer';

function App() {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync play/pause state with actual video element
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(vid.currentTime);
    const onDurationChange = () => setDuration(vid.duration || 0);
    const onProgress = () => {
      if (vid.buffered.length > 0) {
        setBuffered(vid.buffered.end(vid.buffered.length - 1));
      }
    };
    const onLoadedMetadata = () => {
      setDuration(vid.duration || 0);
      setCurrentTime(0);
    };

    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('durationchange', onDurationChange);
    vid.addEventListener('progress', onProgress);
    vid.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('durationchange', onDurationChange);
      vid.removeEventListener('progress', onProgress);
      vid.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [currentVideo]); // re-attach when video changes since src changes

  const playVideo = useCallback((video: Video) => {
    setCurrentVideo(video);
    setIsMinimized(false);
    setIsPip(false);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    // Actual play will happen via useEffect in VideoPlayer after src is set
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
    setIsPip(false);
  }, []);

  const maximizePlayer = useCallback(() => {
    setIsMinimized(false);
    setIsPip(false);
  }, []);

  const enterPip = useCallback(() => {
    setIsPip(true);
    setIsMinimized(false);
  }, []);

  const exitPip = useCallback(() => {
    setIsPip(false);
    setIsMinimized(false);
  }, []);

  const closePlayer = useCallback(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    setCurrentVideo(null);
    setIsMinimized(false);
    setIsPip(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(time, vid.duration || 0));
  }, []);

  const skipForward = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.min(vid.currentTime + 10, vid.duration || 0);
  }, []);

  const skipBackward = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(vid.currentTime - 10, 0);
  }, []);

  const contextValue: PlayerContextType = useMemo(
    () => ({
      currentVideo,
      isMinimized,
      isPip,
      isPlaying,
      videoRef,
      currentTime,
      duration,
      buffered,
      playVideo,
      minimizePlayer,
      maximizePlayer,
      enterPip,
      exitPip,
      closePlayer,
      togglePlayPause,
      setIsPlaying,
      seekTo,
      skipForward,
      skipBackward,
    }),
    [currentVideo, isMinimized, isPip, isPlaying, currentTime, duration, buffered, playVideo, minimizePlayer, maximizePlayer, enterPip, exitPip, closePlayer, togglePlayPause, seekTo, skipForward, skipBackward]
  );

  return (
    <PlayerContext.Provider value={contextValue}>
        <div className="h-full w-full bg-yt-black relative overflow-hidden">
        {/* Hidden persistent video element — shared across player views */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          preload="metadata"
        />

        <HomePage />

        <AnimatePresence>
          {currentVideo && !isMinimized && !isPip && (
            <VideoPlayer key="video-player" />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentVideo && isMinimized && (
            <MiniPlayer key="mini-player" />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentVideo && isPip && (
            <PipPlayer key="pip-player" />
          )}
        </AnimatePresence>
      </div>
    </PlayerContext.Provider>
  );
}

export default App;
