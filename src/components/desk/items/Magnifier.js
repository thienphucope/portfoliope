import { Ring, Rod, Lathe, GlassLens } from '../primitives';

const FRAME = [[0.26, -0.021], [0.286, -0.021], [0.298, -0.013], [0.298, 0.019],
  [0.288, 0.027], [0.259, 0.027], [0.256, 0.018], [0.26, 0.012], [0.26, -0.021]];
const HANDLE = [[0, -0.285], [0.044, -0.285], [0.061, -0.264], [0.065, -0.22],
  [0.055, 0.1], [0.047, 0.255], [0.043, 0.285], [0, 0.285]];

export function Magnifier() {
  return <group position={[-2.08, 0, 0.11]} rotation={[0, -0.48, 0]}>
    <Lathe position={[0, 0.038, 0]} points={FRAME} color="#91835a" metalness={0.8} roughness={0.27} />
    <Ring at={[0, 0.017, 0]} radius={0.278} tube={0.017} color="#6d704f" />
    <Ring at={[0, 0.063, 0]} radius={0.276} tube={0.007} color="#c0ad78" />
    <GlassLens position={[0, 0.038, 0]} radius={0.263} edge={0.008} dome={0.024} />
    <Rod from={[0, 0.047, 0.278]} to={[0, 0.065, 0.47]} radius={0.029} color="#b3a06c" />
    <Lathe position={[0, 0.065, 0.703]} rotation={[-Math.PI / 2, 0, 0]} points={HANDLE} color="#3f3930" metalness={0.08} roughness={0.37} />
    {[0.424, 0.451, 0.95].map((z) => <Ring key={z} at={[0, 0.065, z]} radius={z > 0.9 ? 0.053 : 0.045}
      tube={0.004} rotation={[0, 0, 0]} color="#a09065" />)}
  </group>;
}
