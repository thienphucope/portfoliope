import React from 'react';

export default function MarkdownStyles() {
  return (
    <style jsx global>{`
        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--md-font); font-size:var(--md-size); line-height:var(--md-line); color:var(--colortext-markdown); text-align: justify; }
        .markdown-content h1 { font-size:2.0em; margin:.8em 0 .4em; color:#fff; font-weight:700; text-align: left; }
        .markdown-content h2 { font-size:1.6em; margin:.7em 0 .3em; color:#fff; font-weight:700; text-align: left; }
        .markdown-content h3 { font-size:1.2em; margin:.6em 0 .2em; color:#fff; font-weight:700; }
        .markdown-content .fit-heading {
          display: block;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          font-family: var(--font-title-block, var(--md-font));
          font-weight: 700;
          color: var(--colortext-spine);
          line-height: 1;
          margin: 0.3em 0;
          letter-spacing: -0.03em;
          opacity: 0.95;
        }
        .markdown-content h6.fit-heading {
          font-style: italic;
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

        .table-container { position:relative; left:50%; transform:translateX(-50%); width:calc(100vw - 58px); overflow-x:auto; margin:1.5em 0; display:block; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.03) transparent; }
        .table-container::-webkit-scrollbar { height:1px; }
        .table-container::-webkit-scrollbar-thumb { background:rgba(255,255,255,.03); border-radius:0; }
        table { border-collapse:collapse; margin:0 auto; }
        th, td { padding:10px 14px; border:none; text-align:left; max-width:25vw; white-space:normal; overflow-wrap:break-word; word-break:break-word; }
        thead { border-bottom:1px solid var(--border); }
        th { color:#fff; font-weight:700; }

        .math-block { margin:1.5em 0; overflow-x:auto; display:block; width:100%; }
        .code-block { background:transparent; border-radius:0; margin:1.5em 0; border:1px solid white; overflow:visible; position:relative; border-top-right-radius:0; }
        .code-header { display:none; }
        .code-lang, .code-lang-label { font-size:11px; color:#888; text-transform:uppercase; }
        .code-lang-label { position:absolute; top:-18px; right:8px; background:transparent; padding:0; z-index:1; }
        pre { margin:0; padding:15px; overflow-x:auto; background:transparent; }
        .mermaid { background:rgba(255,255,255,.02); padding:20px; border-radius:0; margin:1.5em 0; display:flex; justify-content:center; }
        blockquote { border-left:3px solid var(--accent); padding-left:1.25em; margin:1.5em 0; font-style:italic; opacity:.8; }
        blockquote blockquote { border-left-color:rgba(255,255,255,.2); margin-left:1em; }
        .img-circle { border-radius:0; aspect-ratio:1/1; object-fit:cover; max-width:200px; display:block; margin:2em auto; }
        img { width: 100%; height: auto; border-radius: 0; margin: 0; }
        .video-container { position:relative; width:100%; min-width:23vw; aspect-ratio:16/9; margin:1.5em 0; }
        .video-container iframe { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:0; pointer-events: none; }
        .video-container.active iframe { pointer-events: auto; }
    `}</style>
  );
}
