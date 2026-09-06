"use client";

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

const GLOW_COLOR = '#ffcf8a';
const GLOW_INTENSITY = 0.5;

// One desk item: a warm emissive glow while `active`, and a click that opens it
// on its own for a 360° look. Hover is driven from a single scene-level id (see
// SceneContent) so a missed pointer-out can't leave the glow stuck on.
export function Interactive({ id, active, onHover, onSelect, children }) {
  const ref = useRef();
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active || !ref.current) return;
    const saved = [], seen = new Set();
    ref.current.traverse((o) => {
      // MeshBasicMaterial (e.g. the lamp bulb) has no emissive; skip it.
      if (!o.isMesh) return;
      for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!material?.emissive || seen.has(material)) continue;
        seen.add(material);
        saved.push([material, material.emissiveIntensity, material.emissive.clone()]);
        material.emissive.set(GLOW_COLOR);
        material.emissiveIntensity = GLOW_INTENSITY;
      }
    });
    invalidate();
    return () => {
      saved.forEach(([m, intensity, color]) => { m.emissive.copy(color); m.emissiveIntensity = intensity; });
      invalidate();
    };
  }, [active, invalidate]);

  return <group ref={ref}
    onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerMove={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerOut={(e) => { e.stopPropagation(); onHover(id, true); }}
    onClick={(e) => { e.stopPropagation(); onSelect?.(); }}>
    {children}
  </group>;
}
