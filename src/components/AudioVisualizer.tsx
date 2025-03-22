import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

type AudioVisualizerProps = {
  audioUrl: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
};

export function AudioVisualizer({ audioUrl, isPlaying, onPlay, onPause }: AudioVisualizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#FFD700',
        progressColor: '#FFA500',
        cursorColor: '#FF4500',
        barWidth: 2,
        barGap: 1,
        responsive: true,
        height: 60,
        barRadius: 3,
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on('play', onPlay);
      wavesurfer.current.on('pause', onPause);

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4">
      <div ref={waveformRef} className="w-full" />
    </div>
  );
}