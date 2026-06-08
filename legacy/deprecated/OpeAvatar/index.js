'use client';
import { useEffect, useRef, useState } from 'react';
import { IDLE_KAOMOJI_KEYS, KAOMOJI_BY_KEY, getKaomojiKey } from './kaomojis';

// Kaomoji face drawn in the existing 100x100 viewBox.
// Static wrapper chars stay in place, while eyes + mouth inherit the old
// lookGroup tracking so the expression follows the cursor like the SVG avatar.

const LOOK = 4;
const TOOL_EMOTION_STEP_MS = 1200;
const TOOL_IDLE_RESET_MS = 30000;
const rand = (a, b) => a + Math.random() * (b - a);
const f = (v) => Number(v).toFixed(2);

const SLOT = {
  leftParen: { x: 2, y: 52 },
  leftMark: { x: 24, y: 45 },
  leftEye: { x: 26, y: 45 },
  mouth: { x: 50, y: 58 },
  rightEye: { x: 74, y: 45 },
  rightMark: { x: 76, y: 45 },
  rightParen: { x: 98, y: 52 },
};

function getSlots(kaomoji) {
  const leftWrap = Array.from(kaomoji.leftWrap);
  const rightWrap = Array.from(kaomoji.rightWrap);

  return {
    leftParen: leftWrap[0] || '',
    leftMark: leftWrap[1] || '',
    leftEye: kaomoji.leftEye,
    mouth: kaomoji.mouth,
    rightEye: kaomoji.rightEye,
    rightMark: rightWrap.length > 1 ? rightWrap[0] : '',
    rightParen: rightWrap.length > 1 ? rightWrap[1] : rightWrap[0] || '',
  };
}

function countChars(value) {
  return Array.from(String(value || '')).length;
}

function isCustomKaomoji(value) {
  return value
    && typeof value === 'object'
    && value.key
    && countChars(value.leftWrap) >= 1
    && countChars(value.leftWrap) <= 2
    && countChars(value.leftEye) === 1
    && countChars(value.mouth) === 1
    && countChars(value.rightEye) === 1
    && countChars(value.rightWrap) >= 1
    && countChars(value.rightWrap) <= 2;
}

function getKaomoji(value) {
  if (isCustomKaomoji(value)) return value;
  return KAOMOJI_BY_KEY[getKaomojiKey(value)] || KAOMOJI_BY_KEY.smile;
}

function getEmotionKey(value) {
  if (isCustomKaomoji(value)) return value.key;
  return value;
}

function paintFace(n, kaomoji, look, bob) {
  if (!n.face || !kaomoji) return;

  n.face.setAttribute('transform', `translate(${f(bob.x)} ${f(bob.y)}) rotate(${f(bob.rot)} 50 55)`);

  if (n.lookGroup) {
    n.lookGroup.setAttribute('transform', `translate(${f(look.x)} ${f(look.y)})`);
  }

  const slots = getSlots(kaomoji);
  if (n.leftParen) n.leftParen.textContent = slots.leftParen;
  if (n.leftMark) n.leftMark.textContent = slots.leftMark;
  if (n.leftEye) n.leftEye.textContent = slots.leftEye;
  if (n.mouth) n.mouth.textContent = slots.mouth;
  if (n.rightEye) n.rightEye.textContent = slots.rightEye;
  if (n.rightMark) n.rightMark.textContent = slots.rightMark;
  if (n.rightParen) n.rightParen.textContent = slots.rightParen;
}

export default function OpeAvatar({ size = '1em', expression = null, autoplay = true }) {
  const [auto, setAuto] = useState('smile');
  const [hover, setHover] = useState(false);
  const [tap, setTap] = useState(null);
  const [toolExpression, setToolExpression] = useState(null);
  const [reduced, setReduced] = useState(false);

  const svgRef = useRef(null);
  const faceRef = useRef(null);
  const lookGroupRef = useRef(null);
  const leftParenRef = useRef(null);
  const leftMarkRef = useRef(null);
  const leftEyeRef = useRef(null);
  const mouthRef = useRef(null);
  const rightEyeRef = useRef(null);
  const rightMarkRef = useRef(null);
  const rightParenRef = useRef(null);

  const look = useRef({ x: 0, y: 0 });
  const mouse = useRef(null);
  const lastMove = useRef(0);
  const glance = useRef({ x: 0, y: 0 });
  const glanceNext = useRef(0);
  const toolQueue = useRef([]);
  const toolQueueActive = useRef(false);
  const lastToolEmotionKey = useRef(null);
  const toolStepTimer = useRef(null);
  const toolResetTimer = useRef(null);

  const current = expression || tap || toolExpression || (hover ? 'joy' : auto);
  const kaomojiRef = useRef(KAOMOJI_BY_KEY.smile);
  kaomojiRef.current = getKaomoji(current);

  const nodes = () => ({
    face: faceRef.current,
    lookGroup: lookGroupRef.current,
    leftParen: leftParenRef.current,
    leftMark: leftMarkRef.current,
    leftEye: leftEyeRef.current,
    mouth: mouthRef.current,
    rightEye: rightEyeRef.current,
    rightMark: rightMarkRef.current,
    rightParen: rightParenRef.current,
  });

  // Reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const scheduleNextToolEmotion = () => {
      clearTimeout(toolResetTimer.current);
      const next = toolQueue.current.shift();

      if (!next) {
        toolQueueActive.current = false;
        toolResetTimer.current = setTimeout(() => setToolExpression(null), TOOL_IDLE_RESET_MS);
        return;
      }

      toolQueueActive.current = true;
      lastToolEmotionKey.current = getEmotionKey(next);
      setToolExpression(next);
      toolStepTimer.current = setTimeout(scheduleNextToolEmotion, TOOL_EMOTION_STEP_MS);
    };

    const onEmotion = (event) => {
      const next = event.detail?.kaomoji || event.detail?.emotion;
      if (!isCustomKaomoji(next) && !KAOMOJI_BY_KEY[next]) return;
      const nextKey = getEmotionKey(next);
      const tailKey = toolQueue.current.length
        ? getEmotionKey(toolQueue.current[toolQueue.current.length - 1])
        : lastToolEmotionKey.current;
      if (nextKey === tailKey) return;
      toolQueue.current.push(next);
      clearTimeout(toolResetTimer.current);
      if (!toolQueueActive.current) scheduleNextToolEmotion();
    };

    window.addEventListener('ope-avatar-emotion', onEmotion);
    return () => {
      clearTimeout(toolStepTimer.current);
      clearTimeout(toolResetTimer.current);
      window.removeEventListener('ope-avatar-emotion', onEmotion);
    };
  }, []);

  // Drift the resting expression over time (only when nothing else drives it).
  useEffect(() => {
    if (!autoplay || reduced) return undefined;
    let t;
    const loop = () => {
      t = setTimeout(() => {
        setAuto(IDLE_KAOMOJI_KEYS[Math.floor(Math.random() * IDLE_KAOMOJI_KEYS.length)]);
        loop();
      }, rand(2400, 4200));
    };
    loop();
    return () => clearTimeout(t);
  }, [autoplay, reduced]);

  // Static paint when animation is off / reduced motion.
  useEffect(() => {
    if (autoplay && !reduced) return;
    paintFace(nodes(), kaomojiRef.current, { x: 0, y: 0 }, { x: 0, y: 0, rot: 0 });
  }, [current, autoplay, reduced]);

  // Tracking loop: cursor-following look group + old idle wobble.
  useEffect(() => {
    if (!autoplay || reduced) return undefined;
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      lastMove.current = performance.now();
    };
    window.addEventListener('mousemove', onMove);

    const start = performance.now();
    glanceNext.current = start + rand(1200, 2600);

    let raf;
    const tick = () => {
      const now = performance.now();

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

      const bob = {
        x: Math.sin(now * 0.0012) * 3 + Math.sin(now * 0.0023) * 1.1,
        y: Math.sin(now * 0.0017) * 2.2,
        rot: look.current.x * 2.2,
      };
      paintFace(nodes(), kaomojiRef.current, look.current, bob);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [autoplay, reduced]);

  const tapPulse = () => {
    setTap('sparkle');
    setTimeout(() => setTap(null), 900);
  };

  const initialSlots = getSlots(kaomojiRef.current);

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
          <text ref={leftParenRef} className="ope-kaomoji" x={SLOT.leftParen.x} y={SLOT.leftParen.y}>{initialSlots.leftParen}</text>
          <text ref={leftMarkRef} className="ope-kaomoji" x={SLOT.leftMark.x} y={SLOT.leftMark.y}>{initialSlots.leftMark}</text>
          <g ref={lookGroupRef}>
            <text ref={leftEyeRef} className="ope-kaomoji" x={SLOT.leftEye.x} y={SLOT.leftEye.y}>{initialSlots.leftEye}</text>
            <text ref={mouthRef} className="ope-kaomoji" x={SLOT.mouth.x} y={SLOT.mouth.y}>{initialSlots.mouth}</text>
            <text ref={rightEyeRef} className="ope-kaomoji" x={SLOT.rightEye.x} y={SLOT.rightEye.y}>{initialSlots.rightEye}</text>
          </g>
          <text ref={rightMarkRef} className="ope-kaomoji" x={SLOT.rightMark.x} y={SLOT.rightMark.y}>{initialSlots.rightMark}</text>
          <text ref={rightParenRef} className="ope-kaomoji" x={SLOT.rightParen.x} y={SLOT.rightParen.y}>{initialSlots.rightParen}</text>
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
        .ope-kaomoji {
          fill: white;
          font-family: "Noto Sans JP", "Meiryo", "Hiragino Sans", "Segoe UI Symbol", monospace;
          font-size: 24px;
          font-weight: 700;
          dominant-baseline: middle;
          text-anchor: middle;
          user-select: none;
        }
      `}</style>
    </span>
  );
}
