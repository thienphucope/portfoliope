'use client';

import { Text } from '@react-three/drei';
import { FONTS } from '../constants';

export default function NewspaperContent({ item, size }) {
  return (
    <group>
      <mesh position={[0, size[1]/2 - 0.22, 0.005]}>
        <planeGeometry args={[size[0] - 0.12, 0.28]} />
        <meshStandardMaterial color="#14100a" roughness={1} metalness={0} />
      </mesh>
      <Text
        position={[0, size[1]/2 - 0.22, 0.008]}
        fontSize={0.095} 
        color="#e8d898"
        font={FONTS.imFell}
        maxWidth={size[0] - 0.25}
        textAlign="center"
        sdfGlyphSize={64}
      >
        {item.title}
      </Text>
      <Text
        position={[0, size[1]/2 - 0.45, 0.006]}
        fontSize={0.065}
        color="#14100a"
        font={FONTS.imFell}
        maxWidth={size[0] - 0.25}
        textAlign="center"
        sdfGlyphSize={64}
      >
        {item.subtitle}
      </Text>
      <Text
        position={[0, -0.1, 0.005]}
        fontSize={0.045} 
        color="#14100a"
        font={FONTS.specialElite}
        maxWidth={size[0] - 0.25}
        textAlign="justify"
        lineHeight={1.4}
        sdfGlyphSize={64}
      >
        {item.content}
      </Text>
    </group>
  );
}
