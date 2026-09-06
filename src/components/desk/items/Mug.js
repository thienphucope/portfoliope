import { Lathe, Tube, Ring, Disc } from '../primitives';

const BODY = [[0, 0.025], [0.163, 0.025], [0.202, 0.03], [0.219, 0.05], [0.225, 0.105],
  [0.265, 0.501], [0.272, 0.546], [0.269, 0.56], [0.256, 0.564], [0.247, 0.553],
  [0.24, 0.502], [0.203, 0.112], [0.19, 0.081], [0, 0.081]];
const SAUCER = [[0, 0], [0.245, 0], [0.28, 0.007], [0.381, 0.026], [0.396, 0.039],
  [0.394, 0.047], [0.379, 0.052], [0.289, 0.031], [0.231, 0.025], [0, 0.025]];
const HANDLE = [[0.247, 0.473, 0], [0.326, 0.483, 0], [0.429, 0.448, 0],
  [0.469, 0.355, 0], [0.453, 0.229, 0], [0.377, 0.156, 0], [0.215, 0.155, 0]];

export function Mug({ at = [2.94, 0, 0.25] }) {
  return <group position={at}>
    <Lathe points={SAUCER} color="#7e7858" metalness={0} roughness={0.48} />
    <Lathe points={BODY} color="#40594b" metalness={0.05} roughness={0.27} />
    <Tube points={HANDLE} radius={0.042} color="#40594b" metalness={0.05} roughness={0.27} segments={64} />
    {[[0.248, 0.471, 0], [0.22, 0.157, 0]].map((at, i) => <mesh key={i} position={at} scale={[0.7, 1.1, 0.95]} castShadow>
      <sphereGeometry args={[0.059, 20, 12]} /><meshStandardMaterial color="#40594b" roughness={0.27} />
    </mesh>)}
    <Ring at={[0, 0.553, 0]} radius={0.26} tube={0.008} color="#8e9980" metalness={0.08} roughness={0.3} />
    <Disc at={[0, 0.463, 0]} radius={0.235} height={0.003} color="#30271c" metalness={0} roughness={0.17} />
    <Ring at={[0, 0.465, 0]} radius={0.233} tube={0.0025} color="#86734c" metalness={0} />
    {Array.from({ length: 28 }, (_, i) => {
      const a = i / 28 * Math.PI * 2;
      return <Tube key={i} points={[[Math.cos(a) * 0.225, 0.105, Math.sin(a) * 0.225],
        [Math.cos(a) * 0.2455, 0.306, Math.sin(a) * 0.2455], [Math.cos(a) * 0.265, 0.501, Math.sin(a) * 0.265]]}
        radius={0.0035} color="#65775f" metalness={0.05} roughness={0.45} segments={8} />;
    })}
  </group>;
}
