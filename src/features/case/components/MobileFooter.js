import React from 'react';
import { Plus, ArrowLeft, Pencil, Folder, MessageSquare, MoreVertical, X, ChevronRight } from 'lucide-react';

/**
 * Mobile-specific footer component for the case vault, providing navigation actions,
 * overlay toggles, and expandable menu for creating notes and comments.
 */

export default function MobileFooter({
  isFooterExpanded,
  setIsFooterExpanded,
  showReadMore,
  activeOverlay,
  setActiveOverlay,
  handleCreateNewNote,
  fileName,
  handleAppendComment,
  handleTabClick,
  nextTabForActive
}) {
  return (
    <div className="mobile-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          className={`assistive-ball ${isFooterExpanded ? 'active' : ''} ${showReadMore ? 'at-bottom' : ''}`}
        >
          {isFooterExpanded ? (
            <div onClick={() => setIsFooterExpanded(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colorbutton)' }}>
              <X size={28} />
            </div>
          ) : (
            showReadMore ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div 
                  onClick={() => setIsFooterExpanded(true)}
                  style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--colorbutton)' }}
                >
                  <MoreVertical size={24} />
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.15)', margin: '0 2px' }} />
                <div 
                  onClick={(e) => handleTabClick(nextTabForActive, e)}
                  style={{ padding: '0 16px 0 10px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--colorbutton)', marginTop: '2px' }}>{nextTabForActive.title}</span>
                  <div style={{ color: 'var(--colorbutton)' }}>
                    <ChevronRight size={22} />
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsFooterExpanded(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colorbutton)' }}>
                <MoreVertical size={28} />
              </div>
            )
          )}
        </div>
      </div>
      
      <div className={`footer-expanded-content ${isFooterExpanded ? 'active' : ''}`}>
        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); if (activeOverlay) setActiveOverlay(null); else window.history.back(); }}>
          <div className="footer-item">
            <span className="footer-item-label">Back</span>
            <ArrowLeft size={20} />
          </div>
        </div>

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); setActiveOverlay(activeOverlay === 'filetree' ? null : 'filetree'); }}>
          <div className={`footer-item ${activeOverlay === 'filetree' ? 'active-action' : ''}`}>
            <span className="footer-item-label">File Tree</span>
            <Folder size={20} />
          </div>
        </div>

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); handleCreateNewNote(); }}>
          <div className="footer-item">
            <span className="footer-item-label">New Note</span>
            <Plus size={22} />
          </div>
        </div>

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); setActiveOverlay(activeOverlay === 'chat' ? null : 'chat'); }}>
          <div className={`footer-item ${activeOverlay === 'chat' ? 'active-action' : ''}`}>
            <span className="footer-item-label">AI Chat</span>
            <MessageSquare size={20} />
          </div>
        </div>

        <div 
          className="footer-item-wrapper" 
          onClick={() => { if (fileName && fileName !== 'chat' && fileName !== 'filetree') { setIsFooterExpanded(false); handleAppendComment(); } }}
          style={{ opacity: (!fileName || fileName === 'chat' || fileName === 'filetree') ? 0.3 : 1 }}
        >
          <div className="footer-item">
            <span className="footer-item-label">Comment</span>
            <Pencil size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
