import React from 'react';

export default function TabPanelStyles() {
  return (
    <style jsx global>{`
        .accordion-app {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          overflow-x: auto;
          overflow-y: hidden;
          background: transparent;
        }

        .acc-panel {
          display: flex;
          flex-direction: row;
          height: 100%;
          transition: flex-basis 1s cubic-bezier(0.25, 0.8, 0.25, 1), min-width 1s cubic-bezier(0.25, 0.8, 0.25, 1), flex-grow 1s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 1s, opacity 0.5s, border-color 0.3s;
          border-right: 2px solid var(--colorborder);
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Ẩn title các thanh tab khi hover vào content */
        .accordion-app:has(.acc-content:hover) .acc-panel:not(.sticky-spine) {
          border-right-color: var(--colortab) !important;
        }
        .accordion-app:has(.acc-content:hover) .acc-spine {
          opacity: 0 !important;
        }

        .acc-panel.closed {
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          background-color: var(--colortab);
          cursor: pointer;
          isolation: isolate;
        }

        .acc-panel.open {
          /* Để hở ra khoảng 450px cho các spine khác */
          flex-basis: calc(100vw - 450px);
          min-width: calc(100vw - 450px);
          flex-grow: 1;
          background-color: transparent;
        }

        .acc-spine-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: var(--colortab);
          cursor: pointer;
          display: flex;
          align-items: top;
          padding-top: 3rem;
          justify-content: center;
          isolation: isolate;
        }

        .acc-spine {
          writing-mode: vertical-rl;
          font-family: var(--font-title-block, var(--font-display));
          font-size: 3rem;
          color: var(--colortext-spine);
          mix-blend-mode: destination-out;
          white-space: nowrap;
          letter-spacing: 2px;
          user-select: none;
          transition: opacity 0.3s ease;
        }

        .acc-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: calc(100% - 150px);
          animation: fadeIn 1s ease forwards 0.5s;
          opacity: 0;
          position: relative;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .acc-body {
          flex: 1;
          overflow: hidden; 
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: var(--colortab);
        }

        .main-content { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:10px 15px; background:var(--colortab); }
        .main-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }
    `}</style>
  );
}
