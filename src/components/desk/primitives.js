import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { paperCurl } from './paperSupport';

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

export function Rod({ from, to, radius = 0.025, color = '#303b37', metalness = 0.4, segments = 16 }) {
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

export function Disc({ at, radius = 0.2, height = 0.05, color = '#37403a', topRadius, metalness = 0.3, roughness = 0.52, rotation }) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[topRadius ?? radius, radius, height, 64]} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  </mesh>;
}

export function Ring({ at, radius, tube = 0.02, color = '#b6a170', rotation = [-Math.PI / 2, 0, 0], scale, metalness = 0.65, roughness = 0.34 }) {
  return <mesh position={at} rotation={rotation} scale={scale} castShadow>
    <torusGeometry args={[radius, tube, 12, 64]} />
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  </mesh>;
}

// Closed radial profiles describe the outer wall, lip, inner wall and underside.
export function Lathe({ points, color = '#37483f', metalness = 0.3, roughness = 0.45, ...props }) {
  const profile = useMemo(() => points.map(([r, y]) => new THREE.Vector2(r, y)), [points]);
  return <mesh castShadow receiveShadow {...props}>
    <latheGeometry args={[profile, 64]} />
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  </mesh>;
}

export function Tube({ points, radius = 0.02, color = '#36473e', metalness = 0.4, roughness = 0.4, segments = 48, caps = true, ...props }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  return <group {...props}>
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, segments, radius, 10, false]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
    {caps && [points[0], points[points.length - 1]].map((p, i) => <mesh key={i} position={p} castShadow>
      <sphereGeometry args={[radius, 12, 8]} /><meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>)}
  </group>;
}

export function Screw({ at, radius = 0.022, rotation = [Math.PI / 2, 0, 0], color = '#8d9587' }) {
  return <group position={at} rotation={rotation}>
    <Disc radius={radius} height={0.009} color={color} metalness={0.75} />
    <Box at={[0, 0.0047, 0]} size={[radius * 1.35, 0.001, radius * 0.2]} color="#303b34" cast={false} />
  </group>;
}

export function GlassLens({ radius, edge = 0.006, dome = 0.025, roughness = 0.025, ...props }) {
  const profile = useMemo(() => {
    const top = Array.from({ length: 13 }, (_, i) => {
      const r = radius * i / 12;
      return new THREE.Vector2(r, edge / 2 + dome * (1 - (r / radius) ** 2));
    });
    return [...top, ...top.map((p) => new THREE.Vector2(p.x, -p.y)).reverse()].reverse();
  }, [radius, edge, dome]);
  return <mesh {...props}>
    <latheGeometry args={[profile, 64]} />
    <meshPhysicalMaterial color="#eff9f5" metalness={0} roughness={roughness} transmission={0.94}
      thickness={edge + dome * 2} ior={1.52} clearcoat={1} clearcoatRoughness={0.025}
      transparent opacity={1} depthWrite={false} />
  </mesh>;
}

function makePaperGeometry(width, depth, curl, seed, side = 0, thickness = 0.0015, drape, solidBottom) {
  const geometry = new THREE.PlaneGeometry(width, depth, 16, 12);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  let lowest = Infinity;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    const u = (x + width / 2) / width;
    const v = (z + depth / 2) / depth;
    let y = paperCurl(x, z, width, depth, curl, seed);
    if (side) {
      const across = side === -1 ? 1 - u : u;
      y = Math.sin(across * Math.PI) * 0.115 + across * 0.014 + Math.pow(v - 0.5, 2) * 0.06;
    }
    vertices.setY(i, y);
    lowest = Math.min(lowest, y);
  }
  // A loose sheet has a contact patch; curling must not lift the entire sheet.
  if (!side) for (let i = 0; i < vertices.count; i++) vertices.setY(i, vertices.getY(i) - lowest);
  if (drape) for (let i = 0; i < vertices.count; i++) {
    vertices.setY(i, vertices.getY(i) + drape(vertices.getX(i), vertices.getZ(i)));
  }
  geometry.computeVertexNormals();
  // Thin closed slab, with separate front/back material groups. No reversed ink underneath.
  const count = vertices.count, positions = [], uvs = [], indices = [];
  for (const offset of [thickness, 0]) for (let i = 0; i < count; i++) {
    positions.push(vertices.getX(i), offset === 0 && solidBottom !== undefined ? solidBottom : vertices.getY(i) + offset, vertices.getZ(i));
    uvs.push(geometry.attributes.uv.getX(i), geometry.attributes.uv.getY(i));
  }
  const top = Array.from(geometry.index.array);
  indices.push(...top);
  for (let i = 0; i < top.length; i += 3) indices.push(top[i + 2] + count, top[i + 1] + count, top[i] + count);
  const boundary = [];
  for (let x = 0; x < 16; x++) boundary.push([x, x + 1]);
  for (let z = 0; z < 12; z++) boundary.push([z * 17 + 16, (z + 1) * 17 + 16]);
  for (let x = 16; x > 0; x--) boundary.push([12 * 17 + x, 12 * 17 + x - 1]);
  for (let z = 12; z > 0; z--) boundary.push([z * 17, (z - 1) * 17]);
  for (const [a, b] of boundary) indices.push(a, b, a + count, b, b + count, a + count);
  const solid = new THREE.BufferGeometry();
  solid.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  solid.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  solid.setIndex(indices);
  solid.addGroup(0, top.length, 0);
  solid.addGroup(top.length, indices.length - top.length, 1);
  solid.computeVertexNormals();
  geometry.dispose();
  return solid;
}

export function Paper({ at = [0, 0, 0], width = 0.7, depth = 0.8, turn = 0, curl = 0.025, texture, color = '#d8d2b8', seed = 1, side = 0, thickness = 0.0015, drape, solidBottom, ...props }) {
  const geometry = useMemo(() => makePaperGeometry(width, depth, curl, seed, side, thickness, drape, solidBottom), [width, depth, curl, seed, side, thickness, drape, solidBottom]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} rotation={[0, turn, 0]} geometry={geometry} castShadow receiveShadow {...props}>
    <meshStandardMaterial attach="material-0" map={texture} color={color} roughness={0.94} />
    <meshStandardMaterial attach="material-1" color={texture ? '#cbc5ac' : color} roughness={0.96} />
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
    <Paper width={0.61} depth={0.74} curl={0} thickness={0.003} color="#ded8c4" />
    <Paper at={[0, 0.003, -0.053]} width={0.52} depth={0.5} texture={texture} color="#ffffff" curl={0} />
    <Tape at={[0.13, 0.0045, -0.33]} turn={-0.19} width={0.3} />
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
  const cover = Math.min(0.018, h * 0.13);
  const spine = useMemo(() => {
    const shape = new THREE.Shape();
    const x = -w / 2, y = h / 2, r = Math.min(0.032, h * 0.2);
    shape.moveTo(x + 0.085, y); shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y - r); shape.lineTo(x, -y + r);
    shape.quadraticCurveTo(x, -y, x + r, -y); shape.lineTo(x + 0.085, -y);
    shape.lineTo(x + 0.085, -y + cover); shape.lineTo(x + r + cover, -y + cover);
    shape.quadraticCurveTo(x + cover, -y + cover, x + cover, -y + r + cover);
    shape.lineTo(x + cover, y - r - cover);
    shape.quadraticCurveTo(x + cover, y - cover, x + r + cover, y - cover);
    shape.lineTo(x + 0.085, y - cover); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -d / 2); return g;
  }, [w, h, d, cover]);
  const pageLines = useMemo(() => {
    const points = [], n = Math.max(5, Math.ceil(h / 0.009));
    for (let i = 1; i < n; i++) {
      const y = -h / 2 + cover + (h - cover * 2) * i / n;
      const left = -w / 2 + 0.044, right = w / 2 - 0.022, end = d / 2 - 0.024;
      points.push(left, y, end, right, y, end, right, y, end, right, y, -end, right, y, -end, left, y, -end);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); return g;
  }, [w, h, d, cover]);
  useEffect(() => () => { spine.dispose(); pageLines.dispose(); }, [spine, pageLines]);
  return <group position={at} rotation={[0, turn, 0]}>
    <Box at={[0.011, 0, 0]} size={[w - 0.066, h - cover * 2, d - 0.048]} color="#c6c0a5" />
    {[-1, 1].map((side) => <group key={side}>
      <Box at={[0.042, side * (h - cover) / 2, 0]} size={[w - 0.084, cover, d]} color={color} />
      <Box at={[-w / 2 + 0.097, side * (h / 2 - 0.0007), 0]} size={[0.006, 0.001, d - 0.016]} color="#35453b" cast={false} />
    </group>)}
    <mesh geometry={spine} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.73} /></mesh>
    <lineSegments geometry={pageLines}><lineBasicMaterial color="#99977f" transparent opacity={0.45} /></lineSegments>
    {[-0.34, 0.34].map((fraction) => <Box key={fraction} at={[-w / 2 - 0.0007, 0, d * fraction]} size={[0.003, h * 0.7, 0.014]} color="#a4966f" cast={false} />)}
    {texture && <mesh position={[0.048, h / 2 + 0.0008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w - 0.135, d - 0.045]} /><meshStandardMaterial map={texture} roughness={0.8} />
    </mesh>}
  </group>;
}
