import { Box, Rod, Disc, Screw } from '../primitives';

export function Radio() {
  return <group position={[-3.51, 0.365, -1.72]} rotation={[0, 0.11, 0]}>
    <Box size={[1.05, 0.68, 0.46]} color="#313d35" />
    <Box at={[-0.1, 0.015, 0.24]} size={[0.66, 0.5, 0.01]} color="#192c27" />
    {Array.from({ length: 17 }, (_, i) => <Box key={i} at={[-0.405 + i * 0.038, 0.015, 0.249]} size={[0.008, 0.47, 0.006]} color="#536155" cast={false} />)}
    <Box at={[0.348, 0.15, 0.247]} size={[0.19, 0.14, 0.009]} color="#899374" />
    {Array.from({ length: 9 }, (_, i) => <Box key={i} at={[0.274 + i * 0.018, 0.15, 0.253]} size={[0.003, i % 2 ? 0.029 : 0.047, 0.001]} color="#394c3c" cast={false} />)}
    <Box at={[0.35, 0.15, 0.255]} size={[0.005, 0.089, 0.002]} color="#a8643e" cast={false} />
    <Disc at={[0.348, -0.103, 0.265]} radius={0.075} height={0.05} color="#94917a" rotation={[Math.PI / 2, 0, 0]} />
    <Rod from={[-0.41, 0.33, -0.1]} to={[-0.58, 1.13, -0.2]} radius={0.009} color="#98a696" />
    <Rod from={[-0.3, 0.46, 0]} to={[0.3, 0.46, 0]} radius={0.023} />
    {[-0.3, 0.3].map((x) => <Rod key={x} from={[x, 0.33, 0]} to={[x, 0.46, 0]} radius={0.023} />)}
    {[-0.37, 0.37].flatMap((x) => [-0.15, 0.15].map((z) => <Box key={x + ':' + z} at={[x, -0.3525, z]} size={[0.12, 0.025, 0.09]} color="#23372b" />))}
    <Box at={[0, -0.025, -0.234]} size={[0.9, 0.52, 0.012]} color="#3b4c3c" />
    {Array.from({ length: 10 }, (_, i) => <Box key={i} at={[-0.28 + i * 0.062, 0.09, -0.241]} size={[0.027, 0.18, 0.002]} color="#20342c" cast={false} />)}
    <Box at={[0, -0.18, -0.242]} size={[0.44, 0.13, 0.009]} color="#2d3d31" />
    {[-0.4, 0.4].flatMap((x) => [-0.23, 0.2].map((y) => <Screw key={x + ':' + y} at={[x, y, -0.245]} radius={0.014} rotation={[-Math.PI / 2, 0, 0]} />))}
  </group>;
}
