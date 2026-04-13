import React from 'react';

export default function BaseStyles() {
  return (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Prata&family=Fredericka+the+Great&display=swap');

        :root {
          --bg: #121212; --txt: #e0e0e0; --accent: #FFFACD;
          --border: rgba(255,255,255,0.1); --code-bg: #1e1e1e;
          --md-font: 'Prata', serif;
          --font-display: 'Prata', serif;
          --md-size: 19px; --md-line: 1.6;
        }

        body { margin:0; background:var(--bg); color:var(--colortext-markdown); font-family:'Prata', serif; overflow:hidden; }

        /* Hide all scrollbars */
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .app-shell { height:100dvh; width:100vw; display:flex; background:var(--bg); overflow:hidden; }

        .resizer { width:4px; cursor:col-resize; background:var(--border); display:flex; align-items:center; justify-content:center; transition:background .2s,width .2s; user-select:none; z-index:10; }
        .resizer:hover { background:var(--accent); width:6px; }
        .divider-line { display:none; }

        /* Force transparent backgrounds for all vault content */
        body, .app-shell, .main-content, .sidebar-panel, .chat-panel, 
        .chat-container, .markdown-container, .file-list, .prose {
          background: transparent !important;
        }

        .case-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          z-index: -2;
          pointer-events: none;
          overflow: hidden;
          background: black;
        }
        .case-background img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100dvh;
          transform: translate(-50%, -50%) scale(1.5);
          object-fit: cover;
        }
        @media (max-aspect-ratio: 16/9) {
          .case-background img {
            width: 177.78vh;
            height: 100dvh;
          }
        }
        @media (min-aspect-ratio: 16/9) {
          .case-background img {
            width: 100vw;
            height: 56.25vw;
          }
        }
        .video-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); pointer-events: none; }
    `}</style>
  );
}
