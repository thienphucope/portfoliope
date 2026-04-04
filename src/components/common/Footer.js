"use client";
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';
import { useState } from 'react';

export default function Footer() {
  const [hoverKeys, setHoverKeys] = useState({});

  const handleMouseEnter = (id) => {
    setHoverKeys(prev => ({
      ...prev,
      [id]: Math.random()
    }));
  };

  return (
    <footer className="absolute bottom-0 left-0 right-0 px-6 md:px-10 py-6 md:py-10 flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-4 lg:gap-0 z-[60] bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-1000 opacity-100">
      <style jsx>{`
        @keyframes floatUp { 
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.5); }
          80% { opacity: 1; transform: translate(-50%, -80px) scale(2); }
          100% { opacity: 0; transform: translate(-50%, -80px) scale(2); }
        }
        .social-icon { position: relative; display: inline-block; cursor: pointer; }
        .social-label { position: absolute; top: 50%; left: 50%; white-space: nowrap; color: var(--colorone); font-size: 0.5rem; font-weight: bold; pointer-events: none; opacity: 0; }
        .social-label.animating { animation: floatUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
      <div className="order-1 lg:order-1 text-[var(--colorone)] font-bold text-xs md:text-xl opacity-60" style={{ fontFamily: 'var(--font-display)' }}>Scroll down for more info!</div>
      <div className="order-2 lg:order-2 flex gap-6 z-20">
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('youtube')}>
          <a href="https://www.youtube.com/watch?v=zqcrDCynF8k" target="_blank" rel="noopener noreferrer"><FaYoutube className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['youtube']} className={`social-label ${hoverKeys['youtube'] ? 'animating' : ''}`}>Theres</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('instagram')}>
          <a href="https://www.instagram.com/t22felton/" target="_blank" rel="noopener noreferrer"><FaInstagram className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['instagram']} className={`social-label ${hoverKeys['instagram'] ? 'animating' : ''}`}>nothing</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('github')}>
          <a href="https://github.com/thienphucope" target="_blank" rel="noopener noreferrer"><FaGithub className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['github']} className={`social-label ${hoverKeys['github'] ? 'animating' : ''}`}>about</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('email')}>
          <a href="mailto:thienphucmain@gmail.com"><FaEnvelope className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['email']} className={`social-label ${hoverKeys['email'] ? 'animating' : ''}`}>me</span>
        </div>
        <div className="social-icon" onMouseEnter={() => handleMouseEnter('twitter')}>
          <a href="https://x.com/a" target="_blank" rel="noopener noreferrer"><FaTwitter className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          <span key={hoverKeys['twitter']} className={`social-label ${hoverKeys['twitter'] ? 'animating' : ''}`}>here!</span>
        </div>
      </div>
    </footer>
  );
}
