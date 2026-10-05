import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { Billboard, shaderMaterial } from '@react-three/drei';
import { glowTexture } from './materials';

const FlameMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1,
    uCore: new THREE.Color('#fff7dc'),
    uMid: new THREE.Color('#ffb24f'),
    uEdge: new THREE.Color('#ff5a12'),
  },
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv;
      vec3 p = position;
      float sway = sin(uTime * 5.5 + uv.y * 3.0) * 0.045 * smoothstep(0.0, 1.0, uv.y);
      float lick = sin(uTime * 11.0 + uv.y * 9.0) * 0.012 * uv.y;
      p.x += sway + lick;
      p.y *= 1.0 + sin(uTime * 4.0) * 0.04 * uv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uCore;
    uniform vec3 uMid;
    uniform vec3 uEdge;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main() {
      vec2 uv = vUv;
      float y = uv.y;
      float n = noise(vec2(uv.x * 3.0, y * 5.0 - uTime * 2.2));
      // teardrop silhouette: wide near the base, pointed at the tip
      float w = 0.46 * pow(1.0 - y, 0.9) * sqrt(min(1.0, y * 4.5 + 0.05));
      w *= 1.0 + (n - 0.5) * 0.28;
      float x = uv.x - 0.5;
      float d = abs(x) / max(w, 0.0001);
      float body = 1.0 - smoothstep(0.72, 1.0, d);
      body *= smoothstep(0.0, 0.05, y) * smoothstep(1.0, 0.86, y);
      float core = 1.0 - smoothstep(0.0, 0.62, d + max(0.0, y - 0.18) * 0.9);
      vec3 col = mix(uEdge, uMid, smoothstep(0.0, 0.8, body));
      col = mix(col, uCore, clamp(core, 0.0, 1.0));
      // cool blue root
      col = mix(vec3(0.3, 0.45, 1.0), col, smoothstep(0.0, 0.2, y));
      float alpha = body * uIntensity;
      gl_FragColor = vec4(col * (1.2 + core * 1.4), alpha);
    }
  `,
);
extend({ FlameMaterial });

/**
 * A billboarded shader flame with an attached flickering point light.
 * `glow` tints the light (per product) and `scale` lets the hero run bigger.
 */
export function Flame({ position = [0, 0, 0], glow = '#ffb15c', scale = 1, lightIntensity = 5, castLight = true }) {
  const mat = useRef();
  const light = useRef();
  const halo = useRef();
  const glowColor = useMemo(() => new THREE.Color(glow), [glow]);
  const seed = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + seed;
    if (mat.current) {
      mat.current.uTime = t;
      mat.current.uIntensity = 0.92 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 23.7) * 0.03;
    }
    if (light.current) {
      const flicker = 1 + Math.sin(t * 8.3) * 0.08 + Math.sin(t * 19.7) * 0.05 + Math.sin(t * 37.1) * 0.02;
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, lightIntensity * flicker, 12, delta);
      light.current.position.x = Math.sin(t * 6.1) * 0.012;
      light.current.position.z = Math.cos(t * 5.3) * 0.012;
    }
    if (halo.current) {
      const s = 1 + Math.sin(t * 7.7) * 0.06;
      halo.current.scale.set(1.5 * s, 1.5 * s, 1);
      halo.current.material.opacity = 0.3 + Math.sin(t * 9.3) * 0.05;
    }
  });

  return (
    <group position={position} scale={scale}>
      <Billboard follow lockX lockZ>
        <mesh position={[0, 0.25, 0]} renderOrder={10}>
          <planeGeometry args={[0.3, 0.52, 1, 8]} />
          <flameMaterial ref={mat} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
      <sprite ref={halo} position={[0, 0.2, 0]} scale={[1.5, 1.5, 1]} renderOrder={9}>
        <spriteMaterial map={glowTexture()} color={glowColor} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      {castLight && <pointLight ref={light} position={[0, 0.3, 0]} color={glowColor} intensity={lightIntensity} distance={9} decay={1.8} />}
    </group>
  );
}
