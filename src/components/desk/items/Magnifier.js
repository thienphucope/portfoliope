import { Ring, Rod } from '../primitives';

export function Magnifier() {
  return <group position={[-2.08, 0.17, 0.11]} rotation={[0, -0.48, 0]}>
    <Ring at={[0, 0.048, 0]} radius={0.288} tube={0.031} color="#9a8a59" />
    <mesh position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.277, 40]} /><meshStandardMaterial color="#b6d7c3" transparent opacity={0.14} roughness={0.08} metalness={0.2} depthWrite={false} />
    </mesh>
    <Rod from={[0, 0.04, 0.28]} to={[0, 0.055, 0.45]} radius={0.03} color="#aa9965" />
    <Rod from={[0, 0.054, 0.42]} to={[0, 0.054, 0.99]} radius={0.064} color="#494337" metalness={0.1} />
  </group>;
}
