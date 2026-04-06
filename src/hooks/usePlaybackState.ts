import { useEffect, useState } from 'react';

interface UsePlaybackStateOptions {
  effectsCount: number;
  onPlayStart?: (currentEffectIndex: number) => void;
  onEffectAdvanced?: (nextEffectIndex: number) => void;
}

export function usePlaybackState({
  effectsCount,
  onPlayStart,
  onEffectAdvanced
}: UsePlaybackStateOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEffect, setCurrentEffect] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = (prevTime + 1) % 100;

        if (newTime % 20 === 0) {
          setCurrentEffect((prevEffect) => {
            const nextEffect = (prevEffect + 1) % effectsCount;
            onEffectAdvanced?.(nextEffect);
            return nextEffect;
          });
        }

        return newTime;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [effectsCount, isPlaying, onEffectAdvanced]);

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const nextIsPlaying = !prev;
      if (nextIsPlaying) {
        onPlayStart?.(currentEffect);
      }
      return nextIsPlaying;
    });
  };

  const increaseVolume = () => setVolume((prev) => Math.min(100, prev + 5));
  const decreaseVolume = () => setVolume((prev) => Math.max(0, prev - 5));
  const toggleMute = () => setIsMuted((prev) => !prev);

  return {
    isPlaying,
    currentEffect,
    currentTime,
    volume,
    isMuted,
    togglePlay,
    increaseVolume,
    decreaseVolume,
    toggleMute
  };
}
