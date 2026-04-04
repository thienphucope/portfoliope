import React from 'react';
import { Plus, ArrowLeft, Pencil, Folder, MessageSquare, X, ChevronRight, ChevronLeft, Save, Eye, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * FunctionBall component (formerly MobileFooter) providing navigation actions,
 * editor controls (edit/save), and overlay toggles in an expandable "assistive ball".
 * Used for both PC and Mobile views.
 */

export default function FunctionBall({
  isFooterExpanded,
  setIsFooterExpanded,
  showReadMore,
  activeOverlay,
  setActiveOverlay,
  handleCreateNewNote,
  fileName,
  handleAppendComment,
  handleTabClick,
  nextTabForActive,
  prevTabForActive,
  isEditing,
  handleToggleEditMode,
  saveStatus,
  handleSidebarSave,
  activeTabType
}) {
  // Chỉ cho phép dùng các chức năng này khi có tab đang active (editor hoặc static)
  // và không bị overlay (filetree/chat) che mất
  const canEdit = !activeOverlay && activeTabType === 'editor';
  const canComment = !activeOverlay && (activeTabType === 'editor' || activeTabType === 'static');

  return (
    <div className={`mobile-footer ${isFooterExpanded ? 'expanded' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Nút Back - Chỉ hiện khi MỞ RỘNG */}
        {isFooterExpanded && (
          <div 
            className="side-nav-btn"
            onClick={(e) => {
              if (prevTabForActive) handleTabClick(prevTabForActive, e);
              else window.history.back();
            }}
            title={prevTabForActive ? `Back to ${prevTabForActive.title}` : "Back"}
          >
            <ChevronLeft size={24} />
          </div>
        )}

        <div 
          className={`assistive-ball ${isFooterExpanded ? 'active' : ''} ${showReadMore ? 'at-bottom' : ''}`}
        >
          {isFooterExpanded ? (
            <div onClick={() => setIsFooterExpanded(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colorbutton)' }}>
              <X size={28} />
            </div>
          ) : (
            <div onClick={() => setIsFooterExpanded(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colorbutton)' }}>
              <div className="ball-icon">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* Nút Next - Chỉ hiện khi MỞ RỘNG */}
        {isFooterExpanded && nextTabForActive && (
          <div 
            className="side-nav-btn"
            onClick={(e) => handleTabClick(nextTabForActive, e)}
            title={`Next: ${nextTabForActive.title}`}
          >
            <ChevronRight size={24} />
          </div>
        )}
      </div>
      
      <div className={`footer-expanded-content ${isFooterExpanded ? 'active' : ''}`}>
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

        {/* Edit Mode - Chỉ hiện khi canEdit */}
        {canEdit && (
          <div className="footer-item-wrapper" onClick={() => { handleToggleEditMode(); setIsFooterExpanded(false); }}>
            <div className={`footer-item ${isEditing ? 'active-action' : ''}`}>
              <span className="footer-item-label">{isEditing ? 'Read Mode' : 'Edit Mode'}</span>
              {isEditing ? <Eye size={20} /> : <Pencil size={20} />}
            </div>
          </div>
        )}

        {/* Save Button - Chỉ hiện khi canEdit */}
        {canEdit && (
          <div 
            className="footer-item-wrapper" 
            onClick={() => { if (saveStatus !== 'saving') { handleSidebarSave(); setIsFooterExpanded(false); } }}
            style={{ opacity: saveStatus === 'saving' ? 0.5 : 1 }}
          >
            <div className={`footer-item ${saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'error' : ''}`}>
              <span className="footer-item-label">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Error' : 'Save'}
              </span>
              {saveStatus === 'saving' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 size={20} />
              ) : saveStatus === 'error' ? (
                <AlertCircle size={20} />
              ) : (
                <Save size={20} />
              )}
            </div>
          </div>
        )}

        {/* Comment Button - Hiện khi canComment */}
        {canComment && (
          <div 
            className="footer-item-wrapper" 
            onClick={() => { setIsFooterExpanded(false); handleAppendComment(); }}
          >
            <div className="footer-item">
              <span className="footer-item-label">Comment</span>
              <Pencil size={20} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .side-nav-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--colortab);
          border: 2px solid var(--colorbutton);
          color: var(--colorbutton);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          transition: all 0.2s;
          pointer-events: auto;
          opacity: 0.8;
        }
        .side-nav-btn:hover {
          transform: scale(1.1);
          opacity: 1;
          background: var(--colorbutton);
          color: var(--colortab);
        }
        .ball-icon {
          display: flex;
          gap: 3px;
        }
        .dot {
          width: 5px;
          height: 5px;
          background: currentColor;
          border-radius: 50%;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .footer-item.success {
          background: #2e7d32;
          color: white;
        }
        .footer-item.success .footer-item-label {
          color: white;
        }
        .footer-item.error {
          background: #c62828;
          color: white;
        }
        .footer-item.error .footer-item-label {
          color: white;
        }
      `}</style>
    </div>
  );
}
