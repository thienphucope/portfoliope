import { Ring, Box, Disc } from '../primitives';

export function Scissors() {
  return <group position={[2.73, 0.15, 1.29]} rotation={[0, -0.68, 0]}>
    <Ring at={[-0.11, 0.025, -0.06]} radius={0.13} color="#273e36" tube={0.036} scale={[0.8, 1.25, 1]} />
    <Ring at={[0.14, 0.025, -0.06]} radius={0.13} color="#273e36" tube={0.036} scale={[0.8, 1.25, 1]} />
    <Box at={[-0.049, 0.01, 0.43]} size={[0.052, 0.019, 0.72]} rotation={[0, -0.2, 0]} color="#9ea491" />
    <Box at={[0.041, 0.032, 0.43]} size={[0.052, 0.017, 0.72]} rotation={[0, 0.16, 0]} color="#aab19b" />
    <Disc at={[0, 0.054, 0.15]} radius={0.038} height={0.015} color="#bbb69a" />
  </group>;
}
