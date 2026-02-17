import { createContext, useContext } from 'react';
import type { Video } from '../types';

export interface PlayerContextType {
  currentVideo: Video | null;
  isMinimized: boolean;
  isPlaying: boolean;
  playVideo: (video: Video) => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
  closePlayer: () => void;
  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
