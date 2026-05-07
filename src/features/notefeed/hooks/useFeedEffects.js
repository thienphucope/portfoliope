import { useState, useEffect, useRef } from 'react';

export function useFeedEffects({ isMounted, displayedCases, libsReady, scrollRef, cursorDotRef, cursorRingRef, fogCanvasRef }) {
  const [activeSection, setActiveSection] = useState('hero');
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (displayedCases.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const savedPos = sessionStorage.getItem('notefeed_scroll_pos');
      if (savedPos && scrollRef.current) {
        requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = parseInt(savedPos, 10); });
      }
    }
  }, [displayedCases]);

  useEffect(() => {
    if (!isMounted) return;

    const dot  = cursorDotRef.current;
    const ring = cursorRingRef.current;
    let mX = 0, mY = 0, rX = 0, rY = 0;

    const onMouseMove = (e) => {
      mX = e.clientX; mY = e.clientY;
      if (dot) { dot.style.left = `${mX}px`; dot.style.top = `${mY}px`; }
    };
    const animateRing = () => {
      rX += (mX - rX) * 0.15; rY += (mY - rY) * 0.15;
      if (ring) { ring.style.left = `${rX}px`; ring.style.top = `${rY}px`; }
      requestAnimationFrame(animateRing);
    };
    window.addEventListener('mousemove', onMouseMove);
    const ringId = requestAnimationFrame(animateRing);

    const handleMouseEnter = () => ring?.classList.add('inspecting');
    const handleMouseLeave = () => ring?.classList.remove('inspecting');
    const interactiveElements = document.querySelectorAll('a, button, .case-info, .board-note');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    const canvas = fogCanvasRef.current;
    let fogId, resizeHandler;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      resizeHandler = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      resizeHandler();
      window.addEventListener('resize', resizeHandler);

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
          this.size = Math.random() * 200 + 100; this.speedX = (Math.random() - 0.5) * 0.2;
          this.opacity = Math.random() * 0.02 + 0.01; this.life = Math.random() * 500 + 200; this.maxLife = this.life;
        }
        update() { this.x += this.speedX; this.life--; if (this.life <= 0) this.reset(); }
        draw() {
          const alpha = this.opacity * (this.life / this.maxLife);
          const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
          g.addColorStop(0, `rgba(180, 180, 190, ${alpha})`); g.addColorStop(1, 'rgba(180, 180, 190, 0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
      }
      const particles = Array.from({ length: 15 }, () => new Particle());
      const animFog = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => { p.update(); p.draw(); });
        fogId = requestAnimationFrame(animFog);
      };
      animFog();
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.02 }
    );
    document.querySelectorAll('.reveal').forEach((r) => observer.observe(r));

    const handleScroll = () => {
      if (!scrollRef.current) return;
      const currentScroll = scrollRef.current.scrollTop;
      sessionStorage.setItem('notefeed_scroll_pos', currentScroll.toString());
      const scrollPos = currentScroll + 100;
      for (const id of ['hero', 'cases', 'contact']) {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) { setActiveSection(id); break; }
      }
    };
    const scrollContainer = scrollRef.current;
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(ringId);
      if (fogId) cancelAnimationFrame(fogId);
      observer.disconnect();
      scrollContainer?.removeEventListener('scroll', handleScroll);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [isMounted, displayedCases, libsReady]);

  return { activeSection };
}
