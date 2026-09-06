import { Box, Rod, Disc } from '../primitives';

export function DeskClock() {
  return <group position={[-3.35, 0.18, 0.46]} rotation={[-0.22, 0.2, 0]}>
    <Disc at={[0, 0.21, 0]} radius={0.29} height={0.15} color="#4e5e4c" rotation={[Math.PI / 2, 0, 0]} />
    <Disc at={[0, 0.21, 0.079]} radius={0.243} height={0.009} color="#c2bc98" rotation={[Math.PI / 2, 0, 0]} metalness={0} />
    {Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * Math.PI * 2;
      return <Box key={i} at={[Math.sin(a) * 0.2, 0.21 + Math.cos(a) * 0.2, 0.09]} size={[0.01, i % 3 ? 0.025 : 0.04, 0.003]} rotation={[0, 0, -a]} color="#3d4d3d" cast={false} />;
    })}
    <Rod from={[0, 0.21, 0.098]} to={[-0.09, 0.29, 0.098]} radius={0.009} color="#354a3d" />
    <Rod from={[0, 0.21, 0.1]} to={[0.14, 0.21, 0.1]} radius={0.007} color="#354a3d" />
    {[-0.17, 0.17].map((x) => <Disc key={x} at={[x, 0.45, 0]} radius={0.126} height={0.052} color="#6d7560" />)}
    {[-0.16, 0.16].map((x) => <Rod key={x} from={[x, -0.11, 0]} to={[x * 0.8, 0.05, 0]} radius={0.025} />)}
  </group>;
}
