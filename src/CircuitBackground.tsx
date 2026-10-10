import React, { useRef, useEffect } from 'react';

const GAP = 40;          // distance between grid dots
const TRIGGER_R2 = 6400; // 80px radius (squared) around the mouse that spawns traces

export const CircuitBackground = ({ gridVisible = true }: { gridVisible?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastSpawnRef = useRef<Map<number, number>>(new Map());
  const tracesRef = useRef<{
    path: { x: number; y: number }[];
    progress: number;
    opacity: number;
    color: string;
    width: number;
    speed: number;
  }[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isVisible = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only work while any part of the canvas is on screen.
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const resize = () => {
      canvas.width = canvas.clientWidth || window.innerWidth;
      canvas.height = canvas.clientHeight || canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const spawnTrace = (px: number, py: number) => {
      const segments = 3;
      const path = [{ x: px, y: py }];
      let curX = px;
      let curY = py;
      const step = 40;

      for (let i = 0; i < segments; i++) {
        const dx = mouseRef.current.x - curX;
        const dy = mouseRef.current.y - curY;
        const targetAngle = Math.atan2(dy, dx);

        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        let bestAngle = angles[0] * (Math.PI / 180);
        let minDiff = Infinity;

        angles.forEach(a => {
          const rad = a * (Math.PI / 180);
          let diff = Math.abs(targetAngle - rad);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          if (diff < minDiff) { minDiff = diff; bestAngle = rad; }
        });

        if (Math.random() < 0.2) {
          bestAngle = angles[Math.floor(Math.random() * angles.length)] * (Math.PI / 180);
        }

        curX += Math.round(Math.cos(bestAngle)) * step;
        curY += Math.round(Math.sin(bestAngle)) * step;
        path.push({ x: curX, y: curY });
      }

      tracesRef.current.push({
        path, progress: 0, opacity: 1, color: '#10b981',
        width: Math.random() < 0.4 ? 2 : 1,
        speed: 0.15 + Math.random() * 0.1,
      });
    };

    let lastClientX = -1000;
    let lastClientY = -1000;
    let animationFrame: number;
    const animate = () => {
      if (isVisible.current) {
        if (lastClientX !== -1000) {
          const rect = canvas.getBoundingClientRect();
          mouseRef.current = { x: lastClientX - rect.left, y: lastClientY - rect.top };
        }
        const now = Date.now();

        // Spawn: only look at the handful of grid dots near the mouse (not every dot on the canvas).
        if (gridVisible) {
          const mx = mouseRef.current.x, my = mouseRef.current.y;
          if (mx > -100 && my > -100 && mx < canvas.width + 100 && my < canvas.height + 100) {
            const i0 = Math.floor((mx - 80) / GAP), i1 = Math.ceil((mx + 80) / GAP);
            const j0 = Math.floor((my - 80) / GAP), j1 = Math.ceil((my + 80) / GAP);
            for (let i = i0; i <= i1; i++) {
              for (let j = j0; j <= j1; j++) {
                const x = i * GAP, y = j * GAP;
                if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) continue;
                const dx = x - mx, dy = y - my;
                if (dx * dx + dy * dy >= TRIGGER_R2) continue;
                const key = i * 100000 + j;
                if (now - (lastSpawnRef.current.get(key) || 0) > 1200) {
                  spawnTrace(x, y);
                  lastSpawnRef.current.set(key, now);
                }
              }
            }
          }
        }

        // Draw traces. When there are none we skip clearing/drawing entirely.
        if (tracesRef.current.length > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = tracesRef.current.length - 1; i >= 0; i--) {
            const trace = tracesRef.current[i];

            if (trace.progress < trace.path.length - 1) trace.progress += trace.speed;
            else trace.opacity -= 0.04;

            if (trace.opacity <= 0) { tracesRef.current.splice(i, 1); continue; }

            ctx.strokeStyle = trace.color;
            ctx.globalAlpha = trace.opacity * 0.9;
            ctx.lineWidth = trace.width;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(trace.path[0].x, trace.path[0].y);
            const fullSegments = Math.floor(trace.progress);
            const partial = trace.progress % 1;
            for (let j = 1; j <= fullSegments; j++) ctx.lineTo(trace.path[j].x, trace.path[j].y);

            let head = trace.path[trace.path.length - 1];
            if (fullSegments < trace.path.length - 1) {
              const last = trace.path[fullSegments];
              const next = trace.path[fullSegments + 1];
              head = { x: last.x + (next.x - last.x) * partial, y: last.y + (next.y - last.y) * partial };
              ctx.lineTo(head.x, head.y);
            }
            ctx.stroke();

            ctx.fillStyle = trace.color;
            ctx.beginPath();
            ctx.arc(head.x, head.y, trace.width + 1, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => { lastClientX = e.clientX; lastClientY = e.clientY; };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [gridVisible]);

  return (
    <>
      {/* The static dot grid is plain CSS (free), instead of being redrawn on the canvas every frame. */}
      {gridVisible && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 0 0, rgba(52,211,153,0.15) 1.2px, transparent 1.7px)',
            backgroundSize: `${GAP}px ${GAP}px`,
          }}
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0" />
    </>
  );
};

export default CircuitBackground;