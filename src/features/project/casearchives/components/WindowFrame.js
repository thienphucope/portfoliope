"use client";
import React from 'react';
import { Maximize2, Minimize2, X, Zap, Save, Pencil, Eye, MessageSquare, Plus, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Upload, Search, Pin, PinOff } from 'lucide-react';

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
  isHidden = false,
  isPinned = false,
  onTogglePin,
  onBarClick,
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
      {/* Grain effect overlay */}
      <div className="window-grain"></div>
      
      <div className="window-content">
        {children}
      </div>

      <div className="window-title-bar" onClick={onBarClick}>
        {/* Render Title Bar based on window type */}
        {(id === 'editor' || id === 'graph') ? (
          <>
            {/* Fixed Prefix - Now at top in vertical mode */}
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
                  <Search size={12} color="var(--colorbutton)" className="title-search-hint" />
                  <span className="window-title-text">{subject}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* For PDF and Chat: Just show the full title as a fixed label */
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
        </div>
      </div>

      <style jsx>{`
        .window-frame {
          display: flex;
          flex-direction: row;
          background: #0a0a0c;
          border: none;
          border-radius: 0;
          overflow: hidden;
          height: 100%;
          width: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
          container-type: inline-size;
        }

        .window-grain {
          position: absolute;
          inset: 0;
          z-index: 9999;
          opacity: 0.04;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .window-frame.hidden-window {
          display: none !important;
        }

        .window-frame.maximized {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          width: 100vw;
          height: 100vh;
        }

        .window-title-bar {
          position: relative;
          width: 38px;
          height: 100%;
          padding: 12px 0;
          background: rgba(255, 250, 205, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          border-left: none;
          user-select: none;
          flex-shrink: 0;
        }

        .window-title-prefix {
          font-family: 'Prata', serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--colorbutton);
          opacity: 1;
          white-space: nowrap;
          z-index: 1;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          margin-top: 15px;
          letter-spacing: 1px;
        }

        .window-title-fixed {
          font-family: 'Prata', serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--colorbutton);
          opacity: 1;
          white-space: nowrap;
          z-index: 1;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          margin-bottom: auto;
          margin-top: 10px;
          letter-spacing: 1px;
        }

        .window-title-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          margin: 15px 0;
          z-index: 10;
          min-height: 0;
        }

        .window-title-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          padding: 12px 2px;
          background: rgba(255, 250, 205, 0.12);
          border: 1px solid rgba(255, 250, 205, 0.2);
          border-radius: 20px;
          transition: all 0.2s;
          width: 28px;
          height: auto;
          max-height: 100%;
        }

        .window-title-box.clickable {
          cursor: pointer;
        }

        .window-title-box.clickable:hover {
          background: rgba(255, 250, 205, 0.2);
          border-color: rgba(255, 250, 205, 0.4);
        }

        .window-title-text {
          font-family: 'Prata', serif;
          font-size: 0.85rem;
          color: var(--colorbutton);
          opacity: 1;
          writing-mode: vertical-rl;
          transform: rotate(180deg) translateZ(0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .title-search-hint {
          stroke: var(--colorbutton);
          opacity: 1;
        }

        .window-search-active {
          position: absolute;
          right: 42px;
          top: 0;
          width: calc(100cqw - 60px);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 15, 15, 0.98);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 250, 205, 0.5);
          border-radius: 20px;
          padding: 6px 14px;
          box-shadow: -4px 4px 20px rgba(0,0,0,0.6);
          z-index: 100;
        }

        .search-icon-inside {
          stroke: var(--colorbutton);
          opacity: 1;
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
          opacity: 0.5;
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          background: #0a0a0c;
          border: 1px solid rgba(255, 250, 205, 0.3);
          border-radius: 8px;
          z-index: 2000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          animation: slideDown 0.2s ease-out;
        }

        .window-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
          margin-top: auto;
          z-index: 1;
        }

        .window-control-btn {
          background: transparent;
          border: none;
          color: var(--colorbutton);
          cursor: pointer;
          opacity: 1;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 4px;
        }

        .window-control-btn:hover:not(:disabled) {
          background: rgba(255, 250, 205, 0.15);
        }

        .window-control-btn:disabled {
          opacity: 0.2;
          cursor: default;
        }

        .pdf-page-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--colorbutton);
          opacity: 1;
        }

        .pdf-title-input {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: inherit;
          width: 28px;
          text-align: center;
          font-size: 11px;
          border-radius: 2px;
          outline: none;
        }

        .window-control-btn.active-mode {
          color: #fff;
          background: rgba(255, 250, 205, 0.3);
        }

        .control-separator {
          width: 18px;
          height: 2px;
          background: var(--colorborder);
          margin: 4px 0;
        }

        .window-control-btn.close-btn:hover {
          color: #ff4d4d;
        }

        .window-control-btn.pin-btn.pinned {
          color: var(--colorone, #ba9170);
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
