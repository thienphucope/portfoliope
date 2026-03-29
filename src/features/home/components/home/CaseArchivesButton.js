"use client";
import { useEffect, useRef } from 'react';
import Link from 'next/link';

const GLITCH_FONTS = [
  "'Courier New', monospace",
  "fantasy",
  "cursive",
  "'Impact', sans-serif",
  "'Georgia', serif",
  "'Palatino', serif",
  "monospace",
  "'Times New Roman', serif",
];

export default function CaseArchivesButton() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef("idle");
  const phaseTimeRef = useRef(0);
  const fontIndexRef = useRef(0);
  const glitchSeedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = 30;
    const TEXT = "Case Archives";

    const getColor = () =>
      (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue("--colorone").trim()) || "#e879a0";

    ctx.font = `bold ${SIZE}px 'Fredericka the Great', serif`;
    canvas.width = Math.ceil(ctx.measureText(TEXT).width) + 20;
    canvas.height = SIZE + 16;

    const draw = (font, glitch = false) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${SIZE}px ${font}`;
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(TEXT).width;
      const x = (canvas.width - tw) / 2;
      const y = canvas.height / 2;
      const color = getColor();

      if (glitch) {
        const slices = 4;
        for (let i = 0; i < slices; i++) {
          const ox = (Math.random() - 0.5) * 16;
          const oy = (Math.random() - 0.5) * 5;
          const sh = canvas.height / slices;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, i * sh, canvas.width, sh);
          ctx.clip();
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#ff003c";
          ctx.fillText(TEXT, x + ox + 3, y + oy);
          ctx.fillStyle = "#00fff9";
          ctx.fillText(TEXT, x + ox - 3, y + oy);
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.fillText(TEXT, x + ox, y + oy);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = color;
        ctx.fillText(TEXT, x, y);
      }
    };

    draw("'Fredericka the Great', serif");
    phaseRef.current = "glitch";

    let last = 0;
    const loop = (ts) => {
      const dt = ts - last; last = ts;
      const phase = phaseRef.current;

      if (phase === "idle") {
        draw("'Fredericka the Great', serif");
        phaseTimeRef.current += dt;
        if (phaseTimeRef.current > 2000) {
          phaseRef.current = "glitch";
          phaseTimeRef.current = 0;
        }
      } else if (phase === "glitch" || phase === "glitch2") {
        phaseTimeRef.current += dt;
        if (Math.floor(ts / 40) !== glitchSeedRef.current) {
          glitchSeedRef.current = Math.floor(ts / 40);
          draw("'Fredericka the Great', serif", true);
        }
        if (phaseTimeRef.current > 350) {
          phaseRef.current = phase === "glitch" ? "fontcycle" : "idle";
          phaseTimeRef.current = 0;
          fontIndexRef.current = 0;
        }
      } else if (phase === "fontcycle") {
        phaseTimeRef.current += dt;
        draw(GLITCH_FONTS[fontIndexRef.current % GLITCH_FONTS.length]);
        if (phaseTimeRef.current > 160) {
          phaseTimeRef.current = 0;
          fontIndexRef.current++;
          if (fontIndexRef.current >= GLITCH_FONTS.length) {
            phaseRef.current = "glitch2";
            phaseTimeRef.current = 0;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <Link href="/case">
      <canvas
        ref={canvasRef}
        className="w-[120px] md:w-auto h-auto cursor-pointer"
        style={{ display: "inline-block", verticalAlign: "middle" }}
      />
    </Link>
  );
}
