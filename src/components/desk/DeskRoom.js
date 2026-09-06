import { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Rod, Disc, Paper, Book } from './primitives';

const BOARD_PINS = [[-0.91, 0.49], [-0.35, 0.04], [0.25, 0.39], [0.83, -0.3], [-0.55, -0.42]];

function Window({ position, rotation, width, height = 4.1, rain, compact }) {
  const slatCount = compact ? 22 : 29;
  return <group position={position} rotation={rotation}>
    {/* The city is behind real slats and mullions, inside the same 3D space. */}
    <mesh position={[0, 0, -0.17]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="#9bbdb8" emissive="#b1d6d2" emissiveIntensity={0.7} roughness={1} />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => <group key={i}>
      <Box at={[-width / 2 + 0.17 + i * width / 9, -height * 0.3 + (i % 3) * 0.09, -0.135]}
        size={[width / 9 * 0.88, height * (0.27 + (i % 3) * 0.12), 0.009]} color={i % 2 ? '#6a918b' : '#719992'} cast={false} />
      {Array.from({ length: 6 }, (_, row) => <Box key={row} at={[-width / 2 + 0.17 + i * width / 9, -height * 0.4 + row * 0.17, -0.12]}
        size={[width / 9 * 0.61, 0.035, 0.006]} color="#9ab2a4" cast={false} />)}
    </group>)}
    <mesh position={[0, 0, -0.09]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={rain} transparent opacity={0.65} roughness={0.7} depthWrite={false} />
    </mesh>
    {[-width / 2, width / 2].map((x) => <Box key={x} at={[x, 0, 0]} size={[0.13, height + 0.22, 0.28]} color="#4e6b61" />)}
    {[-height / 2, height / 2].map((y) => <Box key={y} at={[0, y, 0]} size={[width + 0.24, 0.12, 0.28]} color="#58756a" />)}
    <Box at={[0, 0, 0.004]} size={[0.08, height, 0.22]} color="#49685d" />
    <Box at={[0, -height * 0.19, 0]} size={[width, 0.065, 0.21]} color="#557365" />
    <Box at={[0, -height / 2 - 0.055, 0.13]} size={[width + 0.37, 0.13, 0.65]} color="#738777" />
    <Box at={[0, height / 2 - 0.04, 0.18]} size={[width, 0.13, 0.22]} color="#7d9180" />
    {Array.from({ length: slatCount }, (_, i) => <Box key={i}
      at={[0, height / 2 - 0.19 - i * (height - 0.2) / slatCount, 0.19]}
      size={[width - 0.08, 0.018, 0.17]} rotation={[-0.26, 0, 0]}
      color={i % 3 === 0 ? '#9fb6ac' : '#b4c6b8'} emissive="#8fb8b5" glow={0.15} cast={false} />)}
    {[-0.36, -0.12, 0.12, 0.36].map((fraction) => <Rod key={fraction}
      from={[width * fraction, height / 2 - 0.17, 0.245]} to={[width * fraction, -height / 2 + 0.03, 0.245]}
      radius={0.008} color="#afbea5" metalness={0} segments={5} />)}
    <Rod from={[width / 2 - 0.2, height / 2 - 0.17, 0.3]} to={[width / 2 - 0.2, -height / 2 + 0.72, 0.3]} radius={0.011} color="#b7c0a7" metalness={0} />
    <Disc at={[width / 2 - 0.2, -height / 2 + 0.69, 0.3]} radius={0.024} height={0.1} color="#b6b391" metalness={0} />
  </group>;
}

function Board({ textures, woodMaterial }) {
  const threads = useMemo(() => BOARD_PINS.slice(1).map((end, i) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(BOARD_PINS[i][0], BOARD_PINS[i][1], 0.114),
    new THREE.Vector3((BOARD_PINS[i][0] + end[0]) / 2, (BOARD_PINS[i][1] + end[1]) / 2 - 0.04, 0.115),
    new THREE.Vector3(end[0], end[1], 0.114),
  ])), []);
  return <group position={[-4.54, 2.42, -2.64]} scale={[2, 2, 1]}>
    <Box size={[2.56, 1.82, 0.1]} color="#796f4e" />
    {[-1.29, 1.29].map((x) => <Box key={x} at={[x, 0, 0.06]} size={[0.08, 1.94, 0.12]} material={woodMaterial} />)}
    {[-0.94, 0.94].map((y) => <Box key={y} at={[0, y, 0.06]} size={[2.64, 0.08, 0.12]} material={woodMaterial} />)}
    <mesh position={[0.2, 0.04, 0.057]} rotation={[0, 0, 0.02]}><planeGeometry args={[1.85, 1.5]} /><meshStandardMaterial map={textures.map} roughness={1} /></mesh>
    <mesh position={[-0.86, 0.39, 0.07]} rotation={[0, 0, -0.12]}><planeGeometry args={[0.56, 0.65]} /><meshStandardMaterial map={textures.clippings[1]} roughness={1} /></mesh>
    <mesh position={[-0.57, -0.47, 0.084]} rotation={[0, 0, 0.13]}><planeGeometry args={[0.63, 0.45]} /><meshStandardMaterial map={textures.photos[2]} roughness={1} /></mesh>
    <mesh position={[0.74, 0.59, 0.076]} rotation={[0, 0, -0.05]}><planeGeometry args={[0.39, 0.39]} /><meshStandardMaterial map={textures.notes[4]} roughness={1} /></mesh>
    {BOARD_PINS.map(([x, y], i) => <mesh key={i} position={[x, y, 0.124]} castShadow><sphereGeometry args={[0.029, 10, 8]} /><meshStandardMaterial color="#a04b35" roughness={0.5} /></mesh>)}
    {threads.map((curve, i) => <mesh key={i}><tubeGeometry args={[curve, 12, 0.007, 5, false]} /><meshStandardMaterial color="#aa5240" roughness={1} /></mesh>)}
  </group>;
}

export function DeskFurniture({ woodMaterial, textures }) {
  return <group>
    <Box at={[0, -0.14, 0]} size={[8.45, 0.28, 4.55]} material={woodMaterial} />
    <Box at={[0, -0.039, 2.268]} size={[8.4, 0.044, 0.045]} color="#a58b63" cast={false} />
    <Box at={[0, -0.3, 2.15]} size={[8.34, 0.07, 0.11]} color="#544e3b" />
    <Box at={[-2.62, -0.59, 1.75]} size={[2.32, 0.74, 0.19]} material={woodMaterial} />
    <Box at={[-0.44, -0.44, 1.75]} size={[1.83, 0.45, 0.19]} material={woodMaterial} />
    {[-2.63, -0.44].map((x) => <group key={x}>
      <Rod from={[x - 0.21, -0.46, 1.92]} to={[x + 0.21, -0.46, 1.92]} radius={0.025} color="#a89567" />
      {[-0.21, 0.21].map((dx) => <Rod key={dx} from={[x + dx, -0.46, 1.82]} to={[x + dx, -0.46, 1.92]} radius={0.024} color="#a89567" />)}
    </group>)}
    <Box at={[2.88, -1.37, 0.02]} size={[2.19, 2.47, 3.75]} material={woodMaterial} />
    {[0, 1, 2].map((i) => <group key={i}>
      <Box at={[2.88, -0.71 - i * 0.75, 1.95]} size={[1.97, 0.67, 0.12]} material={woodMaterial} />
      <Rod from={[2.67, -0.63 - i * 0.75, 2.077]} to={[3.08, -0.63 - i * 0.75, 2.077]} radius={0.032} color="#8d825c" />
      {[-0.2, 0.2].map((dx) => <Box key={dx} at={[2.88 + dx, -0.63 - i * 0.75, 2.047]} size={[0.053, 0.096, 0.083]} color="#7b7655" />)}
    </group>)}
    {[[-3.69, -1.83], [-3.69, 1.78], [3.55, -1.83], [3.55, 1.78]].map(([x, z], i) =>
      <Box key={i} at={[x, -1.51, z]} size={[0.2, 2.55, 0.21]} material={woodMaterial} />)}
    <Box at={[0, -0.71, -2.06]} size={[7.5, 0.53, 0.15]} material={woodMaterial} />
    <group position={[-5.12, -1.18, -0.19]}>
      <Disc at={[0, 0, 0]} radius={0.83} height={0.09} color="#536352" metalness={0} />
      <Disc at={[0, -0.83, 0]} radius={0.06} height={1.62} color="#3f4f42" />
      <Disc at={[0, -1.6, 0]} radius={0.5} height={0.09} color="#384d40" />
      <Box at={[0, 0.23, 0]} size={[1.08, 0.42, 0.56]} color="#8e9a7d" />
      <Box at={[0, 0.445, 0]} size={[0.53, 0.008, 0.085]} color="#394a3b" />
      <Paper at={[-0.05, 0.46, 0]} width={0.4} depth={0.33} turn={0.25} curl={0.32} color="#d0d6b9" />
    </group>
    <group position={[0.58, -2.6175, -1.31]}>
      <Book at={[0, 0, 0]} size={[1.04, 0.35, 1.32]} color="#636e51" texture={textures.bookSpines[3]} turn={0.1} />
      <Book at={[0.07, 0.27, 0]} size={[0.95, 0.19, 1.3]} color="#846b47" texture={textures.bookSpines[4]} turn={-0.03} />
    </group>
  </group>;
}

export function Room({ textures, woodMaterial, compact }) {
  return <group>
    <Box at={[0, -2.85, 0]} size={[40, 0.1, 40]} color="#394a40" />
    {Array.from({ length: 18 }, (_, i) => <Box key={i} at={[-9 + i, -2.792, 0]} size={[0.025, 0.005, 17]} color="#253c32" cast={false} />)}
    <mesh position={[0, 8.4, -2.96]} receiveShadow><boxGeometry args={[22, 24, 0.23]} /><meshStandardMaterial map={textures.wall} roughness={1} /></mesh>
    <mesh position={[4.63, 8.4, -0.5]} receiveShadow><boxGeometry args={[0.23, 24, 40]} /><meshStandardMaterial map={textures.wall} roughness={1} /></mesh>
    <Box at={[0, -1.57, -2.77]} size={[14, 0.09, 0.12]} color="#42594b" />
    <Box at={[4.47, -1.57, 0]} size={[0.1, 0.09, 8]} color="#42594b" />
    <Window position={[1.21, 2.16, -2.62]} width={5.92} height={4.07} rain={textures.rain} compact={compact} />
    <Window position={[4.29, 2.16, -0.17]} rotation={[0, -Math.PI / 2, 0]} width={4.94} height={4.07} rain={textures.rain} compact={compact} />
    <Board textures={textures} woodMaterial={woodMaterial} />
  </group>;
}
