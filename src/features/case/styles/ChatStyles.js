import React from 'react';

export default function ChatStyles() {
  return (
    <style jsx global>{`
        .chat-panel { height:100dvh; background:var(--bg); flex-shrink:0; border-left:1px solid var(--border); overflow:hidden; }
        .chat-container { height:100%; width:100%; position:relative; }

        .acc-panel.tab-chat.open {
          position: fixed;
          left: 84.375px;
          top: 0;
          width: calc(100vw - 84.375px);
          z-index: 45;
          flex-basis: auto !important;
          min-width: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-right: none;
        }

        .acc-panel.tab-chat .acc-content {
          width: 100%;
        }

        /* Overlay Mode for Chat */
        .chat-active .acc-panel.closed {
          opacity: 0;
          pointer-events: none;
        }

        .chat-active .acc-panel.open:not(.tab-chat) {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
    `}</style>
  );
}
