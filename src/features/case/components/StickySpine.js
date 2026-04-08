import React from 'react';
import { Plus, Network, ArrowLeft } from 'lucide-react';

/**
 * Sticky navigation spine component for the case vault interface, rendering vertical
 * tab titles and floating action buttons for file tree, AI chat, and new note creation.
 */

export default function StickySpine({ 
  showHeader, 
  activeTab, 
  activeOverlay, 
  handleCreateNewNote, 
  setActiveOverlay,
  setActiveTab
}) {
  const handleCloseTab = () => {
    setActiveTab(null);
    setActiveOverlay(null);
  };

  return (
    <div className={`acc-panel sticky-spine ${(!showHeader || activeTab || activeOverlay) ? 'header-hidden' : ''}`}>
      <div className="acc-ope-container" style={{ width: '100%', flex: '1' }}>
        <div className="spine-content">
          <div className="add-note-btn" onClick={(e) => { e.stopPropagation(); handleCreateNewNote(); }} title="New Note">
            <Plus size={44} />
          </div>
          <div
            className={`filetree-btn ${activeOverlay === 'filetree' ? 'active' : ''}`}
            onClick={(e) => {
            e.stopPropagation();
            setActiveOverlay(prev => prev === 'filetree' ? null : 'filetree');
            }}
            title="File Tree"
          >
            <Network size={34} strokeWidth={2} />
          </div>
          <div
            className={`chatvault-btn ${activeOverlay === 'chat' ? 'active' : ''}`}
            onClick={(e) => { 
            e.stopPropagation(); 
            setActiveOverlay(prev => prev === 'chat' ? null : 'chat');
            }}
            title="AI Chat Vault"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          
          <div className="acc-ope" onClick={() => window.location.href = '/about'}>
            <div className="ope-txt-archive">Case Archives</div>
            <div className="ope-txt">Ope Watson</div>
          </div>

          <button 
            className="mobile-exit-btn" 
            onClick={(e) => { e.stopPropagation(); window.location.href = '/about'; }} 
            title="Exit Case"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
