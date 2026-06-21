import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { m } from 'framer-motion';
import { PetType } from '../types';

// (WebP static images kept in src/assets/pets/*.webp as design references)

// ─── Lottie animation JSON imports ──────────────────────────────────────────
// CAT
import catIdle from '../assets/pets/cat/idle.json';
import catEating from '../assets/pets/cat/eating.json';
import catLevelUp from '../assets/pets/cat/levelup.json';
// HAMSTER
import hamsterIdle from '../assets/pets/hamster/idle.json';
import hamsterEating from '../assets/pets/hamster/eating.json';
import hamsterLevelUp from '../assets/pets/hamster/levelup.json';
// BIRD
import birdIdle from '../assets/pets/bird/idle.json';
import birdEating from '../assets/pets/bird/eating.json';
import birdLevelUp from '../assets/pets/bird/levelup.json';
// RABBIT
import rabbitIdle from '../assets/pets/rabbit/idle.json';
import rabbitEating from '../assets/pets/rabbit/eating.json';
import rabbitLevelUp from '../assets/pets/rabbit/levelup.json';
// FOX
import foxIdle from '../assets/pets/fox/idle.json';
import foxEating from '../assets/pets/fox/eating.json';
import foxLevelUp from '../assets/pets/fox/levelup.json';
// MONKEY
import monkeyIdle from '../assets/pets/monkey/idle.json';
import monkeyEating from '../assets/pets/monkey/eating.json';
import monkeyLevelUp from '../assets/pets/monkey/levelup.json';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MathPetProps {
  type: PetType;
  level: number;
  animationState?: 'idle' | 'eating' | 'levelUp';
  className?: string;
}

type AnimState = 'idle' | 'eating' | 'levelUp';

// ─── Animation data map ──────────────────────────────────────────────────────
// Each pet has 3 animation states: idle (loops), eating (plays once), levelUp (plays once)
const LOTTIE_MAP: Record<PetType, Record<AnimState, object>> = {
  cat:     { idle: catIdle,     eating: catEating,     levelUp: catLevelUp },
  hamster: { idle: hamsterIdle, eating: hamsterEating, levelUp: hamsterLevelUp },
  bird:    { idle: birdIdle,    eating: birdEating,    levelUp: birdLevelUp },
  rabbit:  { idle: rabbitIdle,  eating: rabbitEating,  levelUp: rabbitLevelUp },
  fox:     { idle: foxIdle,     eating: foxEating,     levelUp: foxLevelUp },
  monkey:  { idle: monkeyIdle,  eating: monkeyEating,  levelUp: monkeyLevelUp },
};



// ─── Accessory positioning per pet ──────────────────────────────────────────
const ACCESSORY_OFFSETS: Record<PetType, {
  scarf:   { x: number; y: number; scale: number };
  glasses: { x: number; y: number; scale: number };
  cap:     { x: number; y: number; scale: number };
}> = {
  cat:     { scarf: { x: 0, y: 2,  scale: 0.95 }, glasses: { x: 0, y: -2, scale: 0.95 }, cap: { x: 0, y: -4, scale: 0.90 } },
  hamster: { scarf: { x: 0, y: 7,  scale: 0.90 }, glasses: { x: 0, y: 4,  scale: 1.00 }, cap: { x: 0, y: 2,  scale: 0.85 } },
  bird:    { scarf: { x: 0, y: -1, scale: 0.90 }, glasses: { x: 0, y: -4, scale: 0.85 }, cap: { x: 0, y: -6, scale: 0.85 } },
  rabbit:  { scarf: { x: 0, y: 3,  scale: 0.95 }, glasses: { x: 0, y: -1, scale: 0.95 }, cap: { x: 0, y: 3,  scale: 0.85 } },
  fox:     { scarf: { x: 0, y: 3,  scale: 0.95 }, glasses: { x: 0, y: 0,  scale: 1.00 }, cap: { x: 0, y: -1, scale: 0.95 } },
  monkey:  { scarf: { x: 0, y: 5,  scale: 0.95 }, glasses: { x: 0, y: 1,  scale: 0.95 }, cap: { x: 0, y: 1,  scale: 0.95 } },
};

/**
 * MathPet component displaying the animated Lottie character and its level accessories.
 * Levels unlock hats, glasses, and scarves dynamically.
 */
export const MathPet: React.FC<MathPetProps> = React.memo(({
  type,
  level,
  animationState = 'idle',
  className = '',
}) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Evolution tier accessories
  const showScarf   = level === 2;
  const showGlasses = level === 3;
  const showGradCap = level >= 4;

  const offset = ACCESSORY_OFFSETS[type];
  const rawAnim = LOTTIE_MAP[type][animationState];
  // Unwrap default wrapper if present (sometimes Vite/bundlers wrap JSON files)
  const animData = (rawAnim as any)?.default || rawAnim;

  // Debugging log to verify Lottie data shape in the browser
  useEffect(() => {
    console.log("MathPet Debug:", {
      type,
      animationState,
      hasRawData: !!rawAnim,
      isDefaultWrapped: !!(rawAnim as any)?.default,
      keys: animData ? Object.keys(animData).slice(0, 10) : []
    });
  }, [type, animationState, rawAnim, animData]);

  // Control looping — idle loops forever; eating & levelUp play once
  const shouldLoop = animationState === 'idle';

  // When animationState changes, restart the animation from frame 0
  useEffect(() => {
    const player = lottieRef.current;
    if (!player) return;
    try {
      player.goToAndPlay(0, true);
    } catch (e) {
      console.error("MathPet error playing animation:", e);
    }
  }, [animationState, type]);

  // ── Accessories SVG overlay ─────────────────────────────────────────────
  const renderAccessories = () => (
    <>
      {/* Level 2 — Scarf (Syal) */}
      {showScarf && (
        <g
          id="scarf-accessory"
          transform={`translate(${offset.scarf.x}, ${offset.scarf.y}) scale(${offset.scarf.scale})`}
          style={{ transformOrigin: '70px 70px' }}
        >
          <path d="M52 74 C 60 79, 80 79, 88 74 C 84 82, 56 82, 52 74" fill="#dc2626" />
          <path d="M58 78 C 55 88, 63 94, 61 98 C 65 98, 68 88, 63 78" fill="#b91c1c" />
        </g>
      )}

      {/* Level 3 — Glasses (Kacamata) */}
      {showGlasses && (
        <g
          id="glasses-accessory"
          transform={`translate(${offset.glasses.x}, ${offset.glasses.y}) scale(${offset.glasses.scale})`}
          style={{ transformOrigin: '70px 70px' }}
        >
          <circle cx="56" cy="54" r="8" fill="none" stroke="#1e293b" strokeWidth="2" />
          <circle cx="84" cy="54" r="8" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path d="M64 54 Q 70 51, 76 54" fill="none" stroke="#1e293b" strokeWidth="2" />
          <path d="M48 54 Q 45 51, 42 53" fill="none" stroke="#1e293b" strokeWidth="1.5" />
          <path d="M92 54 Q 95 51, 98 53" fill="none" stroke="#1e293b" strokeWidth="1.5" />
        </g>
      )}

      {/* Level 4+ — Graduation Cap (Toga) */}
      {showGradCap && (
        <g
          id="grad-cap-accessory"
          transform={`translate(${offset.cap.x}, ${offset.cap.y}) scale(${offset.cap.scale})`}
          style={{ transformOrigin: '70px 70px' }}
        >
          <path d="M55 24 L 85 24 L 82 31 L 58 31 Z" fill="#1e293b" />
          <polygon points="70,12 100,22 70,30 40,22" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <path d="M70 22 Q 88 24, 92 34" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="90" y="34" width="4" height="6" rx="1" fill="#eab308" />
        </g>
      )}
    </>
  );

  const sizeClass = className.includes('w-') ? '' : 'w-24 h-24 sm:w-28 sm:h-28';

  return (
    <m.div
      className={`relative inline-flex items-center justify-center bg-white dark:bg-[#1d1d1f] rounded-full border border-[#e0e0e0] dark:border-[#2a2a2c] overflow-hidden ${sizeClass} ${className}`}
      style={{ transformOrigin: 'bottom center' }}
    >
      {/* ── Lottie Animation Player ─────────────────────────────────────── */}
      <Lottie
        lottieRef={lottieRef}
        animationData={animData}
        loop={shouldLoop}
        autoplay={true}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        aria-label={`${type} ${animationState} animation`}
      />

      {/* ── Accessories SVG layer on top of animation ───────────────────── */}
      <svg
        viewBox="0 0 140 140"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none select-none"
        aria-hidden="true"
      >
        {renderAccessories()}
      </svg>
    </m.div>
  );
});

MathPet.displayName = 'MathPet';
export default MathPet;
