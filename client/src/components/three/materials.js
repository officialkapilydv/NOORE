import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────
   Vessel parameter sets. Every vessel type maps onto the same
   MeshPhysicalMaterial parameter space so we can lerp between them.
   ──────────────────────────────────────────────────────────────── */
export function vesselParams(vessel) {
  const base = {
    color: vessel.color,
    roughness: 0.3,
    metalness: 0,
    transmission: 0,
    thickness: 0.6,
    ior: 1.45,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    sheen: 0,
    envMapIntensity: 1,
    opacity: 1,
    map: null,
  };
  switch (vessel.type) {
    case 'glass':
      return { ...base, roughness: 0.11, transmission: 1, thickness: 0.9, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2, attenuation: true };
    case 'tinted':
      return { ...base, roughness: 0.14, transmission: 0.42, thickness: 0.7, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 1.2 };
    case 'porcelain':
      return { ...base, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.22, sheen: 0.35, envMapIntensity: 0.9 };
    case 'stone':
      return { ...base, roughness: 0.78, clearcoat: 0.05, envMapIntensity: 0.6, map: 'speckle' };
    case 'marble':
      return { ...base, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.1, map: 'marble' };
    case 'matte':
      return { ...base, roughness: 0.62, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: 0.7 };
    default:
      return base;
  }
}

export const GOLD = { color: '#d9b25f', metalness: 1, roughness: 0.22, envMapIntensity: 1.6 };

/* ────────────────────────────────────────────────────────────────
   Canvas textures
   ──────────────────────────────────────────────────────────────── */
const textureCache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Marble: soft cloudy base with wandering veins (gold for luxury whites, mineral for malachite). */
export function marbleTexture(baseColor, veinColor, seed = 'marble') {
  const key = `marble:${baseColor}:${veinColor}:${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const size = 1024;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const rnd = seeded(hashString(key));
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // cloudy tonal variation
  const dark = new THREE.Color(baseColor).offsetHSL(0, 0, -0.06).getStyle();
  const light = new THREE.Color(baseColor).offsetHSL(0, 0, 0.05).getStyle();
  ctx.filter = 'blur(60px)';
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = rnd() > 0.5 ? dark : light;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(rnd() * size, rnd() * size, 120 + rnd() * 260, 80 + rnd() * 200, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // veins
  const vein = new THREE.Color(veinColor);
  const veinSoft = vein.clone().lerp(new THREE.Color(baseColor), 0.45).getStyle();
  const drawVein = (width, alpha, color, blur) => {
    ctx.filter = blur ? `blur(${blur}px)` : 'none';
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let x = rnd() * size, y = -20;
    ctx.moveTo(x, y);
    while (y < size + 20) {
      const nx = x + (rnd() - 0.5) * 220;
      const ny = y + 60 + rnd() * 120;
      const cx1 = x + (rnd() - 0.5) * 160, cy1 = y + 40;
      const cx2 = nx + (rnd() - 0.5) * 160, cy2 = ny - 40;
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, nx, ny);
      x = nx; y = ny;
    }
    ctx.stroke();
  };
  for (let i = 0; i < 7; i++) drawVein(10 + rnd() * 18, 0.18, veinSoft, 8);
  for (let i = 0; i < 9; i++) drawVein(1.2 + rnd() * 2.4, 0.75, vein.getStyle(), 0.6);
  for (let i = 0; i < 6; i++) drawVein(0.6 + rnd() * 1.2, 0.5, vein.getStyle(), 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  textureCache.set(key, tex);
  return tex;
}

/** Speckled stoneware. */
export function speckleTexture(baseColor, seed = 'speckle') {
  const key = `speckle:${baseColor}:${seed}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const size = 1024;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const rnd = seeded(hashString(key));
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  const tones = ['#5a4a3c', '#3a2e26', '#8a7a68', '#b9a48a', '#2b2320'];
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
    ctx.globalAlpha = 0.25 + rnd() * 0.55;
    const r = 0.6 + rnd() * rnd() * 3.2;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  textureCache.set(key, tex);
  return tex;
}

const FLAME_PATH = 'M20 2c2.5 9 12 14.5 12 25.5a12 12 0 0 1-24 0c0-6.5 3.6-9.4 5.8-14.5 1 4.6 2.8 6.6 4.7 8.4C20.3 16.4 19.7 9.6 20 2z';
const FLAME_INNER = 'M20 22c1.9 3.9 6 5.9 6 10.6a6 6 0 0 1-12 0c0-3.6 2.5-5.4 3.6-8.1.5 1.9 1.1 2.8 2 3.6z';

/** The product label: wordmark, flame, product name, small-print. */
export function labelTexture({ name, vessel, collection = '' }) {
  const key = `label:${name}:${vessel.labelBg}:${vessel.labelText}:${vessel.accent}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const w = 1024, h = 640;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = vessel.labelBg;
  ctx.fillRect(0, 0, w, h);

  // subtle paper grain
  const rnd = seeded(hashString(key));
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
  }
  ctx.globalAlpha = 1;

  // border
  ctx.strokeStyle = vessel.accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(34, 34, w - 68, h - 68);
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(46, 46, w - 92, h - 92);
  ctx.globalAlpha = 1;

  // flame mark
  ctx.save();
  ctx.translate(w / 2 - 20 * 1.8, 92);
  ctx.scale(1.8, 1.8);
  ctx.strokeStyle = vessel.accent;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(FLAME_PATH));
  ctx.fillStyle = vessel.accent;
  ctx.fill(new Path2D(FLAME_INNER));
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = vessel.labelText;

  // wordmark
  ctx.font = '500 118px "Cormorant Garamond", "Times New Roman", serif';
  drawSpaced(ctx, 'NOORÉ', w / 2, 262, 26);

  // divider
  ctx.fillStyle = vessel.accent;
  ctx.fillRect(w / 2 - 70, 338, 140, 2);

  // product name
  ctx.fillStyle = vessel.labelText;
  const nameUpper = name.toUpperCase();
  let fontSize = 54;
  ctx.font = `500 ${fontSize}px "Jost", "Helvetica Neue", Arial, sans-serif`;
  while (ctx.measureText(nameUpper).width + nameUpper.length * 10 > w - 220 && fontSize > 30) {
    fontSize -= 2;
    ctx.font = `500 ${fontSize}px "Jost", "Helvetica Neue", Arial, sans-serif`;
  }
  drawSpaced(ctx, nameUpper, w / 2, 410, 10);

  // small print
  ctx.globalAlpha = 0.7;
  ctx.font = '400 24px "Jost", "Helvetica Neue", Arial, sans-serif';
  drawSpaced(ctx, `${collection ? collection.toUpperCase() + ' · ' : ''}SCENTED CANDLE · HAND-POURED`, w / 2, 492, 5);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  textureCache.set(key, tex);
  return tex;
}

function drawSpaced(ctx, text, x, y, spacing) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

let glowTex;
/** Soft radial falloff used for the flame halo sprite. */
export function glowTexture() {
  if (glowTex) return glowTex;
  const size = 128;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function clearLabelCache() {
  for (const key of textureCache.keys()) if (key.startsWith('label:')) { textureCache.get(key).dispose(); textureCache.delete(key); }
}

/* ────────────────────────────────────────────────────────────────
   Geometry: the vessel profile, lathe-turned
   ──────────────────────────────────────────────────────────────── */
export const VESSEL = { radius: 0.85, height: 1.3, wall: 0.075, base: 0.12, waxTop: 0.93 };

let vesselGeo;
export function vesselGeometry() {
  if (vesselGeo) return vesselGeo;
  const H = VESSEL.height;
  const pts = [
    [0, 0], [0.66, 0], [0.76, 0.015], [0.815, 0.06], [0.83, 0.2], [0.84, 0.6], [0.848, 1.0], [0.85, H - 0.03], [0.842, H],
    [0.78, H], [0.772, H - 0.04], [0.766, 0.4], [0.76, 0.16], [0.7, VESSEL.base], [0, VESSEL.base],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  vesselGeo = new THREE.LatheGeometry(pts, 96);
  vesselGeo.computeVertexNormals();
  return vesselGeo;
}

let lidGeo;
export function lidGeometry() {
  if (lidGeo) return lidGeo;
  const pts = [
    [0, 0], [0.86, 0], [0.885, 0.02], [0.89, 0.09], [0.86, 0.11], [0.3, 0.11], [0.26, 0.13], [0.24, 0.2], [0.2, 0.23], [0, 0.23],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  lidGeo = new THREE.LatheGeometry(pts, 96);
  lidGeo.computeVertexNormals();
  return lidGeo;
}
