"use client";

import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import MusicHeader from '@/components/sections/MusicHeader';

export default function Gallery({ images = [], showDesktopDiscuss = false }) {
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    if (!activePhoto) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActivePhoto(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  return (
    <section className="gallery-section relative w-full min-h-[100dvh] overflow-hidden">
      <style jsx global>{`
        .gallery-section {
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .gallery-noir {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          margin: 0;
          --font-mono: 'Special Elite', 'Courier New', monospace;
          color: #d7e7e3;
          background:
            radial-gradient(120% 60% at 50% 0%, rgba(174,226,218,0.10), transparent 40%),
            radial-gradient(140% 90% at 50% 120%, rgba(61,107,106,0.16), transparent 60%),
            rgba(10, 20, 22, 0.42);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          padding: var(--feature-space);
          border: 1px solid rgba(174, 226, 218, 0.16);
          box-shadow:
            inset 0 0 0 5px rgba(10, 20, 22, 0.4),
            inset 0 0 0 6px rgba(174, 226, 218, 0.14);
          overflow: hidden;
        }

        .gallery-noir::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: screen;
          opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .gallery-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          margin: 0 auto;
        }

        .gallery-masthead {
          padding-bottom: clamp(22px, 4vw, 38px);
        }

        .gallery-masthead .gallery-discuss-links {
          display: none;
        }

        .gallery-title {
          margin: 0;
          font-family: var(--font-body);
          font-weight: 900;
          font-size: clamp(3.2rem, 10vw, 7.4rem);
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: var(--theme);
        }

        .gallery-wall {
          column-count: 1;
          column-gap: clamp(14px, 2.4vw, 26px);
        }

        .gallery-card {
          display: inline-block;
          width: 100%;
          break-inside: avoid;
          margin: 0 0 clamp(14px, 2.4vw, 26px);
          transition: transform 0.24s ease;
        }

        .gallery-card:hover {
          transform: translateY(-3px);
        }

        .gallery-image-button {
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: inherit;
          cursor: zoom-in;
          text-align: left;
        }

        .gallery-card img {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 4px;
          background: rgba(12, 28, 31, 0.9);
          box-shadow: 0 16px 34px -26px rgba(0, 0, 0, 0.7);
          transition: box-shadow 0.24s ease;
        }

        .gallery-card:hover img {
          box-shadow: 0 22px 44px -28px rgba(15, 15, 15, 0.68);
        }

        .gallery-image-button:focus-visible {
          outline: 2px solid var(--teal-glow);
          outline-offset: 4px;
        }

        .gallery-card figcaption {
          margin-top: 10px;
          font-family: var(--font-mono);
          font-size: clamp(0.72rem, 1.3vw, 0.86rem);
          font-style: italic;
          line-height: 1.25;
          color: rgba(215, 231, 227, 0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gallery-mark {
          position: absolute;
          right: clamp(18px, 4vw, 54px);
          bottom: clamp(18px, 4vw, 42px);
          z-index: 1;
          font-family: var(--font-mono);
          font-size: clamp(5rem, 20vw, 16rem);
          line-height: 0.8;
          color: var(--teal-glow);
          opacity: 0.04;
          pointer-events: none;
          transform: rotate(-8deg);
        }

        .gallery-lightbox {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(18px, 4vw, 44px);
          background: rgba(14, 10, 7, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .gallery-lightbox-figure {
          width: min(1120px, 100%);
          max-height: 100%;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .gallery-lightbox-img {
          display: block;
          max-width: 100%;
          max-height: calc(100dvh - 128px);
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 4px;
          background: rgba(12, 28, 31, 0.9);
          box-shadow: 0 26px 90px rgba(0, 0, 0, 0.55);
        }

        .gallery-lightbox-caption {
          max-width: min(760px, 100%);
          font-family: var(--font-mono);
          font-style: italic;
          font-size: clamp(0.82rem, 1.4vw, 0.96rem);
          line-height: 1.35;
          color: oklch(0.938 0.03 84);
          text-align: center;
          overflow-wrap: anywhere;
        }

        .gallery-lightbox-close {
          position: fixed;
          top: clamp(14px, 3vw, 28px);
          right: clamp(14px, 3vw, 28px);
          z-index: 10001;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(174, 226, 218, 0.3);
          background: rgba(11, 24, 26, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: var(--teal-glow);
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .gallery-lightbox-close:hover {
          background: var(--theme);
          transform: translateY(-1px);
        }

        .gallery-lightbox-close:focus-visible {
          outline: 2px solid var(--theme);
          outline-offset: 4px;
        }

        @media (max-width: 767px) {
          .gallery-title {
            text-align: center;
          }
        }

        @media (min-width: 560px) {
          .gallery-wall {
            column-count: 2;
          }
        }

        @media (min-width: 900px) {
          .gallery-wall {
            column-count: 3;
          }
        }

        @media (min-width: 1024px) {
          .gallery-masthead {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: clamp(24px, 5vw, 72px);
          }

          .gallery-masthead .gallery-discuss-links {
            display: flex;
            flex: 0 0 auto;
            justify-content: flex-start;
            gap: 16px;
            padding-bottom: 0;
          }

          .gallery-masthead .gallery-discuss-links .about-nav {
            gap: 18px;
          }

          .gallery-masthead .gallery-discuss-links .about-social-prompt {
            color: rgba(174, 226, 218, 0.6);
          }

          .gallery-masthead .gallery-discuss-links .title-fly-out {
            max-width: 22vw;
          }
        }

        @media (min-width: 1240px) {
          .gallery-wall {
            column-count: 4;
          }
        }
      `}</style>

      <div className="gallery-noir">
        <span className="gallery-mark" aria-hidden="true">+</span>
        <div className="gallery-shell">
          <header className="gallery-masthead">
            <h1 className="gallery-title">Gallery</h1>
            {showDesktopDiscuss && (
              <MusicHeader
                className="gallery-discuss-links"
                promptLabel="discuss?"
                ariaLabel="Discuss links"
                showMusicControl={false}
              />
            )}
          </header>

          <div className="gallery-wall" aria-label="Gallery">
            {images.map((photo) => (
              <figure
                className="gallery-card"
                key={photo.src}
              >
                <button
                  type="button"
                  className="gallery-image-button"
                  aria-label={`View ${photo.title} fullscreen`}
                  onClick={() => setActivePhoto(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt={photo.title} loading="lazy" decoding="async" />
                </button>
                <figcaption>{photo.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {activePhoto && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          onClick={() => setActivePhoto(null)}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            aria-label="Close fullscreen image"
            onClick={() => setActivePhoto(null)}
          >
            <FaTimes aria-hidden="true" />
          </button>
          <figure className="gallery-lightbox-figure" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="gallery-lightbox-img"
              src={activePhoto.src}
              alt={activePhoto.title}
              decoding="async"
            />
            <figcaption className="gallery-lightbox-caption">{activePhoto.title}</figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
