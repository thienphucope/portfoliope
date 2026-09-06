import { Box, Rod } from '../primitives';

// Cup and its pens/brushes kept together as one unit.
export function PenCup() {
  return <group position={[-1.26, 0.02, -1.48]}>
    <Box at={[0, 0.28, 0]} size={[0.39, 0.55, 0.38]} color="#4d5541" />
    <Box at={[0, 0.558, 0]} size={[0.31, 0.006, 0.3]} color="#202f2b" cast={false} />
    {Array.from({ length: 8 }, (_, i) => <group key={i} position={[(i % 3 - 1) * 0.085, 0.5, (Math.floor(i / 3) - 1) * 0.08]} rotation={[0.1 * (i - 4), 0, (i - 3) * 0.055]}>
      <Rod from={[0, 0, 0]} to={[0, 0.67 + (i % 3) * 0.09, 0]} radius={0.022} color={['#b7a77b', '#786e4e', '#b49358'][i % 3]} metalness={0} segments={6} />
      <mesh position={[0, 0.7 + (i % 3) * 0.09, 0]}><coneGeometry args={[0.022, 0.06, 6]} /><meshStandardMaterial color="#ded1a2" /></mesh>
    </group>)}
  </group>;
}
