import React from 'react';

export default function FileTreeStyles() {
  return (
    <style jsx global>{`
        .sidebar-panel { height:100dvh; background:var(--bg); display:flex; flex-direction:column; flex-shrink:0; }
        .sidebar-brand {
          padding: 14px 16px;
          font-weight: 600;
          letter-spacing: 2px;
          border-bottom: 1px solid var(--border);
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .brand-text { flex: 1; font-size: 13px; }
        .brand-actions { display: flex; align-items: center; gap: 4px; }

        .file-list { flex:1; overflow-y:auto; padding:10px; }

        /* Completely hide overlay spines as they're now accessible via buttons */
        .acc-panel.tab-filetree.closed,
        .acc-panel.tab-chat.closed,
        .acc-panel.tab-pdf.closed {
          display: none !important;
        }

        .acc-panel.tab-filetree.open {
          position: fixed;
          left: 84.375px;
          top: 0;
          width: calc(100vw - 84.375px);
          height: 100vh;
          z-index: 45;
          flex-basis: auto !important;
          min-width: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-right: none;
        }

        .acc-panel.tab-filetree .acc-content {
          width: 100%;
        }

        /* Overlay Mode for File Tree: Hide other panels */
        .filetree-active .acc-panel.closed {
          opacity: 0;
          pointer-events: none;
        }

        .filetree-active .acc-panel.open:not(.tab-filetree) {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .acc-panel.tab-filetree .file-list {
          display: block !important;
          column-width: 280px;
          column-gap: 60px;
          height: 100%;
          padding: 60px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
        }

        /* Top level items in file list should not break across columns */
        .acc-panel.tab-filetree .file-list > div {
          break-inside: avoid;
          margin-bottom: 30px;
        }

        /* Ensure links and text are readable against video */
        .acc-panel.tab-filetree .file-list * {
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .tree-item { display:flex; align-items:center; padding:6px 8px; cursor:pointer; border-radius:4px; transition:.2s; font-size:18px; opacity:.7; font-family:'Crimson Text',serif; }
        .tree-item:hover { background:rgba(255,255,255,.05); opacity:1; color:var(--accent); }
        .tree-item.is-active { background:rgba(255,250,205,0.08); opacity:1; color:var(--accent); border-left:2px solid var(--accent); padding-left:6px; }
        .tree-item.is-local { opacity:0.85; font-style:italic; }
        
        .file-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .tree-item:hover .file-actions {
          opacity: 1;
        }
        .file-action-icon {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .file-action-icon:hover {
          opacity: 1;
          color: var(--accent);
        }

        .local-badge { margin-left: 8px; font-size:8px; color:var(--accent); opacity:0.7; flex-shrink:0; }
        .arrow-wrapper { width:24px; margin-right:4px; display:flex; justify-content:center; }
        .spacer { width:24px; }

        .floating-actions {
          position: absolute;
          top: 15px;
          right: 30px;
          display: flex;
          gap: 10px;
          z-index: 100;
        }
    `}</style>
  );
}
