import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Tube, Disc, Screw } from '../primitives';

// Flat forged blades and the tangs inside the moulded grips share one solid.
export function ScissorShape() {
  const blade = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(-0.1, -0.05); outline.lineTo(-0.132, -0.034);
    outline.lineTo(-0.043, 0.18); outline.lineTo(0.072, 0.72);
    outline.quadraticCurveTo(0.086, 0.77, 0.099, 0.785);
    outline.quadraticCurveTo(0.117, 0.76, 0.118, 0.707);
    outline.lineTo(0.046, 0.14); outline.lineTo(-0.1, -0.05); outline.closePath();
    const g = new THREE.ExtrudeGeometry(outline, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
    g.rotateX(Math.PI / 2); return g;
  }, []);
  useEffect(() => () => blade.dispose(), [blade]);
  return <group>
    {[-1, 1].map((side) => <group key={side}>
      <mesh geometry={blade} position={[0, side === -1 ? 0.036 : 0.051, 0]} scale={[side, 1, 1]} castShadow receiveShadow>
        <meshStandardMaterial color={side === 1 ? '#bec2ad' : '#929e90'} roughness={0.3} metalness={0.82} />
      </mesh>
      <Tube points={[[side * 0.1, 0.03, -0.05], [side * 0.203, 0.03, -0.137], [side * 0.216, 0.03, -0.286],
        [side * 0.129, 0.03, -0.337], [side * 0.059, 0.03, -0.278], [side * 0.065, 0.03, -0.148], [side * 0.1, 0.03, -0.05]]}
        radius={0.03} color="#314a3d" metalness={0.03} roughness={0.4} segments={48} />
      <Tube points={[[side * 0.11, 0.03, -0.078], [side * 0.069, 0.038, 0.035], [side * 0.012, 0.041, 0.145]]}
        radius={0.024} color="#314a3d" metalness={0.03} roughness={0.4} segments={16} />
    </group>)}
    <Disc at={[0, 0.052, 0.15]} radius={0.031} height={0.032} color="#7d8d78" />
    <Screw at={[0, 0.071, 0.15]} radius={0.026} rotation={[0, 0, 0]} />
  </group>;
}
