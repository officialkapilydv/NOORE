import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { SceneShell } from './SceneShell';
import { Candle } from './Candle';
import { GoldDust } from './Particles';
import { PostFX, ReflectiveFloor, SoftShadow, Studio } from './Studio';
import { CandleThumb } from '@/components/shop/CandleThumb';

function Rig({ children, drift = 0.35 }) {
  const group = useRef();
  const { pointer, camera } = useThree();
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * drift, 3, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.08, 3, delta);
    }
    camera.lookAt(0, -0.55, 0);
  });
  return <group ref={group}>{children}</group>;
}

/** A row of lit candles — used as the collection hero and for gift sets. */
export function CandleRow({ products = [], spread = 1.9, background = '#0d0907', lit = true, className = '' }) {
  const list = products.slice(0, 5);
  return (
    <SceneShell className={`scene--row ${className}`} background={background} camera={{ position: [0, 1.4, 7.8], fov: 30, near: 0.1, far: 50 }} fallback={<div className="scene__fallback">{list[0] && <CandleThumb vessel={list[0].vessel} size={200} lit />}</div>}>
      {(quality) => (
        <>
          <Studio intensity={0.95} />
          <Rig>
            <group position={[0, -0.75, 0]}>
              {list.map((p, i) => {
                const x = (i - (list.length - 1) / 2) * spread;
                const depth = Math.abs(i - (list.length - 1) / 2) * -0.35;
                return (
                  <Float key={p.slug} speed={1 + (i % 3) * 0.15} rotationIntensity={0.04} floatIntensity={0.08}>
                    <Candle product={p} quality={quality} lit={lit} lid={lit ? 'hidden' : 'closed'} scale={0.74} position={[x, 0, depth]} rotation-y={(i - (list.length - 1) / 2) * -0.22} lightIntensity={lit ? 1.8 : 0} flameScale={0.9} />
                  </Float>
                );
              })}
              <SoftShadow opacity={0.7} scale={12} />
              <ReflectiveFloor quality={quality} color="#15100c" radius={16} />
            </group>
          </Rig>
          <GoldDust count={quality === 'high' ? 240 : 100} center={[0, 0.6, 0]} spread={[8, 3.5, 3]} opacity={0.6} />
          <fog attach="fog" args={[background, 8, 16]} />
          <PostFX quality={quality} bloom={0.8} />
        </>
      )}
    </SceneShell>
  );
}
