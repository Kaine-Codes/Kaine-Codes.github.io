import React, { useRef, useEffect } from 'react';

export const RedstoneDustBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
  }[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isVisible = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const redstoneColors = ['#ff2244', '#dc2626', '#b91c1c', '#f87171', '#ef4444'];

    const spawnParticles = (x: number, y: number) => {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length > 50) break;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 36,
          y: y + (Math.random() - 0.5) * 36,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.4 - Math.random() * 0.8, // gentle upward float like Minecraft dust
          size: Math.random() > 0.6 ? 4 : 3, // chunky pixel dust
          alpha: 0.8 + Math.random() * 0.2,
          decay: 0.012 + Math.random() * 0.015,
          color: redstoneColors[Math.floor(Math.random() * redstoneColors.length)],
        });
      }
    };

    let lastSpawn = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y };

      const now = Date.now();
      if (now - lastSpawn > 70 && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        spawnParticles(x, y);
        lastSpawn = now;
      }
    };

    let animationFrame: number;
    const animate = () => {
      if (isVisible.current && particlesRef.current.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx + (Math.random() - 0.5) * 0.3; // subtle pixel jitter
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          // Minecraft square pixel particle
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;
      }

      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default RedstoneDustBackground;