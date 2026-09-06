import { Pencil, Ring } from '../primitives';

// Loose pencils and paper clips scattered on the desk — ambient bits, not
// individually meaningful, so they stay lumped together.
export function DeskScatter() {
  return <group>
    <Pencil at={[-0.65, 0.166, -0.83]} turn={-0.04} length={1.48} color="#b69751" />
    <Pencil at={[2.14, 0.148, 1.42]} turn={-0.51} color="#31433c" length={1.21} />
    <Pencil at={[-2.49, 0.191, 1.58]} turn={0.21} color="#906c43" length={0.93} />
    {[[-3.1, 0.19, 1.37], [1.8, 0.18, -0.49], [2.5, 0.2, 1.86]].map((at, i) => <Ring key={i} at={at} radius={0.08} tube={0.008} color="#9e9e82" scale={[0.42, 1, 1]} />)}
  </group>;
}
