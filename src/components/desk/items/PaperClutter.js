import { Paper, Polaroid } from '../primitives';
import { random } from '../deskTextures';

// Every sheet on the desk as its own interactive item ({ id, label, node }),
// so each can be hovered and inspected on its own. Same seed and rng call order
// as before, so the scatter layout is unchanged.
export function paperItems(textures, compact) {
  const rng = random(402);
  const items = [];
  const count = compact ? 38 : 68;
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * 7.65;
    const z = (rng() - 0.5) * 3.85;
    // The central spread sits on top of a bed of paper; avoid burying its pages.
    const underBook = Math.abs(x + 0.12) < 1.65 && z > -0.57 && z < 1.9;
    const sticky = i % 3 === 0;
    const y = underBook ? 0.009 + i * 0.00035 : 0.016 + i * 0.0014;
    const width = sticky ? 0.42 + rng() * 0.28 : 0.65 + rng() * 0.6;
    const depth = sticky ? 0.41 + rng() * 0.28 : 0.85 + rng() * 0.55;
    const turn = (rng() - 0.5) * 1.6;
    items.push({
      id: `paper-${i}`,
      label: sticky ? 'Sticky note' : 'Clipping',
      node: <Paper at={[x, y, z]} width={width} depth={depth} turn={turn}
        curl={sticky ? 0.045 : 0.028} seed={i} texture={sticky ? textures.notes[i % 12] : textures.clippings[i % 8]} color="#ffffff" />,
    });
  }
  items.push(
    { id: 'paper-a', label: 'Clipping', node: <Paper at={[-2.8, 0.142, 0.84]} width={0.91} depth={1.2} turn={-0.28} texture={textures.clippings[0]} color="#ffffff" /> },
    { id: 'paper-b', label: 'Note', node: <Paper at={[2.15, 0.149, 0.71]} width={0.6} depth={0.64} turn={0.13} texture={textures.notes[1]} color="#ffffff" curl={0.05} /> },
    { id: 'paper-c', label: 'Note', node: <Paper at={[0.08, 0.142, -0.92]} width={1.03} depth={0.56} turn={0.035} texture={textures.notes[6]} color="#ffffff" /> },
    { id: 'paper-d', label: 'Note', node: <Paper at={[-3.35, 0.15, -0.1]} width={0.69} depth={0.68} turn={0.11} texture={textures.notes[9]} color="#ffffff" /> },
    { id: 'photo-0', label: 'Photo', node: <Polaroid at={[-1.89, 0.169, 0.83]} turn={0.27} texture={textures.photos[1]} /> },
    { id: 'photo-1', label: 'Photo', node: <Polaroid at={[1.93, 0.151, -0.09]} turn={-0.21} texture={textures.photos[2]} /> },
    { id: 'photo-2', label: 'Photo', node: <Polaroid at={[-0.71, 0.108, -1.44]} turn={-0.17} texture={textures.photos[0]} /> },
  );
  return items;
}
