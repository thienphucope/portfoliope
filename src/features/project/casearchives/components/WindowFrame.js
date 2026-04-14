"use client";
import React from 'react';
import { Maximize2, Minimize2, X, Zap, Save, Pencil, Eye, MessageSquare, Plus, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

/**
 * WindowFrame component that provides a title bar, borders, and window controls
 * (maximize and close) for tiling panels in the desktop layout.
 */
export default function WindowFrame({ 
  title, 
  id, 
  onClose, 
  isMaximized, 
  onToggleMaximize, 
  onLiveCall,
  isLiveCallActive = false,
  onSave,
  saveStatus = 'idle',
  onToggleEdit,
  isEditing = false,
  onComment,
  onNewNote,
  pdfState = null,
  onPdfPrev,
  onPdfNext,
  onPdfUpload,
  onPdfToggleFit,
  onPdfPageJump,
  children,
  isMobile,
  isHidden = false
}) {
  const [localPageInput, setLocalPageInput] = React.useState('');

  // Sync local input with global state when not focused
  React.useEffect(() => {
    if (pdfState) setLocalPageInput(pdfState.pageNumber.toString());
  }, [pdfState?.pageNumber]);

  if (isMobile) return <>{children}</>;

  return (
    <div className={`window-frame ${isMaximized ? 'maximized' : ''} ${isHidden ? 'hidden-window' : ''}`} data-id={id}>
      <div className="window-title-bar">
        <div className="window-title-text">{title}</div>
        <div className="window-controls">
          {/* PDF Specific Controls */}
          {id === 'pdf' && pdfState && (
            <>
              <button className="window-control-btn" onClick={onPdfUpload} title="Upload PDF">
                <Upload size={16} />
              </button>
              <div className="control-separator" />
              <button className="window-control-btn" onClick={onPdfPrev} disabled={pdfState.pageNumber <= 1}>
                <ChevronLeft size={16} />
              </button>
              <div className="pdf-page-indicator">
                <input 
                  type="text" 
                  className="pdf-title-input" 
                  value={localPageInput} 
                  onChange={(e) => setLocalPageInput(e.target.value)}
                  onBlur={() => {
                    const p = parseInt(localPageInput);
                    if (!isNaN(p)) onPdfPageJump(p);
                    else setLocalPageInput(pdfState.pageNumber.toString());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(localPageInput);
                      if (!isNaN(p)) onPdfPageJump(p);
                      e.target.blur();
                    }
                  }}
                />
                <span>/ {pdfState.numPages || 0}</span>
              </div>
              <button className="window-control-btn" onClick={onPdfNext} disabled={pdfState.pageNumber >= pdfState.numPages}>
                <ChevronRight size={16} />
              </button>
              <div className="control-separator" />
              <button className="window-control-btn" onClick={onPdfToggleFit} title={pdfState.fitMode === 'width' ? "Fit Height" : "Fit Width"}>
                {pdfState.fitMode === 'width' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <div className="control-separator" />
            </>
          )}

          {/* Editor Specific Controls */}
          {id === 'editor' && (
            <>
              <button className="window-control-btn" onClick={onNewNote} title="New Note">
                <Plus size={16} />
              </button>
              <button className="window-control-btn" onClick={onComment} title="Add Comment">
                <MessageSquare size={16} />
              </button>
              <button 
                className={`window-control-btn ${isEditing ? 'active-mode' : ''}`} 
                onClick={onToggleEdit} 
                title={isEditing ? "Switch to Read Mode" : "Switch to Edit Mode"}
              >
                {isEditing ? <Eye size={16} /> : <Pencil size={16} />}
              </button>
              <button 
                className={`window-control-btn save-btn ${saveStatus !== 'idle' ? 'status-' + saveStatus : ''}`} 
                onClick={onSave} 
                disabled={saveStatus === 'saving'}
                title="Save Changes"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle2 size={16} color="#4caf50" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle size={16} color="#f44336" />
                ) : (
                  <Save size={16} />
                )}
              </button>
              <div className="control-separator" />
            </>
          )}

          {onLiveCall && id === 'chat' && (
            <button 
              className={`window-control-btn call-live-btn ${isLiveCallActive ? 'active-call' : ''}`} 
              onClick={(e) => { e.stopPropagation(); onLiveCall(); }}
              title={isLiveCallActive ? "End Live Call" : "Start Live AI Call"}
            >
              <Zap size={16} fill={isLiveCallActive ? "#ff4d4d" : "currentColor"} color={isLiveCallActive ? "#ff4d4d" : "currentColor"} className={isLiveCallActive ? 'animate-pulse' : ''} />
            </button>
          )}
          <button 
            className="window-control-btn" 
            onClick={() => onToggleMaximize(id)}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            className="window-control-btn close-btn" 
            onClick={() => onClose(id)}
            title="Close Window"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>

      <style jsx>{`
        .window-frame {
          display: flex;
          flex-direction: column;
          background: var(--colortab);
          border: 1px solid var(--colorborder);
          border-radius: 8px;
          overflow: hidden;
          height: 100%;
          width: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .window-frame.hidden-window {
          display: none !important;
        }

        .window-frame.maximized {
          position: fixed;
          top: 10px;
          left: 94px; /* Offset for StickySpine */
          right: 10px;
          bottom: 10px;
          z-index: 1000;
          width: calc(100vw - 104px);
          height: calc(100vh - 20px);
        }

        .window-title-bar {
          height: 36px;
          padding: 0 12px;
          background: rgba(255, 250, 205, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--colorborder);
          user-select: none;
        }

        .window-title-text {
          font-family: 'Prata', serif;
          font-size: 0.9rem;
          color: var(--colorbutton);
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .window-controls {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .window-control-btn {
          background: transparent;
          border: none;
          color: var(--colorbutton);
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }

        .window-control-btn:hover:not(:disabled) {
          opacity: 1;
          background: rgba(255, 250, 205, 0.1);
        }

        .window-control-btn:disabled {
          opacity: 0.1;
          cursor: default;
        }

        .pdf-page-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--colorbutton);
          opacity: 0.7;
        }

        .pdf-title-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: inherit;
          width: 24px;
          text-align: center;
          font-size: 11px;
          border-radius: 2px;
          outline: none;
        }

        .window-control-btn.active-mode {
          opacity: 1;
          color: #fff;
          background: rgba(255, 250, 205, 0.2);
        }

        .control-separator {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 4px;
        }

        .window-control-btn.close-btn:hover {
          color: #ff4d4d;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .window-content {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}
