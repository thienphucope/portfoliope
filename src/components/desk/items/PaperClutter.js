import { Paper, Polaroid } from '../primitives';
import { random } from '../deskTextures';
import { placeSheet } from '../paperSupport';

// Each clipping keeps its seeded position and its own inspect target. Elevation
// comes from the actual sheets below it, rather than an increasing group offset.
export function paperItems(textures, compact) {
  const rng = random(402), stack = [], items = [];
  const count = compact ? 38 : 68;
  function sheet(id, label, x, z, width, depth, turn, texture, curl = 0.005, seed = 1) {
    const drape = placeSheet(stack, { x, z, width, depth, turn, curl, seed });
    items.push({ id, label, node: <Paper at={[x, 0, z]} width={width} depth={depth} turn={turn}
      drape={drape} curl={curl} seed={seed} texture={texture} color="#ffffff" /> });
  }
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * 7.65, z = (rng() - 0.5) * 3.85;
    const sticky = i % 3 === 0;
    const width = sticky ? 0.42 + rng() * 0.28 : 0.65 + rng() * 0.6;
    const depth = sticky ? 0.41 + rng() * 0.28 : 0.85 + rng() * 0.55;
    const turn = (rng() - 0.5) * 1.6;
    // Most of these were completely hidden by the open notebook.
    if (Math.abs(x + 0.12) < 1.2 && z > -0.2 && z < 1.4) continue;
    sheet('paper-' + i, sticky ? 'Sticky note' : 'Clipping', x, z, width, depth, turn,
      sticky ? textures.notes[i % 12] : textures.clippings[i % 8], sticky ? 0.008 : 0.004, i);
  }
  sheet('paper-a', 'Clipping', -2.8, 0.84, 0.91, 1.2, -0.28, textures.clippings[0]);
  sheet('paper-b', 'Note', 2.15, 0.71, 0.6, 0.64, 0.13, textures.notes[1]);
  sheet('paper-c', 'Note', 0.08, -0.92, 1.03, 0.56, 0.035, textures.notes[6]);
  sheet('paper-d', 'Note', -3.35, -0.1, 0.69, 0.68, 0.11, textures.notes[9]);
  [[-1.89, 0.83, 0.27, 1], [1.93, -0.09, -0.21, 2], [-0.71, -1.44, -0.17, 0]].forEach(([x, z, turn, photo], i) => {
    // Rigid photo stock sits on the highest supporting sheet under its footprint.
    let y = 0;
    for (const dx of [-0.305, 0, 0.305]) for (const dz of [-0.37, 0, 0.37]) {
      const wx = x + dx * Math.cos(turn) + dz * Math.sin(turn), wz = z - dx * Math.sin(turn) + dz * Math.cos(turn);
      for (const support of stack) y = Math.max(y, support.heightAt(wx, wz));
    }
    items.push({ id: 'photo-' + i, label: 'Photo', node: <Polaroid at={[x, y, z]} turn={turn} texture={textures.photos[photo]} /> });
  });
  return items;
}
