"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import Pop from '../src/app/pages/pop';

// ─── UTILS ────────────────────────────────────────────────────────────────────

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement('script');
  s.src = src; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

const loadStyle = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
};

// ─── MARKDOWN ENGINE ──────────────────────────────────────────────────────────

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
    return `<div class="table-container"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
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
    return `<div class="code-block"><div class="code-header"><span class="code-lang">${lang}</span></div><pre><code class="hljs language-${lang}">${highlighted}</code></pre></div>`;
  };

  renderer.image = (token) => {
    const { href = '', title, text } = token;
    const ytMatch = href.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe></div>`;
    if (href.endsWith('#circle')) return `<img src="${href.replace('#circle', '')}" alt="${text || ''}" class="img-circle">`;
    return `<img src="${href}" alt="${text || ''}" title="${title || ''}">`;
  };

  window.marked.use({
    renderer,
    extensions: [
      { name: 'math', level: 'inline',
        start(src) { return src.match(/\$/)?.index; },
        tokenizer(src) {
          const b = /^\$\$([\s\S]+?)\$\$/.exec(src);
          if (b) return { type: 'math', raw: b[0], text: b[1], displayMode: true };
          const i = /^\$((?:\\\$|[^$])+)\$/.exec(src);
          if (i) return { type: 'math', raw: i[0], text: i[1], displayMode: false };
        },
        renderer(t) { return t.displayMode ? `<div class="math-block">$$\n${t.text}\n$$</div>` : `<span class="math-inline">$${t.text}$</span>`; }
      },
      { name: 'footnote', level: 'inline',
        start(src) { return src.match(/\[\^/)?.index; },
        tokenizer(src) { const m = /^\[\^([^\]]+)\]/.exec(src); if (m) return { type: 'footnote', raw: m[0], id: m[1] }; },
        renderer(t) { return `<sup class="fn-ref"><a href="#fn-${t.id}" id="fnref-${t.id}">${t.id}</a></sup>`; }
      },
      { name: 'footnoteDef', level: 'block',
        start(src) { return src.match(/^\[\^/)?.index; },
        tokenizer(src) { const m = /^\[\^([^\]]+)\]:\s+(.*)/.exec(src); if (m) return { type: 'footnoteDef', raw: m[0], id: m[1], text: m[2] }; },
        renderer(t) { return `<div class="footnote-item" id="fn-${t.id}"><a href="#fnref-${t.id}" class="fn-back">↩</a> <span class="fn-id">${t.id}:</span> ${t.text}</div>`; }
      },
      { name: 'wikiLink', level: 'inline',
        start(src) { return src.match(/\[\[/)?.index; },
        tokenizer(src) { const m = /^\[\[(.*?)\]\]/.exec(src); if (m) return { type: 'wikiLink', raw: m[0], text: m[1] }; },
        renderer(t) { return `<span class="internal-link" data-target="${t.text}">${t.text}</span>`; }
      },
    ],
    gfm: true, breaks: true,
  });

  window.markedConfigured = true;
};

// ─── SINGLETON LIB LOADER ─────────────────────────────────────────────────────

let _libsPromise = null;
const ensureLibsLoaded = () => {
  if (_libsPromise) return _libsPromise;
  _libsPromise = Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
    loadStyle('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'),
    loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
    loadStyle('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'),
    loadScript('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'),
  ])
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'))
    .then(() => {
      if (window.mermaid) window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      configureMarked();
    });
  return _libsPromise;
};

// ─── DOM POST-PROCESSING (KaTeX + Mermaid) ───────────────────────────────────

const postProcess = (el) => {
  if (!el) return;
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false,
    });
  }
  const nodes = el.querySelectorAll('.mermaid:not([data-processed="true"])');
  if (window.mermaid && nodes.length) window.mermaid.run({ nodes });
};

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

const cacheKey  = (name) => `vault_v3::${name}`;
const readCache = (name) => { try { return JSON.parse(localStorage.getItem(cacheKey(name))); } catch { return null; } };
const saveCache = (name, data) => { try { localStorage.setItem(cacheKey(name), JSON.stringify(data)); } catch {} };
const mkBlock   = (raw = '', type = 'paragraph') => ({
  id: `b${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  raw, type,
});

// ─── CURSOR HELPERS ───────────────────────────────────────────────────────────

const cursorToEnd = (el) => {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

// ─── LINE TYPE HELPERS ────────────────────────────────────────────────────────

const getLineType = (line) => {
  if (/^# /.test(line))            return 'h1';
  if (/^## /.test(line))           return 'h2';
  if (/^#{3,6} /.test(line))       return 'h3';
  if (/^[-*+] /.test(line))        return 'li';
  if (/^\d+\. /.test(line))        return 'oli';
  if (/^> /.test(line))            return 'quote';
  if (/^`{3}/.test(line))          return 'codefence';
  if (/^---+$|^\*\*\*+$/.test(line.trim())) return 'hr';
  if (!line.trim())                return 'empty';
  return 'p';
};

const renderLineAsHtml = (line) => {
  if (!line.trim()) return '<br>';
  return window.marked.parse(line)
    .replace(/^\s*<p>([\s\S]*?)<\/p>\s*$/, '$1').trim();
};

// ─── BLOCK VIEW (inactive block) ─────────────────────────────────────────────

const BlockView = ({ block, isEditing, onActivate, onLinkClick }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    divRef.current.innerHTML = window.marked.parse(block.raw || '');
    postProcess(divRef.current);
  }, [block.raw]);

  const handleClick = useCallback((e) => {
    const link = e.target.closest('a, .internal-link');
    if (link) { onLinkClick(e); return; }
    if (isEditing) onActivate();
  }, [isEditing, onActivate, onLinkClick]);

  return (
    <div
      ref={divRef}
      className={`block-content markdown-content block-view${isEditing ? ' editable-mode' : ''}`}
      onClick={handleClick}
    />
  );
};

// ─── CODE RAW EDITOR ─────────────────────────────────────────────────────────

const CodeRawEditor = ({ block, onSave, onDeactivate, onLinkClick }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = block.raw;
    cursorToEnd(ref.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(() => {
    if (ref.current) onSave(ref.current.textContent);
    onDeactivate();
  }, [onSave, onDeactivate]);

  const handleKeyDown = useCallback(async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const text = ref.current?.textContent?.trim() ?? '';
      if (text.startsWith('/ai ')) {
        e.preventDefault();
        const query = text.slice(4).trim();
        if (!query) return;
        ref.current.textContent = '⏳ AI is thinking…';
        try {
          const res  = await fetch('https://rag-backend-zh2e.onrender.com/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'BlockEditor', query }),
          });
          const data = await res.json();
          const reply = data.response || '*No response from AI.*';
          onSave(reply);
          onDeactivate();
        } catch {
          ref.current.textContent = '⚠ Could not reach AI.';
        }
        return;
      }
    }
  }, [onSave, onDeactivate]);

  return (
    <pre
      ref={ref}
      className="block-content markdown-content active-block code-raw-editor"
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

// ─── LINE EDITOR ──────────────────────────────────────────────────────────────

const LineEditor = ({ block, onSave, onDeactivate, onCreateAfter, onLinkClick }) => {
  const containerRef  = useRef(null);
  const cursorLineRef = useRef(null);
  const isReadyRef    = useRef(false);

  const flushAndSave = useCallback(() => {
    if (cursorLineRef.current)
      cursorLineRef.current.dataset.raw = cursorLineRef.current.textContent;
    if (!containerRef.current) return;
    const rawLines = Array.from(
      containerRef.current.querySelectorAll('.md-line')
    ).map(d => d.dataset.raw ?? '');
    onSave(rawLines.join('\n'));
  }, [onSave]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.marked) return;

    isReadyRef.current = false;
    container.innerHTML = '';

    const lines = (block.raw || '').split('\n');
    const divs = lines.map((line, i) => {
      const d = document.createElement('div');
      d.className = `md-line md-${getLineType(line)}`;
      d.dataset.raw = line;
      d.dataset.lineIndex = String(i);
      d.innerHTML = renderLineAsHtml(line);
      return d;
    });

    divs.forEach(d => container.appendChild(d));

    // Last line becomes cursor line (raw text)
    const lastDiv = divs[divs.length - 1];
    if (lastDiv) {
      lastDiv.textContent = lastDiv.dataset.raw;
      lastDiv.classList.add('cursor-line');
      cursorLineRef.current = lastDiv;
    }

    isReadyRef.current = true;
    if (lastDiv) cursorToEnd(lastDiv);

    const handleSelectionChange = () => {
      if (!isReadyRef.current) return;
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode) return;

      // Walk up to find .md-line inside container
      let node = sel.anchorNode;
      let newDiv = null;
      while (node && node !== document.body) {
        if (node.classList && node.classList.contains('md-line') && container.contains(node)) {
          newDiv = node;
          break;
        }
        node = node.parentNode;
      }

      if (!newDiv || newDiv === cursorLineRef.current) return;

      // Outgoing: sync raw, re-render, remove cursor-line
      const outgoing = cursorLineRef.current;
      if (outgoing) {
        outgoing.dataset.raw = outgoing.textContent;
        outgoing.innerHTML = renderLineAsHtml(outgoing.dataset.raw);
        outgoing.classList.remove('cursor-line');
      }

      // Incoming: set textContent = raw, add cursor-line
      newDiv.textContent = newDiv.dataset.raw;
      newDiv.classList.add('cursor-line');
      cursorLineRef.current = newDiv;
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      isReadyRef.current = false;
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(() => {
    const cur = cursorLineRef.current;
    if (!cur) return;
    cur.dataset.raw = cur.textContent;
    // Update line type CSS class
    const lt = getLineType(cur.textContent);
    cur.className = `md-line md-${lt} cursor-line`;
  }, []);

  const handleKeyDown = useCallback(async (e) => {
    const cur = cursorLineRef.current;
    if (!cur) return;

    // Backspace at offset 0 — merge with previous line
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.anchorOffset === 0 && sel.focusOffset === 0) {
        const prev = cur.previousElementSibling;
        if (prev) {
          e.preventDefault();
          const prevRaw = prev.dataset.raw ?? '';
          const curRaw  = cur.dataset.raw ?? cur.textContent;
          const merged  = prevRaw + curRaw;
          prev.dataset.raw = merged;
          prev.textContent = merged;
          prev.classList.add('cursor-line');
          prev.classList.remove(`md-${getLineType(prevRaw)}`);
          prev.classList.add(`md-${getLineType(merged)}`);
          cur.remove();
          cursorLineRef.current = prev;
          // Place cursor at junction
          const range = document.createRange();
          const textNode = prev.firstChild || prev;
          const offset = Math.min(prevRaw.length, textNode.textContent?.length ?? 0);
          try { range.setStart(textNode, offset); range.collapse(true); } catch {}
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(range);
        }
      }
      return;
    }

    // Shift+Enter — allow default
    if (e.key === 'Enter' && e.shiftKey) return;

    if (e.key === 'Enter') {
      const rawText = cur.textContent.trim();

      // /ai command
      if (rawText.startsWith('/ai ')) {
        e.preventDefault();
        const query = rawText.slice(4).trim();
        if (!query) return;
        cur.textContent = '⏳ AI is thinking…';
        try {
          const res  = await fetch('https://rag-backend-zh2e.onrender.com/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'BlockEditor', query }),
          });
          const data = await res.json();
          const reply = data.response || '*No response from AI.*';
          onSave(reply);
        } catch {
          onSave('⚠ Could not reach AI.');
        }
        onDeactivate();
        return;
      }

      const lt = getLineType(cur.textContent);

      // List continuation
      if (lt === 'li' || lt === 'oli') {
        e.preventDefault();
        cur.dataset.raw = cur.textContent;
        const newDiv = document.createElement('div');
        const prefix = lt === 'li' ? '- ' : (() => {
          const m = cur.textContent.match(/^(\d+)\./);
          return m ? `${parseInt(m[1]) + 1}. ` : '1. ';
        })();
        newDiv.className = `md-line md-${lt} cursor-line`;
        newDiv.dataset.raw = prefix;
        newDiv.textContent = prefix;
        cur.classList.remove('cursor-line');
        cur.after(newDiv);
        cursorLineRef.current = newDiv;
        cursorToEnd(newDiv);
        return;
      }

      // Default: save and create new block after
      e.preventDefault();
      flushAndSave();
      onCreateAfter();
    }
  }, [onSave, onDeactivate, onCreateAfter, flushAndSave]);

  const handleBlur = useCallback((e) => {
    // Don't deactivate if focus moved to another child within container
    if (containerRef.current && containerRef.current.contains(e.relatedTarget)) return;
    flushAndSave();
    onDeactivate();
  }, [flushAndSave, onDeactivate]);

  const handleClick = useCallback((e) => {
    const link = e.target.closest('a, .internal-link');
    if (link) { onLinkClick(e); }
  }, [onLinkClick]);

  return (
    <div
      ref={containerRef}
      className="block-content markdown-content active-block line-editor-container"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={handleClick}
    />
  );
};

// ─── ACTIVE BLOCK ─────────────────────────────────────────────────────────────

const ActiveBlock = ({ block, onSave, onDeactivate, onCreateAfter, onLinkClick }) => {
  if (block.type === 'code' || block.type === 'table') {
    return (
      <CodeRawEditor
        block={block}
        onSave={onSave}
        onDeactivate={onDeactivate}
        onLinkClick={onLinkClick}
      />
    );
  }
  return (
    <LineEditor
      block={block}
      onSave={onSave}
      onDeactivate={onDeactivate}
      onCreateAfter={onCreateAfter}
      onLinkClick={onLinkClick}
    />
  );
};

// ─── BLOCK EDITOR ─────────────────────────────────────────────────────────────

const BlockEditor = ({ content, fileName, onLinkClick }) => {
  const [blocks, setBlocks]           = useState([]);
  const [activeBlockIndex, setActive] = useState(null);
  const [isEditing, setIsEditing]     = useState(false);
  const [libsReady, setLibsReady]     = useState(false);

  useEffect(() => { ensureLibsLoaded().then(() => setLibsReady(true)); }, []);

  useEffect(() => {
    if (!libsReady || !window.marked || !fileName) return;
    setActive(null);

    const cached = readCache(fileName);
    if (Array.isArray(cached) && cached.length > 0) {
      // Migrate old v2 blocks (had .html instead of .raw)
      const migrated = cached.map(b =>
        b.raw !== undefined ? b : mkBlock(b.html ? b.html.replace(/<[^>]+>/g, '') : '', 'paragraph')
      );
      setBlocks(migrated);
      return;
    }

    const tokens    = window.marked.lexer(content || '');
    const newBlocks = tokens
      .filter(t => t.type !== 'space')
      .map(t => mkBlock(t.raw.trimEnd(), t.type));

    setBlocks(newBlocks.length > 0 ? newBlocks : [mkBlock('', 'paragraph')]);
  }, [content, fileName, libsReady]);

  useEffect(() => {
    if (fileName && blocks.length > 0) saveCache(fileName, blocks);
  }, [blocks, fileName]);

  const saveBlock = useCallback((index, raw) => {
    setBlocks(prev => {
      const n = [...prev];
      const tokens = window.marked ? window.marked.lexer(raw) : [];
      const type = tokens.find(t => t.type !== 'space')?.type ?? 'paragraph';
      n[index] = { ...n[index], raw, type };
      return n;
    });
  }, []);

  const createBlockAfter = useCallback((index) => {
    const fresh = mkBlock('', 'paragraph');
    setBlocks(prev => { const n = [...prev]; n.splice(index + 1, 0, fresh); return n; });
    setActive(index + 1);
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing(e => !e);
    setActive(null);
  }, []);

  if (!libsReady) return <div className="status-msg">Booting Vault Engine…</div>;

  return (
    <div className="block-editor">
      <button className="mode-toggle-btn" onClick={toggleEditing}>
        {isEditing ? '👁 Read' : '✏ Edit'}
      </button>

      {blocks.map((block, index) => (
        activeBlockIndex === index && isEditing ? (
          <ActiveBlock
            key={block.id}
            block={block}
            onSave={(raw) => saveBlock(index, raw)}
            onDeactivate={() => setActive(null)}
            onCreateAfter={() => createBlockAfter(index)}
            onLinkClick={onLinkClick}
          />
        ) : (
          <BlockView
            key={block.id}
            block={block}
            isEditing={isEditing}
            onActivate={() => setActive(index)}
            onLinkClick={onLinkClick}
          />
        )
      ))}
    </div>
  );
};

// ─── FILE SYSTEM ITEM ─────────────────────────────────────────────────────────

const FileSystemItem = ({ item, level = 0, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="select-none">
      <div
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (item.kind === 'directory') setIsOpen(o => !o);
          else onSelectFile(item.path, item.name);
        }}
      >
        <span className="arrow-wrapper">
          {item.kind === 'directory'
            ? isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            : <span className="spacer" />}
        </span>
        <span className="item-name">{item.name.replace('.md', '')}</span>
      </div>
      {item.kind === 'directory' && isOpen && item.children?.map((child, i) => (
        <FileSystemItem key={i} item={child} level={level + 1} onSelectFile={onSelectFile} />
      ))}
    </div>
  );
};

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────

export default function UltimateRedVault() {
  const [fileTree,    setFileTree]    = useState([]);
  const [content,     setContent]     = useState('');
  const [fileName,    setFileName]    = useState('');
  const fileRegistry  = useRef({});
  const appShellRef   = useRef(null);

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth,    setChatWidth]    = useState(350);
  const isResizingSidebar = useRef(false);
  const isResizingChat    = useRef(false);

  const isMobileView = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth <= 1024 || window.matchMedia('(orientation: portrait)').matches);

  const handleMouseMove = useCallback((e) => {
    if (isResizingSidebar.current) { const w = e.clientX;           if (w > 150 && w < 500) setSidebarWidth(w); }
    if (isResizingChat.current)    { const w = window.innerWidth - e.clientX; if (w > 250 && w < 600) setChatWidth(w); }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = isResizingChat.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const startResizingSidebar = useCallback(() => {
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, stopResizing]);

  const startResizingChat = useCallback(() => {
    isResizingChat.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, stopResizing]);

  const loadFile = useCallback(async (path, name, updateHistory = true) => {
    try {
      const res  = await fetch(path);
      const text = await res.text();
      setContent(text);
      setFileName(name);
      if (updateHistory) {
        const u = new URL(window.location);
        u.searchParams.set('file', name);
        window.history.pushState({ path, name }, '', u);
      }
      if (isMobileView() && appShellRef.current)
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'smooth' });
    } catch { setContent('# Error\nFailed to load.'); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tree = await fetch('/api/cases').then(r => r.json());
        if (!Array.isArray(tree)) { setContent(`# API Error\n${tree.error || 'Unknown'}`); return; }
        const buildRegistry = (nodes) => nodes.forEach(n => {
          if (n.kind === 'file') {
            fileRegistry.current[n.name.toLowerCase()] = n.path;
            fileRegistry.current[n.name.replace('.md', '').toLowerCase()] = n.path;
          } else if (n.children) buildRegistry(n.children);
        });
        buildRegistry(tree);
        setFileTree(tree);
        const p = fileRegistry.current['dash board.md'];
        if (p) loadFile(p, 'Dash Board.md');
      } catch { setContent('# Connection Error\nFailed to connect to API.'); }
    })();
  }, [loadFile]);

  useEffect(() => {
    const center = () => { if (isMobileView() && appShellRef.current) appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'instant' }); };
    center();
    window.addEventListener('resize', center);
    return () => window.removeEventListener('resize', center);
  }, []);

  useEffect(() => {
    const onPop = (e) => { if (e.state?.path) loadFile(e.state.path, e.state.name, false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [loadFile]);

  const handleLinkClick = useCallback((e) => {
    const link = e.target.closest('.internal-link') || e.target.closest('a');
    if (!link) return;
    const name = link.getAttribute('data-target') || link.innerText;
    const path = fileRegistry.current[name.toLowerCase()];
    if (path) { e.preventDefault(); loadFile(path, name); }
  }, [loadFile]);

  return (
    <div className="app-shell" ref={appShellRef}>

      {/* LEFT: FILE TREE */}
      <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">RED VAULT</div>
        <div className="file-list">
          {fileTree.map((item, i) => <FileSystemItem key={i} item={item} onSelectFile={loadFile} />)}
        </div>
      </aside>

      <div className="resizer" onMouseDown={startResizingSidebar}><div className="divider-line">||</div></div>

      {/* CENTER: BLOCK EDITOR */}
      <main className="main-content">
        <article className="markdown-container">
          <BlockEditor content={content} fileName={fileName} onLinkClick={handleLinkClick} />
        </article>
      </main>

      <div className="resizer" onMouseDown={startResizingChat}><div className="divider-line">||</div></div>

      {/* RIGHT: CHAT */}
      <aside className="chat-panel" style={{ width: chatWidth }}>
        <div className="chat-container"><Pop isEmbedded={true} /></div>
      </aside>

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
        .sidebar-brand { padding:20px; font-weight:600; letter-spacing:2px; border-bottom:1px solid var(--border); font-family:'Inter',sans-serif; }
        .file-list { flex:1; overflow-y:auto; padding:10px; scrollbar-width:none; }
        .file-list::-webkit-scrollbar { display:none; }

        .main-content { flex:1; overflow-y:auto; display:flex; justify-content:center; padding:30px 15px; scrollbar-width:none; background:var(--bg); }
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
          min-height: calc(var(--md-line) * var(--md-size));
        }

        .block-content p:first-child { margin-top: 0; }
        .block-content p:last-child  { margin-bottom: 0; }

        .block-view { cursor: default; }
        .block-view.editable-mode { cursor: text; }
        .block-view.editable-mode:hover { background: rgba(255,255,255,0.025); }

        .active-block {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
          padding: 2px 4px;
          outline: none;
        }

        .status-msg { opacity:.4; font-family:'Inter',sans-serif; font-size:13px; padding:20px 0; }

        /* Mode toggle */
        .mode-toggle-btn {
          position: sticky; top: 8px; float: right; z-index: 100;
          background: rgba(255,255,255,0.07); border: 1px solid var(--border);
          border-radius: 20px; padding: 4px 12px; font-size: 12px;
          font-family: 'Inter', sans-serif; color: var(--txt);
          cursor: pointer; user-select: none; transition: background .15s;
        }
        .mode-toggle-btn:hover { background: rgba(255,255,255,0.12); }

        /* Line divs inside LineEditor */
        .md-line { display: block; outline: none; min-height: 1.4em; white-space: pre-wrap; }
        .md-line.md-h1  { font-size: 2em; font-weight: 700; color: #fff; line-height: 1.2; }
        .md-line.md-h2  { font-size: 1.6em; font-weight: 700; color: #fff; line-height: 1.2; }
        .md-line.md-h3  { font-size: 1.2em; font-weight: 700; color: #fff; line-height: 1.2; }
        .md-line.md-li  { padding-left: 1.5em; position: relative; }
        .md-line.md-li::before { content: '•'; position: absolute; left: 0.3em; }
        .md-line.md-oli { padding-left: 1.5em; }
        .md-line.md-quote { border-left: 3px solid var(--accent); padding-left: 1em; font-style: italic; opacity: 0.8; }
        .md-line.md-codefence { font-family: monospace; opacity: 0.6; }
        .md-line.cursor-line { caret-color: var(--accent); }

        /* CodeRawEditor */
        .code-raw-editor {
          font-family: monospace; font-size: 14px;
          background: var(--code-bg); border-radius: 4px; padding: 10px;
          white-space: pre; overflow-x: auto; min-height: 3em; outline: none;
        }

        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--md-font); font-size:var(--md-size); line-height:var(--md-line); color:var(--txt); }
        .markdown-content h1 { font-size:2.0em; margin:.8em 0 .4em; color:#fff; font-weight:700; }
        .markdown-content h2 { font-size:1.6em; margin:.7em 0 .3em; color:#fff; font-weight:700; }
        .markdown-content h3 { font-size:1.2em; margin:.6em 0 .2em; color:#fff; font-weight:700; }
        .markdown-content p  { margin-bottom:1em; }

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
        .video-container iframe { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:8px; }

        /* MOBILE & TABLET PORTRAIT */
        @media (max-width:1024px),(orientation:portrait) {
          .app-shell { overflow-x:auto !important; overflow-y:hidden !important; scroll-snap-type:x mandatory; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; display:flex !important; flex-wrap:nowrap !important; }
          .sidebar-panel,.main-content,.chat-panel { width:100vw !important; min-width:100vw !important; flex-shrink:0 !important; scroll-snap-align:center; position:relative !important; height:100dvh !important; }
          .resizer { display:none !important; }
          .main-content { padding:30px 15px; }
          :root { --md-size: clamp(17px, 1.5vw + 10px, 22px); }
          .markdown-content h1 { font-size:1.8em; }
          .markdown-content h2 { font-size:1.5em; }
          .markdown-content h3 { font-size:1.2em; }
          .tree-item { font-size:clamp(13px,1vw + 10px,16px); }
        }
      `}</style>
    </div>
  );
}
