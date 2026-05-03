'use client';
// All transforms go straight to the DOM — zero React re-renders during scroll/pan/animation.
// React state is only used for the initial render; after that everything is imperative.
import { useRef, useCallback, useLayoutEffect, useEffect } from 'react';

const MAX = 3.0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Mirror LIGHT position from lighting.js so we can update the vignette without a state round-trip
const LIGHT_X = 500, LIGHT_Y = 350;

export function useCanvas(canvasW, canvasH) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null); // the transformable board div
  const vignetteRef  = useRef(null); // the screen-space vignette div
  const vwR = useRef(1200);
  const vhR = useRef(800);
  const tr  = useRef({ s: 1, x: 0, y: 0 }); // single source of truth, never React state
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  const apply = useCallback((s, ox, oy) => {
    const minS = Math.max(vwR.current / canvasW, vhR.current / canvasH);
    const cs   = clamp(s, minS, MAX);
    const sw   = canvasW * cs, sh = canvasH * cs;
    // keep canvas covering viewport at all times
    const fx = sw >= vwR.current ? clamp(ox, vwR.current - sw, 0) : (vwR.current - sw) / 2;
    const fy = sh >= vhR.current ? clamp(oy, vhR.current - sh, 0) : (vhR.current - sh) / 2;
    tr.current = { s: cs, x: fx, y: fy };

    if (canvasRef.current)
      canvasRef.current.style.transform = `translate(${fx}px,${fy}px) scale(${cs})`;

    if (vignetteRef.current) {
      const lx = fx + LIGHT_X * cs, ly = fy + LIGHT_Y * cs;
      vignetteRef.current.style.background =
        `radial-gradient(ellipse at ${lx}px ${ly}px,transparent 50%,rgba(0,0,0,.18) 80%,rgba(0,0,0,.38) 100%)`;
    }
  }, [canvasW, canvasH]);

  // set initial position once on mount
  useLayoutEffect(() => {
    vwR.current = window.innerWidth;
    vhR.current = window.innerHeight;
    const ms = Math.max(vwR.current / canvasW, vhR.current / canvasH);
    apply(ms, (vwR.current - canvasW * ms) / 2, (vhR.current - canvasH * ms) / 2);
  }, [apply, canvasW, canvasH]);

  // expose for GSAP — also imperative, no state
  const setPosition = useCallback((s, o) => apply(s, o.x, o.y), [apply]);

  useEffect(() => {
    const onResize = () => {
      vwR.current = window.innerWidth;
      vhR.current = window.innerHeight;
      const { s, x, y } = tr.current;
      apply(s, x, y);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [apply]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const { s, x, y } = tr.current;
    const minS   = Math.max(vwR.current / canvasW, vhR.current / canvasH);
    const factor = e.deltaY < 0 ? 1.13 : 0.87;
    const ns = clamp(s * factor, minS, MAX);
    const cx = (e.clientX - x) / s;
    const cy = (e.clientY - y) / s;
    apply(ns, e.clientX - cx * ns, e.clientY - cy * ns);
  }, [apply, canvasW, canvasH]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    const { s, x, y } = tr.current;
    apply(s, x + dx, y + dy);
  }, [apply]);

  const stop = useCallback(() => { dragging.current = false; }, []);

  return {
    containerRef, canvasRef, vignetteRef, setPosition,
    handlers: { onMouseDown, onMouseMove, onMouseUp: stop, onMouseLeave: stop },
  };
}
