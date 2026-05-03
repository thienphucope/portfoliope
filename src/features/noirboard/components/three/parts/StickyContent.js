'use client';

import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FONTS, STICKY_PALETTES } from '../constants';

export default function StickyContent({ item, size }) {
  const p = STICKY_PALETTES[item.color] || STICKY_PALETTES.amber;
  return (
    <group>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.075} 
        color={p.text}
        maxWidth={size[0] - 0.15}
        font={FONTS.caveat}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        sdfGlyphSize={64}
      >
        {item.content}
      </Text>
      <mesh position={[size[0]/2 - 0.07, size[1]/2 - 0.07, 0.005]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.13, 0.13]} />
        <meshPhysicalMaterial color={p.fold} roughness={1} />
      </mesh>
    </group>
  );
}
