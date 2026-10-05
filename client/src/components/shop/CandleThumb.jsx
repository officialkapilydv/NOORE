import { useId } from 'react';
import { shade, isDark } from '@/lib/format';

/**
 * Lightweight SVG candle, drawn from the vessel palette. Crisp at any size, with an
 * animated CSS flame. Used in cards, the cart, search results and as a WebGL fallback.
 */
export function CandleThumb({ vessel, size = 120, lit = true, className = '', style }) {
  const uid = useId().replace(/:/g, '');
  const v = vessel || { type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'none', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c' };
  const translucent = v.type === 'glass' || v.type === 'tinted';
  const dark = isDark(v.color);
  const hi = shade(v.color, dark ? 0.35 : 0.5);
  const lo = shade(v.color, dark ? -0.45 : -0.28);
  const lid = v.lid && v.lid !== 'none';
  const w = size, h = size * 1.25;

  return (
    <svg className={`cthumb ${lit ? 'is-lit' : ''} ${className}`} width={w} height={h} viewBox="0 0 120 150" style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={lo} />
          <stop offset="0.18" stopColor={hi} stopOpacity="0.95" />
          <stop offset="0.42" stopColor={v.color} />
          <stop offset="0.8" stopColor={lo} />
          <stop offset="1" stopColor={shade(v.color, dark ? 0.2 : 0.25)} />
        </linearGradient>
        <linearGradient id={`wax-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={shade(v.wax, -0.12)} />
          <stop offset="0.3" stopColor={shade(v.wax, 0.3)} />
          <stop offset="1" stopColor={shade(v.wax, -0.08)} />
        </linearGradient>
        <linearGradient id={`gold-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8d6f2a" />
          <stop offset="0.35" stopColor="#f3e0a4" />
          <stop offset="0.6" stopColor="#c9a24a" />
          <stop offset="1" stopColor="#8d6f2a" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor={v.glow} stopOpacity="0.85" />
          <stop offset="0.45" stopColor={v.glow} stopOpacity="0.25" />
          <stop offset="1" stopColor={v.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`flame-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6f8cff" />
          <stop offset="0.18" stopColor="#ff6a1a" />
          <stop offset="0.55" stopColor="#ffb24f" />
          <stop offset="1" stopColor="#fff7dc" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d="M26 46 Q26 42 30 42 H90 Q94 42 94 46 L91 134 Q90 140 84 140 H36 Q30 140 29 134 Z" />
        </clipPath>
      </defs>

      {/* glow */}
      {lit && <circle className="cthumb__glow" cx="60" cy="38" r="40" fill={`url(#glow-${uid})`} />}

      {/* shadow */}
      <ellipse cx="60" cy="142" rx="34" ry="5" fill="#000" opacity="0.28" />

      {/* vessel body */}
      <path d="M26 46 Q26 42 30 42 H90 Q94 42 94 46 L91 134 Q90 140 84 140 H36 Q30 140 29 134 Z" fill={`url(#g-${uid})`} />

      {/* wax seen through translucent glass */}
      {translucent && (
        <g clipPath={`url(#clip-${uid})`} opacity={v.type === 'glass' ? 0.75 : 0.45}>
          <rect x="30" y="52" width="60" height="90" fill={`url(#wax-${uid})`} />
          <rect x="30" y="52" width="60" height="4" fill={shade(v.wax, 0.45)} opacity="0.8" />
        </g>
      )}

      {/* marble veins */}
      {v.type === 'marble' && (
        <g clipPath={`url(#clip-${uid})`} stroke={v.veins || '#c9a24a'} fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M30 60 C45 70, 40 90, 58 100 S80 120, 92 130" strokeWidth="1.2" />
          <path d="M70 44 C62 60, 80 70, 72 90 S50 110, 60 138" strokeWidth="0.8" />
          <path d="M28 110 C40 104, 48 118, 62 112" strokeWidth="0.7" opacity="0.6" />
        </g>
      )}
      {v.type === 'stone' && (
        <g clipPath={`url(#clip-${uid})`} fill="#5a4a3c" opacity="0.5">
          {[[34, 60], [52, 70], [80, 58], [40, 100], [70, 118], [86, 96], [58, 130], [36, 128], [84, 136], [64, 86], [48, 118]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.9 + (i % 3) * 0.4} />)}
        </g>
      )}

      {/* glass highlights */}
      <path d="M33 50 L31 130" stroke="#fff" strokeOpacity={translucent ? 0.55 : 0.35} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M86 52 L88 128" stroke="#fff" strokeOpacity="0.14" strokeWidth="3" strokeLinecap="round" />

      {/* rim */}
      <ellipse cx="60" cy="43" rx="34" ry="5" fill={shade(v.color, dark ? 0.15 : 0.1)} />
      <ellipse cx="60" cy="43" rx="30" ry="3.6" fill={translucent || !lid ? `url(#wax-${uid})` : shade(v.wax, 0.1)} />
      {lid && <ellipse cx="60" cy="43" rx="34" ry="5" fill="none" stroke={`url(#gold-${uid})`} strokeWidth="1.6" />}

      {/* label */}
      <rect x="37" y="80" width="46" height="34" rx="2" fill={v.labelBg} />
      <rect x="39.5" y="82.5" width="41" height="29" fill="none" stroke={v.accent} strokeWidth="0.6" opacity="0.9" />
      <path d="M60 86.5c.9 2.6 3.2 4 3.2 6.9a3.2 3.2 0 0 1-6.4 0c0-1.9 1-2.7 1.6-4.1.3 1.3.8 1.9 1.3 2.4-.1-1.6-.2-3.4.3-5.2z" fill={v.accent} />
      <text x="60" y="102" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="7.4" fontWeight="600" letterSpacing="1.1" fill={v.labelText}>NOORÉ</text>
      <rect x="47" y="105.5" width="26" height="0.6" fill={v.accent} />
      <rect x="50" y="108" width="20" height="0.9" fill={v.labelText} opacity="0.55" />

      {/* lid, when unlit */}
      {lid && !lit && (
        <g>
          <ellipse cx="60" cy="41" rx="36" ry="6" fill={`url(#gold-${uid})`} />
          <rect x="24" y="35" width="72" height="6" fill={`url(#gold-${uid})`} />
          <ellipse cx="60" cy="35" rx="36" ry="6" fill="#e5c77a" />
          <ellipse cx="60" cy="34" rx="6" ry="2" fill="#b58d3a" />
        </g>
      )}

      {/* wick + flame */}
      {lit && (
        <g className="cthumb__flame-group">
          <rect x="59.2" y="36" width="1.6" height="7" fill="#1a110c" />
          <path className="cthumb__flame" d="M60 16c3.2 6.2 6.4 9 6.4 15.2A6.4 6.4 0 0 1 53.6 31.2C53.6 25 56.8 22.2 60 16z" fill={`url(#flame-${uid})`} />
          <path className="cthumb__flame cthumb__flame--core" d="M60 23c1.4 2.8 3 4.4 3 7.4a3 3 0 0 1-6 0c0-3 1.6-4.6 3-7.4z" fill="#fff7dc" opacity="0.85" />
        </g>
      )}
    </svg>
  );
}
