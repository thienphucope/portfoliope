import { Box, Rod } from '../primitives';
import { ScissorShape } from './ScissorShape';

// Cup and its pens/brushes kept together as one unit.
export function PenCup() {
  return <group position={[-1.26, 0, -1.48]}>
    <Box at={[0, 0.016, 0]} size={[0.39, 0.032, 0.38]} color="#35483a" />
    {[-1, 1].map((side) => <group key={side}>
      <Box at={[side * 0.184, 0.286, 0]} size={[0.022, 0.528, 0.38]} color="#43543e" />
      <Box at={[0, 0.286, side * 0.179]} size={[0.368, 0.528, 0.022]} color="#43543e" />
      {Array.from({ length: 12 }, (_, i) => <group key={i}>
        <Rod from={[-0.168 + i * 0.03, 0.055, side * 0.191]} to={[-0.168 + i * 0.03, 0.529, side * 0.191]} radius={0.003} color="#69785c" metalness={0.2} />
        <Rod from={[side * 0.196, 0.055, -0.164 + i * 0.03]} to={[side * 0.196, 0.529, -0.164 + i * 0.03]} radius={0.003} color="#69785c" metalness={0.2} />
      </group>)}
    </group>)}
    {Array.from({ length: 6 }, (_, i) => <group key={i} position={[(i % 3 - 1) * 0.07, 0.04, (Math.floor(i / 3) - 1) * 0.06]} rotation={[0.045 * (i - 2), 0, (i - 3) * 0.04]}>
      <Rod from={[0, 0, 0]} to={[0, 0.99 + (i % 3) * 0.09, 0]} radius={0.022} color={['#b7a77b', '#786e4e', '#b49358'][i % 3]} metalness={0} segments={6} />
      <mesh position={[0, 1.02 + (i % 3) * 0.09, 0]}><coneGeometry args={[0.022, 0.06, 6]} /><meshStandardMaterial color="#ded1a2" /></mesh>
      <mesh position={[0, 1.047 + (i % 3) * 0.09, 0]}><coneGeometry args={[0.007, 0.021, 6]} /><meshStandardMaterial color="#303c32" /></mesh>
    </group>)}
    <group position={[0.031, 0.877, 0.07]} rotation={[Math.PI / 2 + 0.04, 0, -0.1]} scale={[0.66, 1, 1.05]}><ScissorShape /></group>
  </group>;
}
