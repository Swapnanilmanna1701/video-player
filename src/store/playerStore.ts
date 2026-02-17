import { createContext, useContext } from 'react';
import type { RefObject } from 'react';
import type { Video } from '../types';

export interface PlayerContextType {
  currentVideo: Video | null;
  isMinimized: boolean;
  isPip: boolean;
  isPlaying: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  buffered: number;
  playVideo: (video: Video) => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
  enterPip: () => void;
  exitPip: () => void;
  closePlayer: () => void;
  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  seekTo: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
}

export const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
