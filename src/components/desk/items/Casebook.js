import { Box, Tube, Paper, Pin } from '../primitives';

const PAGE_WIDTH = 1.438, PAGE_DEPTH = 1.985, PAGE_X = 0.735, PAGE_Y = 0.114;
function pageHeight(x, z) {
  const side = x < 0 ? -1 : 1;
  const u = (x - side * PAGE_X + PAGE_WIDTH / 2) / PAGE_WIDTH;
  const across = side === -1 ? 1 - u : u;
  return PAGE_Y + Math.sin(across * Math.PI) * 0.115 + across * 0.014 + (z / PAGE_DEPTH) ** 2 * 0.06 + 0.002;
}
function Attachment({ x, z, turn = 0, width, depth, texture, color = '#ffffff' }) {
  const drape = (lx, lz) => pageHeight(x + lx * Math.cos(turn) + lz * Math.sin(turn), z - lx * Math.sin(turn) + lz * Math.cos(turn));
  return <Paper at={[x, 0, z]} turn={turn} width={width} depth={depth} texture={texture} color={color} curl={0} drape={drape} />;
}

export function Casebook({ textures }) {
  return <group position={[-0.12, 0, 0.61]} rotation={[0, -0.045, 0]}>
    {[-1, 1].map((side) => <group key={side}>
      <Box at={[side * 0.777, 0.021, 0]} size={[1.47, 0.042, 2.13]} color="#344e4b" />
      <Box at={[side * 0.1, 0.0425, 0]} size={[0.009, 0.003, 2.105]} color="#253d37" cast={false} />
      {/* Filled page block with curved top and a flat underside on the cover. */}
      <Paper at={[side * PAGE_X, 0.042, 0]} width={PAGE_WIDTH} depth={2.016}
        side={side} thickness={0.06} solidBottom={0} color="#bfbba0" />
      {Array.from({ length: 5 }, (_, i) => <Paper key={i} at={[side * PAGE_X, 0.104 + i * 0.002, 0]}
        width={PAGE_WIDTH - i * 0.001} depth={2.006 - i * 0.004} side={side}
        thickness={0.002} color={i % 2 ? '#b9b59b' : '#d0cab0'} />)}
      <Paper at={[side * PAGE_X, PAGE_Y, 0]} width={PAGE_WIDTH} depth={PAGE_DEPTH}
        side={side} thickness={0.002} texture={textures.pages[side === -1 ? 0 : 1]} color="#ffffff" />
    </group>)}
    <Box at={[0, 0.021, 0]} size={[0.16, 0.042, 2.13]} color="#344641" />
    <Tube points={[[0, 0.048, -1.03], [0, 0.083, -0.82], [0, 0.098, 0], [0, 0.083, 0.82], [0, 0.048, 1.03]]}
      radius={0.014} color="#807350" metalness={0} roughness={0.9} />
    <Attachment x={-0.36} z={0.09} width={0.5} depth={0.46} turn={0.12} texture={textures.notes[6]} />
    <Attachment x={1.035} z={-0.44} width={0.5} depth={0.5} turn={-0.05} texture={textures.chart} />
    <Attachment x={0.5} z={0.7} width={0.46} depth={0.39} turn={-0.03} texture={textures.notes[7]} />
    <Attachment x={-0.97} z={-0.8} width={0.27} depth={0.105} turn={-0.3} color="#c4bd8a" />
    <Attachment x={-0.55} z={-0.19} width={0.24} depth={0.105} turn={0.18} color="#c4bd8a" />
    {[[0.45, -0.02], [1.13, 0.19], [0.83, 0.61], [0.39, 0.46]].map(([x, z], i) =>
      <Pin key={i} at={[x, pageHeight(x, z), z]} />)}
    <Paper at={[0.1, 0.003, 1.12]} width={0.07} depth={0.38} turn={-0.18} curl={0} color="#9d4e36" thickness={0.005} />
  </group>;
}
