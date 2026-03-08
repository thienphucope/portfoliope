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

// ─── BLOCK VIEW (inactive block) ─────────────────────────────────────────────

const BlockView = ({ block, isEditing, isActive, onActivate, onLinkClick }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    divRef.current.innerHTML = window.marked.parse(block.raw || '');
    postProcess(divRef.current);
  }, [block.raw]);

  const handleClick = useCallback((e) => {
    if (isActive) return;
    const link = e.target.closest('a, .internal-link');
    if (link) { onLinkClick(e); return; }
    if (isEditing) onActivate();
  }, [isActive, isEditing, onActivate, onLinkClick]);

  return (
    <div
      ref={divRef}
      className={`block-content markdown-content block-view${isEditing ? ' editable-mode' : ''}${isActive ? ' block-view-hidden' : ''}`}
      onClick={handleClick}
    />
  );
};

// ─── CODE RAW EDITOR ─────────────────────────────────────────────────────────

const CodeRawEditor = ({ block, onSave, onDeactivate, onNavigate, cursorPosition = "end" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.value = block.raw;
    ref.current.focus();
    const pos = cursorPosition === 'start' ? 0 : ref.current.value.length;
    ref.current.setSelectionRange(pos, pos);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(() => {
    if (ref.current) onSave(ref.current.value);
    onDeactivate();
  }, [onSave, onDeactivate]);

  const handleKeyDown = useCallback(async (e) => {
    if (e.key === 'Escape') {
      if (ref.current) onSave(ref.current.value);
      onDeactivate();
      return;
    }

    if (e.key === 'Backspace') {
      const ta = ref.current;
      if (ta && ta.value === '') {
        e.preventDefault();
        onSave('');
        onNavigate('up', true);
        return;
      }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const ta = ref.current;
      if (!ta) return;
      const val = ta.value;
      const pos = ta.selectionStart;
      const beforeCursor = val.slice(0, pos);
      const afterCursor  = val.slice(pos);
      const onFirstLine  = !beforeCursor.includes('\n');
      const onLastLine   = !afterCursor.includes('\n');
      if (e.key === 'ArrowUp' && onFirstLine) {
        e.preventDefault();
        onSave(ta.value);
        onNavigate('up');
        return;
      }
      if (e.key === 'ArrowDown' && onLastLine) {
        e.preventDefault();
        onSave(ta.value);
        onNavigate('down');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const text = ref.current?.value?.trim() ?? '';
      if (text.startsWith('/ai ')) {
        e.preventDefault();
        const query = text.slice(4).trim();
        if (!query) return;
        ref.current.value = '⏳ AI is thinking…';
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
          ref.current.value = '⚠ Could not reach AI.';
        }
      }
    }
  }, [onSave, onDeactivate]);

  // Auto-resize textarea
  const handleInput = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, []);

  return (
    <textarea
      ref={ref}
      className="block-content code-raw-editor active-block"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      spellCheck={false}
    />
  );
};

// ─── LINE TYPE HELPERS ────────────────────────────────────────────────────────

const getLineClass = (line) => {
  if (/^###### /.test(line)) return 'rte-h6';
  if (/^##### /.test(line))  return 'rte-h5';
  if (/^#### /.test(line))   return 'rte-h4';
  if (/^### /.test(line))    return 'rte-h3';
  if (/^## /.test(line))     return 'rte-h2';
  if (/^# /.test(line))      return 'rte-h1';
  if (/^[-*+] /.test(line))  return 'rte-ul';
  if (/^\d+\. /.test(line))  return 'rte-ol';
  if (/^> /.test(line))      return 'rte-blockquote';
  if (/^`{3}/.test(line))    return 'rte-codefence';
  if (/^---+$|^\*\*\*+$/.test(line.trim())) return 'rte-hr';
  return 'rte-p';
};

// ─── RAW TEXT EDITOR ─────────────────────────────────────────────────────────
// contentEditable with per-line CSS classes styled to match rendered output.
// Each line = one <div class="rte-line rte-XX"> holding raw text.
// Empty lines rendered as <div class="rte-line rte-empty"><br></div> for height.

const RawTextEditor = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition = 'end' }) => {
  const containerRef = useRef(null);

  // Build a single line div from raw string
  const buildLineDiv = (line) => {
    const d = document.createElement('div');
    const cls = getLineClass(line);
    d.className = `rte-line ${cls}`;
    if (line === '') {
      d.classList.add('rte-empty');
      d.innerHTML = '<br>';
    } else {
      d.textContent = line;
    }
    return d;
  };

  // Build all line divs from raw string
  const buildLines = (raw) => (raw || '').split('\n').map(buildLineDiv);

  // Collect raw text — reads textContent per line, empty = ''
  const collectRaw = () => {
    if (!containerRef.current) return '';
    return Array.from(containerRef.current.querySelectorAll('.rte-line'))
      .map(d => {
        if (d.classList.contains('rte-empty')) return '';
        // textContent is always the raw markdown text (no pseudo-element content)
        return d.textContent || '';
      })
      .join('\n');
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    buildLines(block.raw || '').forEach(d => el.appendChild(d));
    if (cursorPosition === 'start') {
      const first = el.firstElementChild || el;
      first.focus();
      const range = document.createRange();
      range.setStart(first, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      cursorToEnd(el.lastElementChild || el);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On every keystroke: re-classify current line CSS only (no innerHTML touch)
  const handleInput = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let node = sel.anchorNode;
    while (node && node !== containerRef.current) {
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-line')) break;
      node = node.parentNode;
    }
    if (!node || node === containerRef.current) return;
    const text = node.textContent || '';
    const isEmpty = text === '' || node.innerHTML === '<br>';
    node.className = `rte-line ${getLineClass(text)}${isEmpty ? ' rte-empty' : ''}`;
    // Ensure empty line has <br> so it holds height
    if (isEmpty && !node.querySelector('br')) {
      node.innerHTML = '<br>';
    }
  }, []);

  const handleBlur = useCallback(() => {
    onSave(collectRaw());
    onDeactivate();
  }, [onSave, onDeactivate]);

  // Helper: find the rte-line div containing the current cursor
  const getCurrentLineDiv = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    let node = sel.anchorNode;
    const container = containerRef.current;
    while (node && node !== container) {
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-line')) return node;
      node = node.parentNode;
    }
    // fallback: if cursor is directly inside container (e.g. on <br>), return first/last child
    if (node === container) {
      const lines = container.querySelectorAll('.rte-line');
      return lines.length > 0 ? lines[sel.anchorOffset === 0 ? 0 : lines.length - 1] : null;
    }
    return null;
  };

  const handleKeyDown = useCallback(async (e) => {
    const el = containerRef.current;
    if (!el) return;

    if (e.key === 'Escape') {
      onSave(collectRaw());
      onDeactivate();
      return;
    }

    // Backspace on empty block → delete block and move to previous
    if (e.key === 'Backspace') {
      const raw = collectRaw();
      if (raw === '') {
        e.preventDefault();
        onSave(raw);
        onNavigate('up', true); // true = delete this block
        return;
      }
    }

    // Arrow up/down — navigate between blocks at first/last line
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const lineDiv = getCurrentLineDiv();
      const lines = el.querySelectorAll('.rte-line');
      const firstLine = lines[0];
      const lastLine  = lines[lines.length - 1];
      const isFirst = !lineDiv || lineDiv === firstLine || !lineDiv.previousElementSibling;
      const isLast  = !lineDiv || lineDiv === lastLine  || !lineDiv.nextElementSibling;
      if (e.key === 'ArrowUp' && isFirst) {
        e.preventDefault();
        onSave(collectRaw());
        onNavigate('up');
        return;
      }
      if (e.key === 'ArrowDown' && isLast) {
        e.preventDefault();
        onSave(collectRaw());
        onNavigate('down');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      // Get current line div
      const sel = window.getSelection();
      let lineDiv = sel?.anchorNode;
      while (lineDiv && !(lineDiv.classList && lineDiv.classList.contains('rte-line'))) lineDiv = lineDiv?.parentNode;

      const lineText = lineDiv ? (lineDiv.textContent || '') : '';

      // /ai command
      if (lineText.trim().startsWith('/ai ')) {
        e.preventDefault();
        const query = lineText.trim().slice(4).trim();
        if (!query) return;
        if (lineDiv) lineDiv.textContent = '⏳ AI is thinking…';
        try {
          const res  = await fetch('https://rag-backend-zh2e.onrender.com/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'BlockEditor', query }),
          });
          const data = await res.json();
          onSave(data.response || '*No response from AI.*');
        } catch {
          onSave('⚠ Could not reach AI.');
        }
        onDeactivate();
        return;
      }

      // List continuation
      const ulMatch = /^([-*+] )/.exec(lineText);
      const olMatch = /^(\d+)\. /.exec(lineText);

      if (ulMatch && lineText.trim() !== '-' && lineText.trim() !== '*' && lineText.trim() !== '+' && lineText.trim() !== ulMatch[1].trim()) {
        e.preventDefault();
        const newDiv = document.createElement('div');
        newDiv.className = `rte-line ${getLineClass(ulMatch[1])}`;
        newDiv.dataset.raw = ulMatch[1];
        newDiv.textContent = ulMatch[1];
        lineDiv.after(newDiv);
        cursorToEnd(newDiv);
        return;
      }

      if (olMatch) {
        const num = parseInt(olMatch[1]);
        if (lineText.trim() !== `${num}.`) {
          e.preventDefault();
          const prefix = `${num + 1}. `;
          const newDiv = document.createElement('div');
          newDiv.className = 'rte-line rte-ol';
          newDiv.textContent = prefix;
          lineDiv.after(newDiv);
          cursorToEnd(newDiv);
          return;
        }
      }

      // Default: save and create new block
      e.preventDefault();
      onSave(collectRaw());
      onCreateAfter();
    }
  }, [onSave, onDeactivate, onCreateAfter]);

  return (
    <div
      ref={containerRef}
      className="block-content markdown-content raw-text-editor active-block"
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  );
};

// ─── ACTIVE BLOCK ─────────────────────────────────────────────────────────────

const ActiveBlock = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition, onLinkClick }) => {
  if (block.type === 'code' || block.type === 'table') {
    return (
      <CodeRawEditor
        block={block}
        onSave={onSave}
        onDeactivate={onDeactivate}
        onNavigate={onNavigate}
        cursorPosition={cursorPosition}
      />
    );
  }
  return (
    <RawTextEditor
      block={block}
      onSave={onSave}
      onDeactivate={onDeactivate}
      onCreateAfter={onCreateAfter}
      onNavigate={onNavigate}
      cursorPosition={cursorPosition}
    />
  );
};

// ─── BLOCK EDITOR ─────────────────────────────────────────────────────────────

const BlockEditor = ({ content, fileName, onLinkClick, onSaveFile }) => {
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
      const migrated = cached.map(b =>
        b.raw !== undefined ? b : mkBlock(b.html ? b.html.replace(/<[^>]+>/g, '') : '', 'paragraph')
      );
      setBlocks(migrated);
      return;
    }

    const tokens = window.marked.lexer(content || '');
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

  const [cursorPos, setCursorPos] = useState('end');

  const navigateBlock = useCallback((index, direction, deleteBlock = false) => {
    if (deleteBlock) {
      // Remove this block and move to previous
      setBlocks(prev => {
        if (prev.length <= 1) return prev; // never delete last block
        const n = [...prev];
        n.splice(index, 1);
        return n;
      });
      setCursorPos('end');
      setActive(Math.max(0, index - 1));
      return;
    }
    if (direction === 'up' && index > 0) {
      setCursorPos('end');
      setActive(index - 1);
    }
    if (direction === 'down' && index < blocks.length - 1) {
      setCursorPos('start');
      setActive(index + 1);
    }
  }, [blocks.length]);

  const [saveStatus, setSaveStatus] = useState('idle');

  const handleSave = useCallback(async () => {
    const raw = blocks.map(b => b.raw).join('\n\n');
    setSaveStatus('saving');
    try {
      await onSaveFile(raw);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [blocks, onSaveFile]);

  const toggleEditing = useCallback(() => {
    setIsEditing(e => !e);
    setActive(null);
  }, []);

  if (!libsReady) return <div className="status-msg">Booting Vault Engine…</div>;

  return (
    <div className="block-editor">
      <div className="toolbar">
        <button className="mode-toggle-btn" onClick={toggleEditing}>
          {isEditing ? '👁 Read' : '✏ Edit'}
        </button>
        <button
          className={`save-btn save-btn--${saveStatus}`}
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? '⏳' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✗ Error' : '💾 Save'}
        </button>
      </div>

      {blocks.map((block, index) => {
        const isActive = activeBlockIndex === index && isEditing;
        return (
          <div key={block.id} className="block-wrapper">
            <BlockView
              block={block}
              isEditing={isEditing}
              isActive={isActive}
              onActivate={() => { setCursorPos('end'); setActive(index); }}
              onLinkClick={onLinkClick}
            />
            {isActive && (
              <ActiveBlock
                block={block}
                onSave={(raw) => saveBlock(index, raw)}
                onDeactivate={() => setActive(null)}
                onCreateAfter={() => createBlockAfter(index)}
                onNavigate={(dir, del) => navigateBlock(index, dir, del)}
                cursorPosition={cursorPos}
                onLinkClick={onLinkClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── FILE SYSTEM ITEM ─────────────────────────────────────────────────────────

const FileSystemItem = ({ item, level = 0, onSelectFile, activeFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = item.kind === 'file' && item.name.toLowerCase() === activeFile?.toLowerCase();
  return (
    <div className="select-none">
      <div
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}${isActive ? ' is-active' : ''}${item.isLocal ? ' is-local' : ''}`}
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
        {item.isLocal && <span className="local-badge">●</span>}
      </div>
      {item.kind === 'directory' && isOpen && item.children?.map((child, i) => (
        <FileSystemItem key={i} item={child} level={level + 1} onSelectFile={onSelectFile} activeFile={activeFile} />
      ))}
    </div>
  );
};

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────

export default function UltimateRedVault() {
  const [fileTree,    setFileTree]    = useState([]);
  const [content,     setContent]     = useState('');
  const [fileName,    setFileName]    = useState('');
  const [contentKey,  setContentKey]  = useState(0);  // bumped on every file open to force BlockEditor reset
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

  const loadFile = useCallback(async (path, name, serverPath = null, updateHistory = true) => {
    // Local-only file (not saved to server yet) — restore from cache
    if (!path) {
      const key = serverPath || name;
      const cached = readCache(key);
      const raw = Array.isArray(cached) && cached.length > 0
        ? cached.map(b => b.raw).join('\n\n')
        : `# ${name.replace('.md', '')}\n`;
      setContent(raw);
      setFileName(key);
      setContentKey(k => k + 1);
      if (isMobileView() && appShellRef.current)
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'smooth' });
      return;
    }
    try {
      const res  = await fetch(path);
      const text = await res.text();
      setContent(text);
      setFileName(name);
      setContentKey(k => k + 1);
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

  // Before unload: check if localStorage cache differs from last known server content.
  // If so, show native browser confirm. If user chooses to leave → flush cache so
  // next load gets clean server content. If user cancels → stay on page, nothing changes.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      // Collect all vault cache keys
      const dirtyKeys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('vault_v3::')) dirtyKeys.push(k);
        }
      } catch {}
      if (dirtyKeys.length === 0) return;

      // Show native browser dialog — "changes may not be saved"
      e.preventDefault();
      e.returnValue = '';   // required for Chrome to show dialog

      // When user confirms leaving, flush all vault caches
      // (returnValue trick: we can't know their choice synchronously,
      //  so we use a tiny setTimeout — if page unloads the flush runs
      //  just before; if they cancel it's a no-op since page stays)
      const flush = () => {
        dirtyKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
      };
      // schedule flush — fires if page actually unloads
      window.addEventListener('unload', flush, { once: true });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Re-fetch tree and rebuild registry
  const refreshTree = useCallback(async () => {
    const tree = await fetch('/api/cases').then(r => r.json());
    if (!Array.isArray(tree)) return;
    const buildReg = (nodes) => nodes.forEach(n => {
      if (n.kind === 'file') {
        fileRegistry.current[n.name.toLowerCase()] = n.path;
        fileRegistry.current[n.name.replace('.md','').toLowerCase()] = n.path;
      } else if (n.children) buildReg(n.children);
    });
    buildReg(tree);
    setFileTree(tree);
  }, []);

  // Create file locally in memory and open it — no server call until Save
  // target examples: "MyNote" → cases/notes/MyNote.md
  //                  "folder/MyNote" → cases/folder/MyNote.md
  //                  "cases/x/MyNote" → cases/x/MyNote.md (used as-is if starts with cases/)
  // Resolve [[target]] to a server path:
  //   [[note]]          → notes/note.md      (default folder)
  //   [[folder/note]]   → folder/note.md     (explicit path)
  const resolveWikiPath = (target) => {
    const withExt = target.endsWith('.md') ? target : `${target}.md`;
    return withExt.includes('/') ? withExt : `notes/${withExt}`;
  };

  const createAndOpenFile = useCallback((target) => {
    const serverPath  = resolveWikiPath(target);              // e.g. "notes/MyNote.md"
    const displayName = serverPath.split('/').pop();          // "MyNote.md"
    const title       = displayName.replace('.md', '');

    // Register with null = local only
    fileRegistry.current[serverPath.toLowerCase()] = null;
    fileRegistry.current[displayName.toLowerCase()] = null;
    fileRegistry.current[target.toLowerCase()] = null;

    // Insert into tree, creating folder nodes as needed
    const parts = serverPath.split('/');
    setFileTree(prev => {
      const insert = (nodes, [head, ...rest]) => {
        if (rest.length === 0) {
          if (nodes.some(n => n.name.toLowerCase() === head.toLowerCase())) return nodes;
          return [...nodes, { kind: 'file', name: head, path: null, isLocal: true }];
        }
        const folder = nodes.find(n => n.kind === 'directory' && n.name.toLowerCase() === head.toLowerCase());
        if (folder) return nodes.map(n => n === folder ? { ...n, children: insert(n.children || [], rest) } : n);
        return [...nodes, { kind: 'directory', name: head, isOpen: true, children: insert([], rest) }];
      };
      return insert(prev, parts);
    });

    // Clear any stale cache so BlockEditor starts fresh
    try { localStorage.removeItem(`vault_v3::${serverPath}`); } catch {}
    setContent(`# ${title}\n`);
    setFileName(serverPath);
    setContentKey(k => k + 1);
  }, []);

  const handleLinkClick = useCallback((e) => {
    const link = e.target.closest('.internal-link') || e.target.closest('a');
    if (!link) return;
    const target = link.getAttribute('data-target') || link.innerText;
    const serverPath = resolveWikiPath(target);
    const key        = serverPath.toLowerCase();
    const baseName   = serverPath.split('/').pop().toLowerCase();

    // Check registry: string value = real path, null = local-only, undefined = not found
    const realPath = fileRegistry.current[key] ?? fileRegistry.current[baseName];

    e.preventDefault();
    if (typeof realPath === 'string') {
      loadFile(realPath, serverPath.split('/').pop());
    } else if (realPath === null) {
      // already open/created locally — just set fileName to navigate back
      setFileName(serverPath);
    } else {
      createAndOpenFile(target);
    }
  }, [loadFile, createAndOpenFile]);

  // Save current file — create:true if file only exists locally (new [[wikilink]] file)
  const handleSaveFile = useCallback(async (raw) => {
    if (!fileName) throw new Error('No file open');
    // If registry has null for this file it means it was created locally and not yet on server
    const isNew = fileRegistry.current[fileName.toLowerCase()] === null;
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: fileName, content: raw, create: isNew }),
    });
    if (!res.ok) throw new Error(await res.text());
    // After first successful save, refresh tree — replaces local-only entry with real server path
    if (isNew) {
      await refreshTree();
    }
  }, [fileName, refreshTree]);

  return (
    <div className="app-shell" ref={appShellRef}>

      {/* LEFT: FILE TREE */}
      <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">RED VAULT</div>
        <div className="file-list">
          {fileTree.map((item, i) => <FileSystemItem key={i} item={item} onSelectFile={loadFile} activeFile={fileName} />)}
        </div>
      </aside>

      <div className="resizer" onMouseDown={startResizingSidebar}><div className="divider-line">||</div></div>

      {/* CENTER: BLOCK EDITOR */}
      <main className="main-content">
        <article className="markdown-container">
          <BlockEditor key={contentKey} content={content} fileName={fileName} onLinkClick={handleLinkClick} onSaveFile={handleSaveFile} />
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
        }

        .block-content p:first-child { margin-top: 0; }
        .block-content p:last-child  { margin-bottom: 0; }

        .block-view { cursor: default; }
        .block-view.editable-mode { cursor: text; }
        .block-view.editable-mode:hover { background: rgba(255,255,255,0.025); }

        /* Block wrapper — holds BlockView + optional overlay textarea */
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

        /* Raw text editor — contentEditable with styled lines */
        .raw-text-editor {
          background: rgba(18,18,18,0.98);
          border: 1px solid rgba(255,250,205,0.2);
          border-radius: 4px;
          padding: 4px 8px;
          caret-color: var(--accent);
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
          cursor: text;
        }

        .raw-text-editor:focus-within {
          border-color: rgba(255, 250, 205, 0.35);
          outline: none;
        }

        /* Per-line divs — inherit font/size/color from .markdown-content parent */
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
        /* Mirror .markdown-content h1/h2/h3 exactly — use px so em doesn't compound */
        .rte-h1 { font-size: 2.0em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .8em;  margin-bottom: .4em; }
        .rte-h2 { font-size: 1.6em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .7em;  margin-bottom: .3em; }
        .rte-h3 { font-size: 1.2em;  font-weight: 700; color: #fff; line-height: 1.2; margin-top: .6em;  margin-bottom: .2em; }
        .rte-h4 { font-size: 1.05em; font-weight: 700; color: #fff; }
        .rte-h5 { font-size: 1em;    font-weight: 700; color: #ddd; }
        .rte-h6 { font-size: 0.9em;  font-weight: 700; color: #bbb; }
        /* Lists — hanging indent: marker in gutter, text wraps aligned */
        .rte-ul, .rte-ol { padding-left: 1.8em; text-indent: -1.8em; margin-bottom: 0.3em; }
        /* Blockquote */
        .rte-blockquote { border-left: 3px solid var(--accent); padding-left: 1.25em; margin-left: 0; font-style: italic; opacity: 0.8; }
        /* Code fence line */
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

        /* Unsaved cache prompt banner */
        .unsaved-prompt {
          display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
          background: rgba(255,250,205,0.06);
          border: 1px solid rgba(255,250,205,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
        }
        .unsaved-prompt__msg { flex: 1; color: var(--accent); opacity: 0.9; min-width: 200px; }
        .unsaved-prompt__actions { display: flex; gap: 8px; }
        .unsaved-prompt__btn {
          border-radius: 16px; padding: 4px 12px; font-size: 12px;
          font-family: 'Inter', sans-serif; cursor: pointer;
          border: 1px solid var(--border); background: rgba(255,255,255,0.06);
          color: var(--txt); transition: background .15s;
        }
        .unsaved-prompt__btn:hover { background: rgba(255,255,255,0.12); }
        .unsaved-prompt__btn--save  { border-color: rgba(100,220,100,0.4); color: #7dda7d; }
        .unsaved-prompt__btn--discard { border-color: rgba(220,80,80,0.35); color: #e07070; }

        /* Toolbar */
        .toolbar {
          position: sticky; top: 8px; float: right; z-index: 100;
          display: flex; gap: 6px; align-items: center;
        }
        .mode-toggle-btn, .save-btn {
          background: rgba(255,255,255,0.07); border: 1px solid var(--border);
          border-radius: 20px; padding: 4px 12px; font-size: 12px;
          font-family: 'Inter', sans-serif; color: var(--txt);
          cursor: pointer; user-select: none; transition: background .15s, border-color .15s;
        }
        .mode-toggle-btn:hover { background: rgba(255,255,255,0.12); }
        .save-btn--idle:hover  { background: rgba(255,255,255,0.12); }
        .save-btn--saving      { opacity: 0.6; cursor: default; }
        .save-btn--saved       { border-color: rgba(100,220,100,0.5); color: #7dda7d; }
        .save-btn--error       { border-color: rgba(220,80,80,0.5);  color: #e07070; }

        /* ── MARKDOWN TYPOGRAPHY ────────────────────────────────────────────── */
        .markdown-content { font-family:var(--md-font); font-size:var(--md-size); line-height:var(--md-line); color:var(--txt); }
        .markdown-content h1 { font-size:2.0em; margin:.8em 0 .4em; color:#fff; font-weight:700; }
        .markdown-content h2 { font-size:1.6em; margin:.7em 0 .3em; color:#fff; font-weight:700; }
        .markdown-content h3 { font-size:1.2em; margin:.6em 0 .2em; color:#fff; font-weight:700; }
        .markdown-content p  { margin-bottom:1em; }

        /* ── LISTS ────────────────────────────────────────────────────────── */
        .markdown-content ul {
          list-style-type: disc;
          margin: 0.5em 0 1em 0;
          padding-left: 1.8em;
        }
        .markdown-content ol {
          list-style-type: decimal;
          margin: 0.5em 0 1em 0;
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

        /* Task list checkboxes */
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