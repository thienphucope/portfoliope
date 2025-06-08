"use client";

import { useEffect, useRef } from "react";
import { FaArrowDown } from 'react-icons/fa';

export default function Page2() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const magnifierRef = useRef(null);
  const interactionTimeoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const content = contentRef.current;
    const magnifier = magnifierRef.current;
    if (!canvas || !content) return;

    const ctx = canvas.getContext("2d");
    let revealInProgress = false;
    let centerX = 0;
    let centerY = 0;
    let points = [];
    let startTime;
    let stopRadius;

    // Resize canvas to match content size
    const resizeCanvas = () => {
      canvas.width = content.clientWidth;
      canvas.height = content.clientHeight;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background') || "#c1729a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation function for rectangular burn effect
    const animateReveal = () => {
      if (!revealInProgress) return;

      const time = (performance.now() - startTime) / 1000;

      const vertices = points.map(p => {
        const base_radius = p.speed * time;
        const radius = base_radius + p.amplitude * Math.sin(2 * Math.PI * p.frequency * time + p.phase);
        const x = centerX + radius * Math.cos(p.angle) * p.xScale;
        const y = centerY + radius * Math.sin(p.angle) * p.yScale;
        return { x, y };
      });

      const allPointsBeyondStop = points.every(p => p.speed * time >= stopRadius);

      if (!allPointsBeyondStop) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 20; i++) {
          const p = vertices[Math.floor(Math.random() * points.length)];
          const sparkleSize = Math.random() * 5 + 2;
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetY = (Math.random() - 0.5) * 10;
          ctx.beginPath();
          ctx.arc(p.x + offsetX, p.y + offsetY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
        requestAnimationFrame(animateReveal);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none"; // Remove canvas from display
        revealInProgress = false;
      }
    };

    // Initialize burn effect on click
    const startReveal = (x, y) => {
      if (revealInProgress) return;
      revealInProgress = true;
      centerX = x;
      centerY = y;

      const N = 100;
      points = [];
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const aspectRatio = canvasWidth / canvasHeight;

      // Calculate distances to edges
      const maxX = Math.max(centerX, canvasWidth - centerX);
      const maxY = Math.max(centerY, canvasHeight - centerY);
      const maxDist = Math.max(maxX, maxY * aspectRatio);

      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const amplitude = 20 + Math.random() * 20;
        const frequency = 2 + Math.random() * 1;
        const phase = Math.random() * Math.PI * 2;

        const xDist = Math.abs(Math.cos(angle)) * maxX;
        const yDist = Math.abs(Math.sin(angle)) * maxY;
        const distToEdge = Math.sqrt(xDist * xDist + (yDist * aspectRatio) * (yDist * aspectRatio));

        const baseSpeed = 600 + Math.random() * 10;
        const speed = baseSpeed * (distToEdge / maxDist);

        const xScale = aspectRatio;
        const yScale = 1;

        points.push({ angle, amplitude, frequency, phase, speed, xScale, yScale });
      }

      const maxSpeed = Math.max(...points.map(p => p.speed));
      const distances = [
        Math.hypot(centerX, centerY),
        Math.hypot(centerX, canvasHeight - centerY),
        Math.hypot(canvasWidth - centerX, centerY),
        Math.hypot(canvasWidth - centerX, canvasHeight - centerY)
      ];
      const maxRadius = Math.max(...distances);
      const maxAmplitude = Math.max(...points.map(p => p.amplitude));
      stopRadius = maxRadius + maxAmplitude + 10;

      if (magnifier) {
        magnifier.style.transition = "opacity 0.5s ease-in-out";
        magnifier.style.opacity = "0";
        setTimeout(() => {
          magnifier.style.display = "none";
        }, 500);
      }

      startTime = performance.now();
      requestAnimationFrame(animateReveal);
    };

    const autoStartReveal = () => {
      if (revealInProgress) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      startReveal(x, y);
    };

    const resetInteractionTimeout = () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      interactionTimeoutRef.current = setTimeout(autoStartReveal, 30000);
    };

    resetInteractionTimeout();

    const handleMagnifierClick = (e) => {
      resetInteractionTimeout();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startReveal(x, y);
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      resetInteractionTimeout();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      startReveal(x, y);
    };

    if (magnifier) {
      magnifier.addEventListener("click", handleMagnifierClick);
    }
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (magnifier) {
        magnifier.removeEventListener("click", handleMagnifierClick);
      }
      canvas.removeEventListener("touchstart", handleTouchStart);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to next section (scroll down)
  const scrollToDown = () => {
    const container = document.querySelector('.snap-y');
    if (container) {
      container.scrollBy({ top: container.offsetHeight, behavior: 'smooth' });
    }
  };

  return (
    <section id="cover" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative">
      {/* Wrapper for canvas and content: Full width, fits content height */}
      <div ref={wrapperRef} className="w-full min-h-screen flex flex-col items-center justify-start">
        {/* Content section: Full width, fits content with newspaper background */}
        <div ref={contentRef} className="relative z-10 w-full bg-[url('/newspaper.jpg')] bg-no-repeat bg-center bg-cover flex flex-col justify-start items-center pt-8 pb-8 px-6 md:px-6 text-gray-800 shadow-inner">
          {/* Canvas for burn effect: Matches content size */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-20"
            style={{ touchAction: "none" }}
          />

          {/* Magnifier image: Centered on content */}
          <img
            ref={magnifierRef}
            src="/yellowtorch.png"
            alt="Magnifier"
            className="absolute z-30 w-64 h-64 md:w-72 md:h-72 object-contain cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-300 top-1/10 md:top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          />

          {/* Content */}
          <h1 className="text-4xl md:text-[5vw] lg:text-6xl font-extrabold leading-tight tracking-tight text-center font-chomsky relative z-10 mb-6">
            THE OBSESSIVE PULSE
          </h1>

          <div className="w-full max-w-7xl flex items-center justify-center gap-4 mb-6 relative z-10">
            <div className="flex-[15] border-t-6 border-gray-800"></div>
            <span className="text-sm md:text-lg font-medium">June 5, 2025</span>
            <div className="flex-[1] border-t-6 border-gray-800"></div>
          </div>

          <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 md:gap-15 relative z-10">
            <div className="w-full md:w-1/2 flex flex-col min-h-fit">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center tracking-tight font-chomsky">
                The Case Of The Overheated GPU
              </h2>
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center tracking-tight font-chomsky">
                The darkest code made the brightest night
              </h3>
              <div className="flex flex-col md:flex-row gap-6 min-h-fit">
                <div className="w-full md:w-1/2 text-sm md:text-base leading-normal text-justify">
                  <div className="mb-4">
                    Ope Watson, a sharp detective, codes solutions to mysteries. He
                    scans clues, loops through evidence, and debugs crimes with
                    clear logic. His mind runs like simple, clean code, catching
                    errors in human actions. In the citys chaos, Ope turns raw data
                    into justice with fast, smart deductions.
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-center leading-snug mt-4 tracking-tight font-chomsky">
                    Omnithirsty
                    <br />
                    Persistent
                    <br />
                    Explorative
                    <br />
                    Watson
                  </h3>
                </div>
                <div className="w-full md:w-1/2 flex flex-col min-h-fit">
                  <div className="w-full h-auto mt-2 mb-3">
                    <img
                      src="/blackcat.jpg"
                      alt="Placeholder"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                  <div className="text-sm md:text-base leading-normal text-justify mb-4">
                    He once hunted overfitting, a sneaky culprit in his AI training
                    case. Ope sifted through messy data, slashed rogue parameters,
                    and inspected wild predictions. With a quick loop and sharp logic,
                    he tamed the model, delivering a clean, crime-solving AI.
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col min-h-fit">
              <div className="flex flex-col md:flex-row gap-6 min-h-fit">
                <div className="w-full md:w-1/2 text-sm md:text-base leading-normal text-justify">
                  <div className="mb-2">
                    Ope Watson likes diving into PyTorch, chasing the thrill of
                    training a beastly neural net. He thought itd be a quick debug
                    session, but oh boy, was he wrong—his GPU had other plans, ready
                    to stage the ultimate meltdown.
                  </div>
                  <div className="w-full h-auto">
                    <img
                      src="/torch.png"
                      alt="Placeholder"
                      className="w-[75%] mx-auto mt-2 mb-3 object-cover"
                    />
                  </div>
                  <div className="pb-0">
                    It started innocently enough: Ope, coffee in hand, fired up
                    PyTorch to train a vision model on a dataset bigger than his
                    ego. He tossed in some layers, cranked the batch size, and let the tensors fly.
                  </div>
                </div>
                <div className="w-full md:w-1/2 text-sm md:text-base leading-normal text-justify mb-4">
                  The code hummed like a detective cracking
                  a case, but the GPU fans screamed like a noir villain cornered in
                  an alley. Halfway through epoch 27, PyTorchs autograd started
                  juggling gradients like a circus act gone wild. Ope, oblivious,
                  tweaked parameters. Just one more epoch! The room grew toasty,
                  his laptop glowing like a rogue AI in a sci-fi flick. Then BAM, a
                  flicker of the screen, and his GPU gave up the code, burning
                  brighter than a supernova. Ope stared, and laughed. Well, thats
                  the hottest show in town tonight! His PyTorch adventure ended
                  with a fried chip and a lesson: never underestimate a GPUs flair
                  for dramatic exits.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More clues button: Bottom-center, scrolls down to next section */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 z-30">
        <div onClick={scrollToDown} className="flex items-center gap-2 text-[var(--background)] text-lg md:text-2xl font-medium hover:text-white transition-colors cursor-pointer">
          <span>more clues</span><FaArrowDown/>
        </div>
      </div>
    </section>
  );
}