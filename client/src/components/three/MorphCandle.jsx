import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { SceneShell } from './SceneShell';
import { Flame } from './Flame';
import { GoldDust } from './Particles';
import { PostFX, ReflectiveFloor, SoftShadow, Studio } from './Studio';
import { VESSEL, labelTexture, vesselGeometry, vesselParams } from './materials';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { useFontsReady } from '@/hooks/useFonts';

/**
 * A candle whose vessel smoothly morphs between products as the user scrolls —
 * colour, transmission, roughness and label all transition in place.
 */
function Morphing({ product, quality }) {
  const fontsReady = useFontsReady();
  const target = useMemo(() => vesselParams(product.vessel), [product]);
  const mat = useRef();
  const waxMat = useRef();
  const poolMat = useRef();
  const labelMesh = useRef();
  const geo = useMemo(() => vesselGeometry(), []);
  const label = useMemo(() => labelTexture({ name: product.name, vessel: product.vessel, collection: product.collection }), [product, fontsReady]);
  const colors = useRef({ vessel: new THREE.Color(target.color), wax: new THREE.Color(product.vessel.wax), glow: new THREE.Color(product.vessel.glow) });
  const labelPulse = useRef(0);

  useEffect(() => { labelPulse.current = 1; }, [product]);

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const k = 1 - Math.exp(-delta * 3.2);
    colors.current.vessel.lerp(new THREE.Color(target.color), k);
    colors.current.wax.lerp(new THREE.Color(product.vessel.wax), k);
    colors.current.glow.lerp(new THREE.Color(product.vessel.glow), k);
    m.color.copy(colors.current.vessel);
    m.attenuationColor.copy(colors.current.vessel);
    m.roughness = THREE.MathUtils.lerp(m.roughness, target.roughness, k);
    m.transmission = THREE.MathUtils.lerp(m.transmission, quality === 'low' ? 0 : target.transmission, k);
    m.clearcoat = THREE.MathUtils.lerp(m.clearcoat, target.clearcoat, k);
    m.thickness = THREE.MathUtils.lerp(m.thickness, target.thickness, k);
    if (waxMat.current) waxMat.current.color.copy(colors.current.wax);
    if (poolMat.current) { poolMat.current.color.copy(colors.current.wax); poolMat.current.emissive.copy(colors.current.glow); }
    if (labelMesh.current) {
      labelPulse.current = THREE.MathUtils.damp(labelPulse.current, 0, 6, delta);
      const s = 1 - labelPulse.current * 0.06;
      labelMesh.current.scale.set(s, s, s);
      labelMesh.current.material.opacity = 1 - labelPulse.current * 0.8;
    }
  });

  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial ref={mat} color={target.color} roughness={target.roughness} transmission={quality === 'low' ? 0 : target.transmission} thickness={target.thickness} ior={1.5} clearcoat={target.clearcoat} clearcoatRoughness={0.08} attenuationColor={target.color} attenuationDistance={1.1} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, (VESSEL.base + VESSEL.waxTop) / 2, 0]}>
        <cylinderGeometry args={[0.745, 0.735, VESSEL.waxTop - VESSEL.base, 64]} />
        <meshStandardMaterial ref={waxMat} color={product.vessel.wax} roughness={0.55} />
      </mesh>
      <mesh position={[0, VESSEL.waxTop + 0.002, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.745, 64]} />
        <meshStandardMaterial ref={poolMat} color={product.vessel.wax} emissive={product.vessel.glow} emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, VESSEL.waxTop + 0.055, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.11, 12]} />
        <meshStandardMaterial color="#1a110c" />
      </mesh>
      <mesh ref={labelMesh} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[VESSEL.radius + 0.004, VESSEL.radius, 0.52, 64, 1, true, -0.78, 1.56]} />
        <meshStandardMaterial map={label} roughness={0.85} transparent />
      </mesh>
      <Flame position={[0, VESSEL.waxTop + 0.1, 0]} glow={product.vessel.glow} lightIntensity={4.5} />
    </group>
  );
}

export function MorphCandleScene({ product, className = '' }) {
  return (
    <SceneShell className={`scene--morph ${className}`} camera={{ position: [0, 1.1, 6.3], fov: 28 }} fallback={<div className="scene__fallback"><CandleThumb vessel={product.vessel} size={220} lit /></div>}>
      {(quality) => (
        <>
          <Studio intensity={1} />
          <group position={[0, -0.7, 0]}>
            <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.1}>
              <Morphing product={product} quality={quality} />
            </Float>
            <SoftShadow opacity={0.7} />
            <ReflectiveFloor quality={quality} color="#15100c" />
          </group>
          <GoldDust count={quality === 'high' ? 200 : 90} center={[0, 0.6, 0]} spread={[5, 3.5, 3]} opacity={0.6} />
          <fog attach="fog" args={['#0d0907', 7, 15]} />
          <PostFX quality={quality} bloom={0.85} />
        </>
      )}
    </SceneShell>
  );
}
