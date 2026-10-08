import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useQualityTier } from '@/hooks/useMedia';
import { useUI } from '@/store/ui';
import { useCart } from '@/store/cart';

/**
 * Compiles every shader before the scene fades in. compileAsync uses the browser's parallel
 * shader compilation, unlike drei's <Preload all/>, which compiled synchronously (plus a cube-camera
 * render) and froze the page each time a scene mounted.
 */
function Warmup({ onDone }) {
  const { gl, scene, camera } = useThree();
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let alive = true;
    const finish = () => { if (alive) { alive = false; done.current(); } };
    // compileAsync can stall if a material is swapped mid-compile; never leave the scene hidden.
    const fallback = setTimeout(finish, 2500);
    try {
      if (gl.compileAsync) gl.compileAsync(scene, camera).then(finish, finish);
      else finish();
    } catch {
      finish();
    }
    return () => { alive = false; clearTimeout(fallback); };
  }, [gl, scene, camera]);
  return null;
}

/**
 * Shared Canvas wrapper:
 *  - creates the WebGL context only once the scene is near the viewport and the page-transition
 *    curtain has settled (context creation blocks the main thread)
 *  - pauses the render loop when scrolled out of view or covered by the menu, search or bag
 *  - caps DPR per device tier
 *  - renders `fallback` while waiting, and when WebGL is unavailable
 */
export function SceneShell({ children, className = '', camera = { position: [0, 1.15, 5.2], fov: 30, near: 0.1, far: 60 }, fallback = null, background = '#0d0907', transparent = false, style, onReady }) {
  const quality = useQualityTier();
  const settled = useUI((s) => s.pageSettled);
  const covered = useUI((s) => s.menuOpen || s.searchOpen);
  const bagOpen = useCart((s) => s.isOpen);
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const dpr = useMemo(() => (quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.4] : [0.8, 1]), [quality]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setNear(true); setVisible(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px 0px' });
    // A screen's height of look-ahead, so the context is ready by the time it scrolls in.
    const nearIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearIo.disconnect(); } }, { rootMargin: '100% 0px' });
    io.observe(el);
    nearIo.observe(el);
    return () => { io.disconnect(); nearIo.disconnect(); };
  }, []);

  // Once mounted, stay mounted; the timer is a safety net if the curtain never reports.
  useEffect(() => {
    if (mounted || !near) return undefined;
    if (settled) { setMounted(true); return undefined; }
    const t = setTimeout(() => setMounted(true), 1600);
    return () => clearTimeout(t);
  }, [settled, near, mounted]);

  const running = visible && !covered && !bagOpen;

  return (
    <>
      {!ready && fallback}
      <div ref={ref} className={`scene ${ready ? 'is-ready' : ''} ${className}`} style={style}>
        {mounted && (
          <Canvas
            dpr={dpr}
            camera={camera}
            // 'demand' while covered: still redraws once if the canvas resizes (the scrollbar vanishes
            // when the bag opens), where 'never' would leave it blank until the overlay closes.
            frameloop={running ? 'always' : visible ? 'demand' : 'never'}
            // Every scene draws through the post-processing composer (or skips AA on the low tier),
            // so a multisampled default framebuffer would only cost memory.
            gl={{ antialias: false, alpha: transparent, powerPreference: 'high-performance', stencil: false }}
            shadows={false}
            fallback={fallback}
            onCreated={({ gl }) => {
              gl.setClearColor(background, transparent ? 0 : 1);
              // Glass refraction renders the scene again at full size; half is indistinguishable on smaller GPUs.
              if (quality !== 'high' && 'transmissionResolutionScale' in gl) gl.transmissionResolutionScale = 0.5;
            }}
            eventPrefix="client"
          >
            {!transparent && <color attach="background" args={[background]} />}
            <Suspense fallback={null}>
              {typeof children === 'function' ? children(quality) : children}
              <Warmup onDone={() => { setReady(true); onReady?.(); }} />
            </Suspense>
            <AdaptiveDpr pixelated={false} />
          </Canvas>
        )}
      </div>
    </>
  );
}
