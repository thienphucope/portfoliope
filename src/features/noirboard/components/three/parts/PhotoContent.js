'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function PhotoContent({ item, size, geometry }) {
  const texture = useTexture(item.imageUrl || '/placeholder.jpg');

  const photoTexture = useMemo(() => {
    const tex = texture.clone();
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }, [texture]);

  return (
    <mesh geometry={geometry} position={[0, 0, 0.002]}>
      <meshStandardMaterial
        map={photoTexture}
        toneMapped={true}
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
