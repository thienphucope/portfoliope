import React from 'react';

export default function VaultStyles() {
  return (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&display=swap');

        :root {
          --bg: #121212; --txt: #e0e0e0; --accent: #FFFACD;
          --border: rgba(255,255,255,0.1); --code-bg: #1e1e1e;
          --md-font: 'Crimson Text', serif; --md-size: 19px; --md-line: 1.6;
        }

        body { margin:0; background:var(--bg); color:var(--txt); font-family:'Inter',sans-serif; overflow:hidden; }

        .app-shell { height:100dvh; width:100vw; display:flex; background:var(--bg); overflow:hidden; }

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

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: color .15s, background .15s, border-color .15s;
          padding: 0;
          flex-shrink: 0;
        }
        .icon-btn:hover {
          color: var(--txt);
          background: rgba(255,255,255,0.07);
          border-color: var(--border);
        }
        .icon-btn--active {
          color: var(--accent);
          background: rgba(255,250,205,0.08);
          border-color: rgba(255,250,205,0.2);
        }
        .icon-btn--saved { color: #7dda7d; }
        .icon-btn--error { color: #e07070; }
        .icon-btn--saving { opacity: 0.5; cursor: default; }
        .icon-btn:disabled { cursor: default; }

        .file-list { flex:1; overflow-y:auto; padding:10px; scrollbar-width:none; }
        .file-list::-webkit-scrollbar { display:none; }

        .main-content { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:0px 15px; scrollbar-width:none; background:var(--bg); }
        .main-content::-webkit-scrollbar { display:none; }
        .markdown-container { max-width:1000px; width:100%; box-sizing:border-box; }

        .chat-panel { height:100dvh; background:var(--bg); flex-shrink:0; border-left:1px solid var(--border); overflow:hidden; }
        .chat-container { height:100%; width:100%; position:relative; }

        .resizer { width:4px; cursor:col-resize; background:var(--border); display:flex; align-items:center; justify-content:center; transition:background .2s,width .2s; user-select:none; z-index:10; }
        .resizer:hover { background:var(--accent); width:6px; }
        .divider-line { display:none; }

        /* ── BLOCK EDITOR ───────────────────────────────────────────────────── */

        .block-editor { width:100%; }

        .block-content {
          outline: none;
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0 -4px;
          transition: background .12s;
        }

        .block-content p:first-child { margin-top: 0; }
        .block-content p:last-child  { margin-bottom: 0; }

        .block-view { cursor: default; }
        .block-view.editable-mode { cursor: text; }
        .block-view.editable-mode:hover { background: rgba(255,255,255,0.025); }

        .block-wrapper {
          position: relative;
        }

        .block-view-hidden {
          visibility: hidden;
          pointer-events: none;
          user-select: none;
        }

        .active-block {
          position: absolute;
          top: 0;
          left: -4px;
          right: -4px;
          width: calc(100% + 8px);
          min-height: 100%;
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
          outline: none;
          z-index: 10;
          box-sizing: border-box;
        }

        /* ── TEXTAREA EDITORS ──────────────────────────────────────────────── */

        .raw-text-editor {
          background: rgba(18,18,18,0.98);
          border: 1px solid rgba(255,250,205,0.2);
          border-radius: 4px;
          padding: 4px 8px;
          caret-color: var(--accent);
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          cursor: text;
          position: relative;
        }

        .raw-text-editor::before {
          content: attr(data-placeholder);
          position: absolute;
          left: 8px;
          top: 4px;
          color: rgba(255, 255, 255, 0.25);
          pointer-events: none;
          font-family: var(--md-font);
          font-size: var(--md-size);
          font-style: italic;
          display: none;
        }
        .raw-text-editor.is-empty::before {
          display: block;
        }

        .raw-text-editor:focus-within {
          border-color: rgba(255, 250, 205, 0.35);
          outline: none;
        }

        .rte-line {
          display: block;
          white-space: pre-wrap;
          word-break: break-word;
          min-height: 1.6em;
          outline: none;
          caret-color: var(--accent);
        }
        .rte-empty {
          min-height: 1.6em;
          display: block;
        }
        .rte-h1 { font-size: 2.0em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .8em;  margin-bottom: .4em; }
        .rte-h2 { font-size: 1.6em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .7em;  margin-bottom: .3em; }
        .rte-h3 { font-size: 1.2em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .6em;  margin-bottom: .2em; }
        .rte-h4 { font-size: 1.05em; font-weight: 700; color: #fff; }
        .rte-h5 { font-size: 1em;    font-weight: 700; color: #ddd; }
        .rte-h6 { font-size: 0.9em; font-weight: 900; color: #fff; font-style: italic; letter-spacing: -0.02em; white-space: nowrap; }
        .rte-ul, .rte-ol { padding-left: 1.8em; text-indent: -1.8em; margin-bottom: 0.3em; }
        .rte-blockquote { border-left: 3px solid var(--accent); padding-left: 1.25em; margin-left: 0; font-style: italic; opacity: 0.8; }
        .rte-codefence { font-family: monospace; font-size: 0.85em; opacity: 0.55; background: rgba(255,255,255,0.03); border-radius: 3px; }
        .rte-hr { border: none; border-bottom: 1px solid var(--border); margin: 0.4em 0; }

        .code-raw-editor {
          resize: none;
          overflow: hidden;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.5;
          background: var(--code-bg);
          border: 1px solid rgba(255,250,205,0.2);
          border-radius: 4px;
          padding: 10px;
          color: var(--txt);
          caret-color: var(--accent);
          white-space: pre;
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }

        .code-raw-editor:focus {
          border-color: rgba(255, 250, 205, 0.4);
          outline: none;
        }

        .status-msg { opacity:.4; font-family:'Inter',sans-serif; font-size:13px; padding:20px 0; }

        /* Password modal */
        .pass-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .pass-modal {
          background: #1a1a1a; border: 1px solid rgba(255,250,205,0.25);
          border-radius: 12px; padding: 24px 28px; min-width: 300px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        }
        .pass-modal__title { font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:var(--accent); }
        .pass-modal__input {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 14px; color: var(--txt);
          font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
          caret-color: var(--accent);
        }
        .pass-modal__input:focus { border-color: rgba(255,250,205,0.4); }
        .pass-modal__hint { font-size: 11px; opacity: 0.4; font-family:'Inter',sans-serif; }

        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--md-font); font-size:var(--md-size); line-height:var(--md-line); color:var(--txt); text-align: justify; }
        .markdown-content h1 { font-size:2.0em; margin:.8em 0 .4em; color:#fff; font-weight:700; }
        .markdown-content h2 { font-size:1.6em; margin:.7em 0 .3em; color:#fff; font-weight:700; }
        .markdown-content h3 { font-size:1.2em; margin:.6em 0 .2em; color:#fff; font-weight:700; }
        .markdown-content h6.fit-heading {
          display: block;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          font-family: 'Crimson Text', serif;
          font-weight: 900;
          font-style: italic;
          color: #fff;
          line-height: 1;
          margin: 0.3em 0;
          letter-spacing: -0.03em;
          opacity: 0.95;
        }
        .markdown-content p  { margin-bottom:1.25em; }

        /* ── LISTS ────────────────────────────────────────────────────────── */
        .markdown-content ul {
          list-style-type: disc;
          margin: 0.5em 0 1.25em 0;
          padding-left: 1.8em;
        }
        .markdown-content ol {
          list-style-type: decimal;
          margin: 0.5em 0 1.25em 0;
          padding-left: 1.8em;
        }
        .markdown-content li {
          margin-bottom: 0.3em;
          line-height: var(--md-line);
        }
        .markdown-content li > ul,
        .markdown-content li > ol {
          margin-top: 0.3em;
          margin-bottom: 0.3em;
        }
        .markdown-content ul ul { list-style-type: circle; }
        .markdown-content ul ul ul { list-style-type: square; }

        .markdown-content li input[type="checkbox"] {
          margin-right: 0.5em;
          accent-color: var(--accent);
        }

        .markdown-content a, .internal-link {
          color:var(--accent); text-decoration:none; border-bottom:1px dotted var(--accent);
          padding-right:14px; position:relative; cursor:pointer;
        }
        .markdown-content a::after, .internal-link::after {
          content:'↗'; position:absolute; right:0; top:-2px; font-size:.75em; opacity:.7;
        }

        .table-container { width:100%; overflow-x:auto; margin:1.5em 0; display:block; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.03) transparent; }
        .table-container::-webkit-scrollbar { height:1px; }
        .table-container::-webkit-scrollbar-thumb { background:rgba(255,255,255,.03); border-radius:10px; }
        table { width:100%; border-collapse:collapse; }
        th, td { padding:10px 14px; border:none; text-align:left; white-space:nowrap; }
        thead { border-bottom:1px solid var(--border); }
        th { color:#fff; font-weight:700; }

        .tree-item { display:flex; align-items:center; padding:6px 8px; cursor:pointer; border-radius:4px; transition:.2s; font-size:14px; opacity:.7; font-family:'Crimson Text',serif; }
        .tree-item:hover { background:rgba(255,255,255,.05); opacity:1; color:var(--accent); }
        .tree-item.is-active { background:rgba(255,250,205,0.08); opacity:1; color:var(--accent); border-left:2px solid var(--accent); padding-left:6px; }
        .tree-item.is-local { opacity:0.85; font-style:italic; }
        .local-badge { margin-left:auto; font-size:8px; color:var(--accent); opacity:0.7; flex-shrink:0; }
        .arrow-wrapper { width:18px; margin-right:4px; display:flex; justify-content:center; }
        .spacer { width:18px; }

        .math-block { margin:1.5em 0; overflow-x:auto; display:block; width:100%; }
        .code-block { background:var(--code-bg); border-radius:8px; margin:1.5em 0; border:1px solid var(--border); overflow:hidden; }
        .code-header { background:#2a2a2a; padding:5px 15px; display:flex; justify-content:flex-end; border-bottom:1px solid var(--border); }
        .code-lang { font-size:11px; color:#888; text-transform:uppercase; }
        pre { margin:0; padding:15px; overflow-x:auto; }
        .mermaid { background:rgba(255,255,255,.02); padding:20px; border-radius:8px; margin:1.5em 0; display:flex; justify-content:center; }
        blockquote { border-left:3px solid var(--accent); padding-left:1.25em; margin:1.5em 0; font-style:italic; opacity:.8; }
        blockquote blockquote { border-left-color:rgba(255,255,255,.2); margin-left:1em; }
        .img-circle { border-radius:50%; aspect-ratio:1/1; object-fit:cover; max-width:200px; display:block; margin:2em auto; }
        img { max-width:100%; border-radius:8px; margin:1.5em 0; }
        .video-container { position:relative; padding-bottom:56.25%; height:0; margin:1.5em 0; }
        .video-container iframe { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:8px; pointer-events: none; }
        .video-container.interactable iframe { pointer-events: auto; }

        /* ── SLASH MENU ─────────────────────────────────────────────────────── */
        .slash-menu {
          position: fixed;
          background: #1e1e1e;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 1000;
          min-width: 180px;
          max-height: 300px;
          overflow-y: auto;
          padding: 6px;
        }
        .slash-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          transition: background 0.1s, color 0.1s;
        }
        .slash-item:hover, .slash-item--active {
          background: rgba(255,250,205,0.1);
          color: var(--accent);
        }
        .slash-item__icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
        }

        /* MOBILE & TABLET PORTRAIT */
        @media (max-width:1024px),(orientation:portrait) {
          .app-shell { overflow-x:auto !important; overflow-y:hidden !important; scroll-snap-type:x mandatory; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; display:flex !important; flex-wrap:nowrap !important; }
          .sidebar-panel,.main-content,.chat-panel { width:100vw !important; min-width:100vw !important; flex-shrink:0 !important; scroll-snap-align:center; position:relative !important; height:100dvh !important; }
          .resizer { display:none !important; }
          .main-content { padding:0px 15px; }
          :root { --md-size: clamp(17px, 1.5vw + 10px, 22px); }
          .markdown-content h1 { font-size:1.8em; }
          .markdown-content h2 { font-size:1.5em; }
          .markdown-content h3 { font-size:1.2em; }
          .tree-item { font-size:clamp(13px,1vw + 10px,16px); }
        }
      `}</style>
  );
}
