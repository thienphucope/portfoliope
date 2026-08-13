'use client';

import { useState } from 'react';
import ChatDesk from './ChatDesk';
import ChatRoom from './ChatRoom';

export default function ChatToggle() {
  const [useRoom, setUseRoom] = useState(false);

  return (
    <>
      <button
        className="chat-mode-toggle"
        onClick={() => setUseRoom(v => !v)}
      >
        {useRoom ? '[ DESK VIEW ]' : '[ ROOM VIEW ]'}
      </button>
      {useRoom ? <ChatRoom /> : <ChatDesk />}
      <style jsx>{`
        .chat-mode-toggle {
          position: fixed;
          top: 14px;
          right: 14px;
          z-index: 1000;
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          color: var(--theme);
          background: transparent;
          border: 1px solid color-mix(in srgb, var(--theme) 40%, transparent);
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .chat-mode-toggle:hover {
          background: color-mix(in srgb, var(--theme) 10%, transparent);
        }
      `}</style>
    </>
  );
}
