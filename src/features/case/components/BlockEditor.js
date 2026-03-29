import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ensureLibsLoaded, postProcess, fitHeading } from '../utils/markdown';
import { useAI } from '../hooks/useAI';
import { useBlockNavigation } from '../hooks/useBlockNavigation';
import { mkBlock, cursorToEnd, getLineClass, SLASH_COMMANDS } from '../utils/editor';

/**
 * Block-based Markdown editor component with AI assistance, slash commands,
 * and real-time rendering for the case vault application.
 * Supports block navigation, code editing, and integration with file registry.
 */

// ─── BLOCK VIEW (inactive block) ─────────────────────────────────────────────

export const BlockView = ({ block, isEditing, isActive, onActivate, onLinkClick, fileRegistry = {} }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    let html = window.marked.parse(block.raw || '');
    if (!html || !html.trim() || html === '<p></p>') html = '<p><br></p>';
    divRef.current.innerHTML = html;
    
    // Check internal links
    const links = divRef.current.querySelectorAll('.internal-link');
    links.forEach(link => {
      const target = link.getAttribute('data-target');
      if (target) {
        const cleanTarget = target.toLowerCase();
        const withExt = cleanTarget.endsWith('.md') ? cleanTarget : `${cleanTarget}.md`;
        const exists = fileRegistry[cleanTarget] || fileRegistry[withExt] || fileRegistry[`notes/${withExt}`];
        if (!exists) {
          link.classList.add('is-missing');
        } else {
          link.classList.remove('is-missing');
        }
      }
    });

    postProcess(divRef.current);
  }, [block.raw, isEditing, fileRegistry]);

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
  const originalRef = useRef(null);
  const { isThinking, requestAI } = useAI();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.value = block.raw;
    ref.current.focus();
    const pos = cursorPosition === 'start' ? 0 : ref.current.value.length;
    ref.current.setSelectionRange(pos, pos);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(() => {
    if (isThinking) return;
    if (ref.current) onSave(ref.current.value);
    onDeactivate();
  }, [onSave, onDeactivate, isThinking]);

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
        
        originalRef.current = ref.current.value;
        ref.current.value = '⏳ AI is thinking…';
        
        try {
          const reply = await requestAI(query, [], 'BlockEditor');
          onSave(reply || '*No response from AI.*');
          onDeactivate();
        } catch (err) {
          if (ref.current) ref.current.value = originalRef.current;
        }
      }
    }
  }, [onSave, onDeactivate, requestAI]);

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

// ─── RAW TEXT EDITOR ─────────────────────────────────────────────────────────

export const RawTextEditor = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition = 'end' }) => {
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const originalRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState({ visible: false, x: 0, y: 0, query: '', selectedIndex: 0 });
  const [isEmpty, setIsEmpty] = useState(block.raw === '');
  const { isThinking, requestAI } = useAI();

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || !slashMenu.visible) return;
    const stopWheel = (e) => e.stopPropagation();
    menu.addEventListener('wheel', stopWheel, { passive: false });
    return () => menu.removeEventListener('wheel', stopWheel);
  }, [slashMenu.visible]);

  useEffect(() => {
    if (slashMenu.visible && menuRef.current) {
      const menu = menuRef.current;
      const activeItem = menu.children[slashMenu.selectedIndex];
      if (activeItem) {
        const menuTop = menu.scrollTop;
        const menuBottom = menuTop + menu.clientHeight;
        const itemTop = activeItem.offsetTop;
        const itemBottom = itemTop + activeItem.offsetHeight;
        if (itemTop < menuTop) menu.scrollTop = itemTop;
        else if (itemBottom > menuBottom) menu.scrollTop = itemBottom - menu.clientHeight;
      }
    }
  }, [slashMenu.selectedIndex, slashMenu.visible]);

  const buildLineDiv = (line) => {
    const d = document.createElement('div');
    const cls = getLineClass(line);
    d.className = `rte-line ${cls}`;
    if (line === '') { d.classList.add('rte-empty'); d.innerHTML = '<br>'; }
    else d.textContent = line;
    return d;
  };

  const buildLines = (raw) => (raw || '').split('\n').map(buildLineDiv);

  const collectRaw = () => {
    if (!containerRef.current) return '';
    return Array.from(containerRef.current.querySelectorAll('.rte-line'))
      .map(d => d.classList.contains('rte-empty') ? '' : (d.textContent || ''))
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
    } else cursorToEnd(el.lastElementChild || el);
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
    if (isLineEmpty && !node.querySelector('br')) node.innerHTML = '<br>';

    if (text.startsWith('/')) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const menuMaxHeight = 240;
      const showUpwards = rect.bottom + menuMaxHeight > window.innerHeight;
      setSlashMenu(prev => ({
        visible: true,
        x: rect.left,
        y: showUpwards ? rect.top - menuMaxHeight - 5 : rect.bottom + 5,
        query: text.slice(1).toLowerCase(),
        selectedIndex: 0
      }));
    } else if (slashMenu.visible) setSlashMenu(prev => ({ ...prev, visible: false }));
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
    cursorToEnd(node);
  }, []);

  const handleBlur = useCallback((e) => {
    if (isThinking) return;
    if (e.relatedTarget?.closest('.slash-menu')) return;
    onSave(collectRaw());
    onDeactivate();
  }, [onSave, onDeactivate, isThinking]);

  const getCurrentLineDiv = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    let node = sel.anchorNode;
    const container = containerRef.current;
    while (node && node !== container) {
      if (node.nodeType === 1 && node.classList && node.classList.contains('rte-line')) return node;
      node = node.parentNode;
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
        e.preventDefault(); e.stopPropagation();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredCommands.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault(); e.stopPropagation();
        applyCommand(filteredCommands[slashMenu.selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        setSlashMenu(prev => ({ ...prev, visible: false }));
        return;
      }
    }

    if (e.key === 'Escape') {
      onSave(collectRaw());
      onDeactivate();
      return;
    }

    if (e.key === 'Backspace' && collectRaw() === '') {
      e.preventDefault();
      onSave('');
      onNavigate('up', true);
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const lineDiv = getCurrentLineDiv();
      const lines = el.querySelectorAll('.rte-line');
      const isFirst = !lineDiv || lineDiv === lines[0] || !lineDiv.previousElementSibling;
      const isLast  = !lineDiv || lineDiv === lines[lines.length - 1] || !lineDiv.nextElementSibling;
      if (e.key === 'ArrowUp' && isFirst) {
        e.preventDefault(); onSave(collectRaw()); onNavigate('up');
        return;
      }
      if (e.key === 'ArrowDown' && isLast) {
        e.preventDefault(); onSave(collectRaw()); onNavigate('down');
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
        if (lineDiv) lineDiv.textContent = '⏳ AI is thinking…';
        try {
          const reply = await requestAI(query, [], 'BlockEditor');
          onSave(reply || '*No response from AI.*');
          onDeactivate();
        } catch (err) {
          if (lineDiv) lineDiv.textContent = originalRef.current;
        }
        return;
      }

      const ulMatch = /^([-*+] )/.exec(lineText);
      const olMatch = /^(\d+)\. /.exec(lineText);
      if (ulMatch && lineText.trim() !== ulMatch[1].trim()) {
        e.preventDefault();
        const newDiv = document.createElement('div');
        newDiv.className = `rte-line ${getLineClass(ulMatch[1])}`;
        newDiv.textContent = ulMatch[1];
        lineDiv.after(newDiv);
        cursorToEnd(newDiv);
        return;
      }
      if (olMatch && lineText.trim() !== `${olMatch[1]}.`) {
        e.preventDefault();
        const newDiv = document.createElement('div');
        newDiv.className = 'rte-line rte-ol';
        newDiv.textContent = `${parseInt(olMatch[1]) + 1}. `;
        lineDiv.after(newDiv);
        cursorToEnd(newDiv);
        return;
      }

      e.preventDefault();
      onSave(collectRaw());
      onCreateAfter();
    }
  }, [onSave, onDeactivate, onCreateAfter, slashMenu, filteredCommands, applyCommand, requestAI]);

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
        spellCheck={false}
        data-placeholder="Type slash / to open command"
      />
      {slashMenu.visible && filteredCommands.length > 0 && (
        <div
          ref={menuRef}
          className="slash-menu"
          style={{ left: slashMenu.x, top: slashMenu.y }}
          onMouseDown={e => e.preventDefault()}
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

export const ActiveBlock = ({ block, onSave, onDeactivate, onCreateAfter, onNavigate, cursorPosition }) => {
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

const BlockEditor = ({ content, fileName, onLinkClick, onSaveFile, isEditing, onToggleEditing, onSaveRef, fileRegistry = {} }) => {
  const [blocks, setBlocks]       = useState([]);
  const [libsReady, setLibsReady] = useState(false);
  useEffect(() => { ensureLibsLoaded().then(() => setLibsReady(true)); }, []);

  const { activeBlockIndex, setActive, cursorPos, setCursorPos, createBlockAfter, navigateBlock } = useBlockNavigation({ blocks, setBlocks });

  useEffect(() => {
    if (!libsReady || !window.marked || !fileName) return;
    setActive(null);
    const tokens = window.marked.lexer(content || '');
    const newBlocks = tokens.filter(t => t.type !== 'space').map(t => mkBlock(t.raw.trimEnd(), t.type));
    setBlocks(newBlocks.length > 0 ? newBlocks : [mkBlock('', 'paragraph')]);
  }, [content, fileName, libsReady]);

  const saveBlock = useCallback((index, raw) => {
    setBlocks(prev => {
      const n = [...prev];
      const tokens = window.marked ? window.marked.lexer(raw) : [];
      const type = tokens.find(t => t.type !== 'space')?.type ?? 'paragraph';
      n[index] = { ...n[index], raw, type };
      return n;
    });
  }, []);

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
              fileRegistry={fileRegistry}
            />
            {isActive && (
              <ActiveBlock
                block={block}
                onSave={(raw) => saveBlock(index, raw)}
                onDeactivate={() => setActive(null)}
                onCreateAfter={() => createBlockAfter(index)}
                onNavigate={(dir, del) => navigateBlock(index, dir, del)}
                cursorPosition={cursorPos}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BlockEditor;
