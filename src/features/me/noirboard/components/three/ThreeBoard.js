'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';
import ThreeItem from './ThreeItem';
import ThreeConnections from './ThreeConnections';
import Lighting from './parts/Lighting';
import { useItems } from '../../hooks/useItems';
import { getItemLayout } from '../../utils/seedLayout';

// Increased resolution for maximum sharpness: 2500x1700
const CANVAS_W = 2500;
const CANVAS_H = 1700;
const SCALE_FACTOR = 0.01;

function Room() {
  return (
    <group>
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
      <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#020202" roughness={1} />
      </mesh>
    </group>
  );
}

function BoardBackground() {
  const texture = useTexture('/mapimage.png');
  texture.anisotropy = 16;
  return (
    <mesh receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[CANVAS_W * SCALE_FACTOR, CANVAS_H * SCALE_FACTOR]} />
      <meshStandardMaterial map={texture} color="#666" roughness={1} metalness={0} />
    </mesh>
  );
}

function Items() {
  const { items, connections, loading } = useItems();
  const layouts = useMemo(() => {
    if (loading) return {};
    return items.reduce((acc, item, i) => {
      acc[item.id] = getItemLayout(item.id, i, items.length, CANVAS_W, CANVAS_H);
      return acc;
    }, {});
  }, [items, loading]);
  if (loading) return null;
  return (
    <>
      {items.map(item => (
        <ThreeItem key={item.id} item={item} layout={layouts[item.id]} scaleFactor={SCALE_FACTOR} />
      ))}
      <ThreeConnections items={items} connections={connections} layouts={layouts} scaleFactor={SCALE_FACTOR} />
    </>
  );
}

function Scene() {
  return (
    <>
      <Lighting />
      <Room />
      <Suspense fallback={null}>
        <BoardBackground />
        <Items />
      </Suspense>

      <OrbitControls
        enableRotate={true}
        enableDamping={true}
        screenSpacePanning={true}
      />
    </>
  );
}

export default function ThreeBoard() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000' }}>
      <Canvas 
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 3]} 
        gl={{ 
          antialias: true, 
          alpha: true, 
          precision: 'highp',
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 0.65
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={40} />
        <Scene />
        <Preload all />
      </Canvas>
    </div>
  );
}
