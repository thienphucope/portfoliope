import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { random } from './deskTextures';

export const TABLE_Y = 0;
const LAMP_SHADE_POSITION = [-1.92, 2.38, -0.39];
const LAMP_TARGET = [-0.02, 0.05, 0.62];

export function Box({ at = [0, 0, 0], size = [1, 1, 1], color = '#676455', material, rotation, cast = true, emissive = '#000000', glow = 0, ...props }) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => {
    const smallest = Math.min(width, height, depth);
    return smallest > 0.06
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(0.035, smallest * 0.14))
      : new THREE.BoxGeometry(width, height, depth);
  }, [width, height, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} rotation={rotation} geometry={geometry} castShadow={cast} receiveShadow {...props}>
    {material ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={color} roughness={0.82} emissive={emissive} emissiveIntensity={glow} />}
  </mesh>;
}

export function Rod({ from, to, radius = 0.025, color = '#303b37', metalness = 0.4, segments = 10 }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
      length: a.distanceTo(b),
    };
  }, [from, to]);
  return <mesh position={midpoint} quaternion={quaternion} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, length, segments]} />
    <meshStandardMaterial color={color} roughness={0.42} metalness={metalness} />
  </mesh>;
}

export function Disc({ at, radius = 0.2, height = 0.05, color = '#37403a', topRadius, metalness = 0.3, rotation }) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[topRadius ?? radius, radius, height, 32]} />
    <meshStandardMaterial color={color} roughness={0.52} metalness={metalness} />
  </mesh>;
}

export function Ring({ at, radius, tube = 0.02, color = '#b6a170', rotation = [-Math.PI / 2, 0, 0], scale }) {
  return <mesh position={at} rotation={rotation} scale={scale} castShadow>
    <torusGeometry args={[radius, tube, 8, 40]} />
    <meshStandardMaterial color={color} metalness={0.65} roughness={0.34} />
  </mesh>;
}

function makePaperGeometry(width, depth, curl, seed, side = 0) {
  const geometry = new THREE.PlaneGeometry(width, depth, 16, 12);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    const u = (x + width / 2) / width;
    const v = (z + depth / 2) / depth;
    let y = curl * (Math.pow(Math.abs(x / width * 2), 5) + Math.pow(Math.abs(z / depth * 2), 5)) * 0.4;
    y += Math.sin(x * 5 + seed) * Math.cos(z * 3 + seed) * curl * 0.13;
    if (side) {
      const across = side === -1 ? 1 - u : u;
      y = Math.sin(across * Math.PI) * 0.115 + across * 0.014 + Math.pow(v - 0.5, 2) * 0.06;
    }
    vertices.setY(i, y);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function Paper({ at = [0, 0.025, 0], width = 0.7, depth = 0.8, turn = 0, curl = 0.025, texture, color = '#d8d2b8', seed = 1, side = 0, ...props }) {
  const geometry = useMemo(() => makePaperGeometry(width, depth, curl, seed, side), [width, depth, curl, seed, side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} rotation={[0, turn, 0]} geometry={geometry} castShadow receiveShadow {...props}>
    <meshStandardMaterial map={texture} color={color} roughness={0.94} side={THREE.DoubleSide} />
  </mesh>;
}

function Tape({ at, turn = 0, width = 0.27 }) {
  return <Box at={at} size={[width, 0.003, 0.105]} rotation={[0, turn, 0]} color="#c4bd8a" cast={false} />;
}

function Pin({ at, color = '#a73d2d' }) {
  return <group position={at}>
    <Rod from={[0, 0, 0]} to={[0.005, 0.055, 0]} radius={0.005} color="#999c89" />
    <mesh position={[0.005, 0.062, 0]} castShadow>
      <sphereGeometry args={[0.025, 12, 8]} /><meshStandardMaterial color={color} roughness={0.38} />
    </mesh>
  </group>;
}

export function Casebook({ textures }) {
  return <group position={[-0.12, 0.042, 0.61]} rotation={[0, -0.045, 0]}>
    <Box at={[0, 0.021, 0]} size={[3.02, 0.066, 2.13]} color="#344e4b" />
    <Box at={[0, 0.02, 0]} size={[0.16, 0.085, 2.14]} color="#344641" />
    {[-1, 1].map((side) => <group key={side}>
      {Array.from({ length: 6 }, (_, i) => <Paper key={i} at={[side * 0.724, 0.048 + i * 0.009, 0]}
        width={1.438 - i * 0.003} depth={2.016 - i * 0.006} side={side} curl={0} color={i % 2 ? '#b9b69d' : '#cfccb3'} />)}
      <Paper at={[side * 0.719, 0.105, 0]} width={1.438} depth={1.985} side={side} texture={textures.pages[side === -1 ? 0 : 1]} color="#ffffff" />
    </group>)}
    <Paper at={[-0.36, 0.266, 0.09]} width={0.5} depth={0.46} turn={0.12} texture={textures.notes[6]} color="#ffffff" curl={0.045} />
    <Paper at={[1.035, 0.266, -0.44]} width={0.5} depth={0.5} turn={-0.05} texture={textures.chart} color="#ffffff" curl={0.02} />
    <Paper at={[0.5, 0.267, 0.7]} width={0.46} depth={0.39} turn={-0.03} texture={textures.notes[7]} color="#ffffff" curl={0.028} />
    <Tape at={[-0.97, 0.245, -0.8]} turn={-0.3} />
    <Tape at={[-0.55, 0.251, -0.19]} turn={0.18} width={0.24} />
    {[[0.45, -0.02], [1.13, 0.19], [0.83, 0.61], [0.39, 0.46]].map(([x, z], i) => <Pin key={i} at={[x, 0.234, z]} />)}
    <Box at={[0.13, 0.031, 1.19]} size={[0.07, 0.008, 0.43]} rotation={[0, -0.18, 0]} color="#9d4e36" />
    <Rod from={[0, 0.11, -0.7]} to={[0, 0.112, 0.7]} radius={0.009} color="#766d51" metalness={0} />
  </group>;
}

export function PaperClutter({ textures, compact }) {
  const papers = useMemo(() => {
    const rng = random(402);
    const result = [];
    const count = compact ? 38 : 68;
    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * 7.65;
      const z = (rng() - 0.5) * 3.85;
      // The central spread sits on top of a bed of paper; avoid burying its pages.
      const underBook = Math.abs(x + 0.12) < 1.65 && z > -0.57 && z < 1.9;
      const sticky = i % 3 === 0;
      result.push({
        x, z, y: underBook ? 0.009 + i * 0.00035 : 0.016 + i * 0.0014,
        width: sticky ? 0.42 + rng() * 0.28 : 0.65 + rng() * 0.6,
        depth: sticky ? 0.41 + rng() * 0.28 : 0.85 + rng() * 0.55,
        turn: (rng() - 0.5) * 1.6, sticky, index: i,
      });
    }
    return result;
  }, [compact]);
  return <group>
    {papers.map((p) => <Paper key={p.index} at={[p.x, p.y, p.z]} width={p.width} depth={p.depth} turn={p.turn}
      curl={p.sticky ? 0.045 : 0.028} seed={p.index} texture={p.sticky ? textures.notes[p.index % 12] : textures.clippings[p.index % 8]} color="#ffffff" />)}
    <Paper at={[-2.8, 0.142, 0.84]} width={0.91} depth={1.2} turn={-0.28} texture={textures.clippings[0]} color="#ffffff" />
    <Paper at={[2.15, 0.149, 0.71]} width={0.6} depth={0.64} turn={0.13} texture={textures.notes[1]} color="#ffffff" curl={0.05} />
    <Paper at={[0.08, 0.142, -0.92]} width={1.03} depth={0.56} turn={0.035} texture={textures.notes[6]} color="#ffffff" />
    <Paper at={[-3.35, 0.15, -0.1]} width={0.69} depth={0.68} turn={0.11} texture={textures.notes[9]} color="#ffffff" />
    <Polaroid at={[-1.89, 0.169, 0.83]} turn={0.27} texture={textures.photos[1]} />
    <Polaroid at={[1.93, 0.151, -0.09]} turn={-0.21} texture={textures.photos[2]} />
    <Polaroid at={[-0.71, 0.108, -1.44]} turn={-0.17} texture={textures.photos[0]} />
  </group>;
}

export function Polaroid({ at, turn = 0, texture }) {
  return <group position={at} rotation={[0, turn, 0]}>
    <Paper width={0.61} depth={0.74} curl={0.012} color="#ded8c4" />
    <Paper at={[0, 0.035, -0.053]} width={0.52} depth={0.5} texture={texture} color="#ffffff" curl={0.006} />
    <Tape at={[0.13, 0.049, -0.33]} turn={-0.19} width={0.3} />
  </group>;
}

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

export function Pencil({ at, turn = 0, color = '#b58c43', length = 0.96 }) {
  return <group position={at} rotation={[0, turn, Math.PI / 2]}>
    <mesh castShadow><cylinderGeometry args={[0.025, 0.025, length, 6]} /><meshStandardMaterial color={color} roughness={0.64} /></mesh>
    <mesh position={[0, length / 2 + 0.065, 0]}><coneGeometry args={[0.025, 0.13, 6]} /><meshStandardMaterial color="#c9ae7b" /></mesh>
    <mesh position={[0, length / 2 + 0.125, 0]}><coneGeometry args={[0.009, 0.032, 6]} /><meshStandardMaterial color="#363c35" /></mesh>
    <Disc at={[0, -length / 2 + 0.034, 0]} radius={0.027} height={0.075} color="#aaa48a" />
    <Disc at={[0, -length / 2 - 0.025, 0]} radius={0.026} height={0.045} color="#9b7160" metalness={0} />
  </group>;
}

export function Stationery() {
  return <group>
    <group position={[-1.26, 0.02, -1.48]}>
      <Box at={[0, 0.28, 0]} size={[0.39, 0.55, 0.38]} color="#4d5541" />
      <Box at={[0, 0.558, 0]} size={[0.31, 0.006, 0.3]} color="#202f2b" cast={false} />
      {Array.from({ length: 8 }, (_, i) => <group key={i} position={[(i % 3 - 1) * 0.085, 0.5, (Math.floor(i / 3) - 1) * 0.08]} rotation={[0.1 * (i - 4), 0, (i - 3) * 0.055]}>
        <Rod from={[0, 0, 0]} to={[0, 0.67 + (i % 3) * 0.09, 0]} radius={0.022} color={['#b7a77b', '#786e4e', '#b49358'][i % 3]} metalness={0} segments={6} />
        <mesh position={[0, 0.7 + (i % 3) * 0.09, 0]}><coneGeometry args={[0.022, 0.06, 6]} /><meshStandardMaterial color="#ded1a2" /></mesh>
      </group>)}
    </group>
    <Pencil at={[-0.65, 0.166, -0.83]} turn={-0.04} length={1.48} color="#b69751" />
    <Pencil at={[2.14, 0.148, 1.42]} turn={-0.51} color="#31433c" length={1.21} />
    <Pencil at={[-2.49, 0.191, 1.58]} turn={0.21} color="#906c43" length={0.93} />
    <group position={[2.73, 0.15, 1.29]} rotation={[0, -0.68, 0]}>
      <Ring at={[-0.11, 0.025, -0.06]} radius={0.13} color="#273e36" tube={0.036} scale={[0.8, 1.25, 1]} />
      <Ring at={[0.14, 0.025, -0.06]} radius={0.13} color="#273e36" tube={0.036} scale={[0.8, 1.25, 1]} />
      <Box at={[-0.049, 0.01, 0.43]} size={[0.052, 0.019, 0.72]} rotation={[0, -0.2, 0]} color="#9ea491" />
      <Box at={[0.041, 0.032, 0.43]} size={[0.052, 0.017, 0.72]} rotation={[0, 0.16, 0]} color="#aab19b" />
      <Disc at={[0, 0.054, 0.15]} radius={0.038} height={0.015} color="#bbb69a" />
    </group>
    <group position={[-2.08, 0.17, 0.11]} rotation={[0, -0.48, 0]}>
      <Ring at={[0, 0.048, 0]} radius={0.288} tube={0.031} color="#9a8a59" />
      <mesh position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.277, 40]} /><meshStandardMaterial color="#b6d7c3" transparent opacity={0.14} roughness={0.08} metalness={0.2} depthWrite={false} />
      </mesh>
      <Rod from={[0, 0.04, 0.28]} to={[0, 0.055, 0.45]} radius={0.03} color="#aa9965" />
      <Rod from={[0, 0.054, 0.42]} to={[0, 0.054, 0.99]} radius={0.064} color="#494337" metalness={0.1} />
    </group>
    <group position={[3.09, 0.07, -0.6]} rotation={[0, 0.13, 0]}>
      <Box at={[0, 0.07, 0]} size={[0.12, 0.14, 0.51]} color="#2c423a" />
      <Box at={[0, 0.14, 0]} size={[0.145, 0.045, 0.55]} color="#607566" />
      <Box at={[0, 0.03, 0.1]} size={[0.105, 0.018, 0.3]} color="#a5ad98" />
    </group>
    {[[-3.1, 0.19, 1.37], [1.8, 0.18, -0.49], [2.5, 0.2, 1.86]].map((at, i) => <Ring key={i} at={at} radius={0.08} tube={0.008} color="#9e9e82" scale={[0.42, 1, 1]} />)}
  </group>;
}

export function Book({ at, size = [0.9, 0.17, 1.2], turn = 0, color = '#566357', texture }) {
  const [w, h, d] = size;
  return <group position={at} rotation={[0, turn, 0]}>
    <Box at={[0.018, 0, 0]} size={[w - 0.03, h - 0.025, d - 0.05]} color="#bdb99d" />
    <Box at={[0, h / 2, 0]} size={[w, 0.018, d]} color={color} />
    <Box at={[0, -h / 2, 0]} size={[w, 0.018, d]} color={color} />
    <Box at={[-w / 2 + 0.017, 0, 0]} size={[0.04, h, d]} color={color} />
    {texture && <Paper at={[0, h / 2 + 0.012, 0]} width={w * 0.95} depth={d * 0.95} texture={texture} color="#ffffff" curl={0} />}
    {[0, 1, 2].map((i) => <Box key={i} at={[0.025, -h * 0.24 + i * h * 0.24, d / 2 - 0.021]} size={[w - 0.04, 0.002, 0.004]} color="#8f917b" cast={false} />)}
  </group>;
}

export function Organizer({ textures, woodMaterial }) {
  return <group position={[2.16, 0.04, -1.32]}>
    <Box at={[0, 0.57, -0.45]} size={[1.72, 1.16, 0.08]} material={woodMaterial} />
    {[-0.82, 0.82].map((x) => <Box key={x} at={[x, 0.57, 0]} size={[0.085, 1.16, 1.06]} material={woodMaterial} />)}
    {[0.02, 0.4, 0.78, 1.17].map((y) => <Box key={y} at={[0, y, 0]} size={[1.72, 0.055, 1.06]} material={woodMaterial} />)}
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

export function Radio() {
  return <group position={[-3.51, 0.36, -1.72]} rotation={[0, 0.11, 0]}>
    <Box size={[1.05, 0.68, 0.46]} color="#313d35" />
    <Box at={[-0.1, 0.015, 0.24]} size={[0.66, 0.5, 0.01]} color="#192c27" />
    {Array.from({ length: 17 }, (_, i) => <Box key={i} at={[-0.405 + i * 0.038, 0.015, 0.249]} size={[0.008, 0.47, 0.006]} color="#536155" cast={false} />)}
    <Box at={[0.348, 0.15, 0.247]} size={[0.19, 0.14, 0.009]} color="#899374" />
    <Disc at={[0.348, -0.103, 0.265]} radius={0.075} height={0.05} color="#94917a" rotation={[Math.PI / 2, 0, 0]} />
    <Rod from={[-0.41, 0.33, -0.1]} to={[-0.58, 1.13, -0.2]} radius={0.009} color="#98a696" />
    <Rod from={[-0.3, 0.46, 0]} to={[0.3, 0.46, 0]} radius={0.023} />
    {[-0.3, 0.3].map((x) => <Rod key={x} from={[x, 0.33, 0]} to={[x, 0.46, 0]} radius={0.023} />)}
  </group>;
}

export function DeskClock() {
  return <group position={[-3.35, 0.18, 0.46]} rotation={[-0.22, 0.2, 0]}>
    <Disc at={[0, 0.21, 0]} radius={0.29} height={0.15} color="#4e5e4c" rotation={[Math.PI / 2, 0, 0]} />
    <Disc at={[0, 0.21, 0.079]} radius={0.243} height={0.009} color="#c2bc98" rotation={[Math.PI / 2, 0, 0]} metalness={0} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * Math.PI * 2;
      return <Box key={i} at={[Math.sin(a) * 0.2, 0.21 + Math.cos(a) * 0.2, 0.09]} size={[0.01, i % 3 ? 0.025 : 0.04, 0.003]} rotation={[0, 0, -a]} color="#3d4d3d" cast={false} />;
    })}
    <Rod from={[0, 0.21, 0.098]} to={[-0.09, 0.29, 0.098]} radius={0.009} color="#354a3d" />
    <Rod from={[0, 0.21, 0.1]} to={[0.14, 0.21, 0.1]} radius={0.007} color="#354a3d" />
    {[-0.17, 0.17].map((x) => <Disc key={x} at={[x, 0.45, 0]} radius={0.126} height={0.052} color="#6d7560" />)}
    {[-0.16, 0.16].map((x) => <Rod key={x} from={[x, -0.11, 0]} to={[x * 0.8, 0.05, 0]} radius={0.025} />)}
  </group>;
}
