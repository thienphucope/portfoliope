import { Box, Ring } from '../primitives';

export function Calendar({ texture }) {
  return <group position={[-1.93, 0.07, -0.97]} rotation={[0, 0.14, 0]}>
    <Box at={[0, 0.39, -0.12]} size={[0.66, 0.81, 0.035]} rotation={[0.22, 0, 0]} color="#263d36" />
    <Box at={[0, 0.38, 0.2]} size={[0.66, 0.8, 0.035]} rotation={[-0.22, 0, 0]} color="#374c41" />
    <mesh position={[0, 0.41, 0.226]} rotation={[-0.22, 0, 0]} castShadow receiveShadow>
      <planeGeometry args={[0.593, 0.69]} /><meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => <Ring key={i} at={[-0.265 + i * 0.075, 0.808, 0.039]} radius={0.034} tube={0.006} rotation={[0, Math.PI / 2, 0]} color="#99a18a" />)}
  </group>;
}
