import React from 'react';

export default function GalleryStyles() {
  return (
    <style jsx global>{`
      .note-gallery-container {
        position: absolute;
        inset: 0;
        z-index: 5;
        overflow-y: auto;
        padding: 80px 40px;
        pointer-events: auto;
        -webkit-overflow-scrolling: touch;
      }

      .note-gallery-container::after {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 100;
        pointer-events: none;
        background: radial-gradient(
          ellipse 70% 60% at 50% 40%,
          transparent 20%,
          rgba(0, 0, 0, 0.65) 60%,
          rgba(0, 0, 0, 0.92) 100%
        );
      }

      .note-gallery-container::-webkit-scrollbar {
        width: 6px;
      }
      .note-gallery-container::-webkit-scrollbar-thumb {
        background: var(--colorone, #ba9170);
        opacity: 0.2;
        border-radius: 3px;
      }

      .gallery-main-title {
        display: block;
        font-family: 'Fredericka the Great', cursive;
        font-weight: 900;
        font-size: 6rem;
        color: var(--colorone, #ba9170);
        text-align: center;
        margin-bottom: 80px;
        letter-spacing: 1.5rem;
        opacity: 0.9;
        text-shadow: 0 0 20px rgba(186, 145, 112, 0.6), 0 0 60px rgba(186, 145, 112, 0.3), 0 0 120px rgba(186, 145, 112, 0.15);
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.2s;
        position: relative;
        z-index: 101;
      }

      .gallery-main-title:hover {
        opacity: 0.7;
      }

      @media (max-width: 1024px) {
        .gallery-main-title {
          font-size: 3.5rem;
          letter-spacing: 0.8rem;
          margin-bottom: 40px;
        }
      }

      .note-gallery {
        column-count: 4;
        column-gap: 30px;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        padding-bottom: 100px;
      }

      @media (max-width: 1600px) {
        .note-gallery {
          column-count: 3;
        }
      }

      @media (max-width: 1100px) {
        .note-gallery {
          column-count: 2;
        }
      }

      .gallery-item * {
        text-transform: uppercase;
      }

      .gallery-item {
        break-inside: avoid;
        margin-bottom: 30px;
        background: url('/paper.jpg') center/cover;
        border: none;
        padding: 12px 24px;
        border-radius: 0;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      .gallery-item:hover {
        background: url('/paper.jpg') center/cover, rgba(0, 0, 0, 0.85);
        background-blend-mode: multiply;
        position: relative;
        z-index: 101;
      }

      .gallery-item:hover .gallery-intro-rendered :global(p),
      .gallery-item:hover .gallery-quote-rendered :global(blockquote),
      .gallery-item:hover .gallery-quote-rendered :global(p),
      .gallery-item:hover.markdown-content p {
        color: rgba(255, 255, 255, 0.85);
      }

      .gallery-title-wrap {
        width: 100%;
        overflow: hidden;
        text-align: center;
        margin-bottom: 10px;
        padding: 16px;
        border-style: solid;
        border-color: var(--colorone, #ba9170);
      }

      .gallery-item-title {
        font-family: 'Fredericka the Great', cursive !important;
        font-weight: 400 !important;
        font-size: 1.8rem;
        color: var(--colorone, #ba9170) !important;
        line-height: 1.2 !important;
        letter-spacing: 0.01em !important;
        white-space: nowrap !important;
        display: inline-block !important;
        text-transform: uppercase !important;
      }


      .gallery-polaroid {
        margin: 10px auto;
        background: #fff;
        padding: 0 10px 10px 10px;
        box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.35);
        display: inline-block;
        width: 100%;
        transform: rotate(-1.5deg);
        transition: transform 0.2s;
      }

      .gallery-item:hover .gallery-polaroid {
        transform: rotate(0deg);
      }

      .gallery-polaroid-img {
        width: 100%;
        display: block;
        aspect-ratio: 16 / 9;
        object-fit: cover;
      }

      /* Markdown Previews */
      .gallery-intro-rendered :global(p) {
        margin: 0.5em 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: justify;
        color: rgba(0, 0, 0, 0.8);
        font-size: 1.05rem;
        font-family: 'Fredericka the Great', cursive;
      }

      .gallery-quote-rendered {
        display: inline-block;
        width: 100%;
        margin: 8px 0 0 0;
        transform: rotate(-1.5deg);
        transition: transform 0.2s;
      }

      .gallery-item:hover .gallery-quote-rendered {
        transform: rotate(0deg);
      }

      .gallery-quote-rendered :global(blockquote) {
        margin: 0 !important;
        padding: 10px 14px !important;
        border-left: none !important;
        border-radius: 2px !important;
        color: rgba(0, 0, 0, 0.85) !important;
        font-family: 'Fredericka the Great', cursive !important;
        font-style: italic;
        box-shadow: 2px 3px 8px rgba(0,0,0,0.25);
        text-align: left !important;
      }

      .gallery-item:nth-child(4n+1) .gallery-quote-rendered :global(blockquote) {
        background: #c9a96e;
      }
      .gallery-item:nth-child(4n+2) .gallery-quote-rendered :global(blockquote) {
        background: #7a9e82;
        transform: rotate(1deg);
      }
      .gallery-item:nth-child(4n+3) .gallery-quote-rendered :global(blockquote) {
        background: #7090b0;
        transform: rotate(-0.5deg);
      }
      .gallery-item:nth-child(4n+0) .gallery-quote-rendered :global(blockquote) {
        background: #b07080;
        transform: rotate(1.5deg);
      }
      
      .gallery-item.markdown-content p {
        margin-bottom: 0.8em;
        color: rgba(0, 0, 0, 0.8);
      }

      .gallery-item .gallery-quote-rendered :global(blockquote),
      .gallery-item .gallery-quote-rendered :global(p) {
        color: rgba(0, 0, 0, 0.7);
      }

      .gallery-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
        justify-content: center;
      }

      .gallery-link-tag {
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--colorone, #ba9170);
        background: rgba(186, 145, 112, 0.08);
        padding: 4px 12px;
        border-radius: 4px;
        border: 2px solid var(--colorone, #ba9170);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
    `}</style>
  );
}
