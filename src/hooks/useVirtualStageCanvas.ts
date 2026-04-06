import { useEffect, useRef, useState } from 'react';

const presets = [
  'Concert Hall',
  'Theater Stage',
  'Club Environment',
  'Outdoor Festival',
  'TV Studio'
];

export function useVirtualStageCanvas(showVirtualStage: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePreset, setActivePreset] = useState(0);

  useEffect(() => {
    if (!showVirtualStage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

      const centerX = canvas.width / 2;
      const colors = ['#FFD700', '#FF4500', '#FF1493', '#00FF7F', '#4169E1'];

      colors.forEach((color, i) => {
        const angle = (Math.sin(Date.now() / 1000 + i) * Math.PI) / 4;

        ctx.save();
        ctx.translate(centerX + (i - 2) * 100, 100);
        ctx.rotate(angle);

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, `${color}33`);
        gradient.addColorStop(0.5, `${color}66`);
        gradient.addColorStop(1, `${color}11`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(40, 400);
        ctx.lineTo(-40, 400);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [showVirtualStage]);

  return {
    canvasRef,
    presets,
    activePreset,
    nextPreset: () => setActivePreset((prev) => (prev + 1) % presets.length)
  };
}
