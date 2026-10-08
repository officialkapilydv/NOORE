import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Flame } from './Flame';
import { GOLD, VESSEL, labelTexture, lidGeometry, marbleTexture, speckleTexture, vesselGeometry, vesselParams } from './materials';
import { useFontsReady } from '@/hooks/useFonts';

function useVesselMaterial(vessel, quality) {
  const params = useMemo(() => vesselParams(vessel), [vessel]);
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(params.color),
      roughness: params.roughness,
      metalness: params.metalness,
      clearcoat: params.clearcoat,
      clearcoatRoughness: params.clearcoatRoughness,
      sheen: params.sheen,
      sheenColor: new THREE.Color('#fff2d8'),
      envMapIntensity: params.envMapIntensity,
      ior: params.ior,
      thickness: params.thickness,
      transmission: quality === 'low' ? 0 : params.transmission,
      transparent: quality === 'low' && params.transmission > 0,
      opacity: quality === 'low' && params.transmission > 0 ? 0.55 : 1,
    });
    if (params.attenuation) {
      m.attenuationColor = new THREE.Color(params.color);
      m.attenuationDistance = 1.1;
    }
    if (params.map === 'marble') m.map = marbleTexture(vessel.color, vessel.veins || '#c9a24a', vessel.color);
    if (params.map === 'speckle') m.map = speckleTexture(vessel.color);
    if (m.map) m.color.set('#ffffff');
    return m;
  }, [params, vessel, quality]);
}

/**
 * The NOORÉ candle. Procedural, data-driven by `vessel`:
 *  - lathe-turned vessel with per-type physical material
 *  - wax body + glowing melt pool + wick
 *  - curved paper label with canvas-rendered typography
 *  - optional brass lid (closed / lifted / floating) and rim
 *  - shader flame with flickering light
 */
export function Candle({
  product,
  vessel: vesselProp,
  lit = true,
  lid = 'auto', // 'auto' | 'closed' | 'open' | 'hidden'
  lidPose = 'above', // where an open lid floats: 'above' | 'left' | 'right'
  quality = 'high',
  scale = 1,
  labelAngle = 0,
  showLabel = true,
  flameScale = 1,
  lightIntensity = 5,
  castLight = true,
  ...props
}) {
  const vessel = vesselProp || product.vessel;
  const name = product?.name || 'NOORÉ';
  const fontsReady = useFontsReady();
  const vesselMat = useVesselMaterial(vessel, quality);
  const geo = useMemo(() => vesselGeometry(), []);
  const lidGeo = useMemo(() => lidGeometry(), []);
  const label = useMemo(() => (showLabel ? labelTexture({ name, vessel, collection: product?.collection }) : null), [name, vessel, showLabel, fontsReady, product?.collection]);

  const hasLid = vessel.lid && vessel.lid !== 'none' && lid !== 'hidden';
  const lidMode = lid === 'auto' ? (lit ? 'open' : 'closed') : lid;
  const lidRef = useRef();
  const poolRef = useRef();
  const wax = useMemo(() => new THREE.Color(vessel.wax), [vessel.wax]);
  const poolColor = useMemo(() => new THREE.Color(vessel.wax).lerp(new THREE.Color(vessel.glow), 0.35), [vessel.wax, vessel.glow]);

  // Lid animation: closed sits on the rim; open floats beside the vessel, tilted.
  const lidTarget = useMemo(() => {
    if (lidMode === 'closed') return { pos: new THREE.Vector3(0, VESSEL.height - 0.01, 0), rot: new THREE.Euler(0, 0, 0) };
    if (lidPose === 'left') return { pos: new THREE.Vector3(-1.22, 0.46, 0.5), rot: new THREE.Euler(0.3, -0.35, 1.15) };
    if (lidPose === 'right') return { pos: new THREE.Vector3(1.22, 0.46, 0.5), rot: new THREE.Euler(0.3, 0.35, -1.15) };
    return { pos: new THREE.Vector3(0.62, VESSEL.height + 0.5, 0.3), rot: new THREE.Euler(0.55, 0.2, -0.6) };
  }, [lidMode, lidPose]);

  useEffect(() => {
    if (lidRef.current) {
      lidRef.current.position.copy(lidTarget.pos);
      lidRef.current.rotation.copy(lidTarget.rot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    if (lidRef.current) {
      const l = lidRef.current;
      l.position.x = THREE.MathUtils.damp(l.position.x, lidTarget.pos.x, 4, delta);
      l.position.y = THREE.MathUtils.damp(l.position.y, lidTarget.pos.y + (lidMode === 'open' ? Math.sin(state.clock.elapsedTime * 1.3) * 0.05 : 0), 4, delta);
      l.position.z = THREE.MathUtils.damp(l.position.z, lidTarget.pos.z, 4, delta);
      l.rotation.x = THREE.MathUtils.damp(l.rotation.x, lidTarget.rot.x, 4, delta);
      l.rotation.y = THREE.MathUtils.damp(l.rotation.y, lidTarget.rot.y + (lidMode === 'open' ? Math.sin(state.clock.elapsedTime * 0.7) * 0.25 : 0), 4, delta);
      l.rotation.z = THREE.MathUtils.damp(l.rotation.z, lidTarget.rot.z, 4, delta);
    }
    if (poolRef.current) {
      const t = state.clock.elapsedTime;
      poolRef.current.emissiveIntensity = lit ? 0.55 + Math.sin(t * 7.3) * 0.08 : 0;
    }
  });

  const waxTop = VESSEL.waxTop;
  const flameOn = lit && lidMode !== 'closed';

  return (
    <group scale={scale} {...props}>
      {/* vessel */}
      <mesh geometry={geo} material={vesselMat} castShadow receiveShadow />

      {/* wax body */}
      <mesh position={[0, (VESSEL.base + waxTop) / 2, 0]}>
        <cylinderGeometry args={[0.745, 0.735, waxTop - VESSEL.base, 64]} />
        <meshStandardMaterial color={wax} roughness={0.55} />
      </mesh>
      {/* melt pool */}
      <mesh position={[0, waxTop + 0.002, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.745, 64]} />
        <meshStandardMaterial ref={poolRef} color={poolColor} emissive={new THREE.Color(vessel.glow)} emissiveIntensity={0.5} roughness={0.18} />
      </mesh>
      {/* wick */}
      <mesh position={[0, waxTop + 0.055, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.11, 12]} />
        <meshStandardMaterial color="#1a110c" roughness={0.9} />
      </mesh>

      {/* label */}
      {label && (
        <mesh position={[0, 0.62, 0]} rotation-y={labelAngle}>
          <cylinderGeometry args={[VESSEL.radius + 0.004, VESSEL.radius + 0.0, 0.52, 64, 1, true, -0.78, 1.56]} />
          <meshStandardMaterial map={label} roughness={0.85} metalness={0} transparent alphaTest={0.01} />
        </mesh>
      )}

      {/* luxury brass rim */}
      {vessel.lid === 'gold' && (vessel.type === 'marble' || vessel.type === 'matte' || vessel.type === 'porcelain') && (
        <mesh position={[0, VESSEL.height - 0.012, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.812, 0.03, 14, 96]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      )}

      {/* lid */}
      {hasLid && (
        <group ref={lidRef}>
          <mesh geometry={lidGeo} castShadow>
            <meshStandardMaterial {...(vessel.lid === 'wood' ? { color: '#6b4a2e', roughness: 0.7, metalness: 0 } : GOLD)} />
          </mesh>
        </group>
      )}

      {/* flame */}
      {(flameOn || castLight) && <Flame position={[0, waxTop + 0.1, 0]} glow={vessel.glow} scale={flameScale} lightIntensity={lightIntensity} castLight={castLight} on={flameOn} />}
    </group>
  );
}
