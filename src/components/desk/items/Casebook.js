import { Box, Rod, Paper, Tape, Pin } from '../primitives';

export function Casebook({ textures }) {
  return <group position={[-0.12, 0.042, 0.61]} rotation={[0, -0.045, 0]}>
    <Box at={[0, 0.021, 0]} size={[3.02, 0.066, 2.13]} color="#344e4b" />
    <Box at={[0, 0.02, 0]} size={[0.16, 0.085, 2.14]} color="#344641" />
    {[-1, 1].map((side) => <group key={side}>
      {Array.from({ length: 6 }, (_, i) => <Paper key={i} at={[side * 0.724, 0.048 + i * 0.009, 0]}
        width={1.438 - i * 0.003} depth={2.016 - i * 0.006} side={side} curl={0} color={i % 2 ? '#b9b69d' : '#cfccb3'} />)}
      <Paper at={[side * 0.719, 0.105, 0]} width={1.438} depth={1.985} side={side} texture={textures.pages[side === -1 ? 0 : 1]} color="#ffffff" />
    </group>)}
    <Paper at={[-0.36, 0.266, 0.09]} width={0.5} depth={0.46} turn={0.12} texture={textures.notes[6]} color="#ffffff" curl={0.045} />
    <Paper at={[1.035, 0.266, -0.44]} width={0.5} depth={0.5} turn={-0.05} texture={textures.chart} color="#ffffff" curl={0.02} />
    <Paper at={[0.5, 0.267, 0.7]} width={0.46} depth={0.39} turn={-0.03} texture={textures.notes[7]} color="#ffffff" curl={0.028} />
    <Tape at={[-0.97, 0.245, -0.8]} turn={-0.3} />
    <Tape at={[-0.55, 0.251, -0.19]} turn={0.18} width={0.24} />
    {[[0.45, -0.02], [1.13, 0.19], [0.83, 0.61], [0.39, 0.46]].map(([x, z], i) => <Pin key={i} at={[x, 0.234, z]} />)}
    <Box at={[0.13, 0.031, 1.19]} size={[0.07, 0.008, 0.43]} rotation={[0, -0.18, 0]} color="#9d4e36" />
    <Rod from={[0, 0.11, -0.7]} to={[0, 0.112, 0.7]} radius={0.009} color="#766d51" metalness={0} />
  </group>;
}
