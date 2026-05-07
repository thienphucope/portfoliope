import ChatRoom from '@/features/chatroom/ChatRoom';

export default function ChatOverlay({ isOpen, handleLinkClick }) {
  return (
    <div className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-chat`} data-tab-id="chat">
      <div
        className="acc-content"
        onClick={(e) => e.stopPropagation()}
        style={!isOpen ? { display: 'none' } : {}}
      >
        <div className="acc-body">
          <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
            <ChatRoom isEmbedded={true} onLinkClick={handleLinkClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
