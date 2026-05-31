'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaGithub, FaEnvelope, FaDiscord } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/configs/social';

export default function HeroSection({ children }) {
  const containerRef = useRef(null);
  const titleFrameRef = useRef(null);
  const opeRef = useRef(null);
  const watsonRef = useRef(null);

  useEffect(() => {
    const fit = () => {
      const container = titleFrameRef.current || containerRef.current;
      if (!container) return;
      const w = container.offsetWidth;

      const sizes = [opeRef, watsonRef].map((ref) => {
        const el = ref.current;
        if (!el) return Infinity;
        el.style.fontSize = '10px';
        return Math.floor(10 * (w / el.scrollWidth) * 0.95);
      });

      const minSize = Math.min(...sizes);
      [opeRef, watsonRef].forEach((ref) => {
        if (ref.current) ref.current.style.fontSize = minSize + 'px';
      });
    };

    const ro = new ResizeObserver(fit);
    const target = titleFrameRef.current || containerRef.current;
    if (target) ro.observe(target);

    // Recalculate once the image loads to include its physical width
    const imgs = containerRef.current?.querySelectorAll('img') || [];
    imgs.forEach(img => img.addEventListener('load', fit));

    fit();

    return () => {
      ro.disconnect();
      imgs.forEach(img => img.removeEventListener('load', fit));
    };
  }, []);

  return (
    <div className="nf-hero-content" ref={containerRef}>
      <div className="nf-title-frame" ref={titleFrameRef}>
        <span className="nf-corner-dot nf-corner-dot-tr" />
        <span className="nf-corner-dot nf-corner-dot-bl" />
        <h1 className="nf-title">
          <span className="nf-title-row" ref={opeRef}>
            Ope
            <Link href="/noirboard" target="_blank" rel="noopener noreferrer" className="nf-title-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="nf-title-img" src="/ope.png" alt="Inspect Board" />
            </Link>
          </span>
          <span className="nf-italic" ref={watsonRef}>Watson</span>
        </h1>
      </div>
      <div className="nf-socials">
        <a href={SOCIAL_LINKS.github}  target="_blank" rel="noopener noreferrer">
          <FaGithub className="nf-social-icon" />
          <span className="nf-social-label">GitHub <span className="nf-social-desc">— where I code</span></span>
        </a>
        <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
          <FaDiscord className="nf-social-icon" />
          <span className="nf-social-label">Discord <span className="nf-social-desc">— chat with agent Arii</span></span>
        </a>
        <a href={SOCIAL_LINKS.email}   target="_blank" rel="noopener noreferrer">
          <FaEnvelope className="nf-social-icon" />
          <span className="nf-social-label">Email <span className="nf-social-desc">— email me</span></span>
        </a>
      </div>
      {children}
      <div className="nf-hero-divider" />
    </div>
  );
}
