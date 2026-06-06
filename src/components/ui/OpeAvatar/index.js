'use client';
import { useEffect, useRef, useState } from 'react';
import Eyebrows from './Eyebrows';
import Eyes from './Eyes';
import Mouth from './Mouth';

// Minimal emoticon face (2 eyes + 1 mouth) drawn in a 100x100 viewBox.
// Everything is procedural and repainted every frame from a few animated
// params, so the WHOLE face is alive: the head floats/tilts, eyes blink &
// glance & follow the cursor, the mouth morphs and "talks". Expression can
// also be forced via the `expression` prop.

const CX = 50;
const MY = 62;        // mouth baseline
const W = 6.5;        // mouth half-width (narrow, compact kaomoji-like)
const EYE = { L: 16, R: 84, Y: 43, RX: 6, RY: 8.5 }; // extremely wide spread apart eyes typical of =D face
const LOOK = 4;       // max pupil travel (viewBox units)
const BLINK_DUR = 130;

// Expression = target values the live params chase toward.
//  smile: -frown .. +smile · open: mouth opening · eye: lid openness · tongue
const EXPR = {
  neutral:  { smile: 0.18, open: 0.06, eye: 1.0,  tongue: 0 }, // :|
  smile:    { smile: 0.62, open: 0.06, eye: 0.92, tongue: 0 }, // :)
  grin:     { smile: 1.0,  open: 0.5,  eye: 0.5,  tongue: 0 }, // :D
  squintD:  { smile: 1.0,  open: 0.7,  eye: 0.16, tongue: 0 }, // =D (squinted to horizontal lines)
  tongue:   { smile: 0.7,  open: 0.34, eye: 0.8,  tongue: 1 }, // :p
  surprise: { smile: 0.0,  open: 0.78, eye: 1.18, tongue: 0 }, // :o
};
const IDLE_FACES = ['neutral', 'smile', 'smile', 'grin', 'tongue', 'surprise'];
const rand = (a, b) => a + Math.random() * (b - a);
const f = (v) => Number(v).toFixed(2);

function drawRoundRect(cx, cy, w, h, r) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const rad = Math.min(r, w / 2, h / 2);
  return `M ${f(x + rad)} ${f(y)} h ${f(w - 2 * rad)} a ${f(rad)} ${f(rad)} 0 0 1 ${f(rad)} ${f(rad)} v ${f(h - 2 * rad)} a ${f(rad)} ${f(rad)} 0 0 1 ${f(-rad)} ${f(rad)} h ${f(-(w - 2 * rad))} a ${f(rad)} ${f(rad)} 0 0 1 ${f(-rad)} ${f(-rad)} v ${f(-(h - 2 * rad))} a ${f(rad)} ${f(rad)} 0 0 1 ${f(rad)} ${f(-rad)} Z`;
}

// Repaint every SVG node from the current animated values.
function paintFace(n, p, look, bf, bob) {
  if (!n.face) return;
  n.face.setAttribute('transform', `translate(${f(bob.x)} ${f(bob.y)}) rotate(${f(bob.rot)} 50 55)`);

  // Translate the entire lookGroup together to preserve face composition (eyes, eyebrows, mouth move as one block)
  const lookT = `translate(${f(look.x)} ${f(look.y)})`;
  if (n.lookGroup) {
    n.lookGroup.setAttribute('transform', lookT);
  }
  // Clear any individual transforms on paths
  if (n.eyesPath) n.eyesPath.removeAttribute('transform');
  if (n.eyebrowsPath) n.eyebrowsPath.removeAttribute('transform');
  if (n.mouthPath) n.mouthPath.removeAttribute('transform');

  const smile = p.smile;
  const open = Math.max(0, p.open);
  const cyCorner = MY - smile * 3;
  const cyMid = MY + smile * 2;
  const bottomMid = cyCorner + Math.max(3.5, open * 13);

  // Squeeze eye openness when looking far up/down (squinting/flattening look)
  const verticalLookFactor = Math.abs(look.y) / LOOK;
  const vertSquint = Math.max(0.1, 1.0 - verticalLookFactor * 0.85);

  // Piecewise LERP supporting 3 states: vertical rectangle (t=1), square (t=0.5), horizontal rectangle (t=0)
  const t = Math.min(1.2, Math.max(0, p.eye * bf * vertSquint));
  let w, h;
  if (t < 0.5) {
    const factor = t / 0.5;
    w = 16 + factor * (8 - 16);
    h = 5 + factor * (8 - 5);
  } else {
    const factor = Math.min(1, (t - 0.5) / 0.5);
    w = 8 + factor * (5 - 8);
    h = 8 + factor * (16 - 8);
  }

  // Local eye shifting relative to the face to create pupil glancing.
  // Moderate horizontal displacement, larger vertical displacement to sit at top/bottom margins.
  const eyeShiftX = look.x * 0.5;
  const eyeShiftY = look.y * 1.25;

  // 1. Left Eye Rounded Rectangle Sub-path
  const leftEyeD = drawRoundRect(EYE.L + eyeShiftX, EYE.Y + eyeShiftY, w, h, 2);

  // 2. Right Eye Rounded Rectangle Sub-path
  const rightEyeD = drawRoundRect(EYE.R + eyeShiftX, EYE.Y + eyeShiftY, w, h, 2);

  if (n.eyesPath) {
    n.eyesPath.setAttribute('d', `${leftEyeD} ${rightEyeD}`);
  }

  // 3. Mouth Sub-path (Line Art)
  // If open is very small, draw as single curved smile line. When opening the mouth, the top lip transitions
  // from a curved smile to flat/horizontal (at most flat), while the bottom lip extends downwards.
  const rc = 2.5; // corner radius to soften the mouth corners
  const cyTopMid = cyMid + (cyCorner - cyMid) * Math.min(1, open * 15);
  const mouthD = open < 0.05
    ? `M ${CX - W} ${f(cyCorner)} Q ${CX} ${f(cyMid)} ${CX + W} ${f(cyCorner)}`
    : `M ${f(CX - W + rc)} ${f(cyCorner)} Q ${CX} ${f(cyTopMid)} ${f(CX + W - rc)} ${f(cyCorner)} a ${rc} ${rc} 0 0 1 ${rc} ${rc} C ${f(CX + W - rc * 0.5)} ${f(bottomMid)} ${f(CX - W + rc * 0.5)} ${f(bottomMid)} ${CX - W} ${f(cyCorner + rc)} a ${rc} ${rc} 0 0 1 ${rc} ${-rc} Z`;

  if (n.mouthPath) {
    n.mouthPath.setAttribute('d', mouthD);
  }

  // 4. Eyebrows Sub-path (Horizontal Lines)
  // Eyebrows lower dynamically as the eyes close (t -> 0) and shift with look
  const ebShiftX = look.x * 0.3;
  const ebShiftY = look.y * 0.8;
  const ebY = 32 - t * 4;
  const ebW = 6;
  const eyebrowsD = `M ${EYE.L + ebShiftX - ebW} ${f(ebY + ebShiftY)} H ${EYE.L + ebShiftX + ebW} M ${EYE.R + ebShiftX - ebW} ${f(ebY + ebShiftY)} H ${EYE.R + ebShiftX + ebW}`;
  if (n.eyebrowsPath) {
    n.eyebrowsPath.setAttribute('d', eyebrowsD);
  }
}

export default function OpeAvatar({ size = '1em', expression = null, autoplay = true }) {
  const [auto, setAuto] = useState('smile');
  const [hover, setHover] = useState(false);
  const [tap, setTap] = useState(null);
  const [reduced, setReduced] = useState(false);

  const svgRef = useRef(null);
  const faceRef = useRef(null);
  const lookGroupRef = useRef(null);
  const eyesPathRef = useRef(null);
  const mouthPathRef = useRef(null);
  const eyebrowsPathRef = useRef(null);

  // Live animation state (kept in refs so frames never trigger re-renders).
  const cur = useRef({ smile: 0.5, open: 0.1, eye: 1, tongue: 0 });
  const look = useRef({ x: 0, y: 0 });
  const mouse = useRef(null);
  const lastMove = useRef(0);
  const glance = useRef({ x: 0, y: 0 });
  const glanceNext = useRef(0);
  const blinkStart = useRef(0);
  const blinkNext = useRef(0);
  const talkStart = useRef(0);
  const talkDur = useRef(0);
  const talkNext = useRef(0);

  const current = expression || tap || (hover ? 'grin' : auto);
  const targetRef = useRef(EXPR.smile);
  targetRef.current = EXPR[current] || EXPR.neutral;

  const nodes = () => ({
    face: faceRef.current,
    lookGroup: lookGroupRef.current,
    eyesPath: eyesPathRef.current,
    mouthPath: mouthPathRef.current,
    eyebrowsPath: eyebrowsPathRef.current,
  });

  // Reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Drift the resting expression over time (only when nothing else drives it).
  useEffect(() => {
    if (!autoplay || reduced) return undefined;
    let t;
    const loop = () => {
      t = setTimeout(() => {
        setAuto(IDLE_FACES[Math.floor(Math.random() * IDLE_FACES.length)]);
        loop();
      }, rand(3800, 7000));
    };
    loop();
    return () => clearTimeout(t);
  }, [autoplay, reduced]);

  // Static paint when animation is off / reduced motion.
  useEffect(() => {
    if (autoplay && !reduced) return;
    cur.current = { ...targetRef.current };
    paintFace(nodes(), targetRef.current, { x: 0, y: 0 }, 1, { x: 0, y: 0, rot: 0 });
  }, [current, autoplay, reduced]);

  // The life loop: float, blink, glance, talk, morph — all per frame.
  useEffect(() => {
    if (!autoplay || reduced) return undefined;
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      lastMove.current = performance.now();
    };
    window.addEventListener('mousemove', onMove);

    const start = performance.now();
    blinkNext.current = start + rand(1400, 3200);
    talkNext.current = start + rand(2200, 4800);
    glanceNext.current = start + rand(1200, 2600);

    let raf;
    const tick = () => {
      const now = performance.now();
      const tgt = targetRef.current;
      const c = cur.current;
      c.smile += (tgt.smile - c.smile) * 0.12;
      c.open += (tgt.open - c.open) * 0.12;
      c.eye += (tgt.eye - c.eye) * 0.12;
      c.tongue += (tgt.tongue - c.tongue) * 0.16;

      // Blink (smooth lid dip).
      if (now > blinkNext.current) {
        blinkStart.current = now;
        blinkNext.current = now + rand(2400, 5600);
      }
      const bd = now - blinkStart.current;
      const bf = bd >= 0 && bd < BLINK_DUR ? 1 - Math.sin((bd / BLINK_DUR) * Math.PI) : 1;

      // Occasional "talk" burst — the mouth flaps a few times.
      if (now > talkNext.current) {
        talkStart.current = now;
        talkDur.current = rand(700, 1400);
        talkNext.current = now + talkDur.current + rand(3200, 6500);
      }
      const td = now - talkStart.current;
      const talk = td >= 0 && td < talkDur.current
        ? Math.abs(Math.sin((td / talkDur.current) * Math.PI * 3)) * Math.sin((td / talkDur.current) * Math.PI) * 0.24
        : 0;

      // Where to look: cursor if recent, otherwise idle saccades.
      if (now > glanceNext.current) {
        glance.current = { x: rand(-LOOK, LOOK) * 0.7, y: rand(-LOOK, LOOK) * 0.5 };
        glanceNext.current = now + rand(1200, 2800);
      }
      let tx = glance.current.x;
      let ty = glance.current.y;
      const svg = svgRef.current;
      if (svg && mouse.current && now - lastMove.current < 2500) {
        const r = svg.getBoundingClientRect();
        const dx = mouse.current.x - (r.left + r.width / 2);
        const dy = mouse.current.y - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        tx = (dx / d) * LOOK;
        ty = (dy / d) * LOOK;
      }
      look.current.x += (tx - look.current.x) * 0.16;
      look.current.y += (ty - look.current.y) * 0.16;

      // Add never-resting idle wobble on top of the eased params.
      const p = {
        smile: c.smile + Math.sin(now * 0.0016) * 0.04,
        open: c.open + Math.sin(now * 0.0021) * 0.05 + talk,
        eye: c.eye + Math.sin(now * 0.0026) * 0.03,
        tongue: c.tongue,
      };
      const bob = {
        x: Math.sin(now * 0.0012) * 3 + Math.sin(now * 0.0023) * 1.1,
        y: Math.sin(now * 0.0017) * 2.2,
        rot: look.current.x * 2.2,
      };
      paintFace(nodes(), p, look.current, bf, bob);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [autoplay, reduced]);

  const tapPulse = () => {
    setTap('tongue');
    setTimeout(() => setTap(null), 900);
  };

  return (
    <span
      className="ope-avatar"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={tapPulse}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg ref={svgRef} viewBox="0 0 100 100" className="ope-avatar-svg">
        <g ref={faceRef}>
          <g ref={lookGroupRef}>
            {/* <Eyebrows ref={eyebrowsPathRef} /> */}
            <Eyes ref={eyesPathRef} />
            <Mouth ref={mouthPathRef} />
          </g>
        </g>
      </svg>

      <style jsx>{`
        .ope-avatar {
          display: inline-flex;
          flex: none;
          align-items: center;
          justify-content: center;
          vertical-align: middle;
          line-height: 0;
          cursor: pointer;
        }
        .ope-avatar-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }
      `}</style>
    </span>
  );
}
