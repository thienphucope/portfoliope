import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TABLE_Y = 0;

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

export function Tape({ at, turn = 0, width = 0.27 }) {
  return <Box at={at} size={[width, 0.003, 0.105]} rotation={[0, turn, 0]} color="#c4bd8a" cast={false} />;
}

export function Pin({ at, color = '#a73d2d' }) {
  return <group position={at}>
    <Rod from={[0, 0, 0]} to={[0.005, 0.055, 0]} radius={0.005} color="#999c89" />
    <mesh position={[0.005, 0.062, 0]} castShadow>
      <sphereGeometry args={[0.025, 12, 8]} /><meshStandardMaterial color={color} roughness={0.38} />
    </mesh>
  </group>;
}

export function Polaroid({ at, turn = 0, texture }) {
  return <group position={at} rotation={[0, turn, 0]}>
    <Paper width={0.61} depth={0.74} curl={0.012} color="#ded8c4" />
    <Paper at={[0, 0.035, -0.053]} width={0.52} depth={0.5} texture={texture} color="#ffffff" curl={0.006} />
    <Tape at={[0.13, 0.049, -0.33]} turn={-0.19} width={0.3} />
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
