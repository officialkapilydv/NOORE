import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

/** Procedural studio lighting — no HDR download, warm key + cool rim + soft fill. */
export function Studio({ intensity = 1, warm = '#ffe3bd', cool = '#cfd8ff' }) {
  return (
    <>
      <ambientLight intensity={0.12 * intensity} color="#ffe9d0" />
      <directionalLight position={[-4, 6, 4]} intensity={1.1 * intensity} color={warm} />
      <directionalLight position={[5, 3, -4]} intensity={0.6 * intensity} color={cool} />
      <Environment resolution={256} frames={1}>
        <group rotation={[0, 0.4, 0]}>
          <Lightformer form="rect" intensity={2.2 * intensity} color={warm} position={[-5, 4, 3]} scale={[7, 5, 1]} target={[0, 0.8, 0]} />
          <Lightformer form="rect" intensity={1.6 * intensity} color="#ffffff" position={[5, 5, -3]} scale={[4, 6, 1]} target={[0, 0.8, 0]} />
          <Lightformer form="ring" intensity={2.2 * intensity} color="#f3cf8a" position={[0, 7, -6]} scale={[5, 5, 1]} target={[0, 0.8, 0]} />
          <Lightformer form="circle" intensity={0.8 * intensity} color={cool} position={[0, -2, 6]} scale={[8, 8, 1]} target={[0, 0.8, 0]} />
        </group>
      </Environment>
    </>
  );
}

/** Dark polished-stone floor with blurred reflections. */
export function ReflectiveFloor({ y = 0, color = '#1b120e', quality = 'high', radius = 14 }) {
  if (quality === 'low') return null;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} receiveShadow>
      <circleGeometry args={[radius, 64]} />
      <MeshReflectorMaterial
        blur={[420, 120]}
        resolution={quality === 'high' ? 1024 : 512}
        mixBlur={1}
        mixStrength={quality === 'high' ? 22 : 12}
        roughness={0.95}
        depthScale={1.1}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.3}
        color={color}
        metalness={0.45}
        mirror={0.4}
      />
    </mesh>
  );
}

export function SoftShadow({ y = 0.001, opacity = 0.7, scale = 6, blur = 2.4 }) {
  return <ContactShadows position={[0, y, 0]} opacity={opacity} scale={scale} blur={blur} far={3} color="#120a06" frames={1} />;
}

export function PostFX({ quality = 'high', bloom = 0.9, vignette = true }) {
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0} disableNormalPass>
      <Bloom intensity={bloom} luminanceThreshold={0.82} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
      {vignette ? <Vignette eskil={false} offset={0.22} darkness={0.78} /> : <></>}
    </EffectComposer>
  );
}

/**
 * Camera rig: looks at `target`, drifts with the pointer, and can be nudged by a
 * MotionValue (scroll progress) for scroll-linked choreography.
 */
export function CameraRig({ target = [0, 0.75, 0], base = [0, 1.15, 5.2], parallax = 0.45, scroll, scrollOffset = [0, -1.4, 0.6], rotateScroll = 0.8, children }) {
  const group = useRef();
  const { camera, pointer } = useThree();
  const look = useRef(new THREE.Vector3(...target));
  const basePos = useRef(new THREE.Vector3(...base));
  const goal = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const s = scroll ? scroll.get() : 0;
    goal.current.set(
      basePos.current.x + pointer.x * parallax + scrollOffset[0] * s,
      basePos.current.y + pointer.y * parallax * 0.5 + scrollOffset[1] * s,
      basePos.current.z + scrollOffset[2] * s,
    );
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.current.x, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.current.y, 3, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.current.z, 3, delta);
    camera.lookAt(look.current);
    if (group.current) group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, s * rotateScroll + pointer.x * 0.12, 3, delta);
  });

  return <group ref={group}>{children}</group>;
}
