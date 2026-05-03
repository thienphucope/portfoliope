export const LIGHT = { x: 500, y: 350 }; // top-left → shadows fall toward bottom-right

export function computeBoxShadow(x, y) {
  const dx = x - LIGHT.x;
  const dy = y - LIGHT.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return '0 8px 24px rgba(0,0,0,0.9)';

  const t = Math.min(dist / 1200, 1);
  const len   = 10 + t * 40;
  const blur  = 14 + t * 30;
  const opacity = 0.55 + t * 0.40; // 0.55 near light → 0.95 far
  const nx = dx / dist, ny = dy / dist;

  return `${(nx * len).toFixed(1)}px ${(ny * len).toFixed(1)}px ${blur.toFixed(0)}px rgba(0,0,0,${opacity.toFixed(2)})`;
}

export function getLightScreenPos(offsetX, offsetY, scale) {
  return {
    x: offsetX + LIGHT.x * scale,
    y: offsetY + LIGHT.y * scale,
  };
}
