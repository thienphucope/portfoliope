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
          border-right: 2px solid var(--theme);
          overflow: hidden;
          flex-shrink: 0;
        }

        .acc-panel.sticky-spine {
          border-right: none;
        }

        /* Ẩn title các thanh tab khi hover vào content */
        .accordion-app:has(.acc-content:hover) .acc-panel:not(.sticky-spine) {
          border-right-color: var(--background) !important;
        }
        .accordion-app:has(.acc-content:hover) .acc-spine {
          opacity: 0 !important;
        }

        .acc-panel.closed {
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          background-color: var(--background);
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
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .pc-layout .sticky-spine {
          flex: 0 0 0px;
          height: 100vh;
        }

        .windows-container {
          display: flex;
          padding: 0;
          width: 100vw;
          height: 100vh;
          margin: 0;
          background: rgba(0, 0, 0, 0.2);
          transition: background 0.3s ease;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        .windows-container.no-windows {
          display: none;
        }

        .windows-container.dragging {
          user-select: none;
        }

        .window-frame-wrapper {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .secondary-windows {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          transition: flex 0.3s ease;
        }

        /* Resizers */
        .resizer-v {
          width: 8px;
          margin: 0 -4px;
          cursor: col-resize;
          z-index: 100;
          flex-shrink: 0;
          transition: background 0.2s;
          position: relative;
        }
        .resizer-v:hover, .resizer-v.active {
          background: rgba(255, 250, 205, 0.3);
        }

        .resizer-h {
          height: 8px;
          margin: -4px 0;
          cursor: row-resize;
          z-index: 100;
          flex-shrink: 0;
          transition: background 0.2s;
          position: relative;
        }
        .resizer-h:hover, .resizer-h.active {
          background: rgba(255, 250, 205, 0.3);
        }

        .resizer-junction {
          position: absolute;
          width: 12px;
          height: 12px;
          margin-left: -6px;
          margin-top: -6px;
          background: var(--theme);
          border-radius: 0;
          z-index: 110;
          cursor: move;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        .resizer-junction:hover, .resizer-junction.active {
          opacity: 1;
          transform: scale(1.2);
        }

        .windows-container:not(.has-editor) .secondary-windows {
          flex-direction: row;
        }

        .secondary-windows.all-hidden {
          flex: 0;
          margin: 0;
          padding: 0;
          display: none;
        }

        .secondary-windows .window-frame {
          flex: 1;
          min-height: 0;
        }

        .hidden-window {
          display: none !important;
        }

        .windows-container.has-maximized {
          display: block;
          padding: 0;
          gap: 0;
        }

        .pc-layout .main-note-area {
          height: 100%;
          overflow: hidden;
          background: var(--feature-bg);
          position: relative;
        }

        .pc-layout .side-widgets-area {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--feature-bg);
        }

        .pc-layout .mini-graph-container {
          flex: 1;
          min-height: 40%;
          border-bottom: 2px solid var(--theme);
          background: var(--feature-bg);
        }

        .pc-layout .horizontal-tabs-container {
          flex: 1;
          min-height: 0; /* Critical for flex scrolling */
          overflow-y: auto !important;
          background: var(--feature-bg);
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
          color: var(--theme);
          font-family: var(--font-display);
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .pc-layout .tab-item-horizontal:hover {
          background: rgba(255,250,205,0.1);
        }

        .pc-layout .tab-item-horizontal.active {
          background: var(--theme);
          color: var(--background);
          filter: invert(1);
        }

        /* Window Frame specific overrides */
        .window-frame .acc-panel {
          border-right: none !important;
          flex-basis: 100% !important;
          min-width: 100% !important;
          background: transparent !important;
          height: 100% !important;
        }

        .window-frame .acc-spine-container {
          display: none !important;
        }

        .window-frame .acc-content {
          width: 100% !important;
          opacity: 1 !important;
          animation: none !important;
          height: 100% !important;
          display: flex !important;
        }

        .window-frame .acc-body {
          flex: 1 !important;
          height: 100% !important;
        }

        .window-frame .main-content {
          padding: 0;
          height: 100% !important;
        }

        .window-frame .markdown-container {
          max-width: 100% !important;
          width: 100% !important;
          padding: 10px;
          min-height: 0;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        .window-frame .note-content-wrapper {
          max-width: 50vw;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .window-content > div {
          height: 100%;
          width: 100%;
          min-height: 0;
        }

        /* Ensure Chat, Graph, PDF fill window */
        .window-frame .chat-container,
        .window-frame .pdf-container,
        .window-frame .file-list {
          height: 100% !important;
          width: 100%;
        }

        /* Title in Panel */
        .window-title-text {
          font-family: var(--font-display) !important;
        }

        .acc-spine-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: var(--background);
          cursor: pointer;
          display: flex;
          align-items: top;
          padding-top: 3rem;
          justify-content: center;
          isolation: isolate;
        }

        .acc-spine {
          writing-mode: vertical-rl;
          font-family: var(--font-display);
          font-size: 3rem;
          color: var(--theme);
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
          background-color: var(--feature-bg);
        }

        .main-content { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:10px 15px; background:var(--feature-bg); }
        .main-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .accordion-app.pc-layout,
          .windows-container,
          .window-frame.maximized {
            height: 100dvh !important;
          }

          .window-frame,
          .window-content,
          .window-frame-wrapper {
            min-height: 0;
          }

          .window-title-bar,
          .window-controls {
            display: none !important;
          }

          .window-frame .markdown-container {
            padding: 10px 10px max(24px, env(safe-area-inset-bottom));
          }

          .window-frame .note-content-wrapper {
            max-width: 100%;
            padding-bottom: max(28px, env(safe-area-inset-bottom));
          }
        }
    `}</style>
  );
}
