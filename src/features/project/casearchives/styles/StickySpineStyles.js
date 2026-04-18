import React from 'react';

export default function StickySpineStyles() {
  return (
    <style jsx global>{`
        .sticky-spine {
          position: fixed;
          left: 0;
          top: 70px;
          bottom: 0;
          z-index: 2000;
          width: 64px;
          background: transparent;
          cursor: default;
        }

        .acc-ope-container::before {
          content: '';
          position: absolute;
          right: -7px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 52px;
          background: var(--colorone, #ba9170);
          border-radius: 0 3px 3px 0;
          pointer-events: none;
        }

        /* Larger hover trigger area */
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
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
          gap: 4px;
        }

        .acc-ope-container {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateX(-100%) translateY(-50%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background-color: var(--colorspine);
          border: 2px solid transparent;
          border-radius: 0 6px 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sticky-spine:hover .acc-ope-container {
          transform: translateX(0) translateY(-50%);
          border-left-color: transparent;
          border-right-color: var(--colorborder);
          border-top-color: var(--colorborder);
          border-bottom-color: var(--colorborder);
        }

        .add-note-btn, .chatvault-btn, .pdfviewer-btn, .graph-btn {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--colorbutton);
          font-size: 18px;
          transition: transform 0.2s, opacity 0.2s;
          border-radius: 4px;
        }

        .add-note-btn:hover, .chatvault-btn:hover, .pdfviewer-btn:hover, .graph-btn:hover {
          opacity: 0.7;
          transform: scale(1.1);
        }

        .add-note-btn.active,
        .chatvault-btn.active,
        .pdfviewer-btn.active,
        .graph-btn.active {
          color: #ffffff;
          opacity: 1;
        }

        /* Hide exit button on PC */
        .mobile-exit-btn {
          display: none;
        }

        body.case-header-hidden header {
          display: none;
        }
    `}</style>
  );
}
