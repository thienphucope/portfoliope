'use client';

import { useState } from 'react';
import ChatDesk from './ChatDesk';
import ChatRoom from './ChatRoom';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';

export default function ChatToggle() {
  const [useRoom, setUseRoom] = useState(false);

  return (
    <div className={`${theme.theme} chat-route`}>
      <button
        className="chat-mode-toggle"
        onClick={() => setUseRoom(v => !v)}
      >
        {useRoom ? '[ live desk ]' : '[ text room ]'}
      </button>
      {useRoom ? <ChatRoom /> : <ChatDesk />}
      <style jsx global>{`
        /* Repaint the ChatRoom (text view) onto the archive paper surface.
           Scoped to .chat-route so the embedded CaseReader chat is untouched. */
        .chat-route .chat-shell { background: var(--archive-paper-texture), var(--archive-paper); color: var(--txt); }
        .chat-route .chat-shell::after { box-shadow: none; }
        .chat-route .messages-list { max-width: 820px; width: 100%; margin: 0 auto; }
        .chat-route .chat-header { background: transparent; border-bottom: 1px solid var(--archive-line-soft); }
        .chat-route .input-area { background: transparent; border-top: 1px solid var(--archive-line-soft); }
        .chat-route .textarea-row { background: transparent; border: 1px solid var(--border); }
        .chat-route .textarea-row:focus-within { background: transparent; border-color: var(--txt); }
        .chat-route .chat-input { color: var(--txt); }
        .chat-route .bubble-content { color: var(--md-colortext); }
        .chat-route .suggest-btn { border: 1px solid var(--border); color: var(--archive-muted); }
        .chat-route .suggest-btn:hover { color: var(--txt); border-color: var(--txt); background: var(--archive-hover); }
      `}</style>
      <style jsx>{`
        .chat-mode-toggle {
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 1000;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--archive-muted);
          background: var(--archive-paper);
          border: 1px solid var(--archive-line-soft);
          padding: 7px 12px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .chat-mode-toggle:hover {
          color: var(--archive-ink);
          border-color: var(--archive-ink);
        }
      `}</style>
    </div>
  );
}
