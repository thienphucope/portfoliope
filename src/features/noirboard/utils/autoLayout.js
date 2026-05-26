import { SIZES } from '../components/three/constants';

const SCALE_FACTOR = 0.01;
const CANVAS_W = 2500;
const CANVAS_H = 1700;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;
const GAP = 25;        // breathing room between items (canvas units)
const Z_VALUE = 10;    // uniform Z — high enough for curl clearance

// --- Seeded RNG ---

function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// --- Image dimension loader ---

function getImageSize(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 400, height: 400 });
    img.src = url;
  });
}

// --- Bounding box in canvas units ---

function computeCanvasSize(item, imgDim) {
  const s = item.scale || 1.0;
  let w3d, h3d;

  if (item.type === 'polaroid' && imgDim) {
    const aspect = imgDim.width / imgDim.height;
    const targetW = 0.9 * s;
    const photoH = targetW / aspect;
    const padding = 0.1 * s;
    w3d = targetW + padding;
    h3d = photoH + padding;
  } else if (item.type === 'photo' && imgDim) {
    const aspect = imgDim.width / imgDim.height;
    const targetW = 0.9 * s;
    const photoH = targetW / aspect;
    w3d = targetW;
    h3d = photoH;
  } else {
    const base = SIZES[item.type] || [0.87, 0.87];
    w3d = base[0] * s;
    h3d = base[1] * s;
  }

  return {
    w: w3d / SCALE_FACTOR,
    h: h3d / SCALE_FACTOR
  };
}

// --- AABB overlap ---

function overlaps(a, b) {
  return !(
    a.x + a.w / 2 < b.x - b.w / 2 ||
    a.x - a.w / 2 > b.x + b.w / 2 ||
    a.y + a.h / 2 < b.y - b.h / 2 ||
    a.y - a.h / 2 > b.y + b.h / 2
  );
}

function inBounds(x, y, w, h) {
  return x - w / 2 >= 0 && x + w / 2 <= CANVAS_W &&
         y - h / 2 >= 0 && y + h / 2 <= CANVAS_H;
}

// --- Main ---

export async function computeAutoLayout(items) {
  // 1. Load image dimensions for polaroids and photos
  const imgDims = {};
  await Promise.all(items.map(async (item) => {
    if ((item.type === 'polaroid' || item.type === 'photo') && item.imageUrl) {
      imgDims[item.id] = await getImageSize(item.imageUrl);
    }
  }));

  // 2. Attach canvas-unit sizes
  const sized = items.map(item => ({
    ...item,
    cs: computeCanvasSize(item, imgDims[item.id])
  }));

  // 3. Sort: news.png first, then largest area first (better packing)
  const sorted = [...sized].sort((a, b) => {
    const aNews = a.imageUrl?.includes('news.png') ? 1 : 0;
    const bNews = b.imageUrl?.includes('news.png') ? 1 : 0;
    if (aNews !== bNews) return bNews - aNews;
    return (b.cs.w * b.cs.h) - (a.cs.w * a.cs.h);
  });

  // 4. Spiral packing
  const placed = [];   // { x, y, w, h }
  const results = {};  // id -> { x, y, z, rotation }

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const w = item.cs.w + GAP;
    const h = item.cs.h + GAP;
    const rand = lcg(hashStr(item.id));

    if (i === 0) {
      // news.png → dead center, no rotation
      results[item.id] = { x: CENTER_X, y: CENTER_Y, z: Z_VALUE, rotation: 0 };
      placed.push({ x: CENTER_X, y: CENTER_Y, w, h });
      continue;
    }

    // Spiral search for a free slot
    let startAngle = rand() * Math.PI * 2;
    let radius = 50;
    const angleStep = 0.12;
    const radiusGrow = 2;
    let found = false;

    for (let step = 0; step < 8000; step++) {
      const angle = startAngle + step * angleStep;
      const r = radius + step * radiusGrow * 0.04;
      const tx = CENTER_X + Math.cos(angle) * r;
      const ty = CENTER_Y + Math.sin(angle) * r;

      if (!inBounds(tx, ty, w, h)) continue;

      const candidate = { x: tx, y: ty, w, h };
      let hit = false;
      for (const p of placed) {
        if (overlaps(candidate, p)) { hit = true; break; }
      }

      if (!hit) {
        const rotation = Math.round((rand() - 0.5) * 8);
        results[item.id] = {
          x: Math.round(tx),
          y: Math.round(ty),
          z: Z_VALUE,
          rotation
        };
        placed.push({ x: tx, y: ty, w, h });
        found = true;
        break;
      }
    }

    if (!found) {
      // Fallback — place somewhere on the board
      results[item.id] = {
        x: Math.round(CENTER_X + (rand() - 0.5) * CANVAS_W * 0.6),
        y: Math.round(CENTER_Y + (rand() - 0.5) * CANVAS_H * 0.6),
        z: Z_VALUE,
        rotation: Math.round((rand() - 0.5) * 8)
      };
    }
  }

  return results;
}
