import { useEffect, useMemo } from 'react';
import { Box, Paper, Book } from '../primitives';

export function Organizer({ textures, woodMaterial }) {
  // Own copy of the shared desk wood so the hover glow stays on this item
  // instead of bleeding onto the desk and room that reuse the same material.
  const wood = useMemo(() => woodMaterial.clone(), [woodMaterial]);
  useEffect(() => () => wood.dispose(), [wood]);
  return <group position={[2.16, 0.04, -1.32]}>
    <Box at={[0, 0.57, -0.45]} size={[1.72, 1.16, 0.08]} material={wood} />
    {[-0.82, 0.82].map((x) => <Box key={x} at={[x, 0.57, 0]} size={[0.085, 1.16, 1.06]} material={wood} />)}
    {[0.02, 0.4, 0.78, 1.17].map((y) => <Box key={y} at={[0, y, 0]} size={[1.72, 0.055, 1.06]} material={wood} />)}
    {[0.09, 0.47, 0.85].map((y, i) => <group key={i}>
      <Box at={[-0.08, y, 0.07 + (i % 2) * 0.08]} size={[1.43, 0.07, 0.77]} color="#a9aa8f" />
      <Paper at={[-0.08, y + 0.041, 0.09]} width={1.39} depth={0.82} texture={textures.clippings[i]} color="#ffffff" curl={0.01} turn={i * 0.018} />
      <Box at={[0, y + 0.01, 0.5]} size={[1.41, 0.07, 0.023]} color="#a09879" />
    </group>)}
    <Book at={[0, 1.3, -0.04]} size={[1.35, 0.19, 0.88]} turn={-0.13} color="#72734d" texture={textures.bookSpines[1]} />
    <Book at={[-0.02, 1.47, 0.06]} size={[1.2, 0.13, 0.95]} turn={0.025} color="#455e6d" texture={textures.bookSpines[0]} />
    {Array.from({ length: 5 }, (_, i) => <group key={i} position={[-1.07 - i * 0.17, 0.56 + i * 0.02, -0.1]} rotation={[0, -0.08, -0.22 - i * 0.037]}>
      <Book at={[0, 0, 0]} size={[0.13 + (i % 2) * 0.04, 1.24 + (i % 3) * 0.13, 0.71]} color={['#9a6444', '#d0bb80', '#667859', '#bca777', '#5c756b'][i]} />
    </group>)}
  </group>;
}
