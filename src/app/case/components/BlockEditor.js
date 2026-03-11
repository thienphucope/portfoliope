import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ensureLibsLoaded, postProcess, fitHeading } from './MarkdownEngine';

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

export const cacheKey  = (name) => `vault_v3::${name}`;
export const readCache = (name) => { try { return JSON.parse(localStorage.getItem(cacheKey(name))); } catch { return null; } };
export const saveCache = (name, data) => { try { localStorage.setItem(cacheKey(name), JSON.stringify(data)); } catch {} };
export const mkBlock   = (raw = '', type = 'paragraph') => ({
  id: `b${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  raw, type,
});

// ─── CURSOR HELPERS ───────────────────────────────────────────────────────────

export const cursorToEnd = (el) => {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

// ─── BLOCK VIEW (inactive block) ─────────────────────────────────────────────

export const BlockView = ({ block, isEditing, isActive, onActivate, onLinkClick }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    divRef.current.innerHTML = window.marked.parse(block.raw || '');
    postProcess(divRef.current);
  }, [block.raw]);

  useEffect(() => {
    const handler = () => { if (divRef.current) divRef.current.querySelectorAll('h6.fit-heading').forEach(fitHeading); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleClick = useCallback((e) => {
    if (isActive) return;
    const internalLink = e.target.closest('.internal-link');
    if (internalLink) { onLinkClick(e); return; }
    // Let external <a> tags open normally
    if (e.target.closest('a')) return;
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

export const CodeRawEditor = ({ block, onSave, onDeactivate, onNavigate, cursorPosition = "end" }) => {
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

export const getLineClass = (line) => {
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

export const RawTextEditor = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition = 'end' }) => {
  const containerRef = useRef(null);

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

  const buildLines = (raw) => (raw || '').split('\n').map(buildLineDiv);

  const collectRaw = () => {
    if (!containerRef.current) return '';
    return Array.from(containerRef.current.querySelectorAll('.rte-line'))
      .map(d => {
        if (d.classList.contains('rte-empty')) return '';
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
    if (isEmpty && !node.querySelector('br')) {
      node.innerHTML = '<br>';
    }
  }, []);

  const handleBlur = useCallback(() => {
    onSave(collectRaw());
    onDeactivate();
  }, [onSave, onDeactivate]);

  const getCurrentLineDiv = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    let node = sel.anchorNode;
    const container = containerRef.current;
    while (node && node !== container) {
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-line')) return node;
      node = node.parentNode;
    }
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

    if (e.key === 'Backspace') {
      const raw = collectRaw();
      if (raw === '') {
        e.preventDefault();
        onSave(raw);
        onNavigate('up', true);
        return;
      }
    }

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
      const sel = window.getSelection();
      let lineDiv = sel?.anchorNode;
      while (lineDiv && !(lineDiv.classList && lineDiv.classList.contains('rte-line'))) lineDiv = lineDiv?.parentNode;

      const lineText = lineDiv ? (lineDiv.textContent || '') : '';

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

export const ActiveBlock = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition, onLinkClick }) => {
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

const BlockEditor = ({ content, fileName, onLinkClick, onSaveFile, isEditing, onToggleEditing, onSaveRef }) => {
  const [blocks, setBlocks]           = useState([]);
  const [activeBlockIndex, setActive] = useState(null);
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
      setBlocks(prev => {
        if (prev.length <= 1) return prev;
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

  // Expose save handler to parent via ref
  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = async () => {
        const raw = blocksRef.current.map(b => b.raw).join('\n\n');
        await onSaveFile(raw);
      };
    }
  }, [onSaveRef, onSaveFile]);

  if (!libsReady) return <div className="status-msg">Booting Vault Engine…</div>;

  return (
    <div className="block-editor">
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

export default BlockEditor;
