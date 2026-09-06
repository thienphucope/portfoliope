import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Box, Ring } from '../primitives';

const WIDTH = 0.74, HEIGHT = 0.87, TILT = 0.24, BOARD = 0.018;
const TOP = HEIGHT * Math.cos(TILT) + BOARD / 2 * Math.sin(TILT);
const HOLES = Array.from({ length: 9 }, (_, i) => -0.308 + i * 0.077);

function BoundBoard({ pages = false, texture }) {
  const geometry = useMemo(() => {
    const w = pages ? WIDTH - 0.036 : WIDTH, h = pages ? HEIGHT - 0.018 : HEIGHT;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(-w / 2, -h); shape.lineTo(w / 2, -h); shape.lineTo(w / 2, 0); shape.closePath();
    for (const x of HOLES) {
      const hole = new THREE.Path(); hole.absellipse(x, -0.047, 0.016, 0.016, 0, Math.PI * 2, true); shape.holes.push(hole);
    }
    const thickness = pages ? 0.012 : BOARD;
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 16 });
    g.translate(0, 0, -thickness / 2); return g;
  }, [pages]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={[0, 0, pages ? 0.016 : 0]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={pages ? '#d0cfb5' : '#30483c'} roughness={0.88} /></mesh>
    {pages && <>
      <mesh position={[0, -0.46, 0.0065]} receiveShadow>
        <planeGeometry args={[0.657, 0.714]} /><meshStandardMaterial map={texture} roughness={0.92} />
      </mesh>
      {[0, 1, 2].map((i) => <Box key={i} at={[0, -HEIGHT + 0.02 + i * 0.002, 0.002 - i * 0.003]}
        size={[WIDTH - 0.04, 0.001, 0.002]} color="#929d85" cast={false} />)}
    </>}
  </group>;
}

export function Calendar({ texture }) {
  return <group position={[-1.93, 0, -0.97]} rotation={[0, 0.14, 0]}>
    <group position={[0, TOP, 0.008]} rotation={[-TILT, 0, 0]}>
      <BoundBoard /><BoundBoard pages texture={texture} />
    </group>
    <group position={[0, TOP, -0.008]} rotation={[TILT, Math.PI, 0]}>
      <BoundBoard />
    </group>
    {HOLES.map((x) => <Ring key={x} at={[x, TOP - 0.005, 0.007]} radius={0.048} tube={0.007}
      rotation={[0, Math.PI / 2, 0]} color="#83917c" />)}
    {/* A folded bottom strap limits the spread of the A-frame. */}
    <Box at={[0, 0.012, 0]} size={[WIDTH - 0.06, 0.015, HEIGHT * Math.sin(TILT) * 2]} color="#52624c" />
  </group>;
}
