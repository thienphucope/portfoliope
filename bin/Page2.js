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

  // Custom Table Renderer for Horizontal Scroll
  renderer.table = (header, body) => {
    return `
      <div class="table-wrapper">
        <table>
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  };

  // Custom Image Renderer with #circle and YouTube support
  renderer.image = (arg1, arg2, arg3) => {
    let href = arg1, title = arg2, text = arg3;
    if (typeof arg1 === 'object' && arg1 !== null) {
      href = arg1.href;
      title = arg1.title;
      text = arg1.text;
    }
    let safeHref = (typeof href === 'string') ? href : '';
    const safeText = (typeof text === 'string') ? text : '';
    const safeTitle = (typeof title === 'string') ? title : '';

    let extraClass = '';
    if (safeHref.endsWith('#circle')) {
      extraClass = 'img-circle';
      safeHref = safeHref.replace('#circle', '');
    }

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = safeHref.match(youtubeRegex);

    if (match && match[1]) {
      return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${match[1]}" title="${safeText}" frameborder="0" allowfullscreen></iframe></div>`;
    }
    
    const titlePart = safeTitle ? ` title="${safeTitle}"` : '';
    return `<img src="${safeHref}" alt="${safeText}" class="${extraClass}"${titlePart}>`;
  };

  // Support for WikiLinks [[...]]
  const wikiLinkExtension = {
    name: 'wikiLink',
    level: 'inline',
    start(src) { return src.match(/\[\[/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\[\[(.*?)\]\]/;
      const match = rule.exec(src);
      if (match) return { type: 'wikiLink', raw: match[0], text: match[1] };
    },
    renderer(token) {
      return `<span class="internal-link" data-target="${token.text}">${token.text}</span>`;
    }
  };

  // Support for Footnotes
  const footnoteExtension = {
    name: 'footnote',
    level: 'inline',
    start(src) { return src.match(/\[\^/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\[\^([^\]]+)\]/;
      const match = rule.exec(src);
      if (match) return { type: 'footnote', raw: match[0], id: match[1] };
    },
    renderer(token) {
      return `<sup><a href="#fn-${token.id}" id="fnref-${token.id}" class="footnote-ref">${token.id}</a></sup>`;
    }
  };

  const footnoteDefExtension = {
    name: 'footnoteDef',
    level: 'block',
    start(src) { return src.match(/^\[\^/m)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\[\^([^\]]+)\]:\s+(.*)(?:\n|$)/;
      const match = rule.exec(src);
      if (match) return { type: 'footnoteDef', raw: match[0], id: match[1], text: match[2] };
    },
    renderer(token) {
      return `<div class="footnote-def" id="fn-${token.id}"><a href="#fnref-${token.id}">[^]</a> ${token.id}: ${token.text}</div>`;
    }
  };

  window.marked.use({ 
    renderer, 
    extensions: [wikiLinkExtension, footnoteExtension, footnoteDefExtension],
    gfm: true,
    breaks: true
  });
  
  window.markedConfigured = true;
};

// --- CONTENT PROCESSOR ---
// Splits content into a tree of sections (rows, columns, or attribute-blocks)
const processMarkdownToTree = (markdown) => {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at the start of sections
    if (trimmed === '' && sections.length === 0) {
      i++;
      continue;
    }

    // --- ROW HANDLING ---
    if (trimmed === ':::row') {
      const row = { type: 'row', columns: [] };
      i++;

      while (i < lines.length) {
        const colLine = lines[i].trim();
        if (colLine === ':::') {
          i++;
          break;
        }

        if (colLine.startsWith(':::col')) {
          const widthMatch = colLine.match(/:::col\s+(\d+%?)/);
          const width = widthMatch ? widthMatch[1] : 'auto';
          const columnLines = [];
          i++;

          let rowNestLevel = 0;
          while (i < lines.length) {
            const contentLine = lines[i];
            const contentTrimmed = contentLine.trim();

            if (contentTrimmed === ':::row') rowNestLevel++;
            else if (contentTrimmed === ':::') {
              if (rowNestLevel > 0) rowNestLevel--;
              else { i++; break; }
            }
            columnLines.push(contentLine);
            i++;
          }

          row.columns.push({
            width,
            content: processMarkdownToTree(columnLines.join('\n'))
          });
        } else {
          i++;
        }
      }
      sections.push(row);
      continue;
    }

    // --- SPACER HANDLING ---
    const spaceMatch = trimmed.match(/^\{space:(\d+px)\}$/);
    if (spaceMatch) {
      sections.push({ type: 'spacer', height: spaceMatch[1] });
      i++;
      continue;
    }

    // --- NORMAL BLOCK WITH ATTRIBUTES ---
    let blockAttributes = { bgColor: null, color: null, align: null };
    let hasAttributes = false;

    // Peek and collect attributes
    while (i < lines.length) {
      const l = lines[i].trim();
      const bgMatch = l.match(/^\{bg:(red|blue|yellow|green|gray|orange|purple|pink)\}$/);
      const colorMatch = l.match(/^\{color:(red|blue|yellow|green|gray|orange|purple|pink|white|black)\}$/);
      const alignMatch = l.match(/^\{align:(left|center|right|justify)\}$/);

      if (bgMatch) { blockAttributes.bgColor = bgMatch[1]; hasAttributes = true; i++; }
      else if (colorMatch) { blockAttributes.color = colorMatch[1]; hasAttributes = true; i++; }
      else if (alignMatch) { blockAttributes.align = alignMatch[1]; hasAttributes = true; i++; }
      else break;
    }

    // Collect content for this block until a new row or attribute block starts
    // NOTE: We don't stop at blank lines anymore to keep standard MD intact
    const blockContent = [];
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();

      if (nextTrimmed === ':::row' || 
          nextTrimmed.match(/^\{bg:/) || 
          nextTrimmed.match(/^\{color:/) ||
          nextTrimmed.match(/^\{align:/) ||
          nextTrimmed.match(/^\{space:/)) {
        break;
      }
      blockContent.push(nextLine);
      i++;
    }

    if (blockContent.length > 0 || hasAttributes) {
      sections.push({
        type: 'block',
        attributes: blockAttributes,
        content: blockContent.join('\n')
      });
    } else if (i < lines.length) {
      // Just skip empty line if we somehow got stuck
      i++;
    }
  }

  return sections;
};

// --- COMPONENTS ---

const MarkdownBlock = ({ block, onLinkClick }) => {
  if (block.type === 'spacer') {
    return <div style={{ height: block.height, width: '100%' }} />;
  }

  const blockRef = useRef(null);
  const { bgColor, color, align } = block.attributes;
  
  useEffect(() => {
    if (blockRef.current && window.marked) {
      configureMarked();
      const htmlContent = window.marked.parse(block.content);
      blockRef.current.innerHTML = htmlContent;
      
      if (window.renderMathInElement) {
        window.renderMathInElement(blockRef.current, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      }
    }
  }, [block.content]);

  const classes = [
    'markdown-block',
    bgColor ? `bg-${bgColor}` : '',
    color ? `text-${color}` : '',
    align ? `text-align-${align}` : ''
  ].filter(Boolean).join(' ');

  return <div ref={blockRef} className={classes} onClick={onLinkClick} />;
};

const MarkdownRow = ({ row, onLinkClick }) => {
  const GAP_PX = 12;
  const numCols = row.columns.length;
  const totalGapSpace = `${(numCols - 1) * GAP_PX}px`;

  return (
    <div className="md-row" style={{ columnGap: `${GAP_PX}px` }}>
      {row.columns.map((col, idx) => {
        let style = col.width !== 'auto' 
          ? { flex: `0 0 calc((100% - ${totalGapSpace}) * ${parseFloat(col.width)/100})`, maxWidth: `calc((100% - ${totalGapSpace}) * ${parseFloat(col.width)/100})` }
          : { flex: 1 };
        
        return (
          <div key={idx} className="md-col" style={style}>
            {col.content.map((item, i) => (
              item.type === 'row' 
                ? <MarkdownRow key={i} row={item} onLinkClick={onLinkClick} />
                : <MarkdownBlock key={i} block={item} onLinkClick={onLinkClick} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const MarkdownViewer = ({ content, onLinkClick }) => {
  const [sections, setSections] = useState([]);
  const [libsLoaded, setLibsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
      loadStyle('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css')
    ]).then(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'))
      .then(() => setLibsLoaded(true))
      .catch(err => console.error("Lib load error:", err));
  }, []);

  useEffect(() => {
    if (libsLoaded) {
      setSections(processMarkdownToTree(content));
    }
  }, [content, libsLoaded]);

  if (!libsLoaded) return <div className="loading-container">Loading Engine...</div>;

  return (
    <div className="markdown-body">
      {sections.map((section, idx) => (
        section.type === 'row' 
          ? <MarkdownRow key={idx} row={section} onLinkClick={onLinkClick} />
          : <MarkdownBlock key={idx} block={section} onLinkClick={onLinkClick} />
      ))}
    </div>
  );
};

// --- FILE SYSTEM ITEM ---
const FileSystemItem = ({ item, level = 0, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = `${level * 12}px`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.kind === 'directory') setIsOpen(!isOpen);
    else onSelectFile(item.path, item.name);
  };

  return (
    <div className="select-none">
      <div 
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        <span className="arrow-wrapper">
          {item.kind === 'directory' ? (
            isOpen ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />
          ) : <span className="spacer"></span>}
        </span>
        <span className={`item-name ${item.kind === 'directory' ? 'font-bold' : ''}`}>
          {item.name.replace('.md', '')}
        </span>
      </div>
      {item.kind === 'directory' && isOpen && item.children && (
        <div className="tree-children">
          {item.children.map((child, index) => (
            <FileSystemItem key={`${child.name}-${index}`} item={child} level={level + 1} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function RedMathVault() {
  const [fileTree, setFileTree] = useState([]);
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const fileRegistry = useRef({}); 
  const sidebarHoverAreaRef = useRef(null);

  const loadFile = async (path, name, updateHistory = true) => {
    try {
      const res = await fetch(path);
      const text = await res.text();
      setCurrentFileName(name ? name.replace('.md', '') : '');
      setContent(text);
      if (updateHistory) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('file', name);
        window.history.pushState({ path, name }, '', newUrl);
      }
    } catch (err) {
      console.error(err);
      setContent('# Error\nKhông tải được file.');
    }
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

        const DEFAULT_FILE_NAME = 'Dash Board.md';
        const defaultPath = fileRegistry.current[DEFAULT_FILE_NAME.toLowerCase()];
        if (defaultPath) loadFile(defaultPath, DEFAULT_FILE_NAME);
        else if (tree.length > 0) {
          const first = tree[0].kind === 'file' ? tree[0] : (tree[0].children?.[0] || tree[0]);
          if (first.path) loadFile(first.path, first.name);
        }
      } catch (err) { console.error("Error loading file tree:", err); }
    };
    fetchTree();
  }, []);

  const handlePreviewClick = (e) => {
    const target = e.target.closest('.internal-link');
    if (target) {
      const fileName = target.getAttribute('data-target');
      const filePath = fileRegistry.current[fileName.toLowerCase()];
      if (filePath) loadFile(filePath, fileName);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.path) loadFile(event.state.path, event.state.name, false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="app-container">
      <div ref={sidebarHoverAreaRef} className="sidebar-hover-area" onMouseEnter={() => setSidebarVisible(true)} />
      
      <aside className={`sidebar ${sidebarVisible ? 'visible' : ''}`} onMouseLeave={() => setSidebarVisible(false)}>
        <div className="sidebar-header"><span className="brand">RED VAULT</span></div>
        <div className="file-tree-scroll">
          {fileTree.map((item, idx) => <FileSystemItem key={idx} item={item} onSelectFile={loadFile} />)}
        </div>
      </aside>

      <main className="main-viewport">
        <div className="content-wrapper">
          <MarkdownViewer content={content} onLinkClick={handlePreviewClick} />
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

        :root {
          --bg-color: #121212;
          --text-color: #ffffff;
          --sidebar-width: 300px;
          --table-border-color: rgba(255, 255, 255, 0.2);
          --accent-yellow: #FFFACD;
        }

        body { 
          margin: 0; background: var(--bg-color); color: var(--text-color); 
          font-family: 'Crimson Text', serif; font-size: 18px; line-height: 1.7;
        }

        .markdown-body {
          font-size: 20px; line-height: 1.8; width: 100%; text-align: justify;
        }

        .markdown-block {
          margin: 4px 0 !important; padding: 4px 12px !important; border-radius: 4px;
        }

        /* Colors & Alignment */
        .bg-red { background-color: rgba(220, 38, 38, 0.15) !important; }
        .bg-blue { background-color: rgba(22, 54, 69, 0.8) !important; }
        .bg-yellow { background-color: rgba(234, 179, 8, 0.15) !important; }
        .bg-green { background-color: rgba(34, 197, 94, 0.15) !important; }
        .bg-gray { background-color: rgba(156, 163, 175, 0.15) !important; }
        .text-red { color: #ff4444 !important; }
        .text-yellow { color: #eab308 !important; }
        .text-white { color: #ffffff !important; }
        .text-align-center { text-align: center !important; }
        .text-align-right { text-align: right !important; }

        /* Headings */
        .markdown-block h1 { font-size: 2.5em; border-bottom: 1px solid var(--table-border-color); padding-bottom: 0.3em; }
        .markdown-block h2 { font-size: 2em; border-bottom: 1px solid var(--table-border-color); padding-bottom: 0.3em; }
        .markdown-block h3 { font-size: 1.5em; }

        /* TABLES - CRITICAL FIX */
        .table-wrapper {
          width: 100%; overflow-x: auto; margin: 1.5em 0; border-radius: 4px;
          border: 1px solid var(--table-border-color);
        }
        table { 
          width: 100%; border-collapse: collapse; min-width: 600px;
        }
        th, td { 
          border: 1px solid var(--table-border-color); padding: 12px 15px; text-align: left;
          word-break: break-word;
        }
        th { background: rgba(255, 255, 255, 0.05); font-weight: 700; }

        /* Images & Videos */
        img { max-width: 100%; height: auto; border-radius: 4px; margin: 1em 0; }
        .img-circle { border-radius: 50%; aspect-ratio: 1/1; object-fit: cover; max-width: 250px; margin: 1em auto; display: block; }
        .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; margin: 1.5em 0; }
        .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px; }

        /* Lists & Quotes */
        ul, ol { padding-left: 2em; margin: 1em 0; }
        blockquote { border-left: 4px solid var(--accent-yellow); padding-left: 1.5em; margin: 1.5em 0; font-style: italic; opacity: 0.9; }
        
        /* Links */
        a { color: var(--accent-yellow); text-decoration: none; border-bottom: 1px solid transparent; transition: 0.2s; }
        a:hover { border-bottom-color: var(--accent-yellow); }
        .internal-link { color: var(--accent-yellow); cursor: pointer; text-decoration: underline dotted; }

        /* Layout */
        .md-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 1em 0; }
        .md-col { min-width: 0; }
        .app-container { min-height: 100vh; display: flex; }
        .sidebar-hover-area { position: fixed; top: 0; left: 0; width: 15px; height: 100vh; z-index: 1001; }
        .sidebar { 
          position: fixed; top: 0; left: 0; height: 100vh; width: var(--sidebar-width); 
          background: #000; z-index: 1000; transform: translateX(-100%); transition: 0.3s;
          box-shadow: 2px 0 15px rgba(0,0,0,0.5);
        }
        .sidebar.visible { transform: translateX(0); }
        .main-viewport { flex: 1; padding: 40px 60px; display: flex; justify-content: center; }
        .content-wrapper { max-width: 1000px; width: 100%; }

        /* Task Lists */
        .task-list-item { list-style-type: none; }
        .task-list-item input { margin-right: 0.5em; }

        /* Footnotes */
        .footnote-ref { font-size: 0.8em; vertical-align: super; }
        .footnote-def { font-size: 0.9em; opacity: 0.7; margin-top: 2em; border-top: 1px solid var(--table-border-color); padding-top: 1em; }

        /* Code Blocks */
        pre { background: #1e1e1e; padding: 1.5em; border-radius: 8px; overflow-x: auto; margin: 1.5em 0; }
        code { font-family: 'Courier New', monospace; font-size: 0.9em; }

        @media (max-width: 768px) {
          .main-viewport { padding: 20px; }
          .markdown-body { font-size: 17px; }
          .md-row { flex-direction: column; }
          .md-col { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
