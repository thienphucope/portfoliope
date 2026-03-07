"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import Pop from '../src/app/pages/pop'; // Đảm bảo đường dẫn đúng

// --- UTILS: Load Scripts Dynamically ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadStyle = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

// --- MARKDOWN ENGINE SETUP ---
const configureMarked = () => {
  if (typeof window === 'undefined' || !window.marked || window.markedConfigured) return;

  const renderer = new window.marked.Renderer();

  renderer.table = (token) => {
    const headerHtml = token.header.map(cell => {
      const align = cell.align ? ` style="text-align:${cell.align}"` : '';
      return `<th${align}>${window.marked.parseInline(cell.text)}</th>`;
    }).join('');

    const bodyHtml = token.rows.map(row => {
      const rowContent = row.map(cell => {
        const align = cell.align ? ` style="text-align:${cell.align}"` : '';
        return `<td${align}>${window.marked.parseInline(cell.text)}</td>`;
      }).join('');
      return `<tr>${rowContent}</tr>`;
    }).join('');

    return `
      <div class="table-container">
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `;
  };

  renderer.code = (token) => {
    const lang = token.lang || 'text';
    const code = token.text;
    if (lang === 'mermaid') return `<div class="mermaid">${code}</div>`;
    let highlighted = code;
    if (window.hljs) {
      try {
        highlighted = window.hljs.getLanguage(lang) 
          ? window.hljs.highlight(code, { language: lang }).value 
          : window.hljs.highlightAuto(code).value;
      } catch (e) {}
    }
    return `
      <div class="code-block">
        <div class="code-header"><span class="code-lang">${lang}</span></div>
        <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
      </div>
    `;
  };

  renderer.image = (token) => {
    let { href, title, text } = token;
    let safeHref = href || '';
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = safeHref.match(ytRegex);
    if (ytMatch) {
      return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    if (safeHref.endsWith('#circle')) {
      return `<img src="${safeHref.replace('#circle', '')}" alt="${text || ''}" class="img-circle">`;
    }
    return `<img src="${safeHref}" alt="${text || ''}" title="${title || ''}">`;
  };

  const mathExtension = {
    name: 'math',
    level: 'inline',
    start(src) { return src.match(/\$/)?.index; },
    tokenizer(src) {
      const blockMatch = /^\$\$([\s\S]+?)\$\$/.exec(src);
      if (blockMatch) return { type: 'math', raw: blockMatch[0], text: blockMatch[1], displayMode: true };
      const inlineMatch = /^\$((?:\\\$|[^$])+)\$/.exec(src);
      if (inlineMatch) return { type: 'math', raw: inlineMatch[0], text: inlineMatch[1], displayMode: false };
    },
    renderer(token) {
      if (token.displayMode) return `<div class="math-block">$$\n${token.text}\n$$</div>`;
      return `<span class="math-inline">$${token.text}$</span>`;
    }
  };

  const footnoteExtension = {
    name: 'footnote',
    level: 'inline',
    start(src) { return src.match(/\[\^/)?.index; },
    tokenizer(src) {
      const match = /^\[\^([^\]]+)\]/.exec(src);
      if (match) return { type: 'footnote', raw: match[0], id: match[1] };
    },
    renderer(token) {
      return `<sup class="fn-ref"><a href="#fn-${token.id}" id="fnref-${token.id}">${token.id}</a></sup>`;
    }
  };

  const footnoteDefExtension = {
    name: 'footnoteDef',
    level: 'block',
    start(src) { return src.match(/^\[\^/)?.index; },
    tokenizer(src) {
      const match = /^\[\^([^\]]+)\]:\s+(.*)/.exec(src);
      if (match) return { type: 'footnoteDef', raw: match[0], id: match[1], text: match[2] };
    },
    renderer(token) {
      return `<div class="footnote-item" id="fn-${token.id}"><a href="#fnref-${token.id}" class="fn-back">↩</a> <span class="fn-id">${token.id}:</span> ${token.text}</div>`;
    }
  };

  const wikiLinkExtension = {
    name: 'wikiLink',
    level: 'inline',
    start(src) { return src.match(/\[\[/)?.index; },
    tokenizer(src) {
      const match = /^\[\[(.*?)\]\]/.exec(src);
      if (match) return { type: 'wikiLink', raw: match[0], text: match[1] };
    },
    renderer(token) {
      return `<span class="internal-link" data-target="${token.text}">${token.text}</span>`;
    }
  };

  window.marked.use({ 
    renderer, 
    extensions: [mathExtension, footnoteExtension, footnoteDefExtension, wikiLinkExtension],
    gfm: true,
    breaks: true
  });
  
  window.markedConfigured = true;
};

// --- MARKDOWN VIEWER ---
const MarkdownViewer = ({ content, onLinkClick }) => {
  const containerRef = useRef(null);
  const [libsLoaded, setLibsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
      loadStyle('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'),
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
      loadStyle('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'),
      loadScript('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js')
    ]).then(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'))
      .then(() => {
        if (window.mermaid) window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        setLibsLoaded(true);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (libsLoaded && containerRef.current && window.marked) {
      configureMarked();
      const htmlContent = window.marked.parse(content);
      containerRef.current.innerHTML = htmlContent;
      
      if (window.renderMathInElement) {
        window.renderMathInElement(containerRef.current, {
          delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
          throwOnError: false
        });
      }
      if (window.mermaid) window.mermaid.run({ nodes: containerRef.current.querySelectorAll('.mermaid') });
    }
  }, [content, libsLoaded]);

  if (!libsLoaded) return <div className="status-msg">Booting Vault Engine...</div>;

  return <div ref={containerRef} className="markdown-content" onClick={onLinkClick} />;
};

// --- FILE SYSTEM ITEM ---
const FileSystemItem = ({ item, level = 0, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = `${level * 12}px`;
  return (
    <div className="select-none">
      <div className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}`} style={{ paddingLeft }} onClick={(e) => {
        e.stopPropagation();
        if (item.kind === 'directory') setIsOpen(!isOpen);
        else onSelectFile(item.path, item.name);
      }}>
        <span className="arrow-wrapper">
          {item.kind === 'directory' ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="spacer"></span>}
        </span>
        <span className="item-name">{item.name.replace('.md', '')}</span>
      </div>
      {item.kind === 'directory' && isOpen && item.children && (
        <div className="tree-children">
          {item.children.map((child, idx) => <FileSystemItem key={idx} item={child} level={level + 1} onSelectFile={onSelectFile} />)}
        </div>
      )}
    </div>
  );
};

// --- MAIN VAULT ---
export default function UltimateRedVault() {
  const [fileTree, setFileTree] = useState([]);
  const [content, setContent] = useState('');
  const fileRegistry = useRef({});
  const appShellRef = useRef(null);
  const mainContentRef = useRef(null);
  
  // --- RESIZABLE LAYOUT STATE ---
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(350);
  const isResizingSidebar = useRef(false);
  const isResizingChat = useRef(false);

  const isMobileView = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024 || window.matchMedia("(orientation: portrait)").matches;
  };

  const startResizingSidebar = useCallback((e) => {
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const startResizingChat = useCallback((e) => {
    isResizingChat.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingChat.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isResizingSidebar.current) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) setSidebarWidth(newWidth);
    }
    if (isResizingChat.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 600) setChatWidth(newWidth);
    }
  }, []);

  const loadFile = async (path, name, updateHistory = true) => {
    try {
      const res = await fetch(path);
      const text = await res.text();
      setContent(text);
      if (updateHistory) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('file', name);
        window.history.pushState({ path, name }, '', newUrl);
      }
      // On mobile/tablet portrait, scroll back to main content after selecting file
      if (isMobileView() && appShellRef.current) {
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'smooth' });
      }
    } catch (err) { setContent('# Error\nFailed to load.'); }
  };

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch('/api/cases');
        const tree = await res.json();
        const buildRegistry = (nodes) => {
          nodes.forEach(node => {
            if (node.kind === 'file') {
              fileRegistry.current[node.name.toLowerCase()] = node.path;
              fileRegistry.current[node.name.replace('.md', '').toLowerCase()] = node.path;
            } else if (node.children) buildRegistry(node.children);
          });
        };
        buildRegistry(tree);
        setFileTree(tree);
        const DEFAULT = 'Dash Board.md';
        const path = fileRegistry.current[DEFAULT.toLowerCase()];
        if (path) loadFile(path, DEFAULT);
      } catch (err) { console.error(err); }
    };
    fetchTree();
  }, []);

  // Initial scroll to middle on mobile/tablet portrait
  useEffect(() => {
    const centerView = () => {
      if (isMobileView() && appShellRef.current) {
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'instant' });
      }
    };
    
    centerView();
    window.addEventListener('resize', centerView);
    return () => window.removeEventListener('resize', centerView);
  }, []);

  useEffect(() => {
    const handlePopState = (e) => { if (e.state && e.state.path) loadFile(e.state.path, e.state.name, false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="app-shell" ref={appShellRef}>
      {/* 1. LEFT: FILE TREE */}
      <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">RED VAULT</div>
        <div className="file-list">
          {fileTree.map((item, idx) => <FileSystemItem key={idx} item={item} onSelectFile={loadFile} />)}
        </div>
      </aside>

      {/* DIVIDER 1 */}
      <div className="resizer" onMouseDown={startResizingSidebar}>
        <div className="divider-line">||</div>
      </div>

      {/* 2. CENTER: MARKDOWN VIEW */}
      <main className="main-content" ref={mainContentRef}>
        <article className="markdown-container">
          <MarkdownViewer content={content} onLinkClick={(e) => {
            const link = e.target.closest('.internal-link') || e.target.closest('a');
            if (link) {
              const name = link.getAttribute('data-target') || link.innerText;
              const path = fileRegistry.current[name.toLowerCase()];
              if (path) { e.preventDefault(); loadFile(path, name); }
            }
          }} />
        </article>
      </main>

      {/* DIVIDER 2 */}
      <div className="resizer" onMouseDown={startResizingChat}>
        <div className="divider-line">||</div>
      </div>

      {/* 3. RIGHT: CHAT POPUP (Embedded) */}
      <aside className="chat-panel" style={{ width: chatWidth }}>
        <div className="chat-container">
          <Pop isEmbedded={true} />
        </div>
      </aside>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600&display=swap');

        :root {
          --bg: #121212;
          --txt: #e0e0e0;
          --accent: #FFFACD;
          --border: rgba(255, 255, 255, 0.1);
          --code-bg: #1e1e1e;
        }

        body { margin: 0; background: var(--bg); color: var(--txt); font-family: 'Inter', sans-serif; overflow: hidden; }
        
        .app-shell { 
          height: 100dvh; 
          width: 100vw; 
          display: flex; 
          background: var(--bg);
          overflow-y: hidden;
          overflow-x: hidden;
        }

        /* PANELS */
        .sidebar-panel { height: 100dvh; background: var(--bg); display: flex; flex-direction: column; flex-shrink: 0; }
        .sidebar-brand { padding: 20px; font-weight: 600; letter-spacing: 2px; border-bottom: 1px solid var(--border); font-family: 'Inter', sans-serif; }
        .file-list { flex: 1; overflow-y: auto; padding: 10px; scrollbar-width: none; }
        .file-list::-webkit-scrollbar { display: none; }

        .main-content { flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 30px 15px; scrollbar-width: none; background: var(--bg); }
        .main-content::-webkit-scrollbar { display: none; }
        .markdown-container { max-width: 1000px; width: 100%; box-sizing: border-box; }

        .chat-panel { height: 100dvh; background: var(--bg); flex-shrink: 0; border-left: 1px solid var(--border); overflow: hidden; }
        .chat-container { height: 100%; width: 100%; position: relative; }

        /* RESIZER */
        .resizer {
          width: 4px;
          cursor: col-resize;
          background: var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, width 0.2s;
          user-select: none;
          z-index: 10;
        }
        .resizer:hover { background: var(--accent); width: 6px; }
        .divider-line { display: none; }

        /* --- TYPOGRAPHY (PC DEFAULT) --- */
        .markdown-content { font-family: 'Crimson Text', serif; font-size: 19px; line-height: 1.6; color: var(--txt); }
        .markdown-content h1 { font-size: 2.0em; margin: 0.8em 0 0.4em; color: #fff; font-weight: 700; }
        .markdown-content h2 { font-size: 1.6em; margin: 0.7em 0 0.3em; color: #fff; font-weight: 700; }
        .markdown-content h3 { font-size: 1.2em; margin: 0.6em 0 0.2em; color: #fff; font-weight: 700; }
        .markdown-content p { margin-bottom: 1em; }

        .markdown-content a, .internal-link {
          color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); padding-right: 14px; position: relative; cursor: pointer;
        }
        .markdown-content a::after, .internal-link::after {
          content: '↗'; position: absolute; right: 0; top: -2px; font-size: 0.75em; opacity: 0.7;
        }

        /* --- TABLES --- */
        .table-container { 
          width: 100%; max-width: 100%; overflow-x: auto; margin: 1.5em 0; display: block; 
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.03) transparent;
        }
        .table-container::-webkit-scrollbar { height: 1px; }
        .table-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 10px; }
        
        table { width: 100%; border-collapse: collapse; table-layout: auto; }
        th, td { padding: 10px 14px; border: none; text-align: left; white-space: nowrap; }
        thead { border-bottom: 1px solid var(--border); }
        th { color: #fff; font-weight: 700; }

        /* --- UI ELEMENTS --- */
        .tree-item { display: flex; align-items: center; padding: 6px 8px; cursor: pointer; border-radius: 4px; transition: 0.2s; font-size: 14px; opacity: 0.7; font-family: 'Crimson Text', serif; }
        .tree-item:hover { background: rgba(255, 255, 255, 0.05); opacity: 1; color: var(--accent); }
        .arrow-wrapper { width: 18px; margin-right: 4px; display: flex; justify-content: center; }
        .spacer { width: 18px; }
        
        .math-block { margin: 1.5em 0; overflow-x: auto; display: block; width: 100%; }
        .code-block { background: var(--code-bg); border-radius: 8px; margin: 1.5em 0; border: 1px solid var(--border); overflow: hidden; }
        .code-header { background: #2a2a2a; padding: 5px 15px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); }
        .code-lang { font-size: 11px; color: #888; text-transform: uppercase; }
        pre { margin: 0; padding: 15px; overflow-x: auto; }
        .mermaid { background: rgba(255,255,255,0.02); padding: 20px; border-radius: 8px; margin: 1.5em 0; display: flex; justify-content: center; }
        
        blockquote { border-left: 3px solid var(--accent); padding-left: 1.25em; margin: 1.5em 0; font-style: italic; opacity: 0.8; }
        blockquote blockquote { border-left-color: rgba(255,255,255,0.2); margin-left: 1em; }
        
        .img-circle { border-radius: 50%; aspect-ratio: 1/1; object-fit: cover; max-width: 200px; display: block; margin: 2em auto; }
        img { max-width: 100%; border-radius: 8px; margin: 1.5em 0; }
        .video-container { position: relative; padding-bottom: 56.25%; height: 0; margin: 1.5em 0; }
        .video-container iframe { position: absolute; top:0; left:0; width:100%; height:100%; border-radius: 8px; }

        /* MOBILE & TABLET PORTRAIT (Responsive Sizing) */
        @media (max-width: 1024px), (orientation: portrait) {
          .app-shell {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            display: flex !important;
            flex-wrap: nowrap !important;
          }
          .sidebar-panel, .main-content, .chat-panel {
            width: 100vw !important;
            min-width: 100vw !important;
            flex-shrink: 0 !important;
            scroll-snap-align: center;
            position: relative !important;
            height: 100dvh !important;
          }
          .resizer { display: none !important; }
          .main-content { padding: 30px 15px; }
          
          /* TABLET SMART SIZING: Use clamp only for mid-range devices */
          .markdown-content { font-size: clamp(17px, 1.5vw + 10px, 22px); }
          .markdown-content h1 { font-size: 1.8em; margin: 0.8em 0 0.4em; }
          .markdown-content h2 { font-size: 1.5em; margin: 0.7em 0 0.3em; }
          .markdown-content h3 { font-size: 1.2em; margin: 0.6em 0 0.2em; }
          .tree-item { font-size: clamp(13px, 1vw + 10px, 16px); }
        }
      `}</style>
    </div>
  );
}
