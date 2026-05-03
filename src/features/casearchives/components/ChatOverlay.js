import React from 'react';
import Chat from './Chat';
import { VolumeX } from 'lucide-react';

export default function ChatOverlay({
  isOpen,
  handleLinkClick,
  reader,
}) {
  const { stop, isPlaying } = reader;

  return (
    <div className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-chat`} data-tab-id="chat">
      <div
        className="acc-content"
        onClick={(e) => e.stopPropagation()}
        style={!isOpen ? { display: 'none' } : {}}
      >
        <div className="acc-body">
          <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
            <Chat isEmbedded={true} onLinkClick={handleLinkClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
