"use client";

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

const LIFT = 0.08; // how far the item pops up on hover — the tuning knob

// One desk item: it pops up a little while `active`, and a click opens it on its
// own for a 360° look. Hover is driven from a single scene-level id (see
// SceneContent) so a missed pointer-out can't leave an item stuck raised.
export function Interactive({ id, active, onHover, onSelect, children }) {
  const ref = useRef();
  const { invalidate } = useThree();

  useEffect(() => {
    const g = ref.current;
    if (!active || !g) return;
    g.position.y += LIFT;
    invalidate();
    return () => { g.position.y -= LIFT; invalidate(); };
  }, [active, invalidate]);

  return <group ref={ref}
    onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerMove={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerOut={(e) => { e.stopPropagation(); onHover(id, true); }}
    onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
    {children}
  </group>;
}
