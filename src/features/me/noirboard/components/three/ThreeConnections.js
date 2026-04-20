'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { SIZES } from './constants';

export default function ThreeConnections({ items, connections, layouts, scaleFactor }) {
  const itemMap = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [items]);

  const threads = useMemo(() => {
    return connections.map(({ from, to }, i) => {
      const startLayout = layouts[from];
      const endLayout = layouts[to];
      const startItem = itemMap[from];
      const endItem = itemMap[to];

      if (!startLayout || !endLayout || !startItem || !endItem) return null;

      const getPinPos = (layout, type) => {
        const size = SIZES[type] || [1, 1];
        const pinY = size[1] / 2 - 0.05;
        
        // Apply rotation to pin position
        const angle = THREE.MathUtils.degToRad(-layout.rotation);
        const localPin = new THREE.Vector3(0, pinY, 0.15);
        localPin.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);

        return new THREE.Vector3(
          (layout.x - 625) * scaleFactor + localPin.x,
          -(layout.y - 425) * scaleFactor + localPin.y,
          layout.z * 0.04 + 0.01 + localPin.z
        );
      };

      // Use actual item type for accurate pin positioning
      const p1 = getPinPos(startLayout, startItem.type); 
      const p2 = getPinPos(endLayout, endItem.type);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.y -= dist * 0.15; // Sag
      mid.z += 0.1; // Move forward slightly

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      return curve;
    }).filter(Boolean);
  }, [connections, layouts, scaleFactor, itemMap]);

  return (
    <group>
      {threads.map((curve, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[curve, 20, 0.01, 8, false]} />
          <meshStandardMaterial color="#9b0e0e" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
