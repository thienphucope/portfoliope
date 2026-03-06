"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

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

  // 1. Table Renderer (Strict Container)
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

  // 2. Code Block Renderer
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

  // 3. Math Extension (Protects $$ and $)
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

  // 4. Footnote & WikiLinks
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

// --- FILE SYSTEM ---
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const fileRegistry = useRef({});

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

  useEffect(() => {
    const handlePopState = (e) => { if (e.state && e.state.path) loadFile(e.state.path, e.state.name, false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="app-shell">
      <div className="hover-trigger" onMouseEnter={() => setSidebarVisible(true)} />
      <aside className={`sidebar ${sidebarVisible ? 'active' : ''}`} onMouseLeave={() => setSidebarVisible(false)}>
        <div className="sidebar-brand">RED VAULT</div>
        <div className="file-list">{fileTree.map((item, idx) => <FileSystemItem key={idx} item={item} onSelectFile={loadFile} />)}</div>
      </aside>
      <main className="content-viewport">
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
        .app-shell { height: 100vh; width: 100vw; display: flex; overflow-y: auto; scrollbar-width: none; }
        .app-shell::-webkit-scrollbar { display: none; }
        .hover-trigger { position: fixed; top: 0; left: 0; width: 15px; height: 100vh; z-index: 1001; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 280px; background: #000; z-index: 1000; transform: translateX(-100%); transition: 0.3s; box-shadow: 5px 0 25px #000; }
        .sidebar.active { transform: translateX(0); }
        .sidebar-brand { padding: 30px; font-weight: 600; letter-spacing: 2px; border-bottom: 1px solid var(--border); }
        .file-list { flex: 1; overflow-y: auto; padding: 15px; }
        .content-viewport { flex: 1; display: flex; justify-content: center; padding: 40px 20px; }
        .markdown-container { max-width: 800px; width: 100%; box-sizing: border-box; }

        /* --- TYPOGRAPHY --- */
        .markdown-content { font-family: 'Crimson Text', serif; font-size: 19px; line-height: 1.6; color: var(--txt); }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-family: 'Crimson Text', serif; color: #fff; margin: 1.5em 0 0.6em; border: none; font-weight: 700; }
        .markdown-content p { margin-bottom: 1em; }

        /* --- LINKS (WITH ARROW) --- */
        .markdown-content a, .internal-link {
          color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); padding-right: 14px; position: relative; cursor: pointer;
        }
        .markdown-content a::after, .internal-link::after {
          content: '↗'; position: absolute; right: 0; top: -2px; font-size: 0.75em; opacity: 0.7;
        }

        /* --- QUOTES (NESTED) --- */
        blockquote { border-left: 3px solid var(--accent); padding-left: 1.25em; margin: 1.5em 0; font-style: italic; opacity: 0.8; }
        blockquote blockquote { border-left-color: rgba(255,255,255,0.2); margin-left: 1em; }

        /* --- TABLES (CONTAINED INNER SCROLL) --- */
        .table-container { 
          width: 100%; max-width: 100%; overflow-x: auto; margin: 2em 0; 
          border: 1px solid var(--border); border-radius: 8px; display: block; 
          box-sizing: border-box;
        }
        .table-container::-webkit-scrollbar { height: 4px; }
        .table-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        table { width: 100%; border-collapse: collapse; table-layout: auto; }
        th, td { padding: 12px 18px; border: 1px solid var(--border); text-align: left; white-space: nowrap; }
        th { background: rgba(255,255,255,0.03); color: #fff; font-weight: 600; }

        /* --- TASK LISTS --- */
        .markdown-content input[type="checkbox"] { appearance: none; width: 18px; height: 18px; border: 2px solid var(--accent); border-radius: 4px; margin-right: 10px; vertical-align: middle; cursor: pointer; position: relative; }
        .markdown-content input[type="checkbox"]:checked { background: var(--accent); }
        .markdown-content input[type="checkbox"]:checked::after { content: '✔'; position: absolute; color: #000; font-size: 12px; left: 3px; top: -1px; }

        /* --- MATH --- */
        .math-block { margin: 1.5em 0; overflow-x: auto; display: block; width: 100%; }
        .katex-display { margin: 0 !important; padding: 10px 0; }

        /* --- LISTS --- */
        .markdown-content ul { list-style-type: disc !important; padding-left: 1.5em; margin-bottom: 1em; display: block; }
        .markdown-content ol { list-style-type: decimal !important; padding-left: 1.5em; margin-bottom: 1em; display: block; }
        .markdown-content li { display: list-item !important; margin-bottom: 0.4em; }

        /* --- CODE & MERMAID --- */
        .code-block { background: var(--code-bg); border-radius: 8px; margin: 1.5em 0; border: 1px solid var(--border); overflow: hidden; }
        .code-header { background: #2a2a2a; padding: 5px 15px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); }
        .code-lang { font-size: 11px; color: #888; text-transform: uppercase; }
        pre { margin: 0; padding: 15px; overflow-x: auto; }
        .mermaid { background: rgba(255,255,255,0.02); padding: 20px; border-radius: 8px; margin: 1.5em 0; display: flex; justify-content: center; }

        /* --- FOOTNOTES --- */
        .fn-ref a { color: var(--accent); font-size: 0.7em; vertical-align: super; margin-left: 2px; }
        .footnote-item { font-size: 0.9em; opacity: 0.8; margin-top: 1em; padding-top: 1em; border-top: 1px solid var(--border); }
        .fn-back { color: var(--accent); margin-right: 5px; text-decoration: none; }
        .fn-id { font-weight: bold; color: var(--accent); }

        img { max-width: 100%; border-radius: 8px; margin: 1.5em 0; }
        .img-circle { border-radius: 50%; aspect-ratio: 1/1; object-fit: cover; max-width: 200px; display: block; margin: 2em auto; }
      `}</style>
    </div>
  );
}
