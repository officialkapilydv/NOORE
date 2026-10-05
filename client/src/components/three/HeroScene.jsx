import { useMemo } from 'react';
import { Float } from '@react-three/drei';
import { SceneShell } from './SceneShell';
import { Candle } from './Candle';
import { GoldDust, Embers } from './Particles';
import { CameraRig, PostFX, ReflectiveFloor, SoftShadow, Studio } from './Studio';
import { CandleThumb } from '@/components/shop/CandleThumb';

const HERO_PRODUCT = {
  name: 'Amber & Saffron',
  collection: 'premium',
  vessel: { type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'gold', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c' },
};
const SIDE_A = {
  name: 'Royal Oud',
  collection: 'luxury',
  vessel: { type: 'marble', color: '#f1ece4', veins: '#c9a24a', wax: '#f5ead7', lid: 'gold', labelBg: '#fbf8f2', labelText: '#2d2016', accent: '#c9a24a', glow: '#ffc784' },
};
const SIDE_B = {
  name: 'Musk Noir',
  collection: 'premium',
  vessel: { type: 'matte', color: '#161210', wax: '#efe4d2', lid: 'none', labelBg: '#1a1513', labelText: '#e8dcc6', accent: '#b89a5a', glow: '#ffb978' },
};

/** The homepage hero: a lit Amber & Saffron on polished stone, flanked by two companions. */
export function HeroScene({ scroll, product, shift = 0, narrow = false }) {
  const hero = useMemo(() => product || HERO_PRODUCT, [product]);
  return (
    <SceneShell className="scene--hero" fallback={<div className="scene__fallback"><CandleThumb vessel={hero.vessel} size={260} lit /></div>}>
      {(quality) => (
        <>
          <Studio intensity={1} />
          <CameraRig scroll={scroll} base={narrow ? [0, 1.3, 7.8] : [shift * 0.85, 1.05, 5.4]} target={narrow ? [0, 0.6, 0] : [shift, 0.72, 0]}>
            <group position={[0, 0, 0]}>
              <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12} floatingRange={[-0.02, 0.02]}>
                <Candle product={hero} quality={quality} lid={narrow ? 'hidden' : 'open'} lidPose="left" scale={1.08} lightIntensity={6} flameScale={1.1} />
              </Float>
              {narrow && <Candle product={SIDE_A} quality={quality} lid="closed" lit={false} scale={0.78} position={[-2.0, 0, -1.3]} rotation-y={0.5} castLight={false} />}
              <Candle product={SIDE_B} quality={quality} lit scale={narrow ? 0.7 : 0.66} position={narrow ? [1.9, 0, -1.5] : [-1.35, 0, -2.7]} rotation-y={-0.4} lightIntensity={1.4} flameScale={0.8} />
            </group>
            {quality !== 'low' && <Embers origin={[0, 1.22 * 1.08, 0]} count={quality === 'high' ? 40 : 20} />}
            <GoldDust count={quality === 'high' ? 360 : 160} />
          </CameraRig>
          <ReflectiveFloor quality={quality} />
          <SoftShadow opacity={0.8} scale={7} />
          <fog attach="fog" args={['#0d0907', 7, 16]} />
          <PostFX quality={quality} bloom={1.05} />
        </>
      )}
    </SceneShell>
  );
}
