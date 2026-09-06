import { Box, Rod, Screw } from '../primitives';

export function Stapler() {
  return <group position={[3.56, 0, -0.62]} rotation={[0, 0.13, 0]}>
    <Box at={[0, 0.011, 0]} size={[0.153, 0.022, 0.565]} color="#20372c" />
    <Box at={[0, 0.033, 0]} size={[0.18, 0.034, 0.63]} color="#3b5544" />
    <Box at={[0, 0.053, 0.204]} size={[0.12, 0.01, 0.13]} color="#a8b29b" />
    {[-0.026, 0.026].map((x) => <Box key={x} at={[x, 0.0585, 0.219]} size={[0.018, 0.001, 0.028]} color="#51614b" cast={false} />)}
    <Box at={[0, 0.091, -0.234]} size={[0.145, 0.104, 0.1]} color="#2b4435" />
    <Rod from={[-0.09, 0.132, -0.224]} to={[0.09, 0.132, -0.224]} radius={0.022} color="#839477" />
    <Screw at={[0.092, 0.132, -0.224]} rotation={[0, 0, -Math.PI / 2]} radius={0.022} />
    <group position={[0, 0.13, -0.224]} rotation={[-0.065, 0, 0]}>
      <Box at={[0, 0.025, 0.225]} size={[0.172, 0.069, 0.57]} color="#526e55" />
      <Box at={[0, -0.02, 0.218]} size={[0.115, 0.025, 0.49]} color="#929f86" />
      {[-0.061, 0.061].map((x) => <Box key={x} at={[x, -0.036, 0.23]} size={[0.008, 0.034, 0.47]} color="#6e806b" />)}
      <Box at={[0, -0.033, 0.465]} size={[0.111, 0.043, 0.014]} color="#bbc1a9" />
    </group>
  </group>;
}
