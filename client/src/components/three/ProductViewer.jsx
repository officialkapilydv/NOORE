import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, PresentationControls } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { SceneShell } from './SceneShell';
import { Candle } from './Candle';
import { GoldDust, Embers } from './Particles';
import { PostFX, ReflectiveFloor, SoftShadow, Studio } from './Studio';
import { CandleThumb } from '@/components/shop/CandleThumb';

const HOTSPOTS = [
  { key: 'top', label: 'Top notes', position: [0.55, 1.5, 0.35] },
  { key: 'heart', label: 'Heart notes', position: [0.95, 0.72, 0.3] },
  { key: 'base', label: 'Base notes', position: [0.72, 0.1, 0.62] },
];

/**
 * Projects 3D anchor points to screen space every frame and positions the DOM
 * hotspot buttons directly (no React re-render, no portal roots).
 */
function HotspotAnchors({ els }) {
  const anchors = useRef({});
  const { camera, size } = useThree();
  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();
  useFrame(() => {
    for (const h of HOTSPOTS) {
      const anchor = anchors.current[h.key];
      const el = els.current[h.key];
      if (!anchor || !el) continue;
      anchor.getWorldPosition(v);
      // facing test: hide spots that rotated to the back of the vessel
      anchor.getWorldDirection(dir);
      const facing = v.clone().sub(camera.position).normalize().dot(dir) < 0.25;
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.classList.toggle('is-right', x > size.width * 0.55);
      el.style.opacity = facing ? '1' : '0.15';
      el.style.pointerEvents = facing ? 'auto' : 'none';
    }
  });
  return (
    <>
      {HOTSPOTS.map((h) => (
        <group key={h.key} ref={(r) => (anchors.current[h.key] = r)} position={h.position} rotation={[0, Math.atan2(h.position[0], h.position[2]), 0]} />
      ))}
    </>
  );
}

/**
 * Interactive product stage: drag to rotate (springs back), lift the lid, snuff/light
 * the flame, and tap hotspots for the fragrance pyramid.
 */
export function ProductViewer({ product, lit, lidOpen, hotspots = true, includes = [] }) {
  const [active, setActive] = useState(null);
  const els = useRef({});
  const isSet = product.kind === 'set' && includes.length > 0;
  const showSpots = hotspots && !isSet && product.notes;
  useEffect(() => setActive(null), [product.slug]);

  return (
    <div className="viewer">
      <SceneShell className="scene--product" camera={{ position: [0, 1.0, 5.9], fov: 28, near: 0.1, far: 50 }} fallback={<div className="scene__fallback"><CandleThumb vessel={product.vessel} size={260} lit /></div>}>
        {(quality) => (
          <>
            <Studio intensity={1} />
            <PresentationControls global={false} cursor snap speed={1.4} zoom={1} polar={[-0.15, 0.25]} azimuth={[-Infinity, Infinity]} config={{ mass: 1, tension: 170, friction: 26 }}>
              <group position={[0, -0.72, 0]}>
                {isSet ? (
                  includes.slice(0, 3).map((p, i, arr) => {
                    const spread = 1.75;
                    const x = (i - (arr.length - 1) / 2) * spread;
                    return (
                      <Float key={p.slug} speed={1 + i * 0.2} rotationIntensity={0.05} floatIntensity={0.1}>
                        <Candle product={p} quality={quality} lit={lit} lid={lidOpen ? 'hidden' : 'closed'} scale={0.74} position={[x, 0, i === 1 ? 0.3 : -0.2]} rotation-y={(i - 1) * -0.25} lightIntensity={lit ? 2.2 : 0} />
                      </Float>
                    );
                  })
                ) : (
                  <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.1} floatingRange={[-0.015, 0.015]}>
                    <Candle product={product} quality={quality} lit={lit} lid={lidOpen ? 'open' : 'closed'} scale={1.02} lightIntensity={lit ? 5 : 0} />
                    {showSpots && <HotspotAnchors els={els} />}
                  </Float>
                )}
                <SoftShadow opacity={0.75} scale={isSet ? 9 : 6} />
                <ReflectiveFloor quality={quality} color="#15100c" />
              </group>
            </PresentationControls>
            {lit && quality !== 'low' && !isSet && <Embers origin={[0, 0.56, 0]} count={24} />}
            <GoldDust count={quality === 'high' ? 220 : 100} center={[0, 0.6, 0]} spread={[5, 3.5, 3]} opacity={0.7} />
            <fog attach="fog" args={['#0d0907', 7, 15]} />
            <PostFX quality={quality} bloom={0.85} />
          </>
        )}
      </SceneShell>

      {showSpots && (
        <div className="hotspots" aria-label="Fragrance notes">
          {HOTSPOTS.map((h) => (
            <div key={h.key} className="hotspot-wrap" ref={(r) => (els.current[h.key] = r)}>
              <button className={`hotspot ${active === h.key ? 'is-active' : ''}`} onClick={() => setActive((a) => (a === h.key ? null : h.key))} aria-label={h.label} data-cursor="hover">
                <span className="hotspot__pulse" />
                <span className="hotspot__dot" />
              </button>
              <AnimatePresence>
                {active === h.key && (
                  <motion.div className="hotspot__card" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.35 }}>
                    <span className="caps gold">{h.label}</span>
                    <strong>{product.notes[h.key].join(' · ')}</strong>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
