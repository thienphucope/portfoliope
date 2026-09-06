import { useMemo } from 'react';
import * as THREE from 'three';
import { Disc, Rod, Ring } from '../primitives';

const LAMP_SHADE_POSITION = [-1.92, 2.38, -0.39];
const LAMP_TARGET = [-0.02, 0.05, 0.62];

export function DeskLamp() {
  const shadeRotation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(...LAMP_TARGET).sub(new THREE.Vector3(...LAMP_SHADE_POSITION)).normalize()), []);
  const shadeProfile = useMemo(() => [new THREE.Vector2(0.53, -0.2), new THREE.Vector2(0.54, -0.17), new THREE.Vector2(0.48, -0.12),
    new THREE.Vector2(0.23, 0.25), new THREE.Vector2(0.14, 0.29), new THREE.Vector2(0.13, 0.4), new THREE.Vector2(0, 0.4)], []);
  const spring = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    return new THREE.Vector3(-2.97 + t * 0.27 + Math.cos(t * Math.PI * 26) * 0.047, 0.72 + t * 0.59, -0.83 + Math.sin(t * Math.PI * 26) * 0.047);
  })), []);
  return <group>
    <Disc at={[-2.84, 0.105, -0.93]} radius={0.48} height={0.18} topRadius={0.39} color="#303c36" />
    <Disc at={[-2.84, 0.202, -0.93]} radius={0.23} height={0.025} color="#4d5645" />
    <Rod from={[-2.84, 0.18, -0.93]} to={[-2.84, 0.51, -0.93]} radius={0.074} />
    {[-0.073, 0.073].map((offset) => <group key={offset}>
      <Rod from={[-2.84 + offset, 0.4, -0.93]} to={[-3.13 + offset, 1.49, -1.1]} radius={0.035} />
      <Rod from={[-3.13 + offset, 1.49, -1.1]} to={[-1.94 + offset, 2.35, -0.44]} radius={0.035} />
    </group>)}
    <Rod from={[-2.72, 0.4, -0.93]} to={[-2.92, 1.49, -1.1]} radius={0.025} />
    <Rod from={[-2.92, 1.49, -1.1]} to={[-1.94, 2.23, -0.44]} radius={0.025} />
    {[[-2.84, 0.42, -0.93], [-3.03, 1.5, -1.1], [-1.94, 2.31, -0.44]].map((at, i) =>
      <Disc key={i} at={at} radius={0.097} height={0.19} color="#677061" rotation={[Math.PI / 2, 0, 0]} />)}
    <mesh castShadow><tubeGeometry args={[spring, 100, 0.011, 5, false]} /><meshStandardMaterial color="#899486" metalness={0.7} roughness={0.4} /></mesh>
    <group position={LAMP_SHADE_POSITION} quaternion={shadeRotation}>
      <mesh castShadow receiveShadow><latheGeometry args={[shadeProfile, 48]} /><meshStandardMaterial color="#34423b" side={THREE.DoubleSide} roughness={0.45} metalness={0.55} /></mesh>
      <mesh position={[0, -0.135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.46, 48]} /><meshStandardMaterial color="#e4d5a8" emissive="#ffd08b" emissiveIntensity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <Ring at={[0, -0.188, 0]} radius={0.518} tube={0.02} color="#7d8270" />
      <mesh position={[0, -0.171, 0]}><sphereGeometry args={[0.12, 20, 12]} /><meshBasicMaterial color="#fff1c5" /></mesh>
    </group>
    <Rod from={[-1.94, 2.3, -0.44]} to={[-1.98, 2.77, -0.58]} radius={0.025} />
  </group>;
}
