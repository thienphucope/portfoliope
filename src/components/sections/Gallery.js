"use client";

import { useEffect, useState } from 'react';
import MusicHeader from '@/components/sections/MusicHeader';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function embedSrc(playlist, ids) {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', loop: '1' });
  if (!ids?.length) {
    // scrape returned nothing → plain playlist embed (still works, just no shuffle)
    params.set('list', playlist.playlistId);
    return `https://www.youtube-nocookie.com/embed/videoseries?${params}`;
  }
  const [first, ...rest] = ids;
  params.set('playlist', rest.length ? rest.join(',') : first);
  return `https://www.youtube-nocookie.com/embed/${first}?${params}`;
}

export default function Gallery({ playlists = [], showDesktopDiscuss = false }) {
  // Shuffle each playlist's videos after mount (SSR renders source order; avoids hydration mismatch).
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    setOrders(playlists.map((p) => shuffle(p.videoIds || [])));
  }, [playlists]);

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
          color: #f4e8c1;
          background: #000;
          padding: var(--feature-space);
          overflow: hidden;
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

        .gallery-playlists {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(20px, 3vw, 40px);
        }

        @media (max-width: 900px) {
          .gallery-playlists {
            grid-template-columns: 1fr;
          }
        }

        .gallery-playlist-section {
          width: 100%;
        }

        .gallery-playlist {
          position: relative;
          width: min(1120px, 100%);
          margin: 0 auto;
          aspect-ratio: 16 / 9;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(12, 28, 31, 0.9);
          box-shadow: 0 26px 90px rgba(0, 0, 0, 0.55);
        }

        .gallery-playlist iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .gallery-mark {
          position: absolute;
          right: clamp(18px, 4vw, 54px);
          bottom: clamp(18px, 4vw, 42px);
          z-index: 1;
          font-family: var(--font-mono);
          font-size: clamp(5rem, 20vw, 16rem);
          line-height: 0.8;
          color: var(--theme);
          opacity: 0.04;
          pointer-events: none;
          transform: rotate(-8deg);
        }

        @media (max-width: 767px) {
          .gallery-title {
            text-align: center;
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
            color: rgba(243, 208, 152, 0.6);
          }

          .gallery-masthead .gallery-discuss-links .title-fly-out {
            max-width: 22vw;
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

          <div className="gallery-playlists">
            {playlists.map((playlist, i) => (
              <section className="gallery-playlist-section" key={playlist.playlistId}>
                <div className="gallery-playlist">
                  <iframe
                    src={embedSrc(playlist, orders ? orders[i] : playlist.videoIds)}
                    title={playlist.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
