import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, Preload } from '@react-three/drei';
import { useQualityTier } from '@/hooks/useMedia';

/**
 * Shared Canvas wrapper:
 *  - pauses the render loop when scrolled out of view
 *  - caps DPR per device tier
 *  - renders `fallback` when WebGL is unavailable
 */
export function SceneShell({ children, className = '', camera = { position: [0, 1.15, 5.2], fov: 30, near: 0.1, far: 60 }, fallback = null, background = '#0d0907', transparent = false, style, onReady }) {
  const quality = useQualityTier();
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`scene ${ready ? 'is-ready' : ''} ${className}`} style={style}>
      <Canvas
        dpr={quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.4] : [0.8, 1]}
        camera={camera}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: quality !== 'low', alpha: transparent, powerPreference: 'high-performance', stencil: false }}
        shadows={false}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.setClearColor(background, transparent ? 0 : 1);
          setReady(true);
          onReady?.();
        }}
        eventPrefix="client"
      >
        {!transparent && <color attach="background" args={[background]} />}
        <Suspense fallback={null}>
          {typeof children === 'function' ? children(quality) : children}
          <Preload all />
        </Suspense>
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </div>
  );
}
