import React from 'react';

/**
 * Global styles component for the case vault UI.
 * Injected into the app shell to provide theme, layout, and responsive rules.
 */
export default function VaultStyles() {
  return (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');

        :root {
          --bg: #121212; --txt: #e0e0e0; --accent: #FFFACD;
          --border: rgba(255,255,255,0.1); --code-bg: #1e1e1e;
          --md-size: 19px; --md-line: 1.6;
        }

        body { margin:0; background:var(--bg); color:var(--colortext-markdown); font-family:'Inter',sans-serif; overflow:hidden; }

        /* Hide all scrollbars */
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

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
          color: var(--colortext-markdown);
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

        .file-list { flex:1; overflow-y:auto; padding:10px; }

        .main-content { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:10px 15px; background:var(--colortab); }
        .main-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .main-content::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }
        
        .markdown-container { max-width:1000px; width:100%; box-sizing:border-box; padding-bottom: 100px; background-color: var(--colortab); }

        .chat-panel { height:100dvh; background:var(--bg); flex-shrink:0; border-left:1px solid var(--border); overflow:hidden; }
        .chat-container { height:100%; width:100%; position:relative; }

        .resizer { width:4px; cursor:col-resize; background:var(--border); display:flex; align-items:center; justify-content:center; transition:background .2s,width .2s; user-select:none; z-index:10; }
        .resizer:hover { background:var(--accent); width:6px; }
        .divider-line { display:none; }

        /* ── BLOCK EDITOR ───────────────────────────────────────────────────── */

        .block-editor { width:100%; }

        .block-content {
          display: block;
          width: 100%;
          outline: none;
          border-radius: 4px;
          padding: 2px 4px;
          margin: 0; 
          transition: background .12s;
          border: 1px solid transparent;
          box-sizing: border-box;
          position: relative;
          overflow-wrap: break-word;
        }

        .block-content p:first-child { margin-top: 0; }
        /* Sync spacing between edit and view modes */
        .markdown-content p br {
          content: "";
          display: block;
          margin-bottom: 1.25em;
        }

        .block-view { cursor: default; width: 100%; display: block; }
        .block-view.editable-mode { cursor: text; min-height: 1.2em; }
        .block-view.editable-mode:hover { background: rgba(255,255,255,0.025); }

        .block-wrapper {
          position: relative;
          width: 100%;
          display: block;
        }

        .block-view-hidden {
          visibility: hidden;
          height: 0;
          overflow: hidden;
          pointer-events: none;
          position: absolute;
        }

        .active-block {
          position: relative;
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255,250,205,0.25);
          border-radius: 4px;
          outline: none;
          z-index: 5;
          box-sizing: border-box;
          padding: 2px 4px;
          text-align: left;
          box-shadow: none;
        }

        /* ── TEXTAREA EDITORS ──────────────────────────────────────────────── */

        .raw-text-editor {
          caret-color: var(--accent);
          cursor: text;
        }

        .raw-text-editor::before {
          content: attr(data-placeholder);
          position: absolute;
          left: 4px;
          top: 2px;
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
          line-height: var(--md-line);
          outline: none;
          caret-color: var(--accent);
          margin: 0;
          padding: 0;
        }
        .rte-empty {
          min-height: 1.6em;
          display: block;
        }
        .rte-p { margin-bottom: 1.25em; }
        .rte-h1 { font-size: 2.0em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .8em;  margin-bottom: .4em; }
        .rte-h2 { font-size: 1.6em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .7em;  margin-bottom: .3em; }
        .rte-h3 { font-size: 1.2em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .6em;  margin-bottom: .2em; }
        .rte-h4 { font-size: 1.05em; font-weight: 700; color: #fff; }
        .rte-h5 { font-size: 1em;    font-weight: 700; color: #ddd; }
        .rte-h6 { font-size: 0.9em; font-weight: 900; color: #fff; font-style: italic; letter-spacing: -0.02em; white-space: pre-wrap; }
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
          padding: 15px; /* Match pre padding */
          color: var(--colortext-markdown);
          caret-color: var(--accent);
          white-space: pre-wrap;
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
          overflow-wrap: break-word;
        }

        /* Override highlight.js background */
        pre, code, .hljs { background: transparent !important; }
        pre code { background: transparent !important; }
        .code-block pre { background: transparent !important; }
        .code-block code { background: transparent !important; }
        .hljs { color: var(--colortext-markdown) !important; }

        .code-raw-editor:focus {
          border-color: rgba(255, 250, 205, 0.4);
          outline: none;
        }

        .status-msg { opacity:.4; font-family:'Inter',sans-serif; font-size:13px; padding:20px 0; }

        /* Password modal */
        .pass-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: var(--colortab); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .pass-modal {
          background: var(--colortab); border: 1px solid var(--colortext-spine);
          border-radius: 12px; padding: 24px 28px; min-width: 300px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        }
        .pass-modal__title { font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:var(--colortext-spine); }
        .pass-modal__input {
          background: rgba(255,255,255,0.05); border: 1px solid var(--colortext-spine);
          border-radius: 8px; padding: 10px 14px; color: var(--colortext-spine);
          font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
          caret-color: var(--colortext-spine);
        }
        .pass-modal__input:focus { border-color: var(--colortext-spine); }
        .pass-modal__hint { font-size: 11px; opacity: 0.6; font-family:'Inter',sans-serif; color: var(--colortext-spine); }

        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--md-font); font-size:var(--md-size); line-height:var(--md-line); color:var(--colortext-markdown); text-align: justify; }
        .markdown-content h1 { font-size:2.0em; margin:.8em 0 .4em; color:#fff; font-weight:700; text-align: left; }
        .markdown-content h2 { font-size:1.6em; margin:.7em 0 .3em; color:#fff; font-weight:700; text-align: left; }
        .markdown-content h3 { font-size:1.2em; margin:.6em 0 .2em; color:#fff; font-weight:700; }
        .markdown-content h6.fit-heading {
          display: block;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          font-family: var(--md-font);
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
          color:var(--colorlink); text-decoration:none; border-bottom:1px dotted var(--colorlink);
          padding-right:14px; position:relative; cursor:pointer;
          transition: opacity 0.2s;
        }
        .markdown-content a::after, .internal-link::after {
          content:'↗'; position:absolute; right:0; top:-2px; font-size:.75em; opacity:.7;
        }
        .internal-link.is-missing {
          opacity: 0.5;
          cursor: help;
        }
        .internal-link.is-missing::after {
          content: '?';
        }

        .table-container { width:100%; overflow-x:auto; margin:1.5em 0; display:block; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.03) transparent; }
        .table-container::-webkit-scrollbar { height:1px; }
        .table-container::-webkit-scrollbar-thumb { background:rgba(255,255,255,.03); border-radius:10px; }
        table { width:100%; border-collapse:collapse; }
        th, td { padding:10px 14px; border:none; text-align:left; white-space:nowrap; }
        thead { border-bottom:1px solid var(--border); }
        th { color:#fff; font-weight:700; }

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

        .math-block { margin:1.5em 0; overflow-x:auto; display:block; width:100%; }
        .code-block { background:transparent; border-radius:0; margin:1.5em 0; border:1px solid white; overflow:visible; position:relative; border-top-right-radius:8px; }
        .code-header { display:none; }
        .code-lang, .code-lang-label { font-size:11px; color:#888; text-transform:uppercase; }
        .code-lang-label { position:absolute; top:-18px; right:8px; background:transparent; padding:0; z-index:1; }
        pre { margin:0; padding:15px; overflow-x:auto; background:transparent; }
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
          min-width: 200px;
          max-height: 240px;
          overflow-y: auto;
          padding: 6px;
          scrollbar-width: thin;
          scrollbar-color: var(--accent) transparent;
        }
        .slash-menu::-webkit-scrollbar {
          width: 4px;
        }
        .slash-menu::-webkit-scrollbar-thumb {
          background: var(--accent);
          border-radius: 10px;
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
          .main-content { padding:10px 10px; }
          :root { --md-size: clamp(17px, 1.5vw + 10px, 22px); }
          .markdown-content h1 { font-size:1.8em; }
          .markdown-content h2 { font-size:1.5em; }
          .markdown-content h3 { font-size:1.2em; }
          .tree-item { font-size:clamp(13px,1vw + 10px,16px); }
        }

        /* ── CASE CLIENT ACCORDION STYLES ──────────────────────────────────── */
        
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
        
        /* Force transparent backgrounds for all vault content */
        body, .app-shell, .main-content, .sidebar-panel, .chat-panel, 
        .chat-container, .markdown-container, .file-list, .prose {
          background: transparent !important;
        }

        .accordion-app {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          overflow-x: auto;
          overflow-y: hidden;
          background: transparent;
        }

        .case-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh;
          z-index: -2;
          pointer-events: none;
          overflow: hidden;
          background: black;
        }
        .case-background img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100dvh;
          transform: translate(-50%, -50%) scale(1.5);
          object-fit: cover;
        }
        @media (max-aspect-ratio: 16/9) {
          .case-background img {
            width: 177.78vh;
            height: 100dvh;
          }
        }
        @media (min-aspect-ratio: 16/9) {
          .case-background img {
            width: 100vw;
            height: 56.25vw;
          }
        }
        .video-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); pointer-events: none; }

        /* Hide scrollbar for accordion app container itself */
        .accordion-app::-webkit-scrollbar {
          display: none;
        }

        .sticky-spine {
          position: sticky;
          left: 0;
          z-index: 50;
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          flex-shrink: 0;
          background-color: var(--colorone);
          border-right: 2px solid var(--colorborder);
          cursor: default;
          isolation: isolate;
        }

        .spine-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-note-btn, .filetree-btn, .chatvault-btn {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: absolute;
          color: var(--colorbutton);
          font-weight: bold;
          font-size: 20px;
          z-index: 100;
          transition: transform 0.2s, opacity 0.2s;
        }
        .add-note-btn:hover, .filetree-btn:hover, .chatvault-btn:hover {
          opacity: 0.7;
          transform: scale(1.1);
        }

        .add-note-btn { top: 40px; }
        .filetree-btn { top: 140px; }
        .chatvault-btn { top: 240px; }

        .acc-ope {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 2.8rem;
          color: var(--colortext-spine);
          mix-blend-mode: destination-out;
          user-select: none;
          cursor: pointer;
          margin-top: auto;
          margin-bottom: 30px;
          position: relative;
        }
        .ope-txt {
          writing-mode: vertical-rl;
          white-space: nowrap;
          letter-spacing: 2px;
          transition: opacity 0.3s ease;
          opacity: 0;
          position: absolute;
          pointer-events: none;
        }
        .ope-txt-archive {
          writing-mode: vertical-rl;
          white-space: nowrap;
          letter-spacing: 2px;
          transition: opacity 0.3s ease;
          opacity: 1;
        }
        .acc-ope:hover .ope-txt {
          opacity: 1;
          pointer-events: auto;
        }
        .acc-ope:hover .ope-txt-archive {
          opacity: 0;
          pointer-events: none;
        }

        .acc-panel {
          display: flex;
          flex-direction: row;
          height: 100%;
          transition: flex-basis 1s cubic-bezier(0.25, 0.8, 0.25, 1), min-width 1s cubic-bezier(0.25, 0.8, 0.25, 1), flex-grow 1s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 1s, opacity 0.5s, border-color 0.3s;
          border-right: 2px solid var(--colorborder);
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Ẩn title các thanh tab khi hover vào content */
        .accordion-app:has(.acc-content:hover) .acc-panel:not(.sticky-spine) {
          border-right-color: var(--colortab) !important;
        }
        .accordion-app:has(.acc-content:hover) .acc-spine {
          opacity: 0 !important;
        }


        .acc-panel.closed {
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          background-color: var(--colortab);
          cursor: pointer;
          isolation: isolate;
        }

        /* Completely hide File Tree and Chat spines as they're now accessible via buttons */
        .acc-panel.tab-filetree.closed,
        .acc-panel.tab-chat.closed {
          display: none !important;
        }

        .acc-panel.open {
          /* Để hở ra khoảng 450px cho các spine khác */
          flex-basis: calc(100vw - 450px);
          min-width: calc(100vw - 450px);
          flex-grow: 1;
          background-color: transparent;
        }

        /* Overlay Mode for File Tree and Chat */
        .filetree-active .acc-panel.closed,
        .chat-active .acc-panel.closed {
          opacity: 0;
          pointer-events: none;
        }

        .filetree-active .acc-panel.open:not(.tab-filetree),
        .chat-active .acc-panel.open:not(.tab-chat) {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .acc-panel.tab-filetree.open,
        .acc-panel.tab-chat.open {
          position: fixed;
          left: 150px;
          top: 0;
          width: calc(100vw - 150px);
          height: 100vh;
          z-index: 45;
          flex-basis: auto !important;
          min-width: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-right: none;
        }

        .acc-panel.tab-filetree .acc-spine-container,
        .acc-panel.tab-chat .acc-spine-container {
          display: none;
        }

        .acc-panel.tab-filetree .acc-content,
        .acc-panel.tab-chat .acc-content {
          width: 100%;
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

        .pc-only {
          display: flex !important;
        }

        .acc-spine-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: var(--colortab);
          cursor: pointer;
          display: flex;
          align-items: top;
          padding-top: 3rem;
          justify-content: center;
          isolation: isolate;
        }

        .acc-spine {
          writing-mode: vertical-rl;
          font-family: var(--font-display);
          font-size: 3rem;
          color: var(--colortext-spine);
          mix-blend-mode: destination-out;
          white-space: nowrap;
          letter-spacing: 2px;
          user-select: none;
          transition: opacity 0.3s ease;
        }
        
        .acc-ope-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: var(--colorspine);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        .acc-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: calc(100% - 150px);
          animation: fadeIn 1s ease forwards 0.5s;
          opacity: 0;
          position: relative;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .acc-body {
          flex: 1;
          overflow: hidden; 
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: var(--colortab);
        }

        /* Hide all scrollbars inside panel bodies */
        .acc-body *::-webkit-scrollbar {
          display: none !important;
        }
        .acc-body * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .floating-actions {
          position: absolute;
          top: 15px;
          right: 30px;
          display: flex;
          gap: 10px;
          z-index: 100;
        }

        .mobile-back-btn {
          display: none;
        }

        @media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
          .accordion-app {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }

          .accordion-app.has-active {
            overflow: hidden !important;
          }

          .sticky-spine {
            position: fixed !important;
            top: 0;
            left: 0;
            z-index: 1000;
            width: 100% !important;
            height: 50px !important;
            flex: 0 0 50px !important;
            min-width: 0 !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
            transition: transform 0.3s ease;
          }

          .header-hidden {
            transform: translateY(-100%);
          }

          .acc-ope-container {
            flex: 1 !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            align-items: center !important;
            justify-content: flex-start !important;
          }

          .spine-content {
            flex-direction: row !important;
            width: 100% !important;
            height: 100% !important;
            justify-content: flex-start !important;
            align-items: center !important;
            position: relative !important;
            padding: 0 20px !important;
          }

          .acc-ope {
            flex-direction: row !important;
            gap: 10px !important;
            position: static !important;
            font-size: 1.4rem !important;
            letter-spacing: 1px !important;
            text-align: left !important;
            margin: 0 !important;
            cursor: pointer;
          }

          .ope-txt {
            writing-mode: horizontal-tb !important;
            white-space: nowrap !important;
            transition: opacity 0.3s ease;
            opacity: 0;
            position: absolute;
            pointer-events: none;
          }

          .ope-txt-archive {
            writing-mode: horizontal-tb !important;
            white-space: nowrap !important;
            transition: opacity 0.3s ease;
            opacity: 1;
          }

          .acc-ope:hover .ope-txt {
            opacity: 1;
            pointer-events: auto;
          }

          .acc-ope:hover .ope-txt-archive {
            opacity: 0;
            pointer-events: none;
          }

          .mobile-back-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1001;
            color: black;
            mix-blend-mode: destination-out;
            cursor: pointer;
          }

          .add-note-btn, .filetree-btn, .chatvault-btn {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            margin: 0 !important;
            width: 32px !important;
            height: 32px !important;
            font-size: 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: opacity 0.2s !important;
          }

          .add-note-btn svg, .filetree-btn svg, .chatvault-btn svg {
            width: 22px !important;
            height: 22px !important;
          }

          .add-note-btn {
            right: 20px !important;
            left: auto !important;
          }
          .chatvault-btn {
            right: 60px !important;
          }
          .filetree-btn {
            right: 100px !important;
          }

          .acc-panel {
            width: 100% !important;
            flex-direction: column !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          .acc-panel.closed {
            flex: 0 0 50px !important;
            min-width: 0 !important;
            height: 50px !important;
          }

          .accordion-app.has-active .acc-panel.closed {
            display: none !important;
          }

          .acc-panel.open {
            flex: 1 !important;
            min-width: 0 !important;
            height: calc(100vh - 60px) !important;
          }

          .acc-spine-container {
            flex: 0 0 50px !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            justify-content: flex-start !important;
            align-items: center !important;
            padding-left: 20px !important;
            position: relative !important;
          }

          .acc-spine {
            writing-mode: horizontal-tb !important;
            font-size: 1.1rem !important;
            letter-spacing: 1px !important;
          }

          .acc-content {
            width: 100% !important;
            height: calc(100% - 50px) !important;
            flex: 1 !important;
            animation: none !important;
            opacity: 1 !important;
          }

          .acc-body {
            height: 100% !important;
            flex: 1 !important;
            overflow: hidden !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }
          
          .main-content {
            padding: 0 !important;
            overflow: hidden !important;
          }

          .markdown-container {
            padding: 0 8px 100px !important;
            overscroll-behavior: contain;
          }

          .floating-actions {
            top: 10px !important;
            right: 15px !important;
          }
          
          .video-background iframe {
            transform: translate(-50%, -50%) scale(2.5) !important;
          }

          .pc-only {
            display: none !important;
          }

          .acc-panel.tab-filetree.open,
          .acc-panel.tab-chat.open {
            position: relative !important;
            left: 0 !important;
            width: 100% !important;
            height: calc(100vh - 60px) !important;
            backdrop-filter: none !important;
          }

          .acc-panel.tab-filetree .acc-spine-container,
          .acc-panel.tab-chat .acc-spine-container {
            display: flex !important;
          }

          .acc-panel.tab-filetree .file-list {
            display: flex !important;
            flex-direction: column !important;
            padding: 20px !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            column-width: auto !important;
          }

          .acc-panel.tab-filetree .file-list > div {
            flex: 0 0 auto !important;
            width: 100% !important;
            margin-bottom: 20px !important;
          }

          .filetree-active .acc-panel.open:not(.tab-filetree),
          .chat-active .acc-panel.open:not(.tab-chat) {
            display: none !important;
          }

          .mobile-read-more {
            display: flex !important;
          }
        }

          .mobile-footer {
            display: none;
          }

          @media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
            .mobile-footer {
              display: flex;
              flex-direction: column-reverse;
              align-items: flex-end;
              position: fixed;
              bottom: calc(30px + env(safe-area-inset-bottom));
              right: 20px;
              width: auto;
              height: auto;
              background: transparent;
              z-index: 2000;
              border-top: none;
              padding: 0;
              gap: 16px;
              pointer-events: none; /* Tránh chặn thao tác vuốt của ngón cái ở vùng trống */
            }

            .assistive-ball {
              width: 48px;
              height: 48px;
              background: var(--colortab);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--colorbutton);
              box-shadow: 0 6px 20px rgba(0,0,0,0.6);
              cursor: pointer;
              z-index: 2001;
              transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              pointer-events: auto; /* Chỉ cho phép tương tác tại quả cầu */
            }

            .assistive-ball.at-bottom {
              width: auto;
              min-width: 48px;
              border-radius: 24px;
              padding: 0;
            }

            .footer-expanded-content {
              display: none;
              flex-direction: column-reverse;
              align-items: flex-end;
              gap: 12px;
              opacity: 0;
              transform: translateY(20px) scale(0.8);
              pointer-events: none;
              transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .footer-expanded-content.active {
              display: flex;
              opacity: 1;
              transform: translateY(0) scale(1);
              pointer-events: auto;
            }
            
            .footer-item-wrapper {
              display: flex;
              align-items: center;
              cursor: pointer;
              transition: transform 0.2s;
            }
            
            .footer-item-wrapper:active {
              transform: scale(0.95);
            }

            .footer-item {
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--colortab);
              height: 48px;
              padding: 0 18px;
              background: var(--colorbutton);
              border-radius: 24px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              gap: 12px;
              white-space: nowrap;
            }

            .footer-item-label {
              font-family: var(--font-display);
              font-size: 1.1rem;
              color: var(--colortab);
              margin-top: 2px;
            }
            
            .footer-item.active-action {
              background: white;
            }
            .footer-item.active-action .footer-item-label {
              color: black;
            }

            .add-note-btn, .filetree-btn, .chatvault-btn, .mobile-back-btn, .comment-trigger {
              display: none !important;
            }

            .acc-panel.open {
              height: calc(100vh - 60px) !important;
            }
            
            .acc-panel.tab-filetree.open,
            .acc-panel.tab-chat.open {
               height: calc(100vh - 60px) !important;
            }
          }
      `}</style>
  );
}
