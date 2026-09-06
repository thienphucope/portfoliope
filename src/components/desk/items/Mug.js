import { useMemo } from 'react';
import * as THREE from 'three';
import { Disc, Ring, Rod } from '../primitives';

export function Mug({ at = [2.94, 0.04, 0.25] }) {
  const profile = useMemo(() => [[0, 0.02], [0.22, 0.02], [0.235, 0.05], [0.28, 0.54], [0.278, 0.56], [0.249, 0.56], [0.215, 0.08], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)), []);
  return <group position={at}>
    <Disc at={[0, 0.025, 0]} radius={0.39} height={0.02} color="#877a56" metalness={0} />
    <mesh castShadow receiveShadow><latheGeometry args={[profile, 40]} /><meshStandardMaterial color="#465b50" roughness={0.38} metalness={0.1} /></mesh>
    <Ring at={[0.27, 0.31, 0]} radius={0.17} tube={0.044} rotation={[0, 0, 0]} color="#546355" scale={[0.87, 1.2, 1]} />
    <Disc at={[0, 0.484, 0]} radius={0.245} height={0.002} color="#342e1f" metalness={0.1} />
    <Ring at={[0, 0.493, 0]} radius={0.236} tube={0.003} color="#9a8956" />
    {Array.from({ length: 20 }, (_, i) => {
      const a = i / 20 * Math.PI * 2;
      return <Rod key={i} from={[Math.cos(a) * 0.234, 0.08, Math.sin(a) * 0.234]} to={[Math.cos(a) * 0.268, 0.47, Math.sin(a) * 0.268]} radius={0.005} color="#75816a" metalness={0.1} />;
    })}
  </group>;
}
