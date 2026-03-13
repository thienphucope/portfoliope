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
    let html = window.marked.parse(block.raw || '');
    if (!html || !html.trim() || html === '<p></p>') html = '<p><br></p>';
    divRef.current.innerHTML = html;
    postProcess(divRef.current);
  }, [block.raw, isEditing]);

  useEffect(() => {
    const handler = () => { if (divRef.current) divRef.current.querySelectorAll('h6.fit-heading').forEach(fitHeading); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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

export const CodeRawEditor = ({ block, onSave, onDeactivate, onNavigate, cursorPosition = "end" }) => {
  const ref = useRef(null);
  const abortControllerRef = useRef(null);
  const originalRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.value = block.raw;
    ref.current.focus();
    const pos = cursorPosition === 'start' ? 0 : ref.current.value.length;
    ref.current.setSelectionRange(pos, pos);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      return; // catch block will handle restoration
    }
    if (ref.current) onSave(ref.current.value);
    onDeactivate();
  }, [onSave, onDeactivate]);

  const cancelAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleKeyDown = useCallback(async (e) => {
    if (e.key === 'Escape') {
      if (abortControllerRef.current) {
        cancelAI();
        return;
      }
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
        
        originalRef.current = ref.current.value;
        ref.current.value = '⏳ AI is thinking (click to cancel)…';
        
        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
          const res  = await fetch('https://rag-backend-zh2e.onrender.com/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'BlockEditor', query }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          abortControllerRef.current = null;
          onSave(data.response || '*No response from AI.*');
          onDeactivate();
        } catch (err) {
          clearTimeout(timeoutId);
          if (ref.current) ref.current.value = originalRef.current;
          abortControllerRef.current = null;
          // Stay active so user can edit their prompt
        }
      }
    }
  }, [onSave, onDeactivate, cancelAI]);

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
      onClick={cancelAI}
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

const SLASH_COMMANDS = [
  { id: 'ai', label: 'AI Prompt', icon: 'AI', template: '/ai ' },
  { id: 'h1', label: 'Heading 1', icon: 'H1', template: '# ' },
  { id: 'h2', label: 'Heading 2', icon: 'H2', template: '## ' },
  { id: 'h3', label: 'Heading 3', icon: 'H3', template: '### ' },
  { id: 'h4', label: 'Heading 4', icon: 'H4', template: '#### ' },
  { id: 'h5', label: 'Heading 5', icon: 'H5', template: '##### ' },
  { id: 'h6', label: 'Heading 6', icon: 'H6', template: '###### ' },
  { id: 'bold', label: 'Bold', icon: 'B', template: '**Bold**' },
  { id: 'italic', label: 'Italic', icon: 'I', template: '*Italic*' },
  { id: 'quote', label: 'Quote', icon: '”', template: '> ' },
  { id: 'ul', label: 'Bullet List', icon: 'UL', template: '- ' },
  { id: 'ol', label: 'Numbered List', icon: 'OL', template: '1. ' },
  { id: 'todo', label: 'Todo List', icon: '☑', template: '- [ ] ' },
  { id: 'table2', label: 'Table (2x2)', icon: '田2', template: "| Col 1 | Col 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |" },
  { id: 'table3', label: 'Table (3x2)', icon: '田3', template: "| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |" },
  { id: 'code', label: 'Code Block', icon: '</>', template: "```\n\n```" },
  { id: 'icode', label: 'Inline Code', icon: '`', template: '`code` ' },
  { id: 'link', label: 'Link', icon: '🔗', template: '[Title](url)' },
  { id: 'img', label: 'Image', icon: '🖼', template: '![Alt](url)' },
  { id: 'math', label: 'Math Block', icon: '∑', template: "$$\n\\text{math}\n$$" },
  { id: 'mermaid', label: 'Mermaid', icon: '🧬', template: "```mermaid\ngraph TD;\nA-->B;\n```" },
  { id: 'hr', label: 'Divider', icon: '—', template: '---' },
];

export const RawTextEditor = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition = 'end' }) => {
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const abortControllerRef = useRef(null);
  const originalRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState({ visible: false, x: 0, y: 0, query: '', selectedIndex: 0 });
  const [isEmpty, setIsEmpty] = useState(block.raw === '');

  // Use a native listener to stop propagation of the wheel event
  // This is more robust against parent components with custom scroll handlers
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || !slashMenu.visible) return;

    const stopWheel = (e) => {
      e.stopPropagation();
    };

    menu.addEventListener('wheel', stopWheel, { passive: false });
    return () => menu.removeEventListener('wheel', stopWheel);
  }, [slashMenu.visible]);

  // Scroll active item into view manually
  useEffect(() => {
    if (slashMenu.visible && menuRef.current) {
      const menu = menuRef.current;
      const activeItem = menu.children[slashMenu.selectedIndex];
      if (activeItem) {
        const menuTop = menu.scrollTop;
        const menuBottom = menuTop + menu.clientHeight;
        const itemTop = activeItem.offsetTop;
        const itemBottom = itemTop + activeItem.offsetHeight;

        if (itemTop < menuTop) {
          menu.scrollTop = itemTop;
        } else if (itemBottom > menuBottom) {
          menu.scrollTop = itemBottom - menu.clientHeight;
        }
      }
    }
  }, [slashMenu.selectedIndex, slashMenu.visible]);

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
    const raw = collectRaw();
    setIsEmpty(raw === '');

    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let node = sel.anchorNode;
    while (node && node !== containerRef.current) {
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-line')) break;
      node = node.parentNode;
    }
    if (!node || node === containerRef.current) return;

    const text = node.textContent || '';
    const isLineEmpty = text === '' || node.innerHTML === '<br>';
    node.className = `rte-line ${getLineClass(text)}${isLineEmpty ? ' rte-empty' : ''}`;
    if (isLineEmpty && !node.querySelector('br')) {
      node.innerHTML = '<br>';
    }

    // Slash menu detection
    if (text.startsWith('/')) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuMaxHeight = 240;
      const showUpwards = rect.bottom + menuMaxHeight > viewportHeight;

      setSlashMenu(prev => ({
        visible: true,
        x: rect.left,
        y: showUpwards ? rect.top - menuMaxHeight - 5 : rect.bottom + 5,
        query: text.slice(1).toLowerCase(),
        selectedIndex: 0
      }));
    } else if (slashMenu.visible) {
      setSlashMenu(prev => ({ ...prev, visible: false }));
    }
  }, [slashMenu.visible]);

  const applyCommand = useCallback((cmd) => {
    const sel = window.getSelection();
    let node = sel?.anchorNode;
    while (node && !(node.classList && node.classList.contains('rte-line'))) node = node.parentNode;
    if (!node) return;

    node.textContent = cmd.template;
    node.className = `rte-line ${getLineClass(cmd.template)}`;
    setSlashMenu({ visible: false, x: 0, y: 0, query: '', selectedIndex: 0 });
    setIsEmpty(collectRaw() === '');

    // Position cursor after template
    cursorToEnd(node);
    if (cmd.id === 'ai' || cmd.id === 'table' || cmd.id === 'code') {
      // For these types, we might want to stay in edit mode
    } else {
      // For others, maybe save and continue
    }
  }, []);

  const handleBlur = useCallback((e) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      return;
    }
    // Prevent blur if clicking on slash menu
    if (e.relatedTarget?.closest('.slash-menu')) return;
    onSave(collectRaw());
    onDeactivate();
  }, [onSave, onDeactivate]);

  const cancelAI = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(slashMenu.query) || c.id.includes(slashMenu.query)
  );

  const handleKeyDown = useCallback(async (e) => {
    const el = containerRef.current;
    if (!el) return;

    if (slashMenu.visible && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredCommands.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        applyCommand(filteredCommands[slashMenu.selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (abortControllerRef.current) {
          cancelAI();
        } else {
          setSlashMenu(prev => ({ ...prev, visible: false }));
        }
        return;
      }
    }

    if (e.key === 'Escape') {
      if (abortControllerRef.current) {
        cancelAI();
        return;
      }
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
        
        originalRef.current = lineText;
        if (lineDiv) lineDiv.textContent = '⏳ AI is thinking (click to cancel)…';
        
        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
          const res  = await fetch('https://rag-backend-zh2e.onrender.com/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'BlockEditor', query }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          abortControllerRef.current = null;
          onSave(data.response || '*No response from AI.*');
          onDeactivate();
        } catch (err) {
          clearTimeout(timeoutId);
          if (lineDiv) lineDiv.textContent = originalRef.current;
          abortControllerRef.current = null;
        }
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
  }, [onSave, onDeactivate, onCreateAfter, slashMenu, filteredCommands, applyCommand, cancelAI]);

  return (
    <>
      <div
        ref={containerRef}
        className={`block-content markdown-content raw-text-editor active-block${isEmpty ? ' is-empty' : ''}`}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={cancelAI}
        spellCheck={false}
        data-placeholder="Type slash / to open command"
      />
      {slashMenu.visible && filteredCommands.length > 0 && (
        <div
          ref={menuRef}
          className="slash-menu"
          style={{ left: slashMenu.x, top: slashMenu.y }}
          onWheel={e => e.stopPropagation()}
          onMouseDown={e => {
            e.preventDefault(); 
          }}
        >
          {filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.id}
              className={`slash-item${idx === slashMenu.selectedIndex ? ' slash-item--active' : ''}`}
              onClick={() => applyCommand(cmd)}
            >
              <div className="slash-item__icon">{cmd.icon}</div>
              <div className="slash-item__label">{cmd.label}</div>
            </div>
          ))}
        </div>
      )}
    </>
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
