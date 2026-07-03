"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

export default function Gallery({ images = [] }) {
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
          color: #241d16;
          background: oklch(0.938 0.03 84);
          padding: clamp(22px, 4vw, 42px);
          border: 1px solid oklch(0.5 0.045 64);
          box-shadow:
            inset 0 0 0 5px oklch(0.938 0.03 84),
            inset 0 0 0 6px oklch(0.5 0.045 64);
          overflow: hidden;
        }

        .gallery-noir::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: multiply;
          opacity: 0.09;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .gallery-shell {
          position: relative;
          z-index: 2;
          width: min(1320px, 100%);
          margin: 0 auto;
        }

        .gallery-masthead {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: clamp(12px, 2.5vw, 20px);
          padding-bottom: clamp(22px, 4vw, 38px);
        }

        .gallery-kicker {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 18px;
          font-family: var(--font-mono);
          font-style: italic;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: lowercase;
          color: oklch(0.55 0.02 64);
        }

        .gallery-kicker a {
          color: #7a1f3d;
          text-decoration: none;
          transition: color 0.22s ease;
        }

        .gallery-kicker a:hover {
          color: #4f1027;
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
          background: #ece9df;
          box-shadow: 0 16px 34px -26px rgba(15, 15, 15, 0.58);
          transition: box-shadow 0.24s ease;
        }

        .gallery-card:hover img {
          box-shadow: 0 22px 44px -28px rgba(15, 15, 15, 0.68);
        }

        .gallery-image-button:focus-visible {
          outline: 2px solid #7a1f3d;
          outline-offset: 4px;
        }

        .gallery-card figcaption {
          margin-top: 10px;
          font-family: var(--font-mono);
          font-size: clamp(0.72rem, 1.3vw, 0.86rem);
          font-style: italic;
          line-height: 1.25;
          color: #343434;
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
          color: #111;
          opacity: 0.035;
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
          background: oklch(0.938 0.03 84);
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
          border: 1px solid oklch(0.7 0.045 70);
          background: oklch(0.938 0.03 84);
          color: #241d16;
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

        @media (min-width: 560px) {
          .gallery-wall {
            column-count: 2;
          }
        }

        @media (min-width: 900px) {
          .gallery-masthead {
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: end;
          }

          .gallery-kicker {
            justify-content: flex-end;
            text-align: right;
          }

          .gallery-wall {
            column-count: 3;
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
            <nav className="gallery-kicker" aria-label="Gallery navigation">
              <Link href="/">back to ope watson</Link>
            </nav>
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
