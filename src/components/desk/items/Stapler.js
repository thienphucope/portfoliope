import { Box } from '../primitives';

export function Stapler() {
  return <group position={[3.09, 0.07, -0.6]} rotation={[0, 0.13, 0]}>
    <Box at={[0, 0.07, 0]} size={[0.12, 0.14, 0.51]} color="#2c423a" />
    <Box at={[0, 0.14, 0]} size={[0.145, 0.045, 0.55]} color="#607566" />
    <Box at={[0, 0.03, 0.1]} size={[0.105, 0.018, 0.3]} color="#a5ad98" />
  </group>;
}
