import React from 'react';

export default function EditorStyles() {
  return (
    <style jsx global>{`
        /* ── BLOCK EDITOR ───────────────────────────────────────────────────── */

        .block-editor { width:100%; }

        .block-content {
          display: block;
          width: 100%;
          outline: none;
          border-radius: 0;
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
          border-radius: 0;
          outline: none;
          z-index: 5;
          box-sizing: border-box;
          padding: 2px 4px;
          text-align: left;
          box-shadow: none;
        }

        .block-reading-highlight {
          background-color: var(--theme) !important;
          color: var(--background) !important;
          border-radius: 0;
          transition: background-color 0.3s ease, color 0.3s ease;
          box-shadow: 0 0 12px var(--theme);
          padding: 4px 8px;
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
          font-family: var(--font-body);
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
        .rte-codefence { font-family: var(--font-mono); font-size: 0.85em; opacity: 0.55; background: rgba(255,255,255,0.03); border-radius: 0; }
        .rte-hr { border: none; border-bottom: 1px solid var(--border); margin: 0.4em 0; }

        .code-raw-editor {
          resize: none;
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.5;
          background: var(--code-bg);
          border: 1px solid rgba(255,250,205,0.2);
          border-radius: 0;
          padding: 15px; /* Match pre padding */
          color: var(--md-colortext);
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
        .hljs { color: var(--md-colortext) !important; }

        .code-raw-editor:focus {
          border-color: rgba(255, 250, 205, 0.4);
          outline: none;
        }

        /* ── RAW MODE EDITOR ──────────────────────────────────────────────── */
        .raw-mode-editor {
          flex: 1;
          width: 100%;
          background: transparent;
          border: none;
          border-top: 1px solid rgba(255, 250, 205, 0.1);
          color: var(--md-colortext);
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.7;
          padding: 16px 4px;
          resize: none;
          outline: none;
          caret-color: var(--accent);
          box-sizing: border-box;
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }

        /* ── TABLE EDITOR ─────────────────────────────────────────────────── */
        .table-editor { width: 100%; border-collapse: collapse; margin: 0; }
        .table-editor th, .table-editor td {
          border: 1px solid rgba(255, 250, 205, 0.2);
          padding: 6px 10px;
          min-width: 60px;
          max-width: 25vw;
          white-space: normal;
          overflow-wrap: break-word;
          word-break: break-word;
          outline: none;
          color: var(--md-colortext);
          caret-color: var(--accent);
        }
        .table-editor th { font-weight: 700; color: #fff; background: rgba(255, 250, 205, 0.05); }
        .table-editor th:focus, .table-editor td:focus {
          background: rgba(255, 250, 205, 0.08);
          border-color: rgba(255, 250, 205, 0.4);
        }

        .status-msg { opacity:.4; font-family:var(--font-body); font-size:13px; padding:20px 0; }

        /* ── SLASH MENU ─────────────────────────────────────────────────────── */
        .slash-menu {
          position: fixed;
          background: #1e1e1e;
          border: 1px solid var(--border);
          border-radius: 0;
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
          border-radius: 0;
        }
        .slash-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 0;
          cursor: pointer;
          font-family: var(--font-body);
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
          border-radius: 0;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
        }
    `}</style>
  );
}
