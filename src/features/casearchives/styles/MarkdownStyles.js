import React from 'react';

export default function MarkdownStyles() {
  return (
    <style jsx global>{`
        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--font-body); font-size:var(--md-size); line-height:1.62; color:var(--md-colortext); text-align: justify; }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          color:#fff;
          font-weight:700;
          line-height:1.18;
          text-align:left;
        }
        .markdown-content h1 { font-size:1.56em; margin:.74em 0 .34em; }
        .markdown-content h2 { font-size:1.36em; margin:.68em 0 .3em; }
        .markdown-content h3 { font-size:1.22em; margin:.62em 0 .26em; }
        .markdown-content h4 { font-size:1.12em; margin:.56em 0 .22em; }
        .markdown-content h5 { font-size:1.06em; margin:.5em 0 .18em; }
        .markdown-content h6 { font-size:1.02em; margin:.46em 0 .16em; }
        .markdown-content .fit-heading {
          display: block;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--theme);
          line-height: 1;
          margin: 0.3em 0;
          letter-spacing: -0.03em;
          opacity: 0.95;
        }
        .markdown-content h6.fit-heading {
          font-style: italic;
        }
        .markdown-content p  { margin-bottom:.82em; }

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
          line-height: 1.56;
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
          color:var(--theme); text-decoration:none; border-bottom:1px dotted var(--theme);
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

        .markdown-content .table-container {
          position:relative;
          z-index:2;
          width:100%;
          max-width:100%;
          overflow-x:auto;
          overflow-y:hidden;
          margin:1.25em 0;
          display:block;
          box-sizing:border-box;
          background:var(--feature-bg);
          border-top:1px solid rgba(255,250,205,.14);
          border-bottom:1px solid rgba(255,250,205,.1);
          scrollbar-width:thin;
          scrollbar-color:rgba(243,208,152,.42) transparent;
          overscroll-behavior-x:contain;
          -webkit-overflow-scrolling:touch;
        }
        .markdown-content .table-container::-webkit-scrollbar { height:4px; }
        .markdown-content .table-container::-webkit-scrollbar-track { background:transparent; }
        .markdown-content .table-container::-webkit-scrollbar-thumb { background:rgba(243,208,152,.42); border-radius:6px; }
        .markdown-content .table-container > table {
          border-collapse:collapse;
          table-layout:auto;
          width:max-content;
          min-width:100%;
          max-width:none;
          margin:0;
        }
        .markdown-content .table-container th,
        .markdown-content .table-container td {
          padding:8px 12px;
          border:none;
          border-bottom:1px solid rgba(255,255,255,.08);
          text-align:left;
          vertical-align:top;
          min-width:96px;
          max-width:min(34vw, 360px);
          white-space:normal;
          overflow-wrap:anywhere;
          word-break:normal;
        }
        .markdown-content .table-container thead { border-bottom:1px solid var(--border); }
        .markdown-content .table-container th { color:#fff; font-weight:700; background:rgba(255,250,205,.045); }

        .math-block { margin:1.5em 0; overflow-x:auto; display:block; width:100%; }
        .code-block { background:transparent; border-radius:0; margin:1.5em 0; border:1px solid white; overflow:visible; position:relative; border-top-right-radius:0; }
        .code-header { display:none; }
        .code-lang, .code-lang-label { font-size:11px; color:#888; text-transform:uppercase; }
        .code-lang-label { position:absolute; top:-18px; right:8px; background:transparent; padding:0; z-index:1; }
        .markdown-content .code-block pre {
          font-size:.88em;
          line-height:1.46;
          padding:6px 8px;
          overflow-x:auto;
          overflow-y:hidden;
          scrollbar-width:thin;
          scrollbar-color:rgba(243,208,152,.42) transparent;
        }
        .markdown-content .code-block pre::-webkit-scrollbar { height:4px; }
        .markdown-content .code-block pre::-webkit-scrollbar-track { background:transparent; }
        .markdown-content .code-block pre::-webkit-scrollbar-thumb { background:rgba(243,208,152,.42); border-radius:6px; }
        .markdown-content .code-block code {
          display:block;
          font-size:inherit;
          width:max-content;
          min-width:100%;
          white-space:pre;
        }
        pre { margin:0; padding:15px; overflow-x:auto; background:transparent; }
        .mermaid { background:rgba(255,255,255,.02); padding:20px; border-radius:0; margin:1.5em 0; display:flex; justify-content:center; }
        blockquote { border-left:3px solid var(--accent); padding-left:1.25em; margin:1.5em 0; font-style:italic; opacity:.8; }
        blockquote blockquote { border-left-color:rgba(255,255,255,.2); margin-left:1em; }
        .img-circle { border-radius:0; aspect-ratio:1/1; object-fit:cover; max-width:200px; display:block; margin:2em auto; }
        img { width: 100%; height: auto; border-radius: 0; margin: 0; }
        .video-container { position:relative; width:100%; min-width:23vw; aspect-ratio:16/9; margin:1.5em 0; }
        .video-container iframe { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:0; pointer-events: none; }
        .video-container.active iframe { pointer-events: auto; }

        @media (max-width: 768px) {
          .markdown-content {
            font-size: 18px;
            line-height: 1.55;
            text-align: left;
          }
          .markdown-content h1 { font-size:1.36em; margin:.68em 0 .32em; }
          .markdown-content h2 { font-size:1.24em; margin:.62em 0 .28em; }
          .markdown-content h3 { font-size:1.14em; margin:.56em 0 .22em; }
          .markdown-content h4 { font-size:1.08em; margin:.5em 0 .18em; }
          .markdown-content h5 { font-size:1.04em; margin:.46em 0 .16em; }
          .markdown-content h6 { font-size:1.01em; margin:.44em 0 .16em; }
          .markdown-content p { margin-bottom:.72em; }
          .markdown-content li { line-height:1.5; }
          .markdown-content .table-container {
            margin:1em 0;
            scrollbar-width:thin;
          }
          .markdown-content .table-container::-webkit-scrollbar { height:3px; }
          .markdown-content .table-container th,
          .markdown-content .table-container td {
            min-width:84px;
            max-width:72vw;
            padding:7px 10px;
          }
        }
    `}</style>
  );
}
