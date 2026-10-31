import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import RedstoneDustBackground from './RedstoneDustBackground';
import CircuitBackground from './CircuitBackground';
import layoutData from './trailLayoutData.ts';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Img = string | { src: string; fit: 'cover' | 'contain' };
export type TrailItem = {
  title: string;
  sub: string;
  desc: string;
  details: string;
  images: Img[];
  img?: string;
  id?: string;
  tags?: string[];
  isFavorite?: boolean;
  isWIP?: boolean;
  highlight?: string;
  // Which fork road a NEW project joins when it has no hand-placed card: 'Embedded' | 'VLSI'.
  // (Every project also appears on the ALL road.)
  track?: 'Embedded' | 'VLSI';
};

type Theme = 'modern' | 'minecraft';

type Props = {
  experiences: TrailItem[];
  projects: TrailItem[];
  onOpen: (item: TrailItem, theme: Theme) => void;
};

// ── ROADS DEFINITION FOR PROJECTS FORK ─────────────────────────────────────────
// One button per road. `key` is the road's name inside trailLayoutData.ts.
// Which projects sit on a road comes from the layout's hand-placed cards,
// plus any NEW project is placed automatically (see AUTO-PLACEMENT below).
const ROADS: { name: string; key: 'Embedded' | 'All' | 'VLSI' }[] = [
  { name: 'Embedded', key: 'Embedded' },
  { name: 'ALL', key: 'All' },
  { name: 'VLSI', key: 'VLSI' },
];

// ── LIGHT-UP HELPERS ──────────────────────────────────────────────────────────
// Turns a road's svgPath into a list of (y, distance-along-road) samples, so we can
// ask: "how much of this road is above the light-up line?"
type Profile = { xs: number[]; ys: number[]; ss: number[]; total: number };
function buildProfile(d: string): Profile {
  const n = (d.match(/-?\d*\.?\d+/g) || []).map(Number);
  let px = n[0], py0 = n[1];
  const xs = [px], ys = [py0], ss = [0];
  let total = 0;
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    const x0 = px, y0 = py0;
    for (let k = 1; k <= 40; k++) {
      const t = k / 40, u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      total += Math.hypot(x - px, y - py0);
      px = x; py0 = y;
      xs.push(x); ys.push(y); ss.push(total);
    }
  }
  return { xs, ys, ss, total };
}

// 0..1 = how much of the road is lit when the light-up line is at height litY.
// The road lights from its start until it first dips below the line, so roads that
// wind back upward still light in the right order.
function litFraction(p: Profile, litY: number): number {
  if (p.ys[0] > litY) return 0;
  for (let i = 1; i < p.ys.length; i++) {
    if (p.ys[i] > litY) {
      const t = (litY - p.ys[i - 1]) / (p.ys[i] - p.ys[i - 1]);
      return (p.ss[i - 1] + t * (p.ss[i] - p.ss[i - 1])) / p.total;
    }
  }
  return 1;
}

// ── AUTO-PLACEMENT ────────────────────────────────────────────────────────────
// For cards that have no hand-placed position: put each one ON the road, at the spot
// that is farthest from every card already there (so new cards fill the biggest gaps).
type Pt = { x: number; y: number };
function autoPlace(
  p: Profile, existing: Pt[], n: number,
  b: { minX: number; maxX: number; minY: number; maxY: number }, w: number, h: number,
): Pt[] {
  let cands: Pt[] = [];
  for (let i = 0; i < p.ys.length; i += 3) {
    const c = { x: p.xs[i], y: p.ys[i] };
    if (c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY) cands.push(c);
  }
  if (!cands.length) cands = p.ys.map((y, i) => ({ x: p.xs[i], y }));
  const taken = [...existing];
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let best: Pt | null = null, bestD = -1;
    for (const c of cands) {
      let d = taken.length ? Infinity : 0;
      for (const t of taken) d = Math.min(d, Math.hypot((c.x - t.x) / w, (c.y - t.y) / h));
      if (d > bestD) { bestD = d; best = c; }
    }
    if (!best) break;
    out.push(best); taken.push(best);
  }
  return out;
}

// ── RED → GREEN PIXEL BLEND ───────────────────────────────────────────────────
// Instead of cutting the road with a hard line where the sections meet, we dither it:
// a band of square "pixels" around the boundary where the chance of a pixel being green
// rises smoothly from 0 (top of band) to 1 (bottom of band), like a Minecraft gradient banner.
const BLEND_HALF_HEIGHT = 260; // band reaches this far above AND below the section boundary
// Soft glow around the lit road. The blur filter looks best but is very expensive to redraw while scrolling,
// so by default we fake it with two wide see-through strokes. Set true to use the original blur.
const USE_BLUR_GLOW = false;
const BLEND_PIXEL = 8;         // size of each pixel in the band (smaller = finer, 8 = very fine)
const NO_PIXEL_ZONES: { x0: number; x1: number; y0: number; y1: number; fade: number }[] = [];
const hash2 = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ── ARC-LENGTH HELPER (used to number experiences in trail order) ─────────────
function arcPos(p: Profile, pt: { x: number; y: number }): number {
  let best = 0, bd = Infinity;
  for (let i = 0; i < p.xs.length; i++) {
    const d = Math.hypot(p.xs[i] - pt.x, p.ys[i] - pt.y);
    if (d < bd) { bd = d; best = i; }
  }
  return p.ss[best];
}

// SVG props that draw only the first `f` (0..1) of a road. Hidden at 0 so no stray dot appears.
const dash = (f: number) => ({
  pathLength: 1,
  strokeDasharray: `${f} 2`,
  strokeOpacity: f > 0.001 ? 1 : 0,
});

// ── FLOATING DECORATIONS ─────────────────────────────────────────────────────
const BOTTLE_SRC = '/pictures/UI_Elements/experience.gif';
const CHIP_SRC = '/pictures/UI_Elements/robott.png';

// Bottle o' Enchanting (Experiences heading): bobs up/down, sways left/right, and flips now and then,
// accompanied by authentic Minecraft potion swirl particles, XP orbs, and enchantment table runes floating up.
const FLIP_EVERY = 6;
const BOTTLE_LIFT = 30;

const POTION_PARTICLES = [
  { x: -16, y: 12, size: 5, color: '#a6ff54', glow: '#55ff55', delay: 0.0, dur: 2.8, dx: -14, type: 'orb' },
  { x: 14, y: 18, size: 4, color: '#ffe838', glow: '#ffff55', delay: 0.5, dur: 3.1, dx: 14, type: 'orb' },
  { x: -6, y: -6, size: 7, color: '#38ffdc', glow: '#00ffff', delay: 1.1, dur: 2.9, dx: -8, type: 'rune', char: 'ᔑ' },
  { x: 18, y: -2, size: 5, color: '#c084fc', glow: '#d946ef', delay: 1.6, dur: 3.4, dx: 12, type: 'orb' },
  { x: -20, y: 22, size: 4, color: '#ffe838', glow: '#ffff55', delay: 2.2, dur: 3.0, dx: -16, type: 'orb' },
  { x: 6, y: 14, size: 7, color: '#a6ff54', glow: '#55ff55', delay: 2.7, dur: 2.7, dx: 10, type: 'rune', char: '✦' },
  { x: -2, y: 28, size: 5, color: '#34d399', glow: '#10b981', delay: 3.3, dur: 3.3, dx: -6, type: 'orb' },
  { x: 16, y: 32, size: 4, color: '#f472b6', glow: '#ec4899', delay: 3.8, dur: 3.1, dx: 16, type: 'orb' },
  { x: -12, y: 2, size: 7, color: '#ffe838', glow: '#ffff55', delay: 4.4, dur: 2.9, dx: -12, type: 'rune', char: 'ᦔ' },
  { x: 8, y: -12, size: 5, color: '#a6ff54', glow: '#55ff55', delay: 5.0, dur: 3.2, dx: 8, type: 'orb' },
];

const EnchantBottle = () => (
  <div aria-hidden className="hidden md:flex self-end shrink-0 pointer-events-none" style={{ perspective: 600, marginBottom: BOTTLE_LIFT }}>
    <style>{`
      @keyframes mc-potion-rise {
        0% {
          transform: translate(0, 0) scale(0.4) rotate(0deg);
          opacity: 0;
        }
        15% {
          opacity: 0.95;
          transform: translate(calc(var(--pdx) * 0.4), -18px) scale(1) rotate(45deg);
        }
        50% {
          opacity: 1;
          transform: translate(calc(var(--pdx) * -0.6), -45px) scale(1.15) rotate(90deg);
        }
        85% {
          opacity: 0.75;
          transform: translate(calc(var(--pdx) * 0.8), -72px) scale(0.85) rotate(135deg);
        }
        100% {
          transform: translate(var(--pdx), -95px) scale(0.2) rotate(180deg);
          opacity: 0;
        }
      }
    `}</style>
    <motion.div animate={{ y: [-10, 8, -10] }} transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}>
      <motion.div className="relative" animate={{ x: [-9, 9, -9], rotate: [-5, 10, -5] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}>

        {/* Floating Potion Particles & XP Orbs */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {POTION_PARTICLES.map((p, i) => (
            <div
              key={`potion-particle-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                ['--pdx' as any]: `${p.dx}px`,
                animation: `mc-potion-rise ${p.dur}s infinite ease-out`,
                animationDelay: `${p.delay}s`,
                pointerEvents: 'none',
              }}
            >
              {p.type === 'orb' ? (
                <div
                  style={{
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    boxShadow: `0 0 6px ${p.glow}, 0 0 2px #fff`,
                    transform: 'rotate(45deg)',
                    imageRendering: 'pixelated',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: `${p.size * 2}px`,
                    color: p.color,
                    textShadow: `0 0 8px ${p.glow}`,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    display: 'block',
                    userSelect: 'none',
                  }}
                >
                  {p.char}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* The Enchantment Bottle Image */}
        <motion.img
          src={BOTTLE_SRC}
          alt=""
          draggable={false}
          className="relative z-10 w-20 md:w-22 pointer-events-none"
          style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 12px rgba(160,255,120,0.45))' }}
          animate={{ rotateY: [0, 0, 360] }}
          transition={{ duration: FLIP_EVERY, times: [0, 0.9, 1], repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  </div>
);

// Robot (Projects heading): floats with animated sparks firing simultaneously from BOTH ears.
const ROBOT_LOOP = 4.2;
const ROBOT_SPARK_LEFT_AT = { l: 0, t: 65 };
const ROBOT_SPARK_RIGHT_AT = { l: 100, t: 50 };
const ROBOT_FALL = 60;
const ROBOT_LIFT = 8;

const ROBOT_SPARKS_LEFT = [
  { dx: -46, up: -26, d: 0 },
  { dx: -28, up: -36, d: 0.02 },
  { dx: -10, up: -30, d: 0.01 },
  { dx: -18, up: -34, d: 0.03 },
  { dx: -38, up: -24, d: 0.015 },
  { dx: -46, up: -30, d: 0.025 },
  { dx: -38, up: -14, d: 0.035 },
  { dx: -26, up: -16, d: 0.005 },
];

const ROBOT_SPARKS_RIGHT = [
  { dx: 40, up: -26, d: 0 },
  { dx: 22, up: -36, d: 0.02 },
  { dx: 4, up: -30, d: 0.01 },
  { dx: 12, up: -34, d: 0.03 },
  { dx: 32, up: -24, d: 0.015 },
  { dx: 40, up: -30, d: 0.025 },
  { dx: 32, up: -14, d: 0.035 },
  { dx: 20, up: -16, d: 0.005 },
];

const FloatingChip = () => (
  <div aria-hidden className="hidden md:block self-end shrink-0 pointer-events-none" style={{ marginBottom: ROBOT_LIFT }}>
    <style>{`
      /* BOTH EARS SPARK SIMULTANEOUSLY */
      @keyframes robot-spark-x-left {
        0%        { transform: translateX(0); animation-timing-function: ease-out; }
        32%, 100% { transform: translateX(var(--dx)); }
      }
      @keyframes robot-spark-x-right {
        0%        { transform: translateX(0); animation-timing-function: ease-out; }
        32%, 100% { transform: translateX(var(--dx)); }
      }
      @keyframes robot-spark-y {
        0%        { transform: translateY(0); opacity: 0; animation-timing-function: ease-out; }
        2%        { opacity: 1; }
        9%        { transform: translateY(var(--up)); opacity: 1; animation-timing-function: ease-in; }
        32%       { transform: translateY(var(--fall)); opacity: 1; }
        40%, 100% { transform: translateY(var(--fall)); opacity: 0; }
      }
      @keyframes robot-flash {
        0%        { opacity: 1; transform: scale(0.4); }
        6%        { opacity: 1; transform: scale(1); }
        14%, 100% { opacity: 0; transform: scale(1.6); }
      }
    `}</style>
    <motion.div animate={{ y: [-10, 8, -10] }} transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}>
      <motion.div className="relative" animate={{ x: [-9, 9, -9], rotate: [-5, 10, -5] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}>
        <img
          src={CHIP_SRC}
          alt=""
          draggable={false}
          className="block w-27 pointer-events-none"
          style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.35))' }}
        />

        {/* ── LEFT EAR SPARK ── */}
        <div style={{ position: 'absolute', left: `${ROBOT_SPARK_LEFT_AT.l}%`, top: `${ROBOT_SPARK_LEFT_AT.t}%`, width: 0, height: 0 }}>
          <div style={{
            position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(210,246,255,0.95) 0%, rgba(56,189,248,0.5) 45%, transparent 70%)',
            animation: `robot-flash ${ROBOT_LOOP}s infinite`,
          }} />
          {ROBOT_SPARKS_LEFT.map((sp, i) => (
            <div key={`left-spark-${i}`} style={{
              position: 'absolute', left: 0, top: 0,
              ['--dx' as any]: `${sp.dx}px`,
              animation: `robot-spark-x-left ${ROBOT_LOOP}s infinite`,
              animationDelay: `${sp.d}s`,
            }}>
              <div style={{
                width: 3, height: 3, marginLeft: -1, marginTop: -1,
                background: i % 3 === 0 ? '#e0faff' : i % 3 === 1 ? '#54d7ff' : '#2aa9e0',
                boxShadow: '0 0 4px rgba(84,215,255,0.9)',
                ['--up' as any]: `${sp.up}px`,
                ['--fall' as any]: `${ROBOT_FALL}px`,
                animation: `robot-spark-y ${ROBOT_LOOP}s infinite`,
                animationDelay: `${sp.d}s`,
              }} />
            </div>
          ))}
        </div>

        {/* ── RIGHT EAR SPARK ── */}
        <div style={{ position: 'absolute', left: `${ROBOT_SPARK_RIGHT_AT.l}%`, top: `${ROBOT_SPARK_RIGHT_AT.t}%`, width: 0, height: 0 }}>
          <div style={{
            position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(210,246,255,0.95) 0%, rgba(56,189,248,0.5) 45%, transparent 70%)',
            animation: `robot-flash ${ROBOT_LOOP}s infinite`,
          }} />
          {ROBOT_SPARKS_RIGHT.map((sp, i) => (
            <div key={`right-spark-${i}`} style={{
              position: 'absolute', left: 0, top: 0,
              ['--dx' as any]: `${sp.dx}px`,
              animation: `robot-spark-x-right ${ROBOT_LOOP}s infinite`,
              animationDelay: `${sp.d}s`,
            }}>
              <div style={{
                width: 3, height: 3, marginLeft: -1, marginTop: -1,
                background: i % 3 === 0 ? '#e0faff' : i % 3 === 1 ? '#54d7ff' : '#2aa9e0',
                boxShadow: '0 0 4px rgba(84,215,255,0.9)',
                ['--up' as any]: `${sp.up}px`,
                ['--fall' as any]: `${ROBOT_FALL}px`,
                animation: `robot-spark-y ${ROBOT_LOOP}s infinite`,
                animationDelay: `${sp.d}s`,
              }} />
            </div>
          ))}
        </div>

      </motion.div>
    </motion.div>
  </div>
);

// ── CARDS ─────────────────────────────────────────────────────────────────────
// Separate memoised components so scrolling (which changes the light-up line constantly) does not
// re-render every card. Each card only re-renders when its own `isLit` flips. 
type CardProps = { s: any; isLit: boolean; left: string; top: string; width: string; onOpen: (item: TrailItem, theme: Theme) => void };

const ExpCard = React.memo(function ExpCard({ s, isLit, left, top, width, onOpen }: CardProps) {
  const it = s.item;
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto" style={{ left, top, width }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
        onClick={() => onOpen(it, 'minecraft')}
        className={`w-full p-5 md:p-6 border-4 border-slate-900 shadow-[inset_4px_4px_0px_0px_rgba(255,255,255,0.06),inset_-4px_-4px_0px_0px_rgba(0,0,0,0.5),0_15px_30px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row gap-5 items-center sm:items-start group transition-colors cursor-pointer ${isLit
          ? 'bg-[#3d2b1f] hover:bg-[#523d2d] shadow-[0_0_25px_rgba(239,68,68,0.25)]'
          : 'bg-[#332217] hover:bg-[#3d2b1f] opacity-85'
          }`}
      >
        <div className="shrink-0 w-[64px] h-[64px] bg-slate-900/40 border-4 border-slate-900 flex items-center justify-center p-2 shadow-inner">
          {it.img ? (
            <img src={it.img} alt={it.title} loading="lazy" className="w-full h-full object-contain -mt-[2px]" />
          ) : (
            <div className="w-8 h-8 bg-emerald-500 rounded-sm" />
          )}
        </div>
        <div className="text-center sm:text-left flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold mb-1 text-white uppercase font-minecraft leading-tight group-hover:text-emerald-300 transition-colors">
            {it.title}
          </h3>
          <p className="text-[#10b981] text-xs md:text-sm mb-3 uppercase tracking-[0.2em] font-minecraft">
            {it.sub}
          </p>
          <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-sans font-medium mb-3 line-clamp-4">
            {it.desc}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-black/30">
            <p className="text-white/25 text-[10px] md:text-xs uppercase tracking-widest group-hover:text-emerald-400/80 transition-colors">
              Click to expand →
            </p>
            <span className="text-[10px] text-stone-400 font-minecraft">
              [LEVEL {s.level + 1}]
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

const ProjCard = React.memo(function ProjCard({ s, isLit, left, top, width, onOpen }: CardProps) {
  const it = s.item;
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto" style={{ left, top, width }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        whileHover={{ scale: 1.05, y: -4, transition: { duration: 0.2 } }}
        onClick={() => onOpen(it, 'modern')}
        className={`group border bg-black/85 p-6 hover:bg-black/90 transition-colors relative overflow-hidden cursor-pointer rounded-lg ${isLit
          ? it.isFavorite
            ? 'border-emerald-400/80 hover:border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
            : 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'border-emerald-500/20 opacity-80'
          }`}
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/40 group-hover:border-emerald-400 transition-colors" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/40 group-hover:border-emerald-400 transition-colors" />
        {it.isWIP && (
          <div className="absolute top-4 right-4 bg-amber-500/20 border border-amber-500/60 px-3 py-1 rounded-lg">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">WIP</span>
          </div>
        )}
        <h3 className="text-2xl font-bold uppercase mb-4 text-white group-hover:text-emerald-400 transition-colors tracking-tight font-sans mt-4">
          {it.title}
        </h3>
        <p className="text-emerald-500/70 text-sm mb-6 leading-relaxed font-sans font-medium line-clamp-3">
          {it.desc}
        </p>
        {it.tags && it.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {it.tags.map((tag: string) => (
              <span key={tag} className="text-[10px] px-2.5 py-1 border border-emerald-500/30 bg-emerald-950/40 text-emerald-400/80 uppercase font-mono font-bold rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
          <p className="text-white/20 uppercase tracking-widest group-hover:text-emerald-400/60 transition-colors">
            Click to expand →
          </p>
          {it.isFavorite && (
            <span className="text-amber-400 font-bold text-lg leading-none">★</span>
          )}
        </div>
      </motion.div>
    </div>
  );
});

export default function TrailSection({ experiences, projects, onOpen }: Props) {
  const [sel, setSel] = useState<number>(1);

  // ── LAYOUT DATA ──
  const { stage, sections, road, cardSize, roads, forkJunction } = layoutData;
  const W = stage.width;
  const H = stage.height;

  // ── LIGHT-UP LINE ──
  // litY = the height (in stage units) of the light-up line. Roads and cards above it are lit.
  // The line sits lightUpLinePercentOfScreen % of the way down the screen.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [litY, setLitY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const lineOnScreen = window.innerHeight * (road.lightUpLinePercentOfScreen / 100);
      const v = Math.round(((lineOnScreen - rect.top) / rect.height) * H / 4) * 4; // 4-unit steps = far fewer re-renders
      setLitY(prev => (prev === v ? prev : v));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); }; // at most once per frame
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [H, road.lightUpLinePercentOfScreen]);

  // Where the stage starts inside the full-width side background (so textures line up without a giant layer).
  const [stageLeft, setStageLeft] = useState(0);
  useEffect(() => {
    const measure = () => setStageLeft(wrapRef.current?.offsetLeft || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pixel cells for the red→green blend band (computed once; depends only on the layout).
  const blend = useMemo(() => {
    const top = sections.projectsSectionStartsAtY - BLEND_HALF_HEIGHT;
    const bottom = sections.projectsSectionStartsAtY + BLEND_HALF_HEIGHT;
    const cols = Math.ceil(W / BLEND_PIXEL);
    const rows = Math.ceil((bottom - top) / BLEND_PIXEL);
    let redD = '', greenD = '';
    for (let j = 0; j < rows; j++) {
      const y = top + j * BLEND_PIXEL;
      let runStart = 0;
      let runGreen: boolean | null = null;
      // adjacent pixels of the same colour are merged into one wide rectangle
      const flush = (end: number) => {
        if (runGreen === null) return;
        const w = (end - runStart) * BLEND_PIXEL;
        const seg = `M${runStart * BLEND_PIXEL} ${y}h${w}v${BLEND_PIXEL}h-${w}z`;
        if (runGreen) greenD += seg; else redD += seg;
      };
      for (let i = 0; i < cols; i++) {
        const x = i * BLEND_PIXEL;
        // ramp only across the middle of the band, so the first/last stretch is pure red / pure green (no stray pixels)
        const t = Math.min(1, Math.max(0, ((y + BLEND_PIXEL / 2 - top) / (bottom - top) - 0.15) / 0.7));
        let zone = 0; // 0..1: how strongly a no-pixel zone suppresses green here (1 = fully red)
        for (const z of NO_PIXEL_ZONES) {
          if (x >= z.x0 && y >= z.y0) zone = Math.max(zone, Math.min(1, (z.x1 - x) / z.fade, (z.y1 - y) / z.fade));
        }
        const p = (1 - Math.max(0, zone)) * (0.15 * t + 0.85 * (t * t * (3 - 2 * t))); // chance this pixel is green
        // each pixel randomly joins a 1x1, 2x2 or 4x4 clump: a mix of single pixels and small blocks
        const pick = hash2(i + 5, j + 9);
        const sh = pick < 0.5 ? 0 : pick < 0.8 ? 1 : 2;
        const n = hash2((i >> sh) + 91 * sh, (j >> sh) + 17 * sh);
        const isGreen = n < p;
        if (isGreen !== runGreen) { flush(i); runStart = i; runGreen = isGreen; }
      }
      flush(cols);
    }
    return { top, bottom, redD, greenD };
  }, [sections.projectsSectionStartsAtY, W]);

  const profiles = useMemo(() => {
    const out: Record<string, Profile> = {};
    ['exp', 'stub', 'Embedded', 'VLSI', 'All'].forEach(k => { out[k] = buildProfile((roads as any)[k].svgPath); });
    return out;
  }, []);
  const frac = (k: string) => litFraction(profiles[k], litY);

  const px = (x: number) => `${(x / W) * 100}%`;
  const py = (y: number) => `${(y / H) * 100}%`;

  // Which project road is showing (one per button).
  const activeProjPaths: string[] = [ROADS[sel].key];

  // ── CARD POSITIONS (hand-placed from the layout + auto-placed for anything new) ──
  const { expCards, projByRoad } = useMemo(() => {
    const ew = cardSize.experience.w, eh = cardSize.experience.h;
    const pw = cardSize.project.w, ph = cardSize.project.h;

    // Experiences: layout cards map by ORDER; extra experiences are auto-placed on the exp road.
    const handExp = roads.exp.cards.slice(0, experiences.length).map((c, i) => ({ x: c.x, y: c.y, title: c.title, index: i, item: experiences[i], auto: false }));
    const extraExp = experiences.slice(handExp.length);
    const autoExp = autoPlace(
      profiles.exp, handExp, extraExp.length,
      { minX: ew / 2 + 10, maxX: W - ew / 2 - 10, minY: sections.experiencesHeadingHeight + eh / 2, maxY: sections.projectsSectionStartsAtY - eh / 2 - 20 },
      ew, eh,
    ).map((pt, k) => ({ x: pt.x, y: pt.y, title: extraExp[k].title, index: handExp.length + k, item: extraExp[k], auto: true }));
    // Number cards in TRAIL order (top of the red road → fork), so [LEVEL n] always reads
    // in the order a visitor walks the road, even when new cards land in gaps.
    const expCards = [...handExp, ...autoExp]
      .map(c => ({ ...c, along: arcPos(profiles.exp, c) }))
      .sort((a, b) => a.along - b.along)
      .map((c, level) => ({ ...c, level }));
    // Heads-up in the console if the red road is too full and cards start overlapping.
    for (let i = 0; i < expCards.length; i++) for (let j = i + 1; j < expCards.length; j++) {
      if (Math.abs(expCards[i].x - expCards[j].x) < ew * 0.9 && Math.abs(expCards[i].y - expCards[j].y) < eh * 0.9) {
        console.warn(`[TrailSection] Experience cards "${expCards[i].title}" and "${expCards[j].title}" overlap.`);
      }
    }

    // Projects: hand-placed cards map by id; projects with no card on a road are auto-placed on it.
    const projByRoad: Record<string, any[]> = {};
    ROADS.forEach(({ key }) => {
      const hand = ((roads as any)[key].cards as any[])
        .map((c, i) => ({ x: c.x, y: c.y, id: c.id, title: c.title, index: i, item: projects.find(p => p.id === c.id), auto: false }))
        .filter(c => c.item);
      const have = new Set(hand.map(c => c.id));
      const todo = projects.filter(p => p.id && !have.has(p.id) && (key === 'All' || p.track === key));
      const prof = profiles[key];
      const auto = autoPlace(
        prof, hand, todo.length,
        { minX: pw / 2 + 10, maxX: W - pw / 2 - 10, minY: forkJunction[1] + 80, maxY: prof.ys[prof.ys.length - 1] - 200 },
        pw, ph,
      ).map((pt, k) => ({ x: pt.x, y: pt.y, id: todo[k].id, title: todo[k].title, index: hand.length + k, item: todo[k], auto: true }));
      projByRoad[key] = [...hand, ...auto];
    });
    return { expCards, projByRoad };
  }, [experiences, projects]);

  const projCards = useMemo(() => activeProjPaths.flatMap(pathName => projByRoad[pathName].map(c => ({ ...c, pathName }))), [sel, projByRoad]);

  return (
    <div className="relative w-full overflow-hidden bg-[#111111]">

      {/* ═════ FULL-WIDTH SIDE BACKGROUND ═════
          Same textures as the two sections, but stretched edge to edge so there are no white strips.
          The texture layers start 5120px left of the stage so the pattern lines up with the sections. */}
      <div data-section="experience" className="absolute inset-x-0 top-0 bg-[#4a3424] overflow-hidden" style={{ height: py(sections.projectsSectionStartsAtY) }}>
        <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`, backgroundSize: '256px 256px', backgroundPosition: `${stageLeft}px 0` }} />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`, backgroundSize: '64px 64px', backgroundPosition: Array(4).fill(`${stageLeft}px 0`).join(',') }} />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#111111]" />
      </div>
      <div data-section="projects" className="absolute inset-x-0 bottom-0 bg-[#111111] overflow-hidden" style={{ top: py(sections.projectsSectionStartsAtY) }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 0 0, rgba(52,211,153,0.08) 1.2px, transparent 1.7px)', backgroundSize: '40px 40px', backgroundPosition: `${stageLeft}px 0` }} />
      </div>

      {/* ═════ THE 1400-WIDE STAGE ═════ */}
      <div ref={wrapRef} className="relative w-full max-w-[1400px] mx-auto" style={{ aspectRatio: `${W} / ${H}` }}>

        {/* ═════════════════════════════════════════════════════════════════════════
          BACKGROUNDS
          ═════════════════════════════════════════════════════════════════════════ */}
        <section
          id="experience"
          className="absolute top-0 w-full bg-[#4a3424] overflow-hidden z-0"
          style={{ height: py(sections.projectsSectionStartsAtY) }}
        >
          <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-matter.png')`, backgroundSize: '256px 256px' }} />
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`, backgroundSize: '64px 64px' }} />
          <RedstoneDustBackground />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#111111] pointer-events-none z-10" />
        </section>

        <section
          id="projects"
          className="absolute w-full bg-[#111111] overflow-hidden z-0"
          style={{ top: py(sections.projectsSectionStartsAtY), height: py(H - sections.projectsSectionStartsAtY) }}
        >
          <CircuitBackground gridVisible={true} />
        </section>

        {/* ═════════════════════════════════════════════════════════════════════════
          SVG TRAIL LAYER
          ═════════════════════════════════════════════════════════════════════════ */}
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            {/* Smooth (never pixelated) clips for the road OUTLINE: red above the band, a neutral dark inside it, green below */}
            <clipPath id="clip-exp-outline"><rect x="0" y="0" width={W} height={blend.top} /></clipPath>
            <clipPath id="clip-band-outline"><rect x="0" y={blend.top} width={W} height={blend.bottom - blend.top} /></clipPath>
            {/* Glow clips (smooth): red glow stops at the bottom of the band, green glow starts at its top */}
            <clipPath id="clip-red-glow"><rect x="0" y="0" width={W} height={blend.bottom} /></clipPath>
            <clipPath id="clip-green-glow"><rect x="0" y={blend.top} width={W} height={H - blend.top} /></clipPath>
            <clipPath id="clip-green-outline"><rect x="0" y={blend.bottom} width={W} height={H - blend.bottom} /></clipPath>
            {/* Red road shows above the blend band + on the "red" pixels inside it */}
            <clipPath id="clip-exp-region">
              <rect x="0" y="0" width={W} height={blend.top} />
              <path d={blend.redD} shapeRendering="crispEdges" />
            </clipPath>
            {/* Green road shows below the blend band + on the "green" pixels inside it */}
            <clipPath id="clip-proj-region">
              <rect x="0" y={blend.bottom} width={W} height={H - blend.bottom} />
              <path d={blend.greenD} shapeRendering="crispEdges" />
            </clipPath>

            <filter id="exp-redstone-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="mc-redstone-inactive" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#2a0505" />
              <rect x="8" y="0" width="8" height="8" fill="#4d0909" />
              <rect x="24" y="0" width="8" height="8" fill="#360505" />
              <rect x="0" y="8" width="8" height="8" fill="#5c0b0b" />
              <rect x="16" y="8" width="8" height="8" fill="#7a0d0d" />
              <rect x="8" y="16" width="8" height="8" fill="#360505" />
              <rect x="24" y="16" width="8" height="8" fill="#690b0b" />
              <rect x="0" y="24" width="8" height="8" fill="#4d0909" />
              <rect x="16" y="24" width="8" height="8" fill="#2a0505" />
            </pattern>
            <pattern id="mc-redstone-active" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#ff0000" />
              <rect x="8" y="0" width="8" height="8" fill="#ff3300" />
              <rect x="24" y="0" width="8" height="8" fill="#cc0000" />
              <rect x="0" y="8" width="8" height="8" fill="#ff5500" />
              <rect x="16" y="8" width="8" height="8" fill="#ff8800" />
              <rect x="8" y="16" width="8" height="8" fill="#ff1100" />
              <rect x="24" y="16" width="8" height="8" fill="#ff6600" />
              <rect x="0" y="24" width="8" height="8" fill="#ee0000" />
              <rect x="16" y="24" width="8" height="8" fill="#dd0000" />
            </pattern>

            <filter id="proj-circuit-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="mc-pcb-inactive" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#01120c" />
              <rect x="8" y="0" width="8" height="8" fill="#021f15" />
              <rect x="24" y="0" width="8" height="8" fill="#01170f" />
              <rect x="0" y="8" width="8" height="8" fill="#032b1d" />
              <rect x="16" y="8" width="8" height="8" fill="#043c29" />
              <rect x="8" y="16" width="8" height="8" fill="#01170f" />
              <rect x="24" y="16" width="8" height="8" fill="#032b1d" />
              <rect x="0" y="24" width="8" height="8" fill="#021f15" />
              <rect x="16" y="24" width="8" height="8" fill="#01120c" />
            </pattern>
            <pattern id="mc-pcb-active" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="#10b981" />
              <rect x="8" y="0" width="8" height="8" fill="#34d399" />
              <rect x="24" y="0" width="8" height="8" fill="#059669" />
              <rect x="0" y="8" width="8" height="8" fill="#6ee7b7" />
              <rect x="16" y="8" width="8" height="8" fill="#a7f3d0" />
              <rect x="8" y="16" width="8" height="8" fill="#10b981" />
              <rect x="24" y="16" width="8" height="8" fill="#34d399" />
              <rect x="0" y="24" width="8" height="8" fill="#059669" />
              <rect x="16" y="24" width="8" height="8" fill="#059669" />
            </pattern>
          </defs>

          {/* ── ROADS ──
            Layer order matters: (1) smooth outlines, (2) dim fills, (3) lit fills + glow.
            Only the INNER fill (2 and 3) is pixelated by the red/green clips; outlines are never pixelated,
            so nothing pokes out past the edge of the road.
            roads.exp.svgPath seamlessly spans from Y=260 all the way down to Y=2655 (fork junction),
            avoiding any rounded cap or stroke seam at the section boundary. */}
          {(() => {
            const pcb = [
              { key: 'exp', d: roads.exp.svgPath },
              ...activeProjPaths.map(name => ({ key: name, d: (roads as any)[name].svgPath })),
            ];
            return (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* 0. CHEAP GLOW (two wide see-through strokes under everything; smooth, not pixelated) */}
                {!USE_BLUR_GLOW && (
                  <>
                    <g clipPath="url(#clip-red-glow)" stroke="#ff2a1a">
                      <path d={roads.exp.svgPath} strokeWidth={road.innerWidth + 26} opacity={0.10} {...dash(frac('exp'))} />
                      <path d={roads.exp.svgPath} strokeWidth={road.innerWidth + 13} opacity={0.22} {...dash(frac('exp'))} />
                    </g>
                    <g clipPath="url(#clip-green-glow)" stroke="#10b981">
                      {pcb.map(r => <path key={`g1-${r.key}`} d={r.d} strokeWidth={road.innerWidth + 26} opacity={0.10} {...dash(frac(r.key))} />)}
                      {pcb.map(r => <path key={`g2-${r.key}`} d={r.d} strokeWidth={road.innerWidth + 13} opacity={0.22} {...dash(frac(r.key))} />)}
                    </g>
                  </>
                )}

                {/* 1. OUTLINES (smooth) */}
                <g clipPath="url(#clip-exp-outline)">
                  <path d={roads.exp.svgPath} stroke="#2a0505" strokeWidth={road.outerWidth} />
                </g>
                <g clipPath="url(#clip-band-outline)">
                  <path d={roads.exp.svgPath} stroke="#140b08" strokeWidth={road.outerWidth} />
                </g>
                <g clipPath="url(#clip-green-outline)">
                  {pcb.map(r => <path key={`o-${r.key}`} d={r.d} stroke="#01120c" strokeWidth={road.outerWidth} />)}
                </g>

                {/* 2. DIM FILLS (pixel-clipped) */}
                <g clipPath="url(#clip-exp-region)">
                  <path d={roads.exp.svgPath} stroke="url(#mc-redstone-inactive)" strokeWidth={road.innerWidth} />
                </g>
                <g clipPath="url(#clip-proj-region)">
                  {pcb.map(r => <path key={`i-${r.key}`} d={r.d} stroke="url(#mc-pcb-inactive)" strokeWidth={road.innerWidth} />)}
                </g>

                {/* 3. LIT FILLS + GLOW (pixel-clipped fill, glow applied after the clip) */}
                <g filter={USE_BLUR_GLOW ? 'url(#exp-redstone-glow)' : undefined}>
                  <g clipPath="url(#clip-exp-region)">
                    <path d={roads.exp.svgPath} stroke="url(#mc-redstone-active)" strokeWidth={road.innerWidth} {...dash(frac('exp'))} />
                  </g>
                </g>
                <g filter={USE_BLUR_GLOW ? 'url(#proj-circuit-glow)' : undefined}>
                  <g clipPath="url(#clip-proj-region)">
                    {pcb.map(r => <path key={`l-${r.key}`} d={r.d} stroke="url(#mc-pcb-active)" strokeWidth={road.innerWidth} {...dash(frac(r.key))} />)}
                  </g>
                </g>
              </g>
            );
          })()}

          {/* ── CHECKPOINT NODES (EXP) ── */}
          {expCards.map(s => {
            const isLit = litY >= s.y;
            return (
              <g key={`exp-node-${s.index}`}>
                <rect x={s.x - 20} y={s.y - 20} width={40} height={40} fill={isLit ? '#ef4444' : '#4a1212'} stroke={isLit ? '#fca5a5' : '#2b0909'} strokeWidth={4} transform={`rotate(45 ${s.x} ${s.y})`} />
                <circle cx={s.x} cy={s.y} r={8} fill={isLit ? '#fee2e2' : '#6b1c1c'} />
              </g>
            );
          })}

          {/* ── CHECKPOINT NODES (PROJ) ── */}
          {projCards.map(s => {
            const isLit = litY >= s.y;
            return (
              <g key={`proj-node-${s.id}-${s.pathName}`}>
                <circle cx={s.x} cy={s.y} r={18} fill={isLit ? '#042f2e' : '#021812'} stroke={isLit ? '#10b981' : '#064e3b'} strokeWidth={4} />
                <circle cx={s.x} cy={s.y} r={8} fill={isLit ? '#6ee7b7' : '#044332'} />
              </g>
            );
          })}
        </svg>

        {/* ═════════════════════════════════════════════════════════════════════════
          HTML CONTENT LAYER (Headings, Cards, Quotes)
          ═════════════════════════════════════════════════════════════════════════ */}

        {/* ── EXPERIENCES HEADING ── */}
        <div className="absolute w-full px-6 md:px-12 z-20 pointer-events-none" style={{ top: 0 }}>
          <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 pointer-events-auto max-w-7xl mx-auto pt-16">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#10b981] mb-2 leading-none font-minecraft [text-shadow:4px_4px_0px_rgba(0,0,0,0.4)]">
                  Experiences
                </h2>
                <p className="text-stone-400 text-[12px] tracking-widest uppercase font-minecraft">
                  Enchantment_Level XXX// Professional_Experience
                </p>
              </div>
              <EnchantBottle />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-[30px] h-[30px] border-4 border-slate-900 shadow-inner mt-[10px] bg-white ${i === 1 ? 'pl-[1px]' : ''}`} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── PROJECTS HEADING & FORK ── */}
        <div className="absolute w-full px-6 md:px-12 z-20 pointer-events-none" style={{ top: py(sections.projectsSectionStartsAtY) }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-10 pointer-events-auto max-w-7xl mx-auto pt-16">
            <div className="flex items-end gap-6">
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-bold block">
                  SECTION_03 // HardWare_ARCH
                </span>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
                  Project Schematics
                </h2>
              </div>
              <FloatingChip />
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto mt-8 mb-16 pointer-events-auto">
            <div className="bg-black/85 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex justify-center gap-4">
              <div className="flex flex-wrap gap-3 justify-center">
                {ROADS.map((r, i) => {
                  const on = sel === i;
                  const count = projByRoad[r.key].length;
                  return (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setSel(i)}
                      className={`px-5 py-2.5 rounded-xl border font-mono text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${on
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                        : 'bg-black/60 text-emerald-400/80 border-emerald-500/30 hover:border-emerald-400 hover:text-white hover:bg-emerald-950/40'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${on ? 'bg-emerald-950' : 'bg-emerald-500'}`} />
                      <span>{r.name}</span>
                      <span className="text-xs opacity-70 font-normal">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARDS (memoised: they only re-render when their own lit state changes) ── */}
        {expCards.map(s => (
          <ExpCard key={`exp-card-${s.index}`} s={s} isLit={litY >= s.y} left={px(s.x)} top={py(s.y)} width={`${(cardSize.experience.w / W) * 100}%`} onOpen={onOpen} />
        ))}
        {projCards.map(s => (
          <ProjCard key={`proj-card-${s.id}-${s.pathName}`} s={s} isLit={litY >= s.y} left={px(s.x)} top={py(s.y)} width={`${(cardSize.project.w / W) * 100}%`} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
