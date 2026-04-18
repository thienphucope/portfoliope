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
        background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/map.jpg') top center / cover no-repeat local;
      }

      .note-gallery-container::after {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 100;
        pointer-events: none;
        background: radial-gradient(
          ellipse 70% 60% at 50% 40%,
          transparent 35%,
          rgba(0, 0, 0, 0.45) 65%,
          rgba(0, 0, 0, 0.75) 100%
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
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-flow: dense;
        gap: 30px;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        padding-bottom: 100px;
        align-items: start;
      }

      .gallery-item-two-col {
        grid-column: span 2;
      }

      @media (max-width: 1600px) {
        .note-gallery {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 1100px) {
        .note-gallery {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 1023px) {
        .note-gallery {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .gallery-item-two-col {
          grid-column: span 1;
        }
        .note-gallery-container {
          padding: 60px 16px;
        }
      }

      .gallery-item * {
        text-transform: uppercase;
      }

      .gallery-item {
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
        overflow: visible;
        text-align: center;
        margin: 0 0 12px 0;
        padding: 6px 0;
        border: none;
        position: relative;
        transition: background 0.3s;
      }

      .gallery-title-wrap::before {
        content: '';
        position: absolute;
        inset: calc(-1 * var(--border-px, 5px));
        border: var(--border-px, 5px) solid transparent;
        filter: url(#rough-border);
        pointer-events: none;
        transition: border-color 0.3s;
      }



      .gallery-item-title {
        font-family: 'Fredericka the Great', cursive !important;
        font-weight: 400 !important;
        font-size: 1.8rem;
        color: #000 !important;
        line-height: 1.2 !important;
        letter-spacing: 0.01em !important;
        white-space: nowrap !important;
        display: inline-block !important;
        text-transform: uppercase !important;
        transition: color 0.3s;
      }

      /* Reset cả border lẫn underline khi hover, để variant tự override */
      .gallery-item:hover .gallery-title-wrap::before {
        border-color: transparent;
      }

      .gallery-item:hover .gallery-title-wrap .gallery-item-title {
        text-decoration: none;
      }

      /* Hover: invert — colorone bg + đen text (tương phản với nền đen item) */
      .gallery-item:hover .gallery-hover-invert {
        background: var(--colorone, #ba9170);
      }

      .gallery-item:hover .gallery-hover-invert .gallery-item-title {
        color: #000 !important;
        text-decoration-color: #000;
      }

      .gallery-item:hover .gallery-hover-invert::before {
        border-color: transparent;
      }

      /* Hover: border — colorone border + colorone text trên nền đen */
      .gallery-item:hover .gallery-hover-border::before {
        border-color: var(--colorone, #ba9170);
      }

      .gallery-item:hover .gallery-hover-border .gallery-item-title {
        color: var(--colorone, #ba9170) !important;
        text-decoration-color: var(--colorone, #ba9170);
      }

      .gallery-polaroid {
        margin: 10px auto;
        background: #fff;
        padding: 10px 10px 10px 10px;
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
        margin: 0;
      }

      /* Markdown Previews */
      .gallery-intro-rendered :global(p) {
        margin: 0.5em 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: left;
        color: rgba(0, 0, 0, 0.8);
        font-size: 1.2rem;
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

      .gallery-item ul,
      .gallery-item ol {
        color: rgba(0, 0, 0, 0.8);
        font-family: 'Fredericka the Great', cursive;
        font-size: 1.2rem;
        padding-left: 1.2em;
        margin: 0.4em 0;
      }

      .gallery-item li {
        color: rgba(0, 0, 0, 0.8);
      }

      .gallery-item:hover ul,
      .gallery-item:hover ol,
      .gallery-item:hover li {
        color: rgba(255, 255, 255, 0.85);
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

      .gallery-item-row {
        display: flex;
        gap: 12px;
        width: 100%;
        align-items: stretch;
      }

      .gallery-item-col {
        flex: 1;
      }

      .gallery-item-col-left {
        flex: 1.2;
        display: flex;
      }

      .gallery-item-col-left .gallery-video-thumbnail {
        width: 100%;
        flex: 1;
        min-height: 0;
        object-fit: cover;
        border-radius: 4px;
      }

      .gallery-item-col-right {
        flex: 0.8;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      .gallery-item-col-right::before {
        content: '';
        height: var(--top-lines, 0px);
        flex-shrink: 0;
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 6px,
          rgba(0, 0, 0, 0.85) 6px,
          rgba(0, 0, 0, 0.85) 26px,
          transparent 26px,
          transparent 32px
        );
      }

      .gallery-item:hover .gallery-item-col-right::before {
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 6px,
          rgba(255, 255, 255, 0.85) 6px,
          rgba(255, 255, 255, 0.85) 26px,
          transparent 26px,
          transparent 32px
        );
      }

      .gallery-item-col-right::after {
        content: '';
        flex: 1;
        min-height: 20px;
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 6px,
          rgba(0, 0, 0, 0.85) 6px,
          rgba(0, 0, 0, 0.85) 26px,
          transparent 26px,
          transparent 32px
        );
      }

      .gallery-item:hover .gallery-item-col-right::after {
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 6px,
          rgba(255, 255, 255, 0.85) 6px,
          rgba(255, 255, 255, 0.85) 26px,
          transparent 26px,
          transparent 32px
        );
      }


      .gallery-item-image {
        width: 100%;
        margin: 0;
        display: block;
      }

      .gallery-item-image img {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 4px;
        box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.25);
        margin: 8px 0;
      }

      /* ── Pin button ── */
      .gallery-pin-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        opacity: 0;
        transition: opacity 0.2s, color 0.2s;
        color: rgba(0, 0, 0, 0.5);
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .gallery-item:hover .gallery-pin-btn {
        opacity: 1;
      }

      .gallery-pin-btn-active {
        opacity: 0.8 !important;
        color: var(--colorone, #ba9170) !important;
      }

      .gallery-item:hover .gallery-pin-btn:hover {
        color: var(--colorone, #ba9170);
      }

      /* ── Pinned item ── */
      .gallery-item-pinned {
        grid-column: 1 / -1;
      }

      .gallery-pinned-body {
        display: flex;
        gap: 24px;
        width: 100%;
        align-items: flex-start;
      }

      .gallery-pinned-col-left {
        flex: 1;
        min-width: 0;
      }

      .gallery-pinned-col-right {
        flex: 2;
        min-width: 0;
      }

      .gallery-intro-pinned :global(p) {
        -webkit-line-clamp: 6 !important;
      }

      @media (max-width: 1023px) {
        .gallery-pinned-body {
          flex-direction: column;
        }
        .gallery-pinned-col-left,
        .gallery-pinned-col-right {
          flex: unset;
          width: 100%;
        }
      }
    `}</style>
  );
}
