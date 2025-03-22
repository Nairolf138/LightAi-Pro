import { AudioAnalyzer } from './audioAnalyzer';

export interface Effect {
  name: string;
  color: string;
  configuration: Record<string, any>;
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, analyzer?: AudioAnalyzer) => void;
}

const createGradient = (ctx: CanvasRenderingContext2D, colors: string[]) => {
  const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  return gradient;
};

export const effects: Effect[] = [
  {
    name: 'Color Chase',
    color: '#FFD700',
    configuration: {
      speed: 1.0,
      colors: ['#FFD700', '#FFA500', '#FF4500'],
      mode: 'linear'
    },
    render: (ctx, canvas) => {
      const { colors, speed } = effects[0].configuration;
      const time = Date.now() * speed * 0.001;
      const gradient = createGradient(ctx, colors);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add moving light beams
      colors.forEach((color, i) => {
        const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 50, canvas.height);
        ctx.lineTo(x + 50, canvas.height);
        ctx.fillStyle = `${color}40`;
        ctx.fill();
      });
    }
  },
  {
    name: 'Audio Reactive',
    color: '#FF4500',
    configuration: {
      sensitivity: 0.8,
      colorIntensity: 1.0,
      smoothing: 0.5
    },
    render: (ctx, canvas, analyzer) => {
      if (!analyzer) return;

      const spectrum = analyzer.getSpectrum();
      const bands = analyzer.getFrequencyBands();
      const beat = analyzer.getBeatDetection();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw frequency spectrum
      const barWidth = canvas.width / spectrum.length;
      const sensitivity = effects[1].configuration.sensitivity;

      spectrum.forEach((value, i) => {
        const height = value * canvas.height * sensitivity;
        const hue = (i / spectrum.length) * 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height);
      });

      // Draw beat circles
      const radius = beat * canvas.height * 0.5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 69, 0, ${beat})`;
      ctx.fill();

      // Draw frequency bands
      const bandWidth = canvas.width / 3;
      ['low', 'mid', 'high'].forEach((band, i) => {
        const height = bands[band as keyof typeof bands] * canvas.height;
        ctx.fillStyle = `rgba(255, ${i * 100}, 0, 0.5)`;
        ctx.fillRect(i * bandWidth, canvas.height - height, bandWidth, height);
      });
    }
  },
  {
    name: 'Matrix Rain',
    color: '#00FF00',
    configuration: {
      density: 0.1,
      speed: 1.0,
      fontSize: 14
    },
    render: (ctx, canvas) => {
      const { density, speed, fontSize } = effects[2].configuration;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00FF00';
      ctx.font = `${fontSize}px monospace`;

      // Create matrix rain effect
      const columns = Math.floor(canvas.width / fontSize);
      const drops: number[] = Array(columns).fill(0);

      drops.forEach((drop, i) => {
        const char = String.fromCharCode(0x30A0 + Math.random() * 96);
        const x = i * fontSize;
        const y = drop * fontSize;

        if (Math.random() < density) {
          ctx.fillText(char, x, y);
        }

        drops[i] = y > canvas.height ? 0 : drop + speed;
      });
    }
  },
  {
    name: 'Particle System',
    color: '#4169E1',
    configuration: {
      particleCount: 100,
      maxSpeed: 2,
      connectionRadius: 100
    },
    render: (ctx, canvas, analyzer) => {
      const { particleCount, maxSpeed, connectionRadius } = effects[3].configuration;
      
      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
      }

      // Initialize particles if needed
      const particles: Particle[] = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * maxSpeed,
        vy: (Math.random() - 0.5) * maxSpeed
      }));

      // Update and draw particles
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#4169E1';
        ctx.fill();

        // Draw connections
        particles.forEach(other => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionRadius) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(65, 105, 225, ${1 - distance / connectionRadius})`;
            ctx.stroke();
          }
        });
      });
    }
  },
  {
    name: 'Laser Show',
    color: '#FF1493',
    configuration: {
      beamCount: 5,
      rotationSpeed: 1,
      thickness: 2
    },
    render: (ctx, canvas, analyzer) => {
      const { beamCount, rotationSpeed, thickness } = effects[4].configuration;
      const time = Date.now() * 0.001 * rotationSpeed;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < beamCount; i++) {
        const angle = (i / beamCount) * Math.PI * 2 + time;
        const length = Math.min(canvas.width, canvas.height) * 0.8;

        const gradient = ctx.createLinearGradient(
          centerX,
          centerY,
          centerX + Math.cos(angle) * length,
          centerY + Math.sin(angle) * length
        );

        gradient.addColorStop(0, '#FF1493');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * length,
          centerY + Math.sin(angle) * length
        );
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;
        ctx.stroke();

        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF1493';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }
];