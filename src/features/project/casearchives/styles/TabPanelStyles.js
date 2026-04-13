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

        .accordion-app.pc-layout {
          display: grid;
          grid-template-columns: 84.375px 2fr 1fr;
          grid-template-rows: 1fr;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .pc-layout .sticky-spine {
          grid-column: 1;
          height: 100vh;
        }

        .pc-layout .main-note-area {
          grid-column: 2;
          height: 100vh;
          overflow: hidden;
          background: var(--colortab);
          border-right: 2px solid var(--colorborder);
          position: relative;
        }

        .pc-layout .side-widgets-area {
          grid-column: 3;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--colortab);
        }

        .pc-layout .mini-graph-container {
          flex: 1;
          min-height: 40%;
          border-bottom: 2px solid var(--colorborder);
          background: var(--colortab);
        }

        .pc-layout .horizontal-tabs-container {
          flex: 1;
          min-height: 0; /* Critical for flex scrolling */
          overflow-y: auto !important;
          background: var(--colortab);
          display: flex;
          flex-direction: column;
          scrollbar-width: none !important; /* Hide for Firefox */
          -ms-overflow-style: none !important; /* Hide for IE */
          pointer-events: auto; /* Ensure it catches mouse events */
        }

        .pc-layout .horizontal-tabs-container::-webkit-scrollbar {
          display: none !important; /* Hide for Chrome/Safari */
        }

        .pc-layout .tab-item-horizontal {
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* Soft white border */
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--colortext-spine);
          font-family: 'Prata', serif;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .pc-layout .tab-item-horizontal:hover {
          background: rgba(255,250,205,0.1);
        }

        .pc-layout .tab-item-horizontal.active {
          background: var(--colortext-spine);
          color: var(--colortab);
          filter: invert(1);
        }

        .pc-layout .main-note-area .acc-panel {
          border-right: none;
          flex-basis: 100%;
          min-width: 100%;
        }

        .pc-layout .main-note-area .acc-spine-container {
          display: none;
        }

        .pc-layout .main-note-area .acc-content {
          width: 100%;
          opacity: 1;
          animation: none;
        }

        /* Title in Panel */
        .pc-layout .main-note-area .editor-header h1,
        .pc-layout .main-note-area .panel-title {
          font-family: 'Prata', serif !important;
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
          font-family: 'Prata', serif;
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
