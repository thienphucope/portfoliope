'use client';

import { useState } from 'react';
import { MessageSquare, AudioLines } from 'lucide-react';
import ChatDesk from './ChatDesk';
import ChatRoom from './ChatRoom';
import WorkspaceHeader from '@/components/ui/WorkspaceHeader';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';

export default function ChatToggle() {
  const [useRoom, setUseRoom] = useState(true);

  return (
    <main className={`${theme.theme} chat-route`}>
      <WorkspaceHeader label="AI Chat Vault">
        <div className="chat-modes" role="group" aria-label="Conversation mode">
          <button type="button" aria-pressed={useRoom} onClick={() => setUseRoom(true)}><MessageSquare size={14} strokeWidth={1.5} aria-hidden="true" />Text</button>
          <button type="button" aria-pressed={!useRoom} onClick={() => setUseRoom(false)}><AudioLines size={14} strokeWidth={1.5} aria-hidden="true" />Live voice</button>
        </div>
      </WorkspaceHeader>
      <div className="chat-workspace">{useRoom ? <ChatRoom /> : <ChatDesk />}</div>
      <style jsx global>{`
        .chat-route { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--archive-paper-texture), var(--archive-paper); }
        .chat-route .chat-workspace { display: flex; flex: 1; flex-direction: column; min-height: 0; width: 100%; max-width: 1000px; margin: 0 auto; }
        .chat-route .chat-modes { display: flex; gap: 3px; padding: 3px; border: 1px solid var(--archive-line-soft); border-radius: 4px; }
        .chat-route .chat-modes button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 7px 12px; border: 0; border-radius: 2px; background: transparent; color: var(--archive-muted); font-family: var(--archive-font-ui); font-size: .75rem; }
        .chat-route .chat-modes button[aria-pressed="true"] { background: var(--archive-ink); color: var(--archive-paper); }
        .chat-route .chat-modes button:hover:not([aria-pressed="true"]) { background: var(--archive-hover); color: var(--archive-ink); }
      `}</style>
    </main>
  );
}
