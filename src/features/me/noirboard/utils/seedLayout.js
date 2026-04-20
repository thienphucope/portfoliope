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

export function getItemLayout(id, index, total, canvasW = 2500, canvasH = 1700) {
  const rand = lcg(hashStr(id));
  
  // Grid configuration
  const cols = Math.ceil(Math.sqrt(total));
  const spacing = 120; // Distance between items in canvas units
  
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  const rows = Math.ceil(total / cols);
  
  // Center the grid
  const gridW = (cols - 1) * spacing;
  const gridH = (rows - 1) * spacing;
  
  const startX = canvasW / 2 - gridW / 2;
  const startY = canvasH / 2 - gridH / 2;

  return {
    x: startX + col * spacing,
    y: startY + row * spacing,
    rotation: (rand() - 0.5) * 10, // Slight random rotation
    z: index + 1, 
  };
}
