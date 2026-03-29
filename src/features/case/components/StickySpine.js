import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Sticky navigation spine component for the case vault interface, rendering vertical
 * tab titles and floating action buttons for file tree, AI chat, and new note creation.
 */

export default function StickySpine({ 
  showHeader, 
  activeTab, 
  activeOverlay, 
  handleCreateNewNote, 
  setActiveOverlay 
}) {
  return (
    <div className={`acc-panel sticky-spine ${(!showHeader || activeTab || activeOverlay) ? 'header-hidden' : ''}`}>
      <div className="acc-ope-container" style={{ width: '100%', flex: '1' }}>
        <div className="spine-content">
          <div className="add-note-btn" onClick={(e) => { e.stopPropagation(); handleCreateNewNote(); }} title="New Note">
            <Plus size={44} />
          </div>
          <div className="filetree-btn" onClick={(e) => {
            e.stopPropagation();
            setActiveOverlay(prev => prev === 'filetree' ? null : 'filetree');
          }} title="File Tree">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="chatvault-btn" onClick={(e) => { 
            e.stopPropagation(); 
            setActiveOverlay(prev => prev === 'chat' ? null : 'chat');
          }} title="AI Chat Vault">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="acc-ope" onClick={() => window.location.href = '/about'}>
            <div className="ope-txt">Ope</div>
            <div className="watson-txt">Watson</div>
          </div>
        </div>
      </div>
    </div>
  );
}
