// Sample the same grid used by Paper. Previously placed sheets support new ones;
// storing the grid avoids recursively evaluating an entire stack for every vertex.
const COLS = 16, ROWS = 12;
export function paperCurl(x, z, width, depth, curl, seed) {
  return curl * (Math.abs(x / width * 2) ** 5 + Math.abs(z / depth * 2) ** 5) * 0.4
    + Math.sin(x * 5 + seed) * Math.cos(z * 3 + seed) * curl * 0.13;
}

export function placeSheet(stack, { x, z, width, depth, turn, curl = 0, seed = 1, thickness = 0.0015 }) {
  const c = Math.cos(turn), s = Math.sin(turn);
  const previous = stack.slice();
  const drape = (lx, lz) => {
    const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
    let support = 0;
    for (const sheet of previous) support = Math.max(support, sheet.heightAt(wx, wz));
    return support;
  };
  const heights = [], bends = [];
  for (let row = 0; row <= ROWS; row++) for (let col = 0; col <= COLS; col++) {
    bends.push(paperCurl((col / COLS - 0.5) * width, (row / ROWS - 0.5) * depth, width, depth, curl, seed));
  }
  const lowest = Math.min(...bends);
  for (let row = 0; row <= ROWS; row++) for (let col = 0; col <= COLS; col++) {
    const i = row * (COLS + 1) + col;
    heights.push(drape((col / COLS - 0.5) * width, (row / ROWS - 0.5) * depth) + bends[i] - lowest + thickness);
  }
  stack.push({ heightAt(wx, wz) {
    const dx = wx - x, dz = wz - z;
    const u = ((dx * c - dz * s) / width + 0.5) * COLS;
    const v = ((dx * s + dz * c) / depth + 0.5) * ROWS;
    if (u < 0 || u > COLS || v < 0 || v > ROWS) return 0;
    const col = Math.min(COLS - 1, Math.floor(u)), row = Math.min(ROWS - 1, Math.floor(v));
    const a = row * (COLS + 1) + col, fu = u - col, fv = v - row;
    // Match PlaneGeometry's diagonal, not a bilinear surface between triangles.
    return fu + fv <= 1
      ? heights[a] + fu * (heights[a + 1] - heights[a]) + fv * (heights[a + COLS + 1] - heights[a])
      : heights[a + COLS + 2] + (1 - fu) * (heights[a + COLS + 1] - heights[a + COLS + 2])
        + (1 - fv) * (heights[a + 1] - heights[a + COLS + 2]);
  } });
  return drape;
}
