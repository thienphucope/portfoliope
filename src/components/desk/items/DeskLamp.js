import { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Disc, Rod, Ring, Lathe, Tube, Screw } from '../primitives';

const SHADE = [-1.92, 2.38, -0.39];
const TARGET = [-0.02, 0.05, 0.62];
const BASE_JOINT = [-2.84, 0.38, -0.93];
const ELBOW = [-3.06, 1.49, -1.1];
const HEAD_JOINT = [-2.29, 2.65, -0.56];
const AXIS = new THREE.Vector3().crossVectors(new THREE.Vector3(...ELBOW).sub(new THREE.Vector3(...BASE_JOINT)),
  new THREE.Vector3(...HEAD_JOINT).sub(new THREE.Vector3(...ELBOW))).normalize();
const BASE_PROFILE = [[0, 0], [0.365, 0], [0.437, 0.017], [0.477, 0.039], [0.475, 0.069],
  [0.439, 0.105], [0.337, 0.146], [0.14, 0.165], [0, 0.165]];
const SHADE_PROFILE = [[0.13, 0.365], [0.145, 0.352], [0.159, 0.225], [0.245, 0.175],
  [0.405, -0.066], [0.532, -0.177], [0.539, -0.192], [0.532, -0.21],
  [0.51, -0.211], [0.503, -0.188], [0.387, -0.077], [0.229, 0.155],
  [0.139, 0.208], [0.123, 0.344], [0.13, 0.365]].reverse();
const INNER_SHADE = [[0.5, -0.187], [0.384, -0.076], [0.226, 0.154], [0.136, 0.209]].reverse();
const offsetPoint = (p, axis, distance) => new THREE.Vector3(...p).addScaledVector(axis, distance).toArray();

function Arm({ from, to }) {
  const direction = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize();
  const separation = new THREE.Vector3().crossVectors(AXIS, direction).normalize();
  return <group>
    {/* Identical in-plane offsets at both ends give a true parallel linkage. */}
    {[-1, 1].map((side) => <Rod key={side} from={offsetPoint(from, separation, side * 0.067)}
      to={offsetPoint(to, separation, side * 0.067)} radius={0.025} color="#35483e" />)}
    {[from, to].map((p, i) => <Rod key={i} from={offsetPoint(p, separation, -0.075)} to={offsetPoint(p, separation, 0.075)} radius={0.032} color="#4b5c4c" />)}
  </group>;
}

function Spring({ from, to }) {
  const points = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const axis = b.clone().sub(a).normalize();
    const u = new THREE.Vector3().crossVectors(axis, AXIS).normalize(), v = new THREE.Vector3().crossVectors(axis, u);
    const start = a.clone().lerp(b, 0.1), end = a.clone().lerp(b, 0.9);
    return [a.toArray(), a.clone().lerp(b, 0.055).toArray(), ...Array.from({ length: 177 }, (_, i) => {
      const t = i / 176, angle = t * Math.PI * 22;
      return start.clone().lerp(end, t).addScaledVector(u, Math.cos(angle) * 0.038).addScaledVector(v, Math.sin(angle) * 0.038).toArray();
    }), a.clone().lerp(b, 0.945).toArray(), b.toArray()];
  }, [from, to]);
  return <Tube points={points} radius={0.009} color="#a2a58e" metalness={0.85} roughness={0.3} segments={220} />;
}

export function DeskLamp() {
  const shadeRotation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(...TARGET).sub(new THREE.Vector3(...SHADE)).normalize()), []);
  const axleRotation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), AXIS), []);
  const shadeTop = new THREE.Vector3(0, 0.355, 0).applyQuaternion(shadeRotation).add(new THREE.Vector3(...SHADE)).toArray();
  return <group>
    <Lathe position={[-2.84, 0, -0.93]} points={BASE_PROFILE} color="#32483d" metalness={0.55} roughness={0.4} />
    <Ring at={[-2.84, 0.033, -0.93]} radius={0.458} tube={0.008} color="#717c63" />
    <Disc at={[-2.84, 0.181, -0.93]} radius={0.12} height={0.043} color="#63745b" />
    <Rod from={[-2.84, 0.17, -0.93]} to={BASE_JOINT} radius={0.06} />
    <Box at={[-2.6, 0.137, -0.76]} size={[0.082, 0.025, 0.1]} color="#1c322b" rotation={[0, -0.23, 0]} />
    <Arm from={BASE_JOINT} to={ELBOW} />
    <Arm from={ELBOW} to={HEAD_JOINT} />
    {[BASE_JOINT, ELBOW, HEAD_JOINT].map((p, i) => <group key={i} position={p} quaternion={axleRotation}>
      <Disc radius={0.088} height={0.14} color="#4a604e" />
      {[-1, 1].map((side) => <group key={side}>
        <Disc at={[0, side * 0.08, 0]} radius={0.064} height={0.022} color="#89927a" />
        <Screw at={[0, side * 0.095, 0]} radius={0.03} rotation={[side === 1 ? 0 : Math.PI, 0, 0]} />
      </group>)}
    </group>)}
    {[-1, 1].map((side) => {
      const from = offsetPoint(BASE_JOINT, AXIS, side * 0.107);
      const to = offsetPoint(ELBOW, AXIS, side * 0.107);
      return <group key={side}>
        <Rod from={BASE_JOINT} to={from} radius={0.018} color="#8e997f" />
        <Rod from={ELBOW} to={to} radius={0.018} color="#8e997f" />
        <Spring from={from} to={to} />
      </group>;
    })}
    <Tube points={[HEAD_JOINT, [-2.21, 2.72, -0.54], shadeTop]} radius={0.026} color="#485e4c" />
    <group position={SHADE} quaternion={shadeRotation}>
      <Lathe points={SHADE_PROFILE} color="#31493e" metalness={0.6} roughness={0.35} />
      <Lathe points={INNER_SHADE} color="#dbceb0" metalness={0.2} roughness={0.53} />
      <Ring at={[0, -0.199, 0]} radius={0.524} tube={0.011} color="#87917a" />
      <Disc at={[0, 0.327, 0]} radius={0.129} height={0.032} color="#283d33" />
      <Disc at={[0, 0.214, 0]} radius={0.066} height={0.142} color="#9c9c80" />
      <mesh position={[0, 0.04, 0]} scale={[1, 1.45, 1]}>
        <sphereGeometry args={[0.099, 32, 20]} />
        <meshStandardMaterial color="#fff0c9" emissive="#ffd092" emissiveIntensity={2} roughness={0.22} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = i / 8 * Math.PI * 2;
        return <Box key={i} at={[Math.cos(a) * 0.142, 0.285, Math.sin(a) * 0.142]} size={[0.006, 0.049, 0.027]} rotation={[0, -a, 0]} color="#1e322b" cast={false} />;
      })}
    </group>
    <Tube points={[[-2.87, 0.025, -1.3], [-3.28, 0.016, -1.46], [-3.44, 0.016, -1.85], [-3.61, 0.016, -2.1]]}
      radius={0.014} color="#24342c" metalness={0} />
    <Tube points={[[-2.85, 0.2, -0.98], [-3.11, 0.88, -1.16], [-3.09, 1.47, -1.17], [-2.57, 1.67, -0.96], shadeTop]}
      radius={0.012} color="#23372e" metalness={0} />
  </group>;
}
