import React from 'react';
import { Plus, Pencil, Folder, MessageSquare, X, ChevronRight, ChevronLeft, Save, Eye, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

/**
 * FunctionBall component (formerly MobileFooter) providing navigation actions,
 * editor controls (edit/save), and overlay toggles in an expandable "assistive ball".
 * Used for both PC and Mobile views.
 */

export default function FunctionBall({
  isFooterExpanded,
  setIsFooterExpanded,
  showReadMore,
  showFunctionBall = true,
  isAtBottom = false,
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
  activeTabType,
  activeTabObj
}) {
  // Chỉ cho phép dùng các chức năng này khi có tab đang active (editor hoặc static)
  // và không bị overlay (filetree/chat) che mất
  const canEdit = !activeOverlay && activeTabType === 'editor';
  const canComment = !activeOverlay && (activeTabType === 'editor' || activeTabType === 'static');

  const isHidden = !showFunctionBall && !isAtBottom && !isFooterExpanded;

  return (
    <div className={`mobile-footer ${isFooterExpanded ? 'expanded' : ''} ${isHidden ? 'hidden-ball' : ''}`}>
      <div className="ball-container">
        
        {/* Nút bên trái/trên FunctionBall */}
        {isFooterExpanded && (
          <div className="left-nav-buttons">
            {/* Nút Close */}
            {activeTabObj && (
              <div 
                className="side-nav-btn"
                onClick={(e) => handleTabClick(activeTabObj, e)}
                title="Close Tab"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 17 5-5-5-5"></path>
                  <path d="M21 12H9"></path>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                </svg>
              </div>
            )}

            {/* Nút Back */}
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
          </div>
        )}

        <div 
          className={`assistive-ball ${isFooterExpanded ? 'active' : ''} ${showReadMore ? 'at-bottom' : ''}`}
        >
          {isFooterExpanded ? (
            <div onClick={() => setIsFooterExpanded(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colortab)' }}>
              <X size={28} />
            </div>
          ) : (
            <div onClick={() => setIsFooterExpanded(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', color: 'var(--colortab)' }}>
              <div className="ball-icon">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* Nút bên phải/dưới FunctionBall (Next) */}
        {isFooterExpanded && nextTabForActive && (
          <div className="right-nav-buttons">
            <div 
              className="side-nav-btn"
              onClick={(e) => handleTabClick(nextTabForActive, e)}
              title={`Next: ${nextTabForActive.title}`}
            >
              <ChevronRight size={24} />
            </div>
          </div>
        )}
      </div>
      
      <div className={`footer-expanded-content ${isFooterExpanded ? 'active' : ''}`}>
        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); setActiveOverlay(activeOverlay === 'chat' ? null : 'chat'); }}>
          <div className={`footer-item ${activeOverlay === 'chat' ? 'active-action' : ''}`}>
            <span className="footer-item-label">AI Chat</span>
            <MessageSquare size={20} />
          </div>
        </div>

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); setActiveOverlay(activeOverlay === 'filetree' ? null : 'filetree'); }}>
          <div className={`footer-item ${activeOverlay === 'filetree' ? 'active-action' : ''}`}>
            <span className="footer-item-label">File Tree</span>
            <Folder size={20} />
          </div>
        </div>

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); setActiveOverlay(activeOverlay === 'pdf' ? null : 'pdf'); }}>
          <div className={`footer-item ${activeOverlay === 'pdf' ? 'active-action' : ''}`}>
            <span className="footer-item-label">PDF Reader</span>
            <FileText size={20} />
          </div>
        </div>

        {/* Comment Button - Hiện khi canComment */}
        {canComment && (
          <div 
            className="footer-item-wrapper" 
            onClick={() => { setIsFooterExpanded(false); handleAppendComment(); }}
          >
            <div className="footer-item">
              <span className="footer-item-label">Comment</span>
              <MessageSquare size={20} />
            </div>
          </div>
        )}

        <div className="footer-item-wrapper" onClick={() => { setIsFooterExpanded(false); handleCreateNewNote(); }}>
          <div className="footer-item">
            <span className="footer-item-label">New Note</span>
            <Plus size={22} />
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
      </div>

      <style jsx>{`
        .mobile-footer {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .mobile-footer.hidden-ball {
          transform: translate(-50%, 150%) !important;
        }
        .ball-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .left-nav-buttons, .right-nav-buttons {
          position: absolute;
          display: flex;
          gap: 16px;
        }
        .left-nav-buttons {
          right: 100%;
          margin-right: 16px;
        }
        .right-nav-buttons {
          left: 100%;
          margin-left: 16px;
        }
        @media (min-width: 1025px), (min-width: 769px) and (orientation: landscape) {
          .left-nav-buttons {
            right: unset;
            bottom: 100%;
            margin-right: 0;
            margin-bottom: 16px;
            flex-direction: column;
          }
          .right-nav-buttons {
            left: unset;
            top: 100%;
            margin-left: 0;
            margin-top: 16px;
            flex-direction: column;
          }
          .mobile-footer {
            top: 50% !important;
            bottom: unset !important;
            right: 32px !important;
            left: unset !important;
            transform: translateY(-50%) !important;
            flex-direction: row-reverse !important;
          }
          .mobile-footer.hidden-ball {
            transform: translate(150%, -50%) !important;
          }
          .footer-expanded-content {
            flex-direction: column-reverse !important;
            gap: 16px;
            margin-right: 16px;
          }
          .footer-item {
            flex-direction: row-reverse !important;
            justify-content: flex-start;
          }
        }
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
