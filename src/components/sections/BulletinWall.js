"use client";

// A scroll-driven, pinned evidence scene. The page itself stays visually still:
// small batches of evidence fly up, snap into a dense composition, then leave
// through the top before the next batch arrives. Photos come from stable,
// seeded Picsum endpoints; evidence copy is shaped like actual case material.
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const BASE_W = 1180;
const COLLISION_GAP = 4;

const SIZE = {
  sticky: [205, 170],
  note: [440, 360],
  paper: [350, 460],
  map: [820, 540],
  bigpic: [545, 370],
  smallpic: [260, 180],
  polaroid: [265, 318],
  receipt: [180, 340],
  envelope: [360, 210],
  bare: [400, 90],
};

const photo = (seed, width = 900, height = 650) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}?grayscale`;

const ITEMS = [
  { id: 'a1', type: 'bare', text: 'CASE 510 / INCIDENT WALL', anchorX: 0.12 },
  { id: 'a2', type: 'sticky', tone: 0, kicker: 'CALL', text: 'M. Hart / 21:00. North stairwell.', meta: '13 AUG', anchorX: 0.76 },
  { id: 'a3', type: 'bigpic', photo: photo('ope-harbour-0314'), alt: 'Harbour evidence photograph', ref: 'EX. 01', text: 'harbour / camera 03:14', anchorX: 0.18 },
  { id: 'a4', type: 'map', photo: '/evidence/noir-city-map.png', alt: 'Hand-drawn fictional river city evidence map', ref: 'ROUTE STUDY / 510', anchorX: 0.62, rotation: -1.1 },
  { id: 'a5', type: 'polaroid', photo: photo('ope-last-seen', 520, 620), alt: 'Last-seen evidence photograph', ref: 'P-04', text: 'last seen / 00:47', anchorX: 0.88 },
  { id: 'a6', type: 'paper', title: 'WITNESS STATEMENT', meta: 'CASE 510 · SHEET 01', text: 'The night porter heard the service door close at 03:10. No vehicle left the courtyard.', stamp: 'SIGNED', anchorX: 0.22 },
  { id: 'a7', type: 'smallpic', photo: photo('ope-plate-kx88', 520, 360), alt: 'Vehicle evidence photograph', ref: 'EX. 03', text: 'plate KX-88', anchorX: 0.7 },
  { id: 'a8', type: 'sticky', tone: 1, kicker: 'WEATHER', text: 'He says rain. Log says dry.', meta: 'VERIFY', anchorX: 0.92 },
  { id: 'b1', type: 'envelope', addressee: 'M. HART', meta: 'FOUND / LOCKER 12', anchorX: 0.1 },
  { id: 'b2', type: 'bigpic', photo: photo('ope-stairwell'), alt: 'Stairwell evidence photograph', ref: 'EX. 07', text: 'service stairwell / west wing', anchorX: 0.64 },
  { id: 'b3', type: 'sticky', tone: 2, kicker: 'LEDGER', text: 'Page 41. Initials: E.W.', meta: 'PRIORITY', anchorX: 0.28 },
  { id: 'b4', type: 'note', title: 'FIELD NOTES / NORTH DOCK', text: '03:17 — chain loose at the east gate. Salt on the inside sill. Shoe print turns back before the water.', mark: 'check tide table', anchorX: 0.82 },
  { id: 'b5', type: 'paper', title: 'AUDIO TRANSCRIPT', meta: 'TAPE 02 · 03:06:18', text: '[metal impact] … eleven seconds of silence … footsteps ascending … second voice unintelligible.', stamp: 'EVIDENCE', anchorX: 0.15 },
  { id: 'b6', type: 'smallpic', photo: photo('ope-brass-key', 520, 360), alt: 'Recovered key evidence photograph', ref: 'EX. 11', text: 'recovered near drain', anchorX: 0.52 },
  { id: 'b7', type: 'receipt', shop: 'NORTH PIER CAFE', time: '02:52', rows: ['coffee ........ 1.20', 'matches ....... 0.15', 'cash .......... 2.00'], total: '0.65', anchorX: 0.94 },
  { id: 'b8', type: 'polaroid', photo: photo('ope-witness', 520, 620), alt: 'Witness reference photograph', ref: 'P-12', text: 'witness B / re-interview', anchorX: 0.35 },
  { id: 'c1', type: 'sticky', tone: 3, kicker: 'ROOM 4B', text: 'Two coats. One hook.', meta: 'WHO LEFT?', anchorX: 0.08 },
  { id: 'c2', type: 'bigpic', photo: photo('ope-east-pier'), alt: 'East pier evidence photograph', ref: 'EX. 14', text: 'east pier / first light', anchorX: 0.72 },
  { id: 'c3', type: 'note', title: 'TIMELINE / REVISED', text: '02:52 receipt. 03:06 tape. 03:10 door. 03:14 harbour camera. Clock discrepancy: seven minutes.', mark: 'do not file yet', anchorX: 0.25 },
  { id: 'c4', type: 'polaroid', photo: photo('ope-courtyard', 520, 620), alt: 'Courtyard evidence photograph', ref: 'P-17', text: 'courtyard / blind angle', anchorX: 0.9 },
  { id: 'c5', type: 'paper', title: "CORONER'S NOTE", meta: 'PRELIMINARY · NOT FINAL', text: 'Estimated interval conflicts with the lobby clock by seven minutes. Recheck recorded times.', stamp: 'REVIEW', anchorX: 0.62 },
  { id: 'c6', type: 'sticky', tone: 4, kicker: 'CLOCK', text: 'Who set it seven minutes fast?', meta: 'OPEN', anchorX: 0.18 },
  { id: 'c7', type: 'bare', text: 'STATUS / OPEN', anchorX: 0.78 },
];

function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function collisionBox(x, y, width, height, rotation, gap) {
  const radians = Math.abs(rotation) * Math.PI / 180;
  const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const rotatedHeight = Math.abs(height * Math.cos(radians)) + Math.abs(width * Math.sin(radians));
  return {
    left: x - (rotatedWidth - width) / 2 - gap,
    top: y - (rotatedHeight - height) / 2 - gap,
    right: x + width + (rotatedWidth - width) / 2 + gap,
    bottom: y + height + (rotatedHeight - height) / 2 + gap,
  };
}

function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function boxDistance(a, b) {
  const dx = Math.max(0, a.left - b.right, b.left - a.right);
  const dy = Math.max(0, a.top - b.bottom, b.top - a.bottom);
  return Math.hypot(dx, dy);
}

// Seeded free placement inside one viewport. Items are packed into successive
// waves; each wave has its own collision field, so the composition can stay
// large and close without turning into a permanent grid.
function layout(items, boardW, viewportH) {
  const isMobile = boardW < 600;
  const isTablet = boardW < 900;
  const scale = Math.min(1.08, Math.max(0.86, boardW / BASE_W));
  const margin = isMobile ? 10 : 16;
  const safeTop = isMobile ? 116 : 72;
  const safeBottom = isMobile ? 36 : 42;
  const usableHeight = Math.max(260, viewportH - safeTop - safeBottom);
  const gap = Math.max(3, COLLISION_GAP * scale);
  const waveLimit = isMobile ? 2 : isTablet ? 3 : 4;
  const rand = lcg(0x0813f00d);
  const dimensions = items.map((item) => {
    const [baseWidth, baseHeight] = SIZE[item.type];
    const itemScale = Math.min(
      scale,
      (boardW - margin * 2) / baseWidth,
      usableHeight / baseHeight
    );
    return {
      item,
      itemScale,
      width: baseWidth * itemScale,
      height: baseHeight * itemScale,
    };
  });
  const placed = [];
  let wave = 0;
  let waveItems = [];

  dimensions.forEach((entry) => {
    const { item, itemScale, width, height } = entry;
    const rotation = item.rotation ?? (rand() - 0.5) * (item.type === 'bare' ? 2.2 : 7.5);
    const maxX = Math.max(margin, boardW - width - margin);
    const targetX = margin + (maxX - margin) * (item.anchorX ?? rand());
    const minY = safeTop;
    const maxY = Math.max(minY, viewportH - safeBottom - height);

    const findPosition = (currentWave) => {
      if (currentWave.length >= waveLimit) return null;

      let best = null;
      for (let attempt = 0; attempt < 520; attempt += 1) {
        const x = attempt === 0
          ? targetX
          : margin + rand() * Math.max(0, maxX - margin);
        const y = attempt === 0
          ? minY + (maxY - minY) * (0.3 + rand() * 0.4)
          : minY + rand() * Math.max(0, maxY - minY);
        const box = collisionBox(x, y, width, height, rotation, gap);
        if (currentWave.some((candidate) => boxesOverlap(box, candidate.collision))) continue;

        const nearest = currentWave.length
          ? Math.min(...currentWave.map((candidate) => boxDistance(box, candidate.collision)))
          : 0;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const centerPenalty = Math.abs(centerX - boardW / 2) * 0.09
          + Math.abs(centerY - (safeTop + usableHeight / 2)) * 0.08;
        const score = nearest * 1.8 + Math.abs(x - targetX) * 0.12 + centerPenalty;

        if (!best || score < best.score) best = { x, y, box, score };
      }
      return best;
    };

    let best = findPosition(waveItems);
    if (!best) {
      wave += 1;
      waveItems = [];
      best = findPosition(waveItems);
    }

    const waveOrder = waveItems.length;

    const positioned = {
      ...item,
      x: best.x,
      y: best.y,
      width,
      height,
      itemScale,
      rotation,
      flightTilt: (rand() > 0.5 ? 1 : -1) * (4 + rand() * 5),
      flightX: (rand() - 0.5) * Math.min(180, boardW * 0.22),
      wave,
      waveOrder,
      collision: best.box,
    };
    waveItems.push(positioned);
    placed.push(positioned);
  });

  return {
    items: placed.map(({ collision, ...item }) => item),
    waveCount: wave + 1,
    scale,
  };
}

function ItemContent({ item }) {
  const evidencePhoto = (
    <span className="bw-photo">
      {/* External evidence placeholders intentionally bypass Next image
          optimization so the API URL can be swapped without config changes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.photo} alt={item.alt} loading="lazy" referrerPolicy="no-referrer" />
    </span>
  );

  switch (item.type) {
    case 'sticky':
      return (
        <>
          <span className="bw-sticky-kicker">{item.kicker}</span>
          <span className="bw-hand">{item.text}</span>
          <span className="bw-note-meta">{item.meta}</span>
        </>
      );
    case 'paper':
      return (
        <>
          <span className="bw-paper-heading">
            <strong>{item.title}</strong>
            <small>{item.meta}</small>
          </span>
          <span className="bw-type">{item.text}</span>
          <span className="bw-redaction" aria-hidden />
          <span className="bw-paper-sign">O. Watson / reviewing officer</span>
          <span className="bw-stamp">{item.stamp}</span>
        </>
      );
    case 'note':
      return (
        <>
          <span className="bw-note-heading">{item.title}</span>
          <span className="bw-note-body">{item.text}</span>
          <span className="bw-note-mark">{item.mark}</span>
        </>
      );
    case 'map':
      return (
        <>
          {evidencePhoto}
          <span className="bw-map-label">{item.ref}</span>
        </>
      );
    case 'receipt':
      return (
        <>
          <i className="bw-tape" />
          <span className="bw-receipt-shop">{item.shop}</span>
          <span className="bw-receipt-time">13 AUG · {item.time}</span>
          <span className="bw-receipt-rows">{item.rows.map((row) => <span key={row}>{row}</span>)}</span>
          <span className="bw-receipt-total">CHANGE {item.total}</span>
          <span className="bw-receipt-code">#0510-8841</span>
        </>
      );
    case 'envelope':
      return (
        <>
          <span className="bw-envelope-flap" aria-hidden />
          <span className="bw-envelope-to">TO: {item.addressee}</span>
          <span className="bw-envelope-meta">{item.meta}</span>
          <span className="bw-envelope-stamp">OPENED</span>
        </>
      );
    case 'bigpic':
    case 'smallpic':
      return <><i className="bw-tape" />{evidencePhoto}<span className="bw-photo-ref">{item.ref}</span><span className="bw-cap">{item.text}</span></>;
    case 'polaroid':
      return <><i className="bw-tape" />{evidencePhoto}<span className="bw-photo-ref">{item.ref}</span><span className="bw-hand">{item.text}</span></>;
    default:
      return <span className="bw-bare-copy">{item.text}</span>;
  }
}

export default function BulletinWall() {
  const wallRef = useRef(null);
  const stageRef = useRef(null);
  const boardRef = useRef(null);
  const [viewport, setViewport] = useState({ boardW: 0, viewportH: 0 });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;

    const measure = () => {
      const next = {
        boardW: Math.round(board.clientWidth),
        viewportH: Math.round(window.innerHeight),
      };
      setViewport((current) => (
        current.boardW === next.boardW && current.viewportH === next.viewportH
          ? current
          : next
      ));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(board);
    window.addEventListener('resize', measure);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const laid = useMemo(
    () => viewport.boardW && viewport.viewportH
      ? layout(ITEMS, viewport.boardW, viewport.viewportH)
      : { items: [], waveCount: 0, scale: 1 },
    [viewport]
  );

  useEffect(() => {
    const wall = wallRef.current;
    const stage = stageRef.current;
    const board = boardRef.current;
    if (!wall || !stage || !board || !laid.items.length) return undefined;

    const elements = Array.from(board.querySelectorAll('.bw-item'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let inspectTween = null;
    let timeline = null;
    const waveStride = 1.85;
    const enterLead = 0.16;
    const enterDuration = 0.24;
    const travelLead = 0.44;
    const travelDuration = 0.9;
    const snapOffset = window.innerHeight * 0.34;
    const exitLead = travelLead + travelDuration + 0.04;
    const exitDuration = 0.24;
    const timelineEnd = (laid.waveCount - 1) * waveStride + 1.92;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(stage, { opacity: 1 });
        elements.forEach((element, index) => {
          gsap.set(element, {
            x: 0,
            y: 0,
            opacity: laid.items[index].wave === 0 ? 1 : 0,
            scale: 1,
            rotation: Number(element.dataset.rotation),
          });
        });
        return;
      }

      gsap.set(stage, { opacity: 0 });
      gsap.set(elements, { opacity: 0 });

      // There are only two snaps: arrival near the bottom and departure near
      // the top. Everything between them is one uninterrupted linear scroll.
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wall,
          start: 'top top',
          end: () => `+=${Math.max(
            window.innerHeight * 4.8,
            laid.waveCount * window.innerHeight * 1.55
          )}`,
          scrub: 0.65,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(stage, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0);

      elements.forEach((element, index) => {
        const item = laid.items[index];
        const waveStart = item.wave * waveStride;
        const enterAt = waveStart + enterLead + item.waveOrder * 0.075;
        const travelAt = waveStart + travelLead;
        const exitAt = waveStart + exitLead + item.waveOrder * 0.035;
        const rotation = Number(element.dataset.rotation);
        const flightTilt = Number(element.dataset.flightTilt);
        const flightX = Number(element.dataset.flightX);

        timeline.fromTo(element, {
          x: flightX,
          y: window.innerHeight * 0.84 + item.height * 0.3,
          opacity: 0,
          scale: 0.82,
          rotation: rotation + flightTilt,
        }, {
          x: 0,
          y: snapOffset,
          opacity: 1,
          scale: 1,
          rotation,
          duration: enterDuration,
          ease: 'power3.out',
        }, enterAt);

        timeline.to(element, {
          y: -snapOffset,
          duration: travelDuration,
          ease: 'none',
        }, travelAt);

        timeline.to(element, {
          x: flightX * -0.45,
          y: -item.y - item.height - window.innerHeight * 0.14,
          opacity: 0,
          scale: 0.92,
          rotation: rotation - flightTilt * 0.7,
          duration: exitDuration,
          ease: 'power2.in',
        }, exitAt);
      });

      timeline.to(stage, { opacity: 0, duration: 0.14, ease: 'power1.in' }, timelineEnd - 0.14);
    }, wall);

    const inspectFirstWave = () => {
      if (reducedMotion || !timeline?.scrollTrigger) return;

      const trigger = timeline.scrollTrigger;
      const firstItem = laid.items.find((item) => item.wave === 0 && item.waveOrder === 0);
      if (!firstItem) return;

      const firstArrival = enterLead + firstItem.waveOrder * 0.075 + enterDuration;
      const progress = Math.min(0.98, (firstArrival + 0.015) / timeline.duration());
      const target = trigger.start + (trigger.end - trigger.start) * progress;
      const scrollState = { y: window.scrollY };

      inspectTween?.kill();
      inspectTween = gsap.to(scrollState, {
        y: target,
        duration: 1.65,
        ease: 'power2.inOut',
        onUpdate: () => window.scrollTo({ top: scrollState.y, behavior: 'auto' }),
        onComplete: () => { inspectTween = null; },
      });
    };

    window.addEventListener('ope:inspect-bulletin', inspectFirstWave);

    return () => {
      inspectTween?.kill();
      window.removeEventListener('ope:inspect-bulletin', inspectFirstWave);
      ctx.revert();
    };
  }, [laid]);

  return (
    <section ref={wallRef} className="bw-wall" aria-label="Bulletin board">
      <style jsx global>{`
        .bw-wall {
          position: relative;
          z-index: 2;
          isolation: isolate;
          width: 100%;
          height: 100dvh;
          background: transparent;
        }
        .bw-stage {
          position: relative;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          opacity: 0;
          background:
            radial-gradient(ellipse 62% 20% at 50% 0%, rgba(243,208,152,0.065), transparent 100%),
            radial-gradient(circle at 18% 32%, rgba(255,255,255,0.018) 0 1px, transparent 1.5px),
            radial-gradient(circle at 78% 61%, rgba(255,255,255,0.014) 0 1px, transparent 1.5px),
            repeating-linear-gradient(87deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 8px),
            #050706;
          background-size: auto, 19px 23px, 31px 29px, auto, auto;
          will-change: opacity;
        }
        .bw-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(0,0,0,0.56), transparent 12% 88%, rgba(0,0,0,0.56));
        }
        .bw-board {
          position: absolute;
          inset: 0;
          width: min(96vw, 1440px);
          height: 100%;
          margin: 0 auto;
        }
        .bw-item {
          position: absolute;
          z-index: 1;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: calc(13px * var(--s));
          text-align: center;
          font-size: calc(14px * var(--s));
          line-height: 1.35;
          transform-origin: 50% 18%;
          will-change: transform, opacity;
        }

        .bw-sticky {
          align-items: flex-start;
          justify-content: flex-start;
          padding: calc(28px * var(--s)) calc(22px * var(--s)) calc(18px * var(--s));
          overflow: visible;
          text-align: left;
          color: #18201d;
          background: var(--tone);
          border-radius: calc(2px * var(--s));
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow:
            0 calc(3px * var(--s)) calc(5px * var(--s)) rgba(0,0,0,0.55),
            0 calc(18px * var(--s)) calc(38px * var(--s)) rgba(0,0,0,0.82);
          font-family: var(--font-body);
        }
        .bw-sticky::before {
          content: '';
          position: absolute;
          right: calc(-1px * var(--s));
          bottom: calc(-1px * var(--s));
          width: calc(32px * var(--s));
          height: calc(32px * var(--s));
          background: linear-gradient(135deg, transparent 48%, rgba(87,77,50,0.2) 49%, rgba(255,255,255,0.28) 100%);
          filter: drop-shadow(calc(-3px * var(--s)) calc(-2px * var(--s)) calc(3px * var(--s)) rgba(0,0,0,0.12));
        }
        .bw-sticky::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 16%, rgba(255,255,255,0.16), transparent 34%),
            repeating-linear-gradient(8deg, rgba(41,35,22,0.025) 0 1px, transparent 1px 4px),
            linear-gradient(145deg, rgba(255,255,255,0.12), transparent 42%, rgba(0,0,0,0.09));
        }
        .bw-paper {
          align-items: flex-start;
          justify-content: flex-start;
          overflow: visible;
          padding: calc(30px * var(--s)) calc(26px * var(--s)) calc(24px * var(--s));
          text-align: left;
          color: #202521;
          border: 1px solid rgba(255,255,255,0.22);
          background-color: #d8ceb7;
          background-image:
            linear-gradient(90deg, transparent 0 calc(34px * var(--s)), rgba(135,74,59,0.18) calc(34px * var(--s)) calc(35px * var(--s)), transparent calc(35px * var(--s))),
            repeating-linear-gradient(180deg, transparent 0 calc(25px * var(--s)), rgba(37,45,40,0.14) calc(25px * var(--s)) calc(26px * var(--s))),
            repeating-linear-gradient(7deg, rgba(65,51,34,0.028) 0 1px, transparent 1px 5px),
            radial-gradient(circle at 15% 8%, rgba(255,255,255,0.32), transparent 36%);
          box-shadow:
            calc(2px * var(--s)) calc(3px * var(--s)) 0 rgba(115,101,77,0.52),
            0 calc(8px * var(--s)) calc(12px * var(--s)) rgba(0,0,0,0.62),
            0 calc(24px * var(--s)) calc(48px * var(--s)) rgba(0,0,0,0.88);
          font-family: var(--font-mono);
        }
        .bw-paper::before {
          content: '';
          position: absolute;
          inset: calc(5px * var(--s));
          pointer-events: none;
          border: 1px solid rgba(45,49,43,0.08);
          box-shadow: inset 0 0 calc(22px * var(--s)) rgba(70,54,32,0.08);
        }
        .bw-paper::after {
          content: '';
          position: absolute;
          right: calc(-2px * var(--s));
          bottom: calc(-2px * var(--s));
          width: calc(36px * var(--s));
          height: calc(36px * var(--s));
          background: linear-gradient(135deg, rgba(99,83,58,0.2) 0 49%, #eee5d2 50% 100%);
          box-shadow: calc(-5px * var(--s)) calc(-5px * var(--s)) calc(8px * var(--s)) rgba(70,55,35,0.16);
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        }
        .bw-note {
          align-items: flex-start;
          justify-content: flex-start;
          overflow: visible;
          padding: calc(28px * var(--s)) calc(27px * var(--s)) calc(24px * var(--s));
          text-align: left;
          color: #242923;
          clip-path: polygon(0.8% 1.2%, 98.7% 0, 100% 96.8%, 91% 98.4%, 84% 97.2%, 75% 99%, 64% 97.6%, 52% 99.2%, 40% 97.8%, 27% 99%, 14% 97.5%, 0 99%);
          background:
            linear-gradient(90deg, transparent 0 calc(34px * var(--s)), rgba(141,70,57,0.2) calc(34px * var(--s)) calc(35px * var(--s)), transparent calc(35px * var(--s))),
            repeating-linear-gradient(180deg, #d8d2be 0 calc(24px * var(--s)), rgba(76,93,91,0.28) calc(24px * var(--s)) calc(25px * var(--s)));
          box-shadow:
            0 calc(5px * var(--s)) calc(8px * var(--s)) rgba(0,0,0,0.62),
            0 calc(22px * var(--s)) calc(45px * var(--s)) rgba(0,0,0,0.86);
          font-family: var(--font-body);
        }
        .bw-note::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(13deg, rgba(64,55,40,0.026) 0 1px, transparent 1px 5px);
          mix-blend-mode: multiply;
        }
        .bw-note-heading { position: relative; z-index: 1; padding-bottom: calc(8px * var(--s)); font-family: var(--font-mono); font-size: calc(10px * var(--s)); font-weight: 700; letter-spacing: 0.12em; }
        .bw-note-body { position: relative; z-index: 1; padding-top: calc(16px * var(--s)); font-size: calc(17px * var(--s)); font-style: italic; line-height: 1.42; transform: rotate(-0.5deg); }
        .bw-note-mark { position: absolute; right: calc(22px * var(--s)); bottom: calc(22px * var(--s)); z-index: 1; color: rgba(111,43,35,0.76); font-family: var(--font-body); font-size: calc(13px * var(--s)); font-weight: 700; transform: rotate(-5deg); }

        .bw-map {
          padding: calc(8px * var(--s));
          overflow: visible;
          border: 1px solid rgba(217,204,174,0.18);
          background: #81755e;
          box-shadow:
            0 calc(6px * var(--s)) calc(10px * var(--s)) rgba(0,0,0,0.66),
            0 calc(28px * var(--s)) calc(60px * var(--s)) rgba(0,0,0,0.92);
        }
        .bw-map .bw-photo { width: 100%; height: 100%; flex: 1; }
        .bw-map .bw-photo img { filter: contrast(1.08) brightness(0.74) saturate(0.7); }
        .bw-map-label { position: absolute; left: calc(18px * var(--s)); bottom: calc(15px * var(--s)); z-index: 2; padding: calc(4px * var(--s)) calc(7px * var(--s)); color: rgba(235,221,190,0.86); border: 1px solid rgba(235,221,190,0.26); background: rgba(12,14,12,0.72); font-family: var(--font-mono); font-size: calc(9px * var(--s)); letter-spacing: 0.11em; }

        .bw-receipt {
          align-items: stretch;
          justify-content: flex-start;
          overflow: visible;
          padding: calc(24px * var(--s)) calc(12px * var(--s)) calc(18px * var(--s));
          color: #22251f;
          clip-path: polygon(0 2%, 4% 0, 8% 2%, 12% 0, 16% 2%, 20% 0, 24% 2%, 28% 0, 32% 2%, 36% 0, 40% 2%, 44% 0, 48% 2%, 52% 0, 56% 2%, 60% 0, 64% 2%, 68% 0, 72% 2%, 76% 0, 80% 2%, 84% 0, 88% 2%, 92% 0, 96% 2%, 100% 0, 100% 98%, 96% 100%, 92% 98%, 88% 100%, 84% 98%, 80% 100%, 76% 98%, 72% 100%, 68% 98%, 64% 100%, 60% 98%, 56% 100%, 52% 98%, 48% 100%, 44% 98%, 40% 100%, 36% 98%, 32% 100%, 28% 98%, 24% 100%, 20% 98%, 16% 100%, 12% 98%, 8% 100%, 4% 98%, 0 100%);
          background:
            repeating-linear-gradient(0deg, rgba(70,60,42,0.03) 0 1px, transparent 1px 4px),
            #d9d3c1;
          box-shadow: 0 calc(15px * var(--s)) calc(30px * var(--s)) rgba(0,0,0,0.82);
          font-family: var(--font-mono);
        }
        .bw-receipt-shop { padding-bottom: calc(7px * var(--s)); border-bottom: 1px dashed rgba(33,38,33,0.46); text-align: center; font-size: calc(9px * var(--s)); font-weight: 700; letter-spacing: 0.06em; }
        .bw-receipt-time { padding: calc(8px * var(--s)) 0; font-size: calc(7px * var(--s)); opacity: 0.64; }
        .bw-receipt-rows { display: flex; flex-direction: column; gap: calc(8px * var(--s)); padding: calc(8px * var(--s)) 0 calc(12px * var(--s)); border-top: 1px dashed rgba(33,38,33,0.28); border-bottom: 1px dashed rgba(33,38,33,0.38); font-size: calc(7px * var(--s)); white-space: nowrap; }
        .bw-receipt-total { padding-top: calc(10px * var(--s)); text-align: right; font-size: calc(8px * var(--s)); font-weight: 700; }
        .bw-receipt-code { margin-top: auto; text-align: center; font-size: calc(6px * var(--s)); letter-spacing: 0.08em; opacity: 0.46; }

        .bw-envelope {
          align-items: flex-start;
          justify-content: flex-end;
          overflow: visible;
          padding: calc(20px * var(--s));
          color: #292b24;
          border: 1px solid rgba(255,255,255,0.18);
          background:
            repeating-linear-gradient(9deg, rgba(65,54,38,0.025) 0 1px, transparent 1px 5px),
            #c8bea5;
          box-shadow: 0 calc(18px * var(--s)) calc(38px * var(--s)) rgba(0,0,0,0.84);
          font-family: var(--font-mono);
        }
        .bw-envelope-flap { position: absolute; inset: 0 0 auto; height: 68%; overflow: hidden; border-bottom: 1px solid rgba(67,61,48,0.2); clip-path: polygon(0 0, 100% 0, 50% 100%); background: linear-gradient(180deg, #d8ceb5, #b8ad91); filter: drop-shadow(0 calc(3px * var(--s)) calc(3px * var(--s)) rgba(0,0,0,0.14)); }
        .bw-envelope-to { position: relative; z-index: 1; font-size: calc(12px * var(--s)); font-weight: 700; letter-spacing: 0.08em; }
        .bw-envelope-meta { position: relative; z-index: 1; margin-top: calc(5px * var(--s)); font-size: calc(8px * var(--s)); opacity: 0.62; }
        .bw-envelope-stamp { position: absolute; right: calc(14px * var(--s)); top: calc(14px * var(--s)); z-index: 2; padding: calc(3px * var(--s)); border: calc(2px * var(--s)) solid rgba(112,40,33,0.56); color: rgba(112,40,33,0.62); font-size: calc(8px * var(--s)); transform: rotate(7deg); }

        .bw-bigpic,
        .bw-smallpic {
          justify-content: flex-end;
          padding: calc(8px * var(--s));
          border: 1px solid rgba(239,232,211,0.34);
          background: #c9c0aa;
          box-shadow:
            0 calc(5px * var(--s)) calc(8px * var(--s)) rgba(0,0,0,0.62),
            0 calc(20px * var(--s)) calc(42px * var(--s)) rgba(0,0,0,0.84);
        }
        .bw-polaroid {
          justify-content: flex-start;
          padding: calc(10px * var(--s)) calc(10px * var(--s)) calc(5px * var(--s));
          color: #1b2420;
          border: 1px solid rgba(255,255,255,0.32);
          background: linear-gradient(145deg, #f1eddf, #d9d1bd);
          box-shadow:
            0 calc(5px * var(--s)) calc(8px * var(--s)) rgba(0,0,0,0.62),
            0 calc(20px * var(--s)) calc(42px * var(--s)) rgba(0,0,0,0.86);
          font-family: var(--font-body);
        }
        .bw-bare { padding: calc(8px * var(--s)); color: var(--theme); }

        .bw-photo {
          position: relative;
          display: block;
          width: 100%;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: #111a18;
          box-shadow: inset 0 0 0 1px rgba(10,13,12,0.7);
        }
        .bw-photo::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(255,255,255,0.07), transparent 30%),
            radial-gradient(ellipse at center, transparent 46%, rgba(0,0,0,0.48) 100%);
        }
        .bw-photo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: sepia(0.18) contrast(1.18) brightness(0.76);
          transform: scale(1.015);
        }
        .bw-polaroid .bw-photo { margin-bottom: calc(6px * var(--s)); }
        .bw-hand { position: relative; z-index: 1; padding: calc(7px * var(--s)) 0; font-weight: 700; letter-spacing: 0.02em; }
        .bw-sticky-kicker { position: relative; z-index: 1; width: 100%; padding-bottom: calc(7px * var(--s)); border-bottom: 1px solid rgba(34,37,30,0.24); font-family: var(--font-mono); font-size: calc(9px * var(--s)); font-weight: 700; letter-spacing: 0.16em; opacity: 0.68; }
        .bw-sticky .bw-hand { flex: 1; padding-top: calc(13px * var(--s)); font-size: calc(15px * var(--s)); line-height: 1.25; }
        .bw-note-meta { position: relative; z-index: 1; align-self: flex-end; font-family: var(--font-mono); font-size: calc(8px * var(--s)); letter-spacing: 0.1em; opacity: 0.58; }
        .bw-paper-heading { position: relative; z-index: 1; display: flex; flex-direction: column; width: 100%; margin-bottom: calc(28px * var(--s)); padding-bottom: calc(8px * var(--s)); border-bottom: calc(2px * var(--s)) solid rgba(27,35,31,0.55); }
        .bw-paper-heading strong { font-size: calc(13px * var(--s)); letter-spacing: 0.12em; }
        .bw-paper-heading small { margin-top: calc(4px * var(--s)); font-size: calc(8px * var(--s)); letter-spacing: 0.08em; opacity: 0.62; }
        .bw-type { position: relative; z-index: 1; text-align: left; font-size: calc(11px * var(--s)); line-height: 1.75; }
        .bw-redaction { position: relative; z-index: 1; display: block; width: 58%; height: calc(7px * var(--s)); margin-top: calc(16px * var(--s)); background: rgba(20,24,22,0.82); transform: rotate(-0.5deg); }
        .bw-paper-sign { position: absolute; left: calc(26px * var(--s)); bottom: calc(22px * var(--s)); z-index: 1; width: 54%; padding-top: calc(5px * var(--s)); border-top: 1px solid rgba(38,43,39,0.36); font-family: var(--font-body); font-size: calc(8px * var(--s)); font-style: italic; opacity: 0.68; }
        .bw-stamp { position: absolute; right: calc(16px * var(--s)); bottom: calc(25px * var(--s)); z-index: 1; padding: calc(3px * var(--s)) calc(5px * var(--s)); border: calc(2px * var(--s)) solid rgba(112,40,33,0.56); color: rgba(112,40,33,0.62); font-size: calc(9px * var(--s)); font-weight: 700; letter-spacing: 0.08em; transform: rotate(-7deg); }
        .bw-photo-ref { position: absolute; top: calc(9px * var(--s)); left: calc(10px * var(--s)); z-index: 2; padding: calc(2px * var(--s)) calc(5px * var(--s)); color: rgba(246,239,219,0.9); background: rgba(7,11,10,0.72); font-family: var(--font-mono); font-size: calc(8px * var(--s)); letter-spacing: 0.1em; }
        .bw-cap { position: absolute; right: calc(8px * var(--s)); bottom: calc(8px * var(--s)); max-width: 82%; padding: calc(3px * var(--s)) calc(7px * var(--s)); color: #eef5ee; background: rgba(0,0,0,0.62); font-family: var(--font-mono); font-size: calc(10px * var(--s)); }
        .bw-bare-copy { font-family: var(--font-mono); font-size: calc(16px * var(--s)); font-style: italic; letter-spacing: 0.035em; opacity: 0.82; text-shadow: 0 0 calc(20px * var(--s)) rgba(243,208,152,0.16); }

        .bw-tape {
          position: absolute;
          top: calc(-9px * var(--s));
          left: 50%;
          z-index: 2;
          width: calc(62px * var(--s));
          height: calc(19px * var(--s));
          transform: translateX(-50%) rotate(-3deg);
          clip-path: polygon(2% 0, 98% 3%, 100% 88%, 96% 100%, 3% 96%, 0 12%);
          background:
            repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 4px),
            rgba(221,210,180,0.5);
          border-left: 1px solid rgba(255,255,255,0.18);
          border-right: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 calc(3px * var(--s)) calc(6px * var(--s)) rgba(0,0,0,0.35);
        }
      `}</style>

      <div ref={stageRef} className="bw-stage">
        <div
          ref={boardRef}
          className="bw-board"
          style={{ '--s': laid.scale }}
        >
          {laid.items.map((item) => (
            <div
              key={item.id}
              data-item-id={item.id}
              data-rotation={item.rotation}
              data-flight-tilt={item.flightTilt}
              data-flight-x={item.flightX}
              className={`bw-item bw-${item.type}`}
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                transform: `rotate(${item.rotation}deg)`,
                '--s': item.itemScale,
                '--tone': ['#e8c96f', '#83c8bb', '#d69797', '#b8cc78', '#d4a96d'][item.tone ?? 0],
              }}
            >
              <ItemContent item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
