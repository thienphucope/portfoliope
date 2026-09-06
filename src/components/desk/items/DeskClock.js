import { Box, Rod, Disc, Ring, Lathe, Tube, GlassLens, Screw } from '../primitives';

const CASE = [[0, -0.116], [0.27, -0.116], [0.328, -0.1], [0.357, -0.064], [0.361, 0.065],
  [0.352, 0.112], [0.331, 0.13], [0.309, 0.13], [0.308, 0.089], [0, 0.089]];
const BELL = [
  ...Array.from({ length: 17 }, (_, i) => [0.174 * Math.sin(i / 16 * Math.PI / 2), -0.027 + 0.144 * Math.cos(i / 16 * Math.PI / 2)]),
  [0.173, -0.034], [0.159, -0.034],
  ...Array.from({ length: 17 }, (_, i) => [0.159 * Math.cos(i / 16 * Math.PI / 2), -0.027 + 0.13 * Math.sin(i / 16 * Math.PI / 2)]),
].reverse();
const HANDLE = [[-0.246, 0.795, -0.034], [-0.217, 0.907, -0.038], [-0.215, 1.076, -0.039],
  [-0.15, 1.106, -0.04], [0, 1.126, -0.04], [0.15, 1.106, -0.04], [0.215, 1.076, -0.039],
  [0.217, 0.907, -0.038], [0.246, 0.795, -0.034]];

export function DeskClock({ texture }) {
  return <group position={[-3.35, 0, 0.46]} rotation={[0, 0.2, 0]}>
    {/* Closed case, recessed dial and a separate convex glass crystal. */}
    <Lathe points={CASE} position={[0, 0.455, 0]} rotation={[Math.PI / 2, 0, 0]} color="#283c38" metalness={0.6} roughness={0.32} />
    <Disc at={[0, 0.455, 0.094]} radius={0.311} height={0.014} color="#d0c9aa" rotation={[Math.PI / 2, 0, 0]} metalness={0} roughness={0.9} />
    {texture && <mesh position={[0, 0.455, 0.102]}>
      <circleGeometry args={[0.303, 64]} /><meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>}
    <Ring at={[0, 0.455, 0.127]} radius={0.321} tube={0.014} color="#6e7866" rotation={[0, 0, 0]} />
    <Ring at={[0, 0.455, -0.101]} radius={0.322} tube={0.006} color="#546359" rotation={[0, 0, 0]} />
    <group position={[0, 0.455, 0.109]}>
      <mesh position={[0, 0.13, 0]} rotation={[0, 0, -0.025]} castShadow>
        <coneGeometry args={[0.018, 0.267, 4]} /><meshStandardMaterial color="#263931" roughness={0.5} />
      </mesh>
      <mesh position={[-0.027, -0.086, 0.004]} rotation={[0, 0, Math.PI - 0.3]} castShadow>
        <coneGeometry args={[0.024, 0.196, 4]} /><meshStandardMaterial color="#263931" roughness={0.5} />
      </mesh>
      <Rod from={[0.018, -0.05, 0.011]} to={[-0.073, 0.235, 0.011]} radius={0.0025} color="#846e49" />
      <Disc at={[0, 0, 0.014]} radius={0.025} height={0.014} color="#606b58" rotation={[Math.PI / 2, 0, 0]} />
    </group>
    <GlassLens position={[0, 0.455, 0.147]} rotation={[Math.PI / 2, 0, 0]} radius={0.311} edge={0.003} dome={0.012} roughness={0.012} />
    {[-1, 1].map((side) => <group key={side}>
      <Rod from={[side * 0.177, 0.717, 0]} to={[side * 0.225, 0.836, 0]} radius={0.024} color="#566556" />
      <group position={[side * 0.23, 0.834, 0]} rotation={[0, 0, -side * 0.36]}>
        <Lathe points={BELL} color="#30403b" metalness={0.65} roughness={0.32} />
        <Ring at={[0, -0.025, 0]} radius={0.167} tube={0.006} color="#79816b" />
        <Disc at={[0, 0.122, 0]} radius={0.024} height={0.025} color="#4e6052" />
        <Rod from={[0, -0.022, 0]} to={[0, 0.1, 0]} radius={0.011} color="#7a8069" />
      </group>
      <Rod from={[side * 0.207, 0.22, 0.01]} to={[side * 0.27, 0.02, 0.078]} radius={0.022} color="#3b4c41" />
      <Disc at={[side * 0.27, 0.012, 0.078]} radius={0.032} height={0.024} color="#263630" metalness={0.05} />
      <Screw at={[side * 0.213, 0.233, 0.115]} radius={0.014} />
    </group>)}
    <Tube points={HANDLE} radius={0.018} color="#46574b" metalness={0.7} segments={64} />
    <Rod from={[0, 0.78, 0]} to={[0, 0.918, 0]} radius={0.008} color="#7a8270" />
    <Rod from={[-0.035, 0.909, 0]} to={[0.035, 0.909, 0]} radius={0.017} color="#31463b" />
    {/* Rear plate, winding key, setting knob and alarm switch. */}
    <Disc at={[0, 0.455, -0.117]} radius={0.278} height={0.011} color="#3b5145" rotation={[Math.PI / 2, 0, 0]} />
    {[[-0.15, 0.32], [0.15, 0.32], [0, 0.66]].map(([x, y], i) => <Screw key={i} at={[x, y, -0.126]} radius={0.014} rotation={[-Math.PI / 2, 0, 0]} />)}
    <Rod from={[-0.076, 0.445, -0.12]} to={[-0.076, 0.445, -0.182]} radius={0.02} />
    <Box at={[-0.076, 0.445, -0.184]} size={[0.12, 0.039, 0.016]} color="#9a9577" />
    <Disc at={[0.105, 0.455, -0.146]} radius={0.037} height={0.052} color="#93967b" rotation={[Math.PI / 2, 0, 0]} />
    <Box at={[0.04, 0.62, -0.14]} size={[0.047, 0.063, 0.033]} color="#8c9277" />
    <Rod from={[0, 0.262, -0.096]} to={[0, 0.019, -0.211]} radius={0.018} color="#3b4c41" />
    <Disc at={[0, 0.009, -0.211]} radius={0.027} height={0.018} color="#263630" metalness={0.05} />
  </group>;
}
