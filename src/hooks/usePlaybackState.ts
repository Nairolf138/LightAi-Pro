import { useEffect, useState } from 'react';
import { observability } from '../lib/observability';

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

    let expectedAt = performance.now() + 100;

    const interval = window.setInterval(() => {
      const now = performance.now();
      const latency = now - expectedAt;
      const droppedFrame = latency > 120;

      observability.trackFrame(latency, droppedFrame);

      if (droppedFrame) {
        observability.warn('playback', 'Frame scheduling drift exceeded threshold', {
          expectedAt,
          actualAt: now,
          latencyMs: Number(latency.toFixed(2))
        });
      }

      expectedAt += 100;

      setCurrentTime((prevTime) => {
        const newTime = (prevTime + 1) % 100;

        if (newTime % 20 === 0) {
          setCurrentEffect((prevEffect) => {
            const nextEffect = (prevEffect + 1) % effectsCount;
            onEffectAdvanced?.(nextEffect);
            observability.info('playback', 'Effect advanced', { from: prevEffect, to: nextEffect });
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
      observability.info('playback', nextIsPlaying ? 'Playback started' : 'Playback paused', {
        currentEffect,
      });
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
