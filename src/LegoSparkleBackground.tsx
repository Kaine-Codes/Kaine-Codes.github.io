import React, { useRef, useEffect } from 'react';

export const LegoSparkleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
    rotation: number;
    dRot: number;
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

    const legoColors = ['#05f7ef', '#ffeb3b', '#2a8a85', '#b3d9f7', '#ffffff'];

    const spawnSparkle = (x: number, y: number) => {
      const count = 1;
      for (let i = 0; i < count; i++) {
        if (sparklesRef.current.length > 25) break;
        sparklesRef.current.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -0.3 - Math.random() * 0.6,
          size: Math.random() > 0.5 ? 5 : 4,
          alpha: 0.85,
          decay: 0.015 + Math.random() * 0.015,
          color: legoColors[Math.floor(Math.random() * legoColors.length)],
          rotation: Math.random() * Math.PI,
          dRot: (Math.random() - 0.5) * 0.08,
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
      if (now - lastSpawn > 90 && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
        spawnSparkle(x, y);
        lastSpawn = now;
      }
    };

    let animationFrame: number;
    const animate = () => {
      if (isVisible.current && sparklesRef.current.length > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = sparklesRef.current.length - 1; i >= 0; i--) {
          const s = sparklesRef.current[i];
          s.x += s.vx;
          s.y += s.vy;
          s.rotation += s.dRot;
          s.alpha -= s.decay;

          if (s.alpha <= 0) {
            sparklesRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rotation);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;
          // Little stud square / diamond
          ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
          ctx.restore();
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

export default LegoSparkleBackground;