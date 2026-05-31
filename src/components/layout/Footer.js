"use client";
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';
import { useState } from 'react';
import { SOCIAL_LINKS } from '@/configs/social';

export default function Footer() {
  const [hoverKeys, setHoverKeys] = useState({});

  const handleMouseEnter = (id) => {
    setHoverKeys(prev => ({
      ...prev,
      [id]: Math.random()
    }));
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 px-2 md:px-4 py-2 md:py-4 flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-2 lg:gap-0 z-[101] bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-1000 opacity-100">
      <style jsx>{`
        @keyframes floatUp { 
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.5); }
          80% { opacity: 1; transform: translate(-50%, -60px) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -60px) scale(1.5); }
        }
        .social-icon { position: relative; display: inline-block; cursor: pointer; }
        .social-label { position: absolute; top: 50%; left: 50%; white-space: nowrap; color: var(--theme); font-size: 0.4rem; font-weight: bold; pointer-events: none; opacity: 0; }
        .social-label.animating { animation: floatUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
      <div className="order-1 lg:order-1 opacity-60 hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="text-[var(--theme)] font-bold text-xs md:text-base">&copy; Ope Watson 2026</span>
      </div>
      <div className="order-2 lg:order-2 flex gap-4 z-20">
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('youtube')}>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer"><FaYoutube className="text-[var(--theme)] text-2xl md:text-3xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['youtube']} className={`social-label ${hoverKeys['youtube'] ? 'animating' : ''}`}>theres</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('instagram')}>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer"><FaInstagram className="text-[var(--theme)] text-2xl md:text-3xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['instagram']} className={`social-label ${hoverKeys['instagram'] ? 'animating' : ''}`}>nothing</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('github')}>
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer"><FaGithub className="text-[var(--theme)] text-2xl md:text-3xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['github']} className={`social-label ${hoverKeys['github'] ? 'animating' : ''}`}>about</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('email')}>
          <a href={SOCIAL_LINKS.email} target="_blank" rel="noopener noreferrer"><FaEnvelope className="text-[var(--theme)] text-2xl md:text-3xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['email']} className={`social-label ${hoverKeys['email'] ? 'animating' : ''}`}>me</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('twitter')}>
          <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer"><FaTwitter className="text-[var(--theme)] text-2xl md:text-3xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['twitter']} className={`social-label ${hoverKeys['twitter'] ? 'animating' : ''}`}>here!</span>
        </div>
      </div>
    </footer>
  );
}
