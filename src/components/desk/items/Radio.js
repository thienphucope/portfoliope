import { Box, Rod, Disc } from '../primitives';

export function Radio() {
  return <group position={[-3.51, 0.36, -1.72]} rotation={[0, 0.11, 0]}>
    <Box size={[1.05, 0.68, 0.46]} color="#313d35" />
    <Box at={[-0.1, 0.015, 0.24]} size={[0.66, 0.5, 0.01]} color="#192c27" />
    {Array.from({ length: 17 }, (_, i) => <Box key={i} at={[-0.405 + i * 0.038, 0.015, 0.249]} size={[0.008, 0.47, 0.006]} color="#536155" cast={false} />)}
    <Box at={[0.348, 0.15, 0.247]} size={[0.19, 0.14, 0.009]} color="#899374" />
    <Disc at={[0.348, -0.103, 0.265]} radius={0.075} height={0.05} color="#94917a" rotation={[Math.PI / 2, 0, 0]} />
    <Rod from={[-0.41, 0.33, -0.1]} to={[-0.58, 1.13, -0.2]} radius={0.009} color="#98a696" />
    <Rod from={[-0.3, 0.46, 0]} to={[0.3, 0.46, 0]} radius={0.023} />
    {[-0.3, 0.3].map((x) => <Rod key={x} from={[x, 0.33, 0]} to={[x, 0.46, 0]} radius={0.023} />)}
  </group>;
}
