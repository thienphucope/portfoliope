"use client";

import ArchiveHeader from '@/features/caseArchive/components/ArchiveHeader';
import galleryImages from '@/data/galleryImages.json';

export default function Gallery() {
  return (
    <section className="gallery-archive">
      <style jsx global>{`
        .gallery-archive {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--archive-paper-texture), var(--archive-paper);
          color: var(--archive-ink);
          font-family: var(--archive-font-ui);
        }
        .gallery-hero {
          container-type: inline-size;
          margin: 0 var(--archive-gutter);
          padding: 34px 0 28px;
          border-bottom: 1px solid var(--archive-line);
        }
        .gallery-hero-meta {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: var(--archive-muted);
          font-family: var(--archive-font-code);
          font-size: .625rem;
          letter-spacing: .19em;
          text-transform: uppercase;
        }
        .gallery-hero h1 {
          margin: 20px 0 4px;
          font-family: var(--archive-font-heading);
          font-size: 18.1cqi;
          font-weight: 400;
          line-height: 1.07;
          letter-spacing: -.065em;
          white-space: nowrap;
        }
        .gallery-hero h1 span { color: var(--archive-accent); }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
          gap: clamp(18px, 2.4vw, 34px);
          margin: 0 var(--archive-gutter);
          padding: 32px 0 48px;
        }
        .gallery-tile {
          margin: 0;
          padding: 6px;
          border: 1px solid var(--archive-line-soft);
          background: #ffffff30;
          transition: border-color var(--archive-motion);
        }
        .gallery-tile:hover { border-color: var(--archive-muted); }
        .gallery-tile img { display: block; width: 100%; height: auto; }
        .gallery-cap {
          margin: 9px 2px 2px;
          color: var(--archive-muted);
          font-family: var(--archive-font-code);
          font-size: .625rem;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        @media (max-width: 820px) {
          .gallery-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <ArchiveHeader />
      <main className="gallery-main">
        <section className="gallery-hero">
          <div className="gallery-hero-meta"><span>Stills room</span><span>Frames &amp; references from the desk</span></div>
          <h1>Gallery<span>.</span></h1>
        </section>
        <div className="gallery-grid">
          {galleryImages.map((img) => (
            <figure className="gallery-tile" key={img.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.title} loading="lazy" />
              <figcaption className="gallery-cap">{img.title}</figcaption>
            </figure>
          ))}
        </div>
      </main>
    </section>
  );
}
