import React from 'react';

export default function StickySpineStyles() {
  return (
    <style jsx global>{`
        .sticky-spine {
          position: sticky;
          left: 0;
          z-index: 50;
          flex-basis: 84.375px;
          min-width: 84.375px;
          flex-grow: 0;
          flex-shrink: 0;
          background-color: var(--colorone);
          border-right: 2px solid var(--colorborder);
          cursor: default;
          isolation: isolate;
        }

        .spine-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .add-note-btn, .chatvault-btn, .pdfviewer-btn, .graph-btn {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          color: var(--colorbutton);
          font-weight: bold;
          font-size: 18px;
          z-index: 100;
          transition: transform 0.2s, opacity 0.2s;
        }
        .add-note-btn:hover, .chatvault-btn:hover, .pdfviewer-btn:hover, .graph-btn:hover {
          opacity: 0.7;
          transform: translateX(-50%) scale(1.1);
        }

        .chatvault-btn.active,
        .pdfviewer-btn.active,
        .graph-btn.active {
          color: #ffffff;
          opacity: 1;
        }

        .add-note-btn { top: 30px; }
        .chatvault-btn { top: 100px; }
        .pdfviewer-btn { top: 170px; }
        .graph-btn { top: 240px; }

        .acc-ope {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 2.8rem;
          color: var(--colortext-spine);
          mix-blend-mode: destination-out;
          user-select: none;
          cursor: pointer;
          margin-top: auto;
          margin-bottom: 30px;
          position: relative;
          width: 100%;
        }
        .ope-txt, .ope-txt-archive {
          writing-mode: vertical-rl;
          white-space: nowrap;
          letter-spacing: 2px;
          transition: opacity 0.3s ease;
          text-align: center;
        }
        .ope-txt {
          opacity: 0;
          position: absolute;
          pointer-events: none;
        }
        .ope-txt-archive {
          opacity: 1;
        }
        .acc-ope:hover .ope-txt {
          opacity: 1;
          pointer-events: auto;
        }
        .acc-ope:hover .ope-txt-archive {
          opacity: 0;
          pointer-events: none;
        }

        .acc-ope-container {
          width: 100%;
          height: 100%;
          background-color: var(--colorspine);
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        /* Hide exit button on PC */
        .mobile-exit-btn {
          display: none;
        }
    `}</style>
  );
}
