import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Github, Linkedin, ExternalLink, Cpu, Code2, Rocket, DraftingCompass, Cable, Braces, Database, Layers, Radio, CircuitBoard, Mail, Phone, MapPin, Zap, Monitor } from 'lucide-react';

// --- Types ---
type AppState = 'loading' | 'terminal' | 'portfolio';

// --- Intro Components ---

const CircuitBackground = ({ gridVisible = true }: { gridVisible?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<{ x: number; y: number; lastSpawn: number }[]>([]);
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

    // Use Intersection Observer to only run when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (canvas) observer.observe(canvas);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
      
      const gap = 40;
      const points = [];
      for (let x = 0; x < canvas.width + gap; x += gap) {
        for (let y = 0; y < canvas.height + gap; y += gap) {
          points.push({ x, y, lastSpawn: 0 });
        }
      }
      pointsRef.current = points;
    };

    window.addEventListener('resize', resize);
    resize();

    const spawnTrace = (pt: { x: number; y: number }) => {
      const segments = 3; 
      const path = [{ x: pt.x, y: pt.y }];
      let curX = pt.x;
      let curY = pt.y;
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
          if (diff < minDiff) {
            minDiff = diff;
            bestAngle = rad;
          }
        });

        if (Math.random() < 0.2) {
          bestAngle = angles[Math.floor(Math.random() * angles.length)] * (Math.PI / 180);
        }
        
        curX += Math.round(Math.cos(bestAngle)) * step;
        curY += Math.round(Math.sin(bestAngle)) * step;
        path.push({ x: curX, y: curY });
      }

      tracesRef.current.push({
        path,
        progress: 0,
        opacity: 1,
        color: '#10b981', 
        width: Math.random() < 0.4 ? 2 : 1,
        speed: 0.15 + Math.random() * 0.1 // Faster growth
      });
    };

    let animationFrame: number;
    const animate = () => {
      if (isVisible.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();

        // Draw Grid
        if (gridVisible) {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.15)'; 
          pointsRef.current.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Spawn check
            const dx = pt.x - mouseRef.current.x;
            const dy = pt.y - mouseRef.current.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < 6400 && now - pt.lastSpawn > 1200) { // 80^2 = 6400
              spawnTrace(pt);
              pt.lastSpawn = now;
            }
          });
        }

        // Traces
        for (let i = tracesRef.current.length - 1; i >= 0; i--) {
          const trace = tracesRef.current[i];
          
          if (trace.progress < trace.path.length - 1) {
            trace.progress += trace.speed;
          } else {
            trace.opacity -= 0.04; // Fast fade
          }

          if (trace.opacity <= 0) {
            tracesRef.current.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = trace.color;
          ctx.globalAlpha = trace.opacity * 0.9;
          ctx.lineWidth = trace.width;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(trace.path[0].x, trace.path[0].y);
          
          const fullSegments = Math.floor(trace.progress);
          const partial = trace.progress % 1;

          for (let j = 1; j <= fullSegments; j++) {
            ctx.lineTo(trace.path[j].x, trace.path[j].y);
          }

          if (fullSegments < trace.path.length - 1) {
            const last = trace.path[fullSegments];
            const next = trace.path[fullSegments + 1];
            ctx.lineTo(
              last.x + (next.x - last.x) * partial,
              last.y + (next.y - last.y) * partial
            );
          }
          ctx.stroke();

          const currentHead = fullSegments < trace.path.length - 1 
            ? { 
                x: trace.path[fullSegments].x + (trace.path[fullSegments+1].x - trace.path[fullSegments].x) * partial,
                y: trace.path[fullSegments].y + (trace.path[fullSegments+1].y - trace.path[fullSegments].y) * partial
              }
            : trace.path[trace.path.length - 1];

          ctx.fillStyle = trace.color;
          ctx.beginPath();
          ctx.arc(currentHead.x, currentHead.y, trace.width + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [gridVisible]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-50 z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

const LoadingScreen = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const [percent, setPercent] = useState(0);
  const [isShattering, setIsShattering] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsShattering(true), 150);
          setTimeout(onComplete, 600);
          return 100;
        }
        return prev + 2.5;
      });
    }, 15);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#594433] overflow-hidden"
      exit={{ opacity: 0 }}
    >
      {/* Dirt Texture Loading Background */}
      <div className="absolute inset-0 opacity-50 " style={{
        backgroundImage: 'url("pictures/UI_Elements/minecraft_loading_screen_bg_dirt.jpg")',
        backgroundSize: '256px 256px'
      }} />
   
      <motion.div 
        className="z-10 flex flex-col items-center"
        animate={isShattering ? { 
          y: [0, 20, 800], 
          rotate: [0, 5, 20],
          opacity: [1, 1, 0]
        } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        <h1 className="text-white font-pixel text-2xl tracking-[0.2em] mb-12 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
          {percent === 100 ? 'DONE!' : 'LOADING PORTFOLIO'}
        </h1>

        <div className="relative w-64 h-64 bg-black/40 backdrop-blur-xl border-8 border-[#3d2b1f] shadow-2xl flex items-center justify-center overflow-hidden">
          <motion.div 
            className="absolute inset-0 border-[12px] border-[#10b981]" 
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
            transition={{ ease: "linear" }}
          />
          <div className="text-white font-pixel text-3xl font-black drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] z-20">
            {percent}%
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TerminalScreen = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isGlitching, setIsGlitching] = useState(true);

  const terminalLines = [
    "> INITIALIZING ECE_PORTFOLIO_V2...",
    "> LOADING CIRCUIT_SCHEMATICS [OK]",
    "> VERIFYING SIGNAL_INTEGRITY [98.2%]",
    "> SYNCHRONIZING HARDWARE_STACK...",
    "> EXECUTING MAIN_BOOT_SEQUENCE...",
    "> FETCHING SHINE_DANIEL.EXE...",

  ];

  useEffect(() => {
    const glitchTimeout = setTimeout(() => setIsGlitching(false), 200);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 250);

    return () => {
      clearTimeout(glitchTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex flex-col bg-black p-12 font-mono overflow-hidden ${isGlitching ? 'animate-glitch' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
            <div className="w-3 h-3 rounded-full bg-[#e7c365]" />
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          </div>
          <span className="text-emerald-500/30 text-[10px] tracking-widest uppercase font-bold">ECE_CORE // V2.0 </span>
        </div>

        <div className="space-y-4 text-emerald-400">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-start gap-8"
            >
              <span className="opacity-20 text-[11px] mt-1 tabular-nums">19:20:{10 + i}</span>
              <p className="text-base tracking-tight leading-none">{line}</p>
            </motion.div>
          ))}
          {lines.length === terminalLines.length && (
            <div className="flex items-center gap-8">
              <span className="opacity-20 text-[11px] tabular-nums invisible">00:00:00</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-3 h-6 bg-emerald-500"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Portfolio Sections ---

const LegoSection = () => {
  const [isCircuitOn, setIsCircuitOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Brick colors computed ONCE on mount — never re-randomised on re-render
  const brickColors = useMemo(() => {
    const COLS = 18;
    const ROWS = 20;
    const WHITE      = '#ffffff';
    const LIGHT_BLUE = '#b3d9f7';
    const CYAN       = '#05f7ef';
    const TEAL       = '#2a8a85';
    const BROWN_MID  = '#7a5440';
    const BROWN      = '#4a3424';
    const rowRecipes: number[][] = [
      [18, 0,  0,  0, 0, 0],
      [18, 0,  0,  0, 0, 0],
      [15, 3,  0,  0, 0, 0],
      [12, 4,  2,  0, 0, 0],
      [9,  5,  4,  0, 0, 0],
      [6,  5,  5,  2, 0, 0],
      [4,  4,  6,  4, 0, 0],
      [2,  3,  6,  5, 2, 0],
      [0,  2,  6,  5, 4, 1],
      [0,  1,  4,  5, 5, 3],
      [0,  0,  3,  4, 6, 5],
      [0,  0,  1,  3, 6, 8],
      [0,  0,  0,  2, 5, 11],
      [0,  0,  0,  1, 3, 14],
      [0,  0,  0,  0, 2, 16],
      [0,  0,  0,  0, 1, 17],
      [0,  0,  0,  0, 0, 18],
      [0,  0,  0,  0, 0, 18],
      [0,  0,  0,  0, 0, 18],
      [0,  0,  0,  0, 0, 18],
    ];
    const palette = [WHITE, LIGHT_BLUE, CYAN, TEAL, BROWN_MID, BROWN];
    const colors: string[] = [];
    for (let r = 0; r < ROWS; r++) {
      const recipe = rowRecipes[r];
      const row: string[] = [];
      recipe.forEach((count, ci) => {
        for (let k = 0; k < count; k++) row.push(palette[ci]);
      });
      for (let j = row.length - 1; j > 0; j--) {
        const swap = Math.floor(Math.random() * (j + 1));
        [row[j], row[swap]] = [row[swap], row[j]];
      }
      colors.push(...row);
    }
    return colors;
  }, []); // empty deps = computed once, never again

  return (
    <section id="intro" className="min-h-screen pt-32 pb-40 bg-[#fdf7ff] relative overflow-hidden">
      {/* Lego Brick Background — uses memoized colors, never re-randomises */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-multiply"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)' }}
      >
        {brickColors.map((color, i) => (
          <div
            key={i}
            className="aspect-square lego-stud relative border border-black/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Darkness Gradient Overlay */}
      {/* TIP: To change the background transition color, modify the 'to-[#3E2B1E]' hex code below. */}
      {/* This color blends the Lego background into the dark Experience section. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#3E2B1E] pointer-events-none z-10" />

      <div className="max-w-8xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-20">
        <div className="md:col-span-12 lg:col-span-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="inline-block px-4 py-2 bg-[#ffeb3b] text-slate-900 font-bold rounded-lg shadow-[4px_4px_0px_0px_#fbc02d] border-2 border-slate-900 uppercase text-xs tracking-wider"
          >
            Electronics Enthusiast // ECE 
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.1 }}
            className="space-y-4 relative"
          >
            {/* SVG Circuit Overlay — Desktop */}
            {!isMobile && (
              <svg 
                className="absolute -inset-x-12 -inset-y-12 w-[calc(100%+6rem)] h-[calc(100%+8rem)] pointer-events-none z-20 overflow-visible" 
                viewBox="0 0 1150 500" 
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="glow-wire">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <g className="transition-all duration-300" stroke="#080808" filter="url(#glow-wire)">
                  {/* Out of DANIEL (Right Side) → right → resistor → left → switch */}
                  <path d="M 1045,160 L 1350,160" fill="none" strokeWidth="6" strokeLinecap="round" />
                  {/* IEEE Resistor */}
                  <path d="M 1350,160 L 1350,185 L 1335,195 L 1365,205 L 1335,215 L 1365,225 L 1335,235 L 1365,245 L 1350,255 L 1350,280" fill="none" strokeWidth="6" strokeLinejoin="round" />
                  <path d="M 1350,280 L 1250,280" fill="none" strokeWidth="6" strokeLinecap="round" />
                  {/* Switch */}
                  <circle cx="1200" cy="280" r="5" fill="none" strokeWidth="4" />
                  <circle cx="1250" cy="280" r="5" fill="none" strokeWidth="4" />
                  <path d={isCircuitOn ? "M 1200,280 L 1250,280" : "M 1200,280 L 1235,255"} fill="none" strokeWidth="6" strokeLinecap="round" className="pointer-events-none" />
                  <rect x="1170" y="250" width="110" height="60" fill="transparent" stroke="none" className="pointer-events-auto cursor-pointer" onClick={() => setIsCircuitOn(!isCircuitOn)} />
                  {/* Switch → right end of red sentence / battery cap */}
                  <path d="M 1200,280 L 1064,280" fill="none" strokeWidth="6" strokeLinecap="round" />
                  {/* Left end of battery → up → left side of DANIEL */}
                  <path d="M 53,280 L 18,280 L 18,203 L 500,203 L 500,102" fill="none" strokeWidth="6" strokeLinecap="round" />
                </g>
              </svg>
            )}

            {/* SVG Circuit Overlay — Mobile
                Layout (vertical loop):
                  SHINE
                  |wire down left|  DANIEL  |wire down right|
                      [switch]          [resistor]
                  |______ ASPIRING VLSI & EMBEDDED... ______|
            */}
            {isMobile && (
              <svg
                className="absolute inset-0 w-full pointer-events-none z-0 overflow-visible"
                viewBox="0 0 340 260"
                preserveAspectRatio="xMidYMid meet"
                style={{ height: '260px', top: '0', left: '0' }}
              >
                <defs>
                  <filter id="glow-wire-m">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <g stroke="#080808" strokeLinecap="round" fill="none" filter="url(#glow-wire-m)">
                  {/* Left wire: down from left-end of DANIEL → to left of sentence */}
                  <path d="M 20,60 L 20,140" strokeWidth="4" />
                  {/* Right wire: down from right-end of DANIEL → to right of sentence */}
                  <path d="M 320,60 L 320,140" strokeWidth="4" />

                  {/* Switch — bottom left, between left wire and sentence */}
                  {/* terminal dots */}
                  <circle cx="20" cy="152" r="4" strokeWidth="3" />
                  <circle cx="20" cy="168" r="4" strokeWidth="3" />
                  {/* switch arm */}
                  <path
                    d={isCircuitOn ? "M 20,152 L 20,168" : "M 20,152 L 36,164"}
                    strokeWidth="4"
                    className="pointer-events-none"
                  />
                  {/* hitbox */}
                  <rect x="6" y="144" width="50" height="36" fill="transparent" stroke="none" className="pointer-events-auto cursor-pointer" onClick={() => setIsCircuitOn(!isCircuitOn)} />
                  {/* wire from switch down to sentence level */}
                  <path d="M 20,176 L 20,200" strokeWidth="4" />

                  {/* Resistor — bottom right, between right wire and sentence */}
                  <path d="M 320,140 L 320,148 L 311,153 L 329,158 L 311,163 L 329,168 L 311,173 L 329,178 L 320,183 L 320,200" strokeWidth="4" strokeLinejoin="round" />

                  {/* Bottom wire: left sentence end ← → right sentence end */}
                  <path d="M 20,200 L 320,200" strokeWidth="4" />
                </g>
              </svg>
            )}

            <h1 className={`font-sans font-black text-slate-900 leading-none tracking-tighter uppercase relative z-10 ${isMobile ? 'flex flex-col items-start text-6xl' : 'flex items-baseline whitespace-nowrap text-7xl md:text-9xl'}`}>
              <span className="relative inline-block shrink-0">
                <span className="relative z-10">
                  SHINE
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
                    initial={{ x: '-100%', opacity: 1 }}
                    whileInView={{ 
                      x: ['-100%', '60%'],
                      opacity: [1, 1, 0]
                    }}
                    viewport={{ once: false }}
                    transition={{ 
                      duration: 1.2, 
                      times: [0, 0.6, 1],
                      repeat: 0, 
                      repeatDelay: 2, 
                      ease: "easeInOut" 
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        whileInView={{ 
                          scale: [0, 1.2, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 90, 180]
                        }}
                        viewport={{ once: false }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: Math.random() * 2,
                          delay: i * 0.2
                        }}
                        style={{
                          top: `${[10, 40, 80, 20, 70, 50][i]}%`,
                          left: `${[10, 85, 30, 75, 15, 60][i]}%`,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 10 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#FACC15" />
                        </svg>
                      </motion.div>
                    ))}
                  </motion.div>
                </span>
              </span>
              <span 
                className={`${isMobile ? 'text-[6rem] mt-1 ml-0' : 'ml-6 md:ml-12 text-9xl md:text-[15rem]'} normal-case font-cursive transition-all duration-300 tracking-[0.05em] -translate-y-1 ${isCircuitOn ? 'text-[#fbbf24] drop-shadow-[0_0_20px_#fddb3c]' : 'text-[#4a3f12]'}`}
                style={{ 
                  textShadow: isCircuitOn 
                    ? '0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fddb3c, 0 0 42px #fddb3c, 0 0 82px #fddb3c, 0 0 92px #fddb3c, 0 0 102px #fddb3c' 
                    : 'none'
                }}
              >
                DANIEL
              </span>
            </h1>
            {/* Battery shape wrapping the red sentence */}
            {/* POSITIONING WRAPPER: change -translate-y-22 to move up/down, add ml-N to shift right */}
            <div className={`relative z-10 flex items-center ${isMobile ? 'mt-2' : '-translate-y-22'}`}>

              {/* MAIN BODY: border-2 = border thickness, px-8 = width padding, py-5 = height padding */}
              {/* bg-white/20 = transparency (20=very transparent, 60=more visible) */}
              <div className={`flex items-center border-3 border-slate-900/70 bg-white/40 backdrop-blur-sm ${isMobile ? 'px-4 py-3' : 'px-2 py-4'}`}>
                <p className={`font-bold text-[#e53935] uppercase font-sans tracking-tight ${isMobile ? 'text-base whitespace-normal leading-tight' : 'text-3xl md:text-4xl whitespace-nowrap'}`}>
                Aspiring VLSI &amp; Embedded Systems Engineer
                </p>
              </div>

              {/* CAP NUB: sits OUTSIDE the body border so it protrudes visually */}
              {/* w-4 = nub width, h-10 = nub height (shorter than body = protrudes inward on top+bottom) */}
              {/* Change w-4→w-6 for wider nub, h-10→h-8 for more protrusion effect */}
              <div className={`border-3 border-slate-900/70 bg-white/20 backdrop-blur-sm self-center ${isMobile ? 'w-3 h-6' : 'w-4 h-10'}`} />

            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.2 }}
            className="text-slate-800 text-2xl max-w-3xl font-medium leading-relaxed bg-white/40 backdrop-blur-sm p-8 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]"
          >
            Proactive Electronics enthusiast who loves to work on projects, gain knowledge and practical skills while building connections with like-minded individuals. Helping shape a better community for electronics enthusiasts.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-8 pt-4"
          >
            <button 
              onClick={() => scrollToSection('projects')}
              className="h-16 px-12 lego-button-3d text-white font-black flex items-center gap-4 uppercase tracking-widest text-lg border-2 border-black/20 cursor-pointer"
            >
              <CircuitBoard className="w-6 h-6" />
              My Work
            </button>
            <a 
              href="https://drive.google.com/file/d/1x6dZd3C1MSOuLO8q5lrje5naXFPYD5gP/view?usp=sharing"
              target="_blank"
              className="h-16 px-12 lego-button-3d lego-button-3d-blue text-white font-black flex items-center gap-4 uppercase tracking-widest text-lg border-2 border-black/20 cursor-pointer"
            >
              <DraftingCompass className="w-6 h-6" />
              Resume
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 relative flex justify-center mt-12 lg:mt-0"
        >
          
        </motion.div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL MODAL
// This popup opens when you click any Experience or Project card.
// It blurs the background and shows an image slider + description.
//
// Props it receives:
//   item.title       → big heading in the modal
//   item.sub         → subtitle line (org name, tags, etc.)
//   item.desc        → short summary paragraph
//   item.details     → ── REPLACE THIS ── longer paragraph with real details
//   item.images      → ── REPLACE THIS ── array of image URLs for the slider
//   onClose          → called when the × button or backdrop is clicked
//   theme            → 'modern' | 'minecraft'
// ─────────────────────────────────────────────────────────────────────────────
type ModalItem = {
  title: string;
  sub: string;
  desc: string;
  details: string;   // longer body text — replace placeholder below
  images: string[];  // array of image paths/URLs — replace placeholder below
  img?: string;      // icon for experiences
  id?: string;       // tracking id for projects
  tags?: string[];   // descriptive tags for projects
};

const DetailModal = ({ item, onClose, theme = 'modern' }: { item: ModalItem; onClose: () => void; theme?: 'modern' | 'minecraft' }) => {
  const [slide, setSlide] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setSlide(s => (s - 1 + item.images.length) % item.images.length); }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setSlide(s => (s + 1) % item.images.length); }

  const isMinecraft = theme === 'minecraft';

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        <motion.div
          key="panel"
          className={`relative z-10 w-full max-w-5xl max-h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl transition-all duration-300 ${
            isMinecraft 
              ? 'bg-[#3d2b1f] border-x-[12px] border-b-[12px] border-[#2d1f14] font-minecraft' 
              : 'bg-[#0d0d0d] border border-emerald-500/30 rounded-2xl'
          }`}
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Minecraft Top Bar (Grass) */}
          {isMinecraft && (
            <div className="absolute top-0 left-0 right-0 h-12 bg-[#5d8a3c] border-b-8 border-[#4d7232] z-20 flex items-center px-4">
               <div className="flex gap-1">
                  <div className="w-4 h-4 bg-white/10" />
                  <div className="w-2 h-2 bg-white/20" />
               </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-2 right-4 z-30 transition-colors text-3xl font-bold leading-none ${
              isMinecraft ? 'text-white hover:text-[#ffeb3b] [text-shadow:2px_2px_0px_#000]' : 'text-white/40 hover:text-white'
            }`}
            aria-label="Close"
          >×</button>

          {/* Spacer for Minecraft Header */}
          {isMinecraft && <div className="md:hidden h-12 w-full shrink-0" />}

          {/* Minecraft Dirt Texture Overlay for Exp section */}
          {isMinecraft && (
            <div className="absolute inset-x-0 bottom-0 top-12 opacity-40 pointer-events-none mix-blend-multiply" style={{
              backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`,
              backgroundSize: '256px 256px'
            }} />
          )}

          {/* ── LEFT COLUMN: Text Content ── */}
          <div className={`w-full md:w-[55%] shrink-0 p-8 overflow-y-auto flex flex-col justify-center space-y-4 relative z-10 ${
            isMinecraft ? 'pt-16 border-r-8 border-[#2d1f14]' : 'border-r border-white/5'
          }`}>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tight leading-tight ${
                isMinecraft ? 'text-[#ffeb3b] [text-shadow:3px_3px_0px_rgba(0,0,0,0.5)]' : 'text-white font-sans'
              }`}>
                {item.title}
              </h2>
              <p className={`text-xs uppercase tracking-widest mt-2 ${
                isMinecraft ? 'text-white/80 font-minecraft' : 'text-emerald-400 font-mono'
              }`}>
                {item.sub}
              </p>
            </div>
            <p className={`text-sm leading-relaxed ${
              isMinecraft ? 'text-stone-300 font-minecraft' : 'text-white/60 font-sans'
            }`}>
              {item.desc}
            </p>
            <div className={`text-sm leading-relaxed border-t pt-4 space-y-4 ${
              isMinecraft ? 'text-stone-400 border-white/10 font-minecraft' : 'text-white/40 border-white/5 font-sans'
            }`}>
              {item.details}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Image / Video Slider ── */}
          <div className={`w-full md:w-[45%] shrink-0 flex flex-col items-center justify-center p-4 relative z-10 ${
            isMinecraft ? 'bg-black/20 pt-16' : 'bg-black/40'
          }`}>
            <div className={`relative w-full aspect-[4/3] overflow-hidden bg-black/60 shadow-inner ${
              isMinecraft ? 'border-4 border-[#2d1f14]' : 'rounded-xl border border-white/5'
            }`}>
              {item.images && item.images.length > 0 ? (
                (() => {
                  const src = item.images[slide];
                  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src);
                  return isVideo ? (
                    <video
                      key={slide}
                      src={item.images[slide]}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      loop
                    />
                  ) : (
                    <motion.img
                      key={slide}
                      src={src}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x450/111/10b981?text=Image+Coming+Soon'; }}
                    />
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 uppercase text-[10px] tracking-widest font-bold">No Preview Available</div>
              )}
              
              {(item.images?.length || 0) > 1 && (
                <>
                  <button onClick={prev} className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer z-10 ${
                    isMinecraft ? 'bg-[#3d2b1f] border-2 border-[#2d1f14] text-white hover:bg-[#523d2d]' : 'bg-black/50 hover:bg-emerald-500/80 text-white rounded-full'
                  }`}>‹</button>
                  <button onClick={next} className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer z-10 ${
                    isMinecraft ? 'bg-[#3d2b1f] border-2 border-[#2d1f14] text-white hover:bg-[#523d2d]' : 'bg-black/50 hover:bg-emerald-500/80 text-white rounded-full'
                  }`}>›</button>
                </>
              )}
            </div>
            
            <div className="flex gap-2 mt-3">
              {item.images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setSlide(i); }}
                  className={`w-2 h-2 transition-colors ${
                    isMinecraft 
                      ? (i === slide ? 'bg-[#ffeb3b]' : 'bg-white/10') 
                      : (i === slide ? 'bg-emerald-400' : 'bg-white/20 rounded-full')
                  } ${!isMinecraft && 'rounded-full'}`}
                />
              ))}
            </div>
            <p className={`text-[10px] uppercase tracking-widest mt-2 ${
              isMinecraft ? 'text-[#ffeb3b]/60' : 'text-white/20'
            }`}>
              {slide + 1} / {item.images.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


const MinecraftSection = () => {
  const [activeExp, setActiveExp] = useState<ModalItem | null>(null);

  const experiences = (
    [
      { 
        title: 'Hardware Internship', 
        sub: '@Magnum Technology Center, Dubai', 
        img: '/pictures/UI_Elements/redstone.png',
        desc: 'Focused on PLC Programming and gaining exposure to industrial safety standards in JAFZA, Dubai (May-June 2025).',
        details: 'During this internship I worked with Allen-Bradley PLCs, learned ladder logic programming, and observed live industrial automation lines. I got hands-on exposure to JAFZA safety compliance standards and collaborated with engineers from 3 different countries.',
        images: [
          {'/pictures/MC_section/hardware internship/1.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/hardware internship/2.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/hardware internship/3.jpeg',  fit: 'contain'   },
          {'/pictures/MC_section/hardware internship/4.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/hardware internship/5.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/hardware internship/6.jpeg',  fit: 'cover'   },
        ],
      },
      { 
        title: 'Vegathon — Organizer', 
        sub: '@ECE Dept & C-DAC', 
        img: '/pictures/UI_Elements/torch.png',
        desc: 'Contributed to organizing many national-level hackathon - CarbonX, in collaboration with C-DAC.',
        details: 'Led logistics for the CarbonX national hackathon, coordinating with 200+ participants, managing event timelines, and liaising between the college ECE dept and C-DAC representatives.',
        images: [
          {'/pictures/MC_section/vegathon/1.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/vegathon/3.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/vegathon/4.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/vegathon/5.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/vegathon/6.jpeg',  fit: 'cover'   },
          {'/pictures/MC_section/vegathon/7.JPG',   fit: 'cover'   },
        ],
      },
      { 
        title: 'Media Member', 
        sub: '@RSET Media Team', 
        img: '/pictures/UI_Elements/Repeater.png',
        desc: 'Contributing to recording/capturing collegiate events and coordinating technical media infrastructure for major celebrations.',
        details: 'Shot and edited coverage for 10+ college events including annual days, tech fests, and departmental fests. Managed camera crew scheduling and delivered final edited videos within tight deadlines.',
        images: [
            { src: '/pictures/MC_section/media/1.jpg',  fit: 'cover'   },
            { src: '/pictures/MC_section/media/2.jpg',  fit: 'cover'   },
            { src: '/pictures/MC_section/media/3.JPG',  fit: 'cover' },
            { src: '/pictures/MC_section/media/4.JPG',  fit: 'contain'   },
            { src: '/pictures/MC_section/media/5.jpeg', fit: 'cover'   },
          ],
      },
      { 
        title: 'Technical Coord & Organizing', 
        sub: '@Electronauts', 
        img: '/pictures/UI_Elements/comparator.png',
        desc: 'Organized tech-fest events including Blindbuild 2.0, Codequest 2.0, Chips2Silicon, and Wire it right and many other activity hour events.',
        details: 'Designed problem statements, sourced components, and managed scoring rubrics for 5 major events. Also mentored junior members on hardware challenge setup and coordinated with faculty advisors.',
        images: [
          {'/pictures/MC_section/organizing_volunteering/1.JPG', fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/2.JPG', fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/3.JPG', fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/4.JPG', fit: 'contain'}
          {'/pictures/MC_section/organizing_volunteering/5.jpeg',fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/6.JPG', fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/7.jpeg',fit: 'cover'}
          {'/pictures/MC_section/organizing_volunteering/8.jpg', fit: 'contain'}
          {'/pictures/MC_section/organizing_volunteering/9.jpg', fit: 'cover'}
        ],
      },
      { 
        title: 'GIS-Mapathon', 
        sub: '@NeST Digital & RSET', 
        img: '/pictures/UI_Elements/piston.png',
        desc: 'Contributed to organizing many tech events from normal activity hours to national-level tech fests.',
        details: 'Volunteered at 8+ events run by IEDC and GDSC chapters, handling registration desks, stage management, and participant coordination.',
        images: [
          {'/pictures/MC_section/mapathon/1.jpeg', fit: 'cover'}
          {'/pictures/MC_section/mapathon/2.JPG',  fit: 'cover'}
          {'/pictures/MC_section/mapathon/3.JPG',  fit: 'cover'}
          {'/pictures/MC_section/mapathon/4.jpeg', fit: 'cover'}
          {'/pictures/MC_section/mapathon/5.jpeg', fit: 'cover'}
        ],
      },
    ] as ModalItem[]
  );

  return (
    <section id="experience" className="min-h-screen py-32 bg-[#4a3424] text-white relative overflow-hidden">
      {/* Darkened Dirt Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply" style={{
        backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`,
        backgroundSize: '256px 256px'
      }} />
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
        backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`,
        backgroundSize: '64px 64px'
      }} />
      
      {/* Color transition to next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#111111] pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="mb-20 flex flex-col md:flex-row justify-between items-center md:items-end gap-8"
        >
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#10b981] mb-2 leading-none font-minecraft [text-shadow:4px_4px_0px_rgba(0,0,0,0.4)]">Experiences</h2>
              <p className="text-stone-400 text-[12px] tracking-widest uppercase font-minecraft">Enchantment_Level XXX// Professional_Experience</p>
            </div>
          </div>
          <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-[30px] h-[30px] border-4 border-slate-900 shadow-inner mt-[10px] bg-white ${i === 1 ? 'pl-[1px]' : ''}`} 
                />
              ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1 }}
              // ── CLICKABLE: opens the detail modal for this experience ──
              onClick={() => setActiveExp(exp)}
              className="bg-[#3d2b1f] p-8 border-4 border-slate-900 shadow-[inset_4px_4px_0px_0px_rgba(255,255,255,0.05),inset_-4px_-4px_0px_0px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row gap-8 items-center sm:items-start group hover:bg-[#523d2d] transition-colors cursor-pointer"
            >
              <div className="shrink-0 w-[80px] h-[80px] bg-slate-900/40 border-4 border-slate-900 flex items-center justify-center p-2 group-hover:-translate-y-1 transition-transform">
                <img src={(exp as any).img} alt={exp.title} className="w-full h-full object-contain -mt-[2px]" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-bold mb-1 text-white uppercase font-minecraft">{exp.title}</h3>
                <p className="text-[#10b981] text-xs mb-4 uppercase tracking-[0.2em] font-minecraft">{exp.sub}</p>
                <p className="text-stone-300 text-xs leading-relaxed font-sans font-medium">{exp.desc}</p>
                {/* Hint that the card is expandable */}
                <p className="text-white/20 text-[10px] uppercase tracking-widest mt-4 group-hover:text-emerald-400/60 transition-colors">Click to expand →</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MODAL — renders on top of everything when a card is clicked ── */}
      {activeExp && <DetailModal item={activeExp} onClose={() => setActiveExp(null)} theme="minecraft" />}
    </section>
  );
};

const SchematicSection = () => {
  const [activeProj, setActiveProj] = useState<ModalItem | null>(null);

  const projects = (
    [
      {
        title: 'Audio Spectrum Analyzer', id: 'ECE_001', tags: ['Analog', 'Filters'],
        sub: 'ECE_001 // Analog & DSP',
        highlight: 'border-amber-400',
        desc: '2 Band Audio Spectrum Analyzer with real-time waveform visualization and signal capture.',
        details: 'Built using op-amp bandpass filters and an LM3914 bar-graph driver. The two bands (bass & treble) are split at 1 kHz. Signal capture was implemented with a peak-detector circuit feeding an ADC. Tested with a function generator across 20 Hz – 20 kHz.',
        images: [
          '/pictures/Projects/Spectrum_Analyzer/Demo2_1.mp4',
          '/pictures/Projects/Spectrum_Analyzer/final_2.jpeg',
          '/pictures/Projects/Spectrum_Analyzer/demo1_3.mp4',
          '/pictures/Projects/Spectrum_Analyzer/assembly_4.jpeg',
          '/pictures/Projects/Spectrum_Analyzer/testing_5.jpeg',
        ],
      },
      {
        title: '4-Bit Binary Adder', id: 'ECE_002', tags: ['Hardware', 'Transistors'],
        sub: 'ECE_002 // Discrete Logic',
        desc: 'Complete binary adder logic implemented using only discrete transistors to demonstrate logic gate synthesis.',
        details: 'Implemented NAND-NAND logic using BC547 NPN transistors on a breadboard. Full adder cells were cascaded to achieve 4-bit addition with carry propagation. Final output verified with a 7-segment display.',
        images: [
          '/pictures/Projects/BinaryAdder/demo.mp4',
          '/pictures/Projects/BinaryAdder/final.jpeg',
        ],
      },
      {
        title: 'Robotic Arm Sim', id: 'ECE_003', tags: ['ROS', 'Gazebo', 'Rviz'],
        sub: 'ECE_003 // Robotics',
        desc: 'Detailed simulation of robotic arm movements including kinematics and motion planning environments.',
        details: 'Developed a 6-DOF robot arm URDF model and simulated it in Gazebo with ROS Noetic. Implemented inverse kinematics via MoveIt! and visualized joint trajectories in RViz. Used a Python script to define pick-and-place sequences.',
        images: [
          '/pictures/Projects/RoboticArm/Demo1.mp4',
          '/pictures/Projects/RoboticArm/Demo2.mp4',
        ],
      },
      {
        title: 'BT RC Car Control', id: 'ECE_004', tags: ['Arduino', 'Bluetooth', 'LCD'],
        sub: 'ECE_004 // Embedded',
        desc: 'Wireless vehicle control system with real-time telemetry displayed on a mounted LCD interface.',
        details: 'Designed around an Arduino Uno and HC-05 Bluetooth module. Motor control via L298N H-bridge. A 16×2 LCD shows speed and direction in real time. Android app (MIT App Inventor) sends commands over BT serial.',
        images: [
          'pictures/Projects/BT_car/final.jpg',
          'pictures/Projects/BT_car/inside1.jpeg',
          'pictures/Projects/BT_car/inside2.jpeg',
          'pictures/Projects/BT_car/withoutchassie.jpeg',
        ],
      },
      {
        title: 'Freq Multiplier', id: 'ECE_005', tags: ['CD4046', 'PLL'],
        sub: 'ECE_005 // Analog',
        desc: 'Signal synthesis circuit for frequency multiplication utilizing Phase-Locked Loop (PLL) stability.',
        details: 'Used the CD4046 PLL IC with a CD4017 divide-by-N counter in the feedback loop to achieve integer frequency multiplication (×2, ×4, ×8). Output verified on an oscilloscope with <0.1% frequency error at 10 kHz.',
        images: [
          '/pictures/Projects/FrequencyMultiplier/final_1.jpeg',
          '/pictures/Projects/FrequencyMultiplier/test_2.jpeg',
          '/pictures/Projects/FrequencyMultiplier/ckt_3.jpeg',
        ],
      },
      {
        title: 'Light Screaming Circuit', id: 'ECE_006', tags: ['Oscillator', 'Sensors'],
        sub: 'ECE_006 // Analog',
        desc: 'Analog oscillator whose audio frequency scales linearly with incident light intensity.',
        details: 'Built around a 555 timer in astable mode with an LDR in the RC network. As light increases, resistance drops, raising the oscillation frequency. Output drives a small speaker directly. Fun demo for illustrating RC time constants.',
        images: [
          '/pictures/Projects/DFlipFlop/flipflop_1.png',
          '/pictures/Projects/DFlipFlop/test_2.png',
          '/pictures/Projects/DFlipFlop/nand_3.png',
          '/pictures/Projects/DFlipFlop/not_4.png',
          '/pictures/Projects/DFlipFlop/result_5.png',
        ],
      },
      {
        title: 'RISC Processor', id: 'ECE_007', tags: ['VLSI', 'Verilog', 'HDL'],
        sub: 'ECE_007 // Digital Design',
        desc: 'Design and simulation of a RISC processor architecture with full test bench verification.',
        details: 'Implemented a simplified RISC processor in Verilog HDL with a custom instruction set. Designed and verified individual modules (ALU, register file, control unit) and integrated them into a full datapath. Simulated using a complete test bench with waveform analysis.',
        images: [
          '/pictures/Projects/RISC_processor/designandtest_1.jpg',
          '/pictures/Projects/RISC_processor/dut_2.jpg',
          '/pictures/Projects/RISC_processor/result_3.jpg',
        ],
      },
      {
        title: 'ESP32-Walkman', id: 'ECE_008', tags: ['ESP32', 'Audio', 'Embedded'],
        sub: 'ECE_008 // Embedded Audio',
        desc: 'A portable music player built around the ESP32 microcontroller with wireless capabilities.',
        details: 'Work in progress. Details and photos coming soon.',
        images: [],
      },
    ] as ModalItem[]
  );

  return (
    <section id="projects" className="min-h-screen py-32 bg-[#111111] border-t border-white/10 text-emerald-500 font-sans relative overflow-hidden">
      <CircuitBackground />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10"
        >
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-bold block">SECTION_03 // HW_ARCH</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">Project Schematics</h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((proj, i) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1 }}
              // ── CLICKABLE: opens the detail modal for this project ──
              onClick={() => setActiveProj(proj)}
              className="group border border-emerald-500/20 bg-black/70 backdrop-blur-md p-8 hover:bg-black/80 hover:border-emerald-500/40 transition-all relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />

              <div className="text-[10px] text-emerald-500/50 mb-8 flex justify-between items-center font-bold">
                <span className="bg-emerald-950 px-2 py-1 border border-emerald-500/20 uppercase">{(proj as any).id}</span>
              </div>
              
              <h3 className="text-2xl font-bold uppercase mb-6 text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                {proj.title}
              </h3>
              
              <p className="text-emerald-500/50 text-sm mb-10 leading-relaxed font-sans font-medium">
                {proj.desc}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(proj as any).tags.map((tag: string) => (
                  <span key={tag} className="text-[9px] px-2 py-1 border border-emerald-500/10 text-emerald-500/20 uppercase font-black">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-white/15 text-[10px] uppercase tracking-widest group-hover:text-emerald-400/50 transition-colors">Click to expand →</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MODAL ── */}
      {activeProj && <DetailModal item={activeProj} onClose={() => setActiveProj(null)} />}
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS SECTION
// ─────────────────────────────────────────────────────────────────────────────
const InterestsSection = () => {
  const skills = [
    { title: 'Embedded Systems',    icon: <Cpu className="w-8 h-8" /> },
    { title: 'VLSI Design',         icon: <CircuitBoard className="w-8 h-8" /> },
    { title: 'Planning & Teamwork', icon: <Layers className="w-8 h-8" /> },
    { title: 'Coding',              icon: <Braces className="w-8 h-8" /> },
    { title: 'Iot',                 icon: <Cable className="w-8 h-8" /> },
  ];

  return (
    <section id="interests" className="py-32 bg-[#111111] border-t border-white/10 relative overflow-hidden">
      <CircuitBackground />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/40 font-bold block mb-4">SECTION_04 // GUNS OF KNOWLEDGE</span>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">Technical Arsenal</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {skills.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center text-center group hover:bg-black/80 hover:border-emerald-500/50 transition-all shadow-xl relative overflow-hidden"
            >
              <div className="p-5 rounded-full bg-[#111111] border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                {React.cloneElement(item.icon as React.ReactElement, { className: 'text-emerald-400' })}
              </div>

              <h3 className="text-white font-mono font-bold uppercase tracking-widest text-xs">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS SECTION
// To add a certification: copy one object in `certs` and fill in:
//   title  → cert name
//   issuer → who issued it
//   date   → when you got it
//   color  → any Tailwind border color class e.g. 'border-emerald-400'
// The belt automatically duplicates the list so it loops seamlessly.
// ─────────────────────────────────────────────────────────────────────────────
const CertificationsSection = () => {
  const certs = [
    // ── REPLACE THESE WITH YOUR REAL CERTIFICATES ──────────────────────────
    { title: 'GIS Mapathon Win',                    issuer: 'NeST Digital',       date: 'Jun 2026',     color: 'border-emerald-400' },
    { title: 'PCB Desgin Workshop',                 issuer: 'RSET/Electronauts',  date: 'Sept 2024',    color: 'border-cyan-400'    },
    { title: 'Microprocessors and Microcontrollers',issuer: 'NPTEL',              date: 'Jan-Apr 2025', color: 'border-amber-400'   },
    { title: 'ELectronauts Execom',                 issuer: 'RSET/ Electronauts', date: 'May 2026',     color: 'border-purple-400'  },
    { title: 'IEDC Summit 2024',                    issuer: 'IEDC',               date: 'Sep 2024',     color: 'border-blue-400'    },
    { title: 'CarbonX Hackathon Organizer',         issuer: 'ECE Dept & C-DAC',   date: 'Mar 2026',     color: 'border-pink-400'    },
    { title: 'Abhiyanthriki Organizer',             issuer: 'RSET',               date: 'Oct 2025',     color: 'border-sky-900'    },
    { title: 'Multiple Intercollege Maths Quizzes', issuer: 'Different Colleges', date: '2023-2026',    color: 'border-red-400'    },   
    { title: 'Machine Learning for Engineering and science applications', issuer: 'NPTEL', date: '2026',color: 'border-lime-300'    },
    { title: 'Bharatham - Art Festival',            issuer: 'RSET',               date: '2025-2026',    color: 'borde-emerald-400'    },
    { title: 'Embedded Sensing, Actuation and Interfacing Systems', issuer: 'NPTEL', date: '2026',      color: 'border-orange-400'    },
    // ────────────────────────────────────────────────────────────────────────
  ];

  // Speed is in px/s. Increases when mouse is near an edge.
  const [speed, setSpeed] = useState(110);
  const beltRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef  = useRef(0);
  const speedRef = useRef(speed);

  // Keep speedRef in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Animate the belt using requestAnimationFrame for smooth, JS-driven scroll
  useEffect(() => {
    let last = performance.now();
    const CARD_W  = 280 + 24; // card width + gap (px) — change if you resize cards
    const TOTAL_W = CARD_W * certs.length; // width of one full copy of the list

    const tick = (now: number) => {
      const dt = (now - last) / 1000; // seconds since last frame
      last = now;
      posRef.current -= speedRef.current * dt;
      // Reset when we've scrolled one full copy — creates seamless loop
      if (posRef.current <= -TOTAL_W) posRef.current += TOTAL_W;
      if (beltRef.current) {
        beltRef.current.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [certs.length]);

  // Detect mouse position relative to section to adjust speed
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const w    = rect.width;
    const EDGE = 120; // px from edge that triggers speed boost
    if (x < EDGE || x > w - EDGE) {
      setSpeed(60); // faster near edges
    } else {
      setSpeed(110);  // normal speed in the middle
    }
  };

  return (
    <section
      id="certifications"
      className="py-32 bg-[#111111] border-t border-white/10 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSpeed(40)}
    >
      <CircuitBackground />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/40 font-bold block mb-4">SECTION_05 // CREDENTIALS</span>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">Certifications</h2>
        </motion.div>
      </div>

      {/* Conveyor belt — overflows the section so cards slide edge-to-edge */}
      <div className="relative overflow-hidden">
        {/* Left fade mask */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none" />
        {/* Right fade mask */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none" />

        {/* Belt — contains TWO copies of the list for seamless looping */}
        <div ref={beltRef} className="flex gap-6 will-change-transform" style={{ width: 'max-content' }}>
          {/* Render the list twice so the loop is seamless */}
          {[...certs, ...certs].map((cert, i) => (
            <div
              key={i}
              // ── CERTIFICATE CARD ──────────────────────────────────────────
              // w-[280px] = card width. Change here AND update CARD_W in useEffect above.
              // color (border) is set per-cert in the certs array at the top.
              className={`w-[280px] shrink-0 p-6 bg-black/70 backdrop-blur-md border ${cert.color} rounded-2xl border-opacity-40 hover:border-opacity-100 transition-all group`}
            >
              {/* Cert icon placeholder — replace with an <img> of the cert logo if you have one */}
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              {/* ── REPLACE: cert.title and cert.issuer in the certs array above ── */}
              <h3 className="text-white font-bold text-sm uppercase tracking-tight mb-1 leading-snug">{cert.title}</h3>
              <p  className="text-emerald-400/60 text-[11px] uppercase tracking-widest mb-3">{cert.issuer}</p>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{cert.date}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="contact" className="py-32 bg-[#111111] border-t border-white/10 relative overflow-hidden">
      <CircuitBackground />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/40 font-bold block mb-4">SECTION_06 // COMMS_ESTABLISHED</span>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">Get In Touch</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.button 
            onClick={() => copyToClipboard('shine.kaine2249@gmail.com', 'email')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-black/80 transition-all group relative cursor-pointer"
          >
            <Mail className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">{copied === 'email' ? 'Copied!' : 'Mail'}</span>
            <div className="absolute bottom-4 text-[9px] uppercase tracking-widest text-white/20 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</div>
          </motion.button>

          <motion.a 
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-black/80 transition-all group cursor-pointer"
          >
            <Github className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">GitHub Profile</span>
          </motion.a>

          <motion.a 
            href="https://www.linkedin.com/in/shine-daniel2"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center text-center hover:border-emerald-500/60 hover:bg-black/80 transition-all group cursor-pointer"
          >
            <Linkedin className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">LinkedIn Profile</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>('loading');
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (state !== 'portfolio') return;

    const handleScroll = () => {
      const sections = ['intro', 'experience', 'projects', 'interests', 'certifications', 'contact'];
      
      // Check if we're near the bottom of the page first (for Contact section)
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition + windowHeight >= fullHeight - 100) {
        setActiveSection('contact');
        return;
      }

      // Otherwise, find the current section based on scroll position
      let current = 'intro';
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // We consider a section active if its top is within the upper part of the viewport
          if (rect.top <= 160) {
            current = id;
          }
        }
      }
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [state]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-500 selection:text-black">
      <AnimatePresence>
        {state === 'loading' && (
          <LoadingScreen key="loading" onComplete={() => setState('terminal')} />
        )}
        {state === 'terminal' && (
          <TerminalScreen key="terminal" onComplete={() => setState('portfolio')} />
        )}
      </AnimatePresence>

      {state === 'portfolio' && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <header className={`fixed top-0 w-full z-[100] h-20 backdrop-blur-md border-b-4 flex justify-between items-center px-6 md:px-12 shadow-md transition-colors duration-300 ${
            activeSection === 'contact' ? 'bg-black/80 border-white/20' : 'bg-white/40 border-slate-900'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#e53935] border-2 border-slate-900 shadow-[2px_2px_0px_0px_#b71c1c]" />
              <span className={`text-xl font-black tracking-tighter uppercase transition-colors ${
                activeSection === 'contact' ? 'text-white' : 'text-slate-900'
              }`}>SHINE//ECE</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-4 uppercase font-bold text-[10px] tracking-widest leading-none">
              <button 
                onClick={() => scrollToSection('intro')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'intro' 
                    ? 'border-slate-900 text-slate-900 bg-white/50' 
                    : activeSection === 'contact' ? 'border-transparent text-white/60 hover:text-white hover:bg-white/10' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('experience')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'experience' 
                    ? 'border-slate-900 text-slate-900 bg-white/50' 
                    : activeSection === 'contact' ? 'border-transparent text-white/60 hover:text-white hover:bg-white/10' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Experience
              </button>
              <button 
                onClick={() => scrollToSection('projects')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'projects' 
                    ? 'border-slate-900 text-slate-900 bg-white/50' 
                    : activeSection === 'contact' ? 'border-transparent text-white/60 hover:text-white hover:bg-white/10' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Projects
              </button>
              <button 
                onClick={() => scrollToSection('interests')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'interests' 
                    ? 'border-slate-900 text-slate-900 bg-white/50' 
                    : activeSection === 'contact' ? 'border-transparent text-white/60 hover:text-white hover:bg-white/10' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Skills
              </button>
              <button 
                onClick={() => scrollToSection('certifications')} 
                className={`px-4 py-2 transition-all rounded cursor-pointer hover:scale-110 active:scale-95 uppercase border-2 ${
                  activeSection === 'certifications' 
                    ? 'border-slate-900 text-slate-900 bg-white/50' 
                    : activeSection === 'contact' ? 'border-transparent text-white/60 hover:text-white hover:bg-white/10' : 'border-transparent text-black hover:text-white hover:bg-black'
                }`}
              >
                Certifications
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => scrollToSection('contact')}
                className={`flex items-center font-black rounded border-2 uppercase text-[10px] transition-all cursor-pointer hover:scale-105 px-6 h-10 ${
                  activeSection === 'contact' 
                    ? 'bg-[#e53935] text-white border-white shadow-[0px_0px_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-[#e53935] text-white border-slate-900 shadow-[3px_3px_0px_0px_#b71c1c] active:translate-y-1 active:shadow-none'
                }`}
              >
                Connect
              </button>
            </div>
          </header>

          <main>
            <LegoSection />
            <MinecraftSection />
            <SchematicSection />
            <InterestsSection />
            <CertificationsSection />
            <ContactSection />
          </main>

          <footer className="bg-[#0a0a0a] py-20 text-slate-500 font-mono border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
              <div className="mb-12">
                <div className="text-8xl font-black text-white/5 select-none leading-none">Lets Cook ;D</div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase font-bold tracking-[0.4em]">
                <div className="flex items-center gap-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>© SHINE DANIEL // ECE // 2026</span>
                </div>
                <div className="flex gap-8">
                  <span>MENTAL_STATE: OPERATIONAL</span>
                  <span>ENCRYPTION: GENZ-256</span>
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
}
