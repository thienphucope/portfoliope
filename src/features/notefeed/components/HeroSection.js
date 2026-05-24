'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaGithub, FaEnvelope, FaDiscord } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/configs/social';

export default function HeroSection() {
  const containerRef = useRef(null);
  const opeRef = useRef(null);
  const watsonRef = useRef(null);

  useEffect(() => {
    const fit = () => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.offsetWidth;

      [opeRef, watsonRef].forEach((ref) => {
        const el = ref.current;
        if (!el) return;
        el.style.fontSize = '10px';
        const ratio = w / el.scrollWidth;
        // 95% margin guarantees no edge clipping or overflow
        el.style.fontSize = Math.floor(10 * ratio * 0.95) + 'px';
      });
    };

    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    
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
      <h1 className="nf-title">
        <span className="nf-title-row" ref={opeRef}>
          Ope
          <Link href="/noirboard" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nf-title-img" src="/ope.png" alt="Inspect Board" />
          </Link>
        </span>
        <span className="nf-italic" ref={watsonRef}>Watson</span>
      </h1>
      <div className="nf-social-divider" />
      <div className="nf-socials">
        <a href={SOCIAL_LINKS.github}  target="_blank" rel="noopener noreferrer"><FaGithub /></a>
        <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer"><FaDiscord /></a>
        <a href={SOCIAL_LINKS.email}   target="_blank" rel="noopener noreferrer"><FaEnvelope /></a>
      </div>
      <div className="nf-hero-divider" />
    </div>
  );
}
