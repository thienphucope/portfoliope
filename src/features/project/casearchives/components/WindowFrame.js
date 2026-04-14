"use client";
import React from 'react';
import { Maximize2, Minimize2, X, Zap, Save, Pencil, Eye, MessageSquare, Plus, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Upload, Search } from 'lucide-react';

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
  allFiles = [],
  onSelectFile,
  children,
  isMobile,
  isHidden = false
}) {
  const [localPageInput, setLocalPageInput] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const searchRef = React.useRef(null);

  // Split title into prefix and subject (e.g., "Case Archives - My Note" -> "Case Archives" and "My Note")
  const { prefix, subject } = React.useMemo(() => {
    if (typeof title !== 'string') return { prefix: '', subject: title };
    const parts = title.split(' - ');
    if (parts.length > 1) {
      return { prefix: parts[0], subject: parts.slice(1).join(' - ') };
    }
    return { prefix: '', subject: title };
  }, [title]);

  // Sync local input with global state when not focused
  React.useEffect(() => {
    if (pdfState) setLocalPageInput(pdfState.pageNumber.toString());
  }, [pdfState?.pageNumber]);

  // Close search on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  const filteredFiles = React.useMemo(() => {
    let results = [];
    if (!searchTerm) {
      results = id === 'graph' ? allFiles.filter(f => f.type === 'tag') : allFiles;
    } else {
      const lower = searchTerm.toLowerCase();
      results = allFiles.filter(f => 
        f.name.toLowerCase().includes(lower) || 
        (f.id && f.id.toLowerCase().includes(lower))
      );
      if (id === 'graph') {
        results = results.filter(f => f.type === 'tag');
      }
    }
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }, [allFiles, searchTerm, id]);

  if (isMobile) return <>{children}</>;

  return (
    <div className={`window-frame ${isMaximized ? 'maximized' : ''} ${isHidden ? 'hidden-window' : ''}`} data-id={id}>
      <div className="window-title-bar">
        {/* Render Title Bar based on window type */}
        {(id === 'editor' || id === 'graph') ? (
          <>
            {/* Left: Fixed Prefix */}
            <div className="window-title-prefix">{prefix || (id === 'graph' ? 'Graph' : '')}</div>

            {/* Center: Interactive Subject Box */}
            <div className="window-title-content" ref={searchRef}>
              {isSearchOpen ? (
                <div className="window-search-active">
                  <Search size={14} color="var(--colorbutton)" className="search-icon-inside" />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder={id === 'graph' ? "Search tags..." : "Search notes..."} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsSearchOpen(false);
                    }}
                    className="window-inline-search"
                  />
                  {isSearchOpen && (
                    <div className="search-results-dropdown">
                      <div className="search-results">
                        {filteredFiles.length > 0 ? (
                          filteredFiles.map((file) => (
                            <div 
                              key={file.id} 
                              className={`search-item ${file.type === 'tag' ? 'is-tag' : ''}`}
                              onClick={() => {
                                onSelectFile(file);
                                setIsSearchOpen(false);
                                setSearchTerm('');
                              }}
                            >
                              {file.type === 'tag' ? file.name : file.name.replace('.md', '')}
                            </div>
                          ))
                        ) : (
                          <div className="search-no-results">No results found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="window-title-box clickable"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setSearchTerm('');
                  }}
                >
                  <span className="window-title-text">{subject}</span>
                  <Search size={12} color="var(--colorbutton)" className="title-search-hint" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* For PDF and Chat: Just show the full title on the left as a fixed label */
          <div className="window-title-fixed">{title}</div>
        )}

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
          position: relative;
          height: 36px;
          padding: 0 12px;
          background: rgba(255, 250, 205, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--colorborder);
          user-select: none;
        }

        .window-title-prefix {
          font-family: 'Prata', serif;
          font-size: 0.8rem;
          color: var(--colorbutton);
          opacity: 0.4;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 100px;
          z-index: 1;
        }

        .window-title-fixed {
          font-family: 'Prata', serif;
          font-size: 0.85rem;
          color: var(--colorbutton);
          opacity: 0.7;
          white-space: nowrap;
          flex-shrink: 0;
          z-index: 1;
        }

        .window-title-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          margin: 0 15px;
          z-index: 10;
          min-width: 0;
        }

        .window-title-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 2px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          transition: all 0.2s;
          width: 100%;
          max-width: 600px;
          height: 26px;
        }

        .window-title-box.clickable {
          cursor: pointer;
        }

        .window-title-box.clickable:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 250, 205, 0.3);
        }

        .window-title-text {
          font-family: 'Prata', serif;
          font-size: 0.85rem;
          color: var(--colorbutton);
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title-search-hint {
          stroke: var(--colorbutton);
          opacity: 0.5;
        }

        .window-search-active {
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--colortab);
          border: 1px solid rgba(255, 250, 205, 0.4);
          border-radius: 6px;
          padding: 2px 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .search-icon-inside {
          stroke: var(--colorbutton);
          opacity: 0.5;
        }

        .window-inline-search {
          background: transparent;
          border: none;
          color: var(--colorbutton);
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          width: 100%;
          height: 24px;
        }

        .window-inline-search::placeholder {
          color: var(--colorbutton);
          opacity: 0.3;
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: -1px;
          right: -1px;
          background: var(--colortab);
          border: 1px solid var(--colorborder);
          border-radius: 8px;
          z-index: 2000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          animation: slideDown 0.2s ease-out;
        }

        .window-controls {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
          margin-left: auto;
          z-index: 1;
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

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-results {
          max-height: min(250px, 40vh);
          overflow-y: auto !important;
          scrollbar-width: thin !important;
          scrollbar-color: var(--colorborder) transparent !important;
        }

        .search-results::-webkit-scrollbar {
          display: block !important;
          width: 5px !important;
        }

        .search-results::-webkit-scrollbar-track {
          background: transparent !important;
        }

        .search-results::-webkit-scrollbar-thumb {
          background: var(--colorborder) !important;
          border-radius: 10px !important;
        }

        .search-item {
          padding: 10px 16px;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--colortext-markdown);
          transition: all 0.2s;
          border-left: 2px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item:hover {
          background: rgba(255, 250, 205, 0.1);
          color: var(--colorbutton);
          border-left-color: var(--colorbutton);
          padding-left: 20px;
        }

        .search-item.is-tag {
          color: #fece9e;
          font-style: italic;
        }

        .search-item.is-tag:hover {
          background: rgba(254, 206, 158, 0.1);
          border-left-color: #fece9e;
        }

        .search-no-results {
          padding: 20px;
          text-align: center;
          font-size: 0.8rem;
          opacity: 0.5;
          color: var(--colorbutton);
        }
      `}</style>
    </div>
  );
}
