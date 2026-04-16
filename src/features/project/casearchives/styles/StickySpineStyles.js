import React from 'react';

export default function StickySpineStyles() {
  return (
    <style jsx global>{`
        .sticky-spine {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 2000;
          width: 84.375px;
          background-color: var(--colorone);
          border-right: 2px solid var(--colorborder);
          cursor: default;
          isolation: isolate;
          transform: translateX(-80px); /* Hide most of it */
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
          opacity: 0.3;
        }

        .sticky-spine:hover {
          transform: translateX(0);
          opacity: 1;
        }

        /* Create a larger hover trigger area */
        .sticky-spine::after {
          content: "";
          position: absolute;
          top: 0;
          right: -20px;
          bottom: 0;
          width: 40px;
          pointer-events: auto;
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

        .add-note-btn.active,
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
          font-family: 'Fredericka the Great', cursive;
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
