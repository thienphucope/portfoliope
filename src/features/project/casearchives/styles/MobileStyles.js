import React from 'react';

export default function MobileStyles() {
  return (
    <style jsx global>{`
        /* MOBILE & TABLET PORTRAIT */
        @media (max-width:1024px),(orientation:portrait) {
          .app-shell { overflow-x:auto !important; overflow-y:hidden !important; scroll-snap-type:x mandatory; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; display:flex !important; flex-wrap:nowrap !important; }
          .sidebar-panel,.main-content,.chat-panel { width:100vw !important; min-width:100vw !important; flex-shrink:0 !important; scroll-snap-align:center; position:relative !important; height:100dvh !important; }
          .resizer { display:none !important; }
          .main-content { padding:10px 10px; }
          :root { --md-size: clamp(17px, 1.5vw + 10px, 22px); }
          .markdown-content h1 { font-size:1.8em; }
          .markdown-content h2 { font-size:1.5em; }
          .markdown-content h3 { font-size:1.2em; }
          .tree-item { font-size:clamp(13px,1vw + 10px,16px); }
        }

        @media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
          /* Không ẩn title các thanh tab khi bật content trên mobile */
          .accordion-app:has(.acc-content:hover) .acc-panel:not(.sticky-spine) {
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .accordion-app:has(.acc-content:hover) .acc-spine {
            opacity: 1 !important;
          }

          .accordion-app {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }

          .accordion-app.has-active {
            overflow: hidden !important;
          }

          .sticky-spine {
            position: fixed !important;
            top: 0;
            left: 0;
            z-index: 1000;
            width: 100% !important;
            height: 50px !important;
            flex: 0 0 50px !important;
            min-width: 0 !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
            transition: transform 0.3s ease;
          }

          .header-hidden {
            transform: translateY(-100%);
          }

          .acc-ope-container {
            flex: 1 !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            align-items: center !important;
            justify-content: flex-start !important;
          }

          .spine-content {
            flex-direction: row !important;
            width: 100% !important;
            height: 100% !important;
            justify-content: flex-start !important;
            align-items: center !important;
            position: relative !important;
            padding: 0 20px !important;
          }

          .acc-ope {
            flex-direction: row !important;
            gap: 10px !important;
            position: static !important;
            font-size: 1.4rem !important;
            letter-spacing: 1px !important;
            text-align: left !important;
            margin: 0 !important;
            cursor: pointer;
          }

          .ope-txt {
            writing-mode: horizontal-tb !important;
            white-space: nowrap !important;
            transition: opacity 0.3s ease;
            opacity: 0;
            position: absolute;
            pointer-events: none;
          }

          .ope-txt-archive {
            writing-mode: horizontal-tb !important;
            white-space: nowrap !important;
            transition: opacity 0.3s ease;
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

          .mobile-back-btn {
            display: none !important;
          }

          .mobile-exit-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            color: var(--colortext-spine);
            padding: 0;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s, transform 0.2s;
            mix-blend-mode: destination-out;
          }
          
          .mobile-exit-btn:active {
            transform: translateY(-50%) scale(0.9);
            opacity: 1;
          }

          .tab-close-btn {
            display: none !important;
          }

          .accordion-app.has-active .tab-close-btn {
            display: flex !important;
            width: 40px !important;
            height: 40px !important;
            align-items: center;
            justify-content: center;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1001;
            padding: 0;
            background: transparent;
            border: 1.5px solid transparent;
            border-radius: 8px;
            color: var(--colorbutton);
            cursor: pointer;
            font-size: 22px;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            mix-blend-mode: screen;
          }

          .tab-close-btn:hover {
            border-color: var(--colorbutton);
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 8px 20px rgba(255, 250, 205, 0.4);
          }

          .tab-close-btn:active {
            transform: translateY(-50%) scale(0.95);
          }

          .add-note-btn, .filetree-btn, .chatvault-btn, .pdfviewer-btn, .mobile-back-btn, .comment-trigger {
            display: none !important;
          }

          .acc-panel {
            width: 100% !important;
            flex-direction: column !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          .acc-panel.closed {
            flex: 0 0 50px !important;
            min-width: 0 !important;
            height: 50px !important;
          }

          .accordion-app.has-active .acc-panel.closed {
            display: none !important;
          }

          .acc-panel.open {
            flex: 1 !important;
            min-width: 0 !important;
            height: calc(100vh - 60px) !important;
          }

          .acc-spine-container {
            flex: 0 0 50px !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            justify-content: flex-start !important;
            align-items: center !important;
            padding-left: 20px !important;
            position: relative !important;
          }

          .acc-panel.open .acc-spine-container {
            display: none !important;
          }

          .acc-spine {
            writing-mode: horizontal-tb !important;
            font-size: 1.1rem !important;
            letter-spacing: 1px !important;
            opacity: 1 !important;
          }

          .acc-content {
            width: 100% !important;
            height: calc(100% - 50px) !important;
            flex: 1 !important;
            animation: none !important;
            opacity: 1 !important;
          }

          .acc-panel.open .acc-content {
            height: 100% !important;
          }

          .acc-body {
            height: 100% !important;
            flex: 1 !important;
            overflow: hidden !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }
          
          .main-content {
            padding: 0 !important;
            overflow: hidden !important;
          }

          .markdown-container {
            padding: 0 8px 100px !important;
            overscroll-behavior: contain;
          }

          .floating-actions {
            top: 10px !important;
            right: 15px !important;
          }
          
          .video-background iframe {
            transform: translate(-50%, -50%) scale(2.5) !important;
          }

          .pc-only {
            display: none !important;
          }

          .acc-panel.tab-chat.open,
          .acc-panel.tab-pdf.open,
          .acc-panel.tab-graph.open {
            position: relative !important;
            left: 0 !important;
            width: 100% !important;
            height: calc(100vh - 60px) !important;
            backdrop-filter: none !important;
          }

          .acc-panel.tab-chat .acc-spine-container,
          .acc-panel.tab-pdf .acc-spine-container,
          .acc-panel.tab-graph .acc-spine-container {
            display: none !important;
          }

          .chat-active .acc-panel.open:not(.tab-chat),
          .pdf-active .acc-panel.open:not(.tab-pdf),
          .graph-active .acc-panel.open:not(.tab-graph) {
            display: none !important;
          }

          .mobile-read-more {
            display: flex !important;
          }
        }
    `}</style>
  );
}
