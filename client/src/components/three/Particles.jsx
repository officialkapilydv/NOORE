import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

const DustMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#e8cf8a'), uSize: 26, uOpacity: 0.9 },
  /* glsl */ `
    attribute float aPhase;
    attribute float aScale;
    varying float vTwinkle;
    uniform float uTime;
    uniform float uSize;
    void main() {
      vec3 p = position;
      p.y += sin(uTime * 0.25 + aPhase) * 0.15;
      p.x += sin(uTime * 0.2 + aPhase * 1.7) * 0.12;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 0.3) + aPhase * 6.0);
      gl_PointSize = uSize * aScale * (1.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    varying float vTwinkle;
    uniform vec3 uColor;
    uniform float uOpacity;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.08, d);
      gl_FragColor = vec4(uColor * (1.0 + vTwinkle * 0.8), a * vTwinkle * uOpacity);
    }
  `,
);
extend({ DustMaterial });

/** Slow-drifting gold dust suspended in the air around the candle. */
export function GoldDust({ count = 320, spread = [5, 4, 3], center = [0, 1.4, 0], color = '#e8cf8a', size = 26, opacity = 0.9 }) {
  const mat = useRef();
  const { positions, phases, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = center[0] + (Math.random() - 0.5) * spread[0];
      positions[i * 3 + 1] = center[1] + (Math.random() - 0.5) * spread[1];
      positions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * spread[2];
      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.4 + Math.random() * Math.random() * 1.6;
    }
    return { positions, phases, scales };
  }, [count, spread, center]);

  useFrame((state) => {
    if (mat.current) mat.current.uTime = state.clock.elapsedTime;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <dustMaterial ref={mat} uColor={new THREE.Color(color)} uSize={size} uOpacity={opacity} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

/** Embers that rise from the flame tip and fade. */
export function Embers({ origin = [0, 1.25, 0], count = 36, color = '#ffb15c' }) {
  const geo = useRef();
  const mat = useRef();
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const vel = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      life[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.3 + Math.random() * 0.5;
      positions[i * 3] = origin[0]; positions[i * 3 + 1] = origin[1]; positions[i * 3 + 2] = origin[2];
      vel[i * 3] = (Math.random() - 0.5) * 0.25; vel[i * 3 + 1] = 0.5 + Math.random() * 0.7; vel[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    return { positions, life, vel, phases, scales };
  }, [count, origin]);

  useFrame((state, delta) => {
    const { positions, life, vel } = data;
    for (let i = 0; i < count; i++) {
      life[i] += delta * 0.45;
      if (life[i] > 1) {
        life[i] = 0;
        positions[i * 3] = origin[0] + (Math.random() - 0.5) * 0.05;
        positions[i * 3 + 1] = origin[1];
        positions[i * 3 + 2] = origin[2] + (Math.random() - 0.5) * 0.05;
        vel[i * 3] = (Math.random() - 0.5) * 0.3;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      positions[i * 3] += (vel[i * 3] + Math.sin(state.clock.elapsedTime * 3 + i) * 0.08) * delta;
      positions[i * 3 + 1] += vel[i * 3 + 1] * delta;
      positions[i * 3 + 2] += vel[i * 3 + 2] * delta;
      data.scales[i] = (1 - life[i]) * 0.7;
    }
    if (geo.current) {
      geo.current.attributes.position.needsUpdate = true;
      geo.current.attributes.aScale.needsUpdate = true;
    }
    if (mat.current) mat.current.uTime = state.clock.elapsedTime;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[data.scales, 1]} />
      </bufferGeometry>
      <dustMaterial ref={mat} uColor={new THREE.Color(color)} uSize={22} uOpacity={0.8} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}
