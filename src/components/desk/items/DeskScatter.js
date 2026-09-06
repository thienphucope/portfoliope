import { Pencil, Tube } from '../primitives';

// Open, bent wire clips have two nested runs and visible ends.
const CLIP = [[-0.025, 0.008, 0.075], [-0.025, 0.008, -0.08], [0, 0.008, -0.105],
  [0.027, 0.008, -0.079], [0.027, 0.008, 0.102], [0, 0.008, 0.133],
  [-0.047, 0.008, 0.105], [-0.047, 0.008, -0.096], [-0.01, 0.008, -0.132],
  [0.047, 0.008, -0.1], [0.047, 0.008, 0.074]];

export function DeskScatter() {
  return <group>
    <Pencil at={[-0.65, 0.027, -0.83]} turn={-0.04} length={1.48} color="#b69751" />
    <Pencil at={[2.14, 0.027, 1.42]} turn={-0.51} color="#31433c" length={1.21} />
    <Pencil at={[-2.49, 0.027, 1.58]} turn={0.21} color="#906c43" length={0.93} />
    {[[-3.1, 0, 1.37], [1.8, 0, -0.49], [2.5, 0, 1.86]].map((at, i) =>
      <Tube key={i} position={at} rotation={[0, i * 0.47 - 0.2, 0]} points={CLIP} radius={0.008}
        color="#a3a58b" metalness={0.85} roughness={0.28} segments={80} />)}
  </group>;
}
