import React from 'react';
import { Network, ArrowLeft, FileText, BookOpen } from 'lucide-react';

/**
 * Sticky navigation spine component for the case vault interface.
 */

export default function StickySpine({ 
  showHeader, 
  activeTab, 
  activeOverlay, 
  handleCreateNewNote, 
  setActiveOverlay,
  setActiveTab,
  openWindows = []
}) {
  const isWinOpen = (id) => openWindows.includes(id) || activeOverlay === id;

  return (
    <div className={`acc-panel sticky-spine ${(!showHeader || activeTab || activeOverlay) ? 'header-hidden' : ''}`}>
      <div className="acc-ope-container" style={{ width: '100%', flex: '1' }}>
        <div className="spine-content">
          <div 
            className={`add-note-btn ${isWinOpen('editor') ? 'active' : ''}`} 
            onClick={(e) => { e.stopPropagation(); setActiveOverlay(prev => prev === 'editor' ? null : 'editor'); }} 
            title="Toggle Notes"
          >
            <BookOpen size={30} strokeWidth={2} />
          </div>
          <div
            className={`chatvault-btn ${isWinOpen('chat') ? 'active' : ''}`}
            onClick={(e) => { 
            e.stopPropagation(); 
            setActiveOverlay(prev => prev === 'chat' ? null : 'chat');
            }}
            title="AI Chat Vault"
          >
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>

          <div
            className={`pdfviewer-btn ${isWinOpen('pdf') ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveOverlay(prev => prev === 'pdf' ? null : 'pdf');
            }}
            title="PDF Reader"
          >
            <FileText size={24} strokeWidth={2} />
          </div>

          <div
            className={`graph-btn ${isWinOpen('graph') ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveOverlay(prev => prev === 'graph' ? null : 'graph');
            }}
            title="Graph View"
          >
            <Network size={25} strokeWidth={2} />
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
