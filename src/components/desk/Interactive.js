"use client";

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

const LIFT = 0.08; // how far the item pops up on hover — the tuning knob
const EASE = 0.16; // per-frame approach toward the target; lower = slower rise
// ponytail: framerate-dependent ease; add delta-time scaling if it feels off on 120Hz+

// One desk item: it eases up a little while `active`, and a click opens it on its
// own for a 360° look. Hover is driven from a single scene-level id (see
// SceneContent) so a missed pointer-out can't leave an item stuck raised.
export function Interactive({ id, active, onHover, onSelect, children }) {
  const ref = useRef();
  const { invalidate } = useThree();

  // Kick the on-demand loop when hover toggles; useFrame eases the lift the rest
  // of the way so it glides instead of snapping.
  useEffect(() => { invalidate(); }, [active, invalidate]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const target = active ? LIFT : 0;
    const diff = target - g.position.y;
    if (Math.abs(diff) < 0.0004) {
      if (g.position.y !== target) { g.position.y = target; invalidate(); }
      return;
    }
    g.position.y += diff * EASE;
    invalidate();
  });

  return <group ref={ref}
    onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerMove={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerOut={(e) => { e.stopPropagation(); onHover(id, true); }}
    onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
    {children}
  </group>;
}
