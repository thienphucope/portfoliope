'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SIZES, STICKY_PALETTES } from './constants';
import StickyContent from './parts/StickyContent';
import PolaroidContent from './parts/PolaroidContent';
import NewspaperContent from './parts/NewspaperContent';

/**
 * Base component for all 3D items on the board.
 * Handles positioning, physics-based curling geometry, and the nail.
 */
function BaseThreeItem({ item, layout, scaleFactor, size, isSelected, onSelect }) {
  const { x, y, rotation, z } = layout;
  
  // Centering offsets for 2500x1700 resolution
  const pos = [
    (x - 1250) * scaleFactor,
    -(y - 850) * scaleFactor,
    z * 0.005 + 0.002 
  ];

  // Very subtle physics for a light, realistic curl
  const physics = useMemo(() => ({
    tiltX: (Math.random() - 0.5) * 0.015,
    tiltY: (Math.random() - 0.5) * 0.015,
    curl: 0.01 + Math.random() * 0.02, 
    noise: 0.005,
    cornerLift: {
      bl: 0.03 + Math.random() * 0.07, 
      br: 0.03 + Math.random() * 0.07, 
    },
    bottomCurl: 0.03 + Math.random() * 0.05,
    edgeWave: 0.005 + Math.random() * 0.01,
    seed: Math.random() * 20
  }), []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size[0], size[1], 32, 32); 
    const posAttr = geo.attributes.position;
    
    // Pinned point coordinates
    const pinX = 0;
    const pinY = size[1]/2 - 0.05;

    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      
      const nx = px / size[0]; // -0.5 to 0.5
      const ny = py / size[1]; // 0.5 (top) to -0.5 (bottom)

      const distFromTop = 0.5 - ny; // 0 to 1
      
      // 1. Side curl (very subtle)
      let pz = Math.pow(Math.abs(nx), 2) * physics.curl;
      
      // 2. Bottom "cong cực nhẹ"
      pz += Math.pow(distFromTop, 2) * physics.bottomCurl;
      
      // 3. Corner lifts - minimal
      const bottomWeight = Math.pow(Math.max(0, distFromTop - 0.6), 2) * 3;
      const leftWeight = Math.pow(Math.max(0, 0.4 - nx), 1.2);
      const rightWeight = Math.pow(Math.max(0, 0.4 + nx), 1.2);
      
      pz += bottomWeight * (leftWeight * physics.cornerLift.bl + rightWeight * physics.cornerLift.br);
      
      // 4. Trace wave
      pz += Math.sin(nx * 3 + physics.seed) * physics.edgeWave * distFromTop;
      
      // 5. Minimal noise
      pz += (Math.sin(px * 8 + physics.seed) * Math.cos(py * 8 + physics.seed)) * physics.noise;
      
      // 6. Pinning
      const nailDist = Math.sqrt(Math.pow(px - pinX, 2) + Math.pow(py - pinY, 2));
      const pinDamp = THREE.MathUtils.smoothstep(nailDist, 0, 0.15);
      pz *= pinDamp;
      
      posAttr.setZ(i, pz); 
    }
    geo.computeVertexNormals();
    return geo;
  }, [size, physics]);

  const bgColor = item.type === 'sticky' 
    ? (STICKY_PALETTES[item.color]?.bg || STICKY_PALETTES.amber.bg)
    : (item.type === 'newspaper' ? '#ede4c8' : '#f2ece0');

  return (
    <group 
      position={pos} 
      rotation={[physics.tiltX, physics.tiltY, THREE.MathUtils.degToRad(-rotation)]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect();
      }}
    >
      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[size[0] + 0.1, size[1] + 0.1]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Paper Body: Matched to Board Background properties */}
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial 
          color={bgColor} 
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Nail Head */}
      <mesh position={[0, size[1]/2 - 0.05, 0.05]} castShadow>
        <sphereGeometry args={[0.027, 16, 16]} />
        <meshPhysicalMaterial 
          color="#aaaaaa" 
          roughness={0.1}
          metalness={1.0}
        />
      </mesh>
      
      {/* Nail Shaft */}
      <mesh position={[0, size[1]/2 - 0.05, -0.05]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>

      <group position={[0, 0, 0.005]}>
        {item.type === 'sticky' && <StickyContent item={item} size={size} geometry={geometry} />}
        {item.type === 'polaroid' && <PolaroidContent item={item} size={size} geometry={geometry} />}
        {item.type === 'newspaper' && <NewspaperContent item={item} size={size} geometry={geometry} />}
      </group>
    </group>
  );
}

/**
 * Specialized component for Polaroid items to handle texture loading and dynamic sizing.
 */
function PolaroidItem(props) {
  const { item, isSelected, onSelect } = props;
  const polaroidTexture = useTexture(item.imageUrl || '/placeholder.jpg');

  const size = useMemo(() => {
    const s = item.scale || 1.0;
    if (polaroidTexture?.image) {
      const imgW = polaroidTexture.image.width;
      const imgH = polaroidTexture.image.height;
      const aspect = imgW / imgH;
      
      const targetW = 0.9 * s; // Fixed width scaled
      const photoH = targetW / aspect;
      const padding = 0.1 * s; // Scale padding
      return [targetW + padding, photoH + padding];
    }
    return [SIZES.polaroid[0] * s, SIZES.polaroid[1] * s];
  }, [polaroidTexture, item.scale]);

  return <BaseThreeItem {...props} size={size} isSelected={isSelected} onSelect={onSelect} />;
}

/**
 * Main dispatcher component for ThreeItems.
 * Resolves the conditional hook issue by splitting into sub-components.
 */
export default function ThreeItem(props) {
  const { item, isSelected, onSelect } = props;

  if (item.type === 'polaroid') {
    return <PolaroidItem {...props} />;
  }

  const baseSize = SIZES[item.type] || [0.87, 0.87];
  const s = item.scale || 1.0;
  const size = [baseSize[0] * s, baseSize[1] * s];
  return <BaseThreeItem {...props} size={size} isSelected={isSelected} onSelect={onSelect} />;
}
