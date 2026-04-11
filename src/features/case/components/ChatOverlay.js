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
      {(isOpen || isPlaying) && (
        <div
          className="acc-content"
          onClick={(e) => e.stopPropagation()}
          style={!isOpen ? { display: 'none' } : {}}
        >
          {isPlaying && (
            <div 
              className="global-stop-reader"
              onClick={stop}
              title="Stop Reading"
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--colorbutton)',
                boxShadow: '0 0 15px var(--colorbutton)',
                animation: 'pulseStop 2s infinite'
              }}
            >
              <VolumeX size={24} color="var(--colorbutton)" />
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulseStop {
                  0% { box-shadow: 0 0 5px var(--colorbutton); }
                  50% { box-shadow: 0 0 20px var(--colorbutton); }
                  100% { box-shadow: 0 0 5px var(--colorbutton); }
                }
              `}} />
            </div>
          )}

          <div className="acc-body">
            <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
              <Chat isEmbedded={true} onLinkClick={handleLinkClick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
