import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ensureLibsLoaded, postProcess, fitHeading } from '@/lib/markdown';
import { mkBlock } from '../utils/editor';
import EditorStyles from '@/styles/EditorStyles';
import MarkdownStyles from '@/styles/MarkdownStyles';
import styles from '../styles/BlockEditor.module.css';

/**
 * Read-only block renderer for the case vault.
 * Splits markdown into blocks for per-block text-to-speech highlighting,
 * renders each block, and handles internal-link clicks. No editing.
 */

// ─── TITLE BLOCK (fixed file name header) ────────────────────────────────────

const TitleBlock = ({ fileName, reader, onDoubleClick, isReading }) => {
  const titleRef = useRef(null);

  const displayTitle = useMemo(() => {
    if (!fileName) return '';
    return fileName.split('/').pop().replace(/\.md$/, '');
  }, [fileName]);

  const updateSize = useCallback(() => {
    const el = titleRef.current;
    if (el) {
      fitHeading(el, 120);
    }
  }, []);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    updateSize();
    window.addEventListener('resize', updateSize);
    const observer = new ResizeObserver(() => updateSize());
    if (el.parentElement) observer.observe(el.parentElement);
    const fontTimer = setTimeout(updateSize, 500);
    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
      clearTimeout(fontTimer);
    };
  }, [displayTitle, updateSize]);

  if (!displayTitle) return null;

  return (
    <div
      className={`block-wrapper title-block ${isReading ? 'block-reading-highlight' : ''}`}
      onDoubleClick={(e) => reader?.triggerRead ? reader.triggerRead(e, () => onDoubleClick()) : onDoubleClick()}
    >
      <div className="block-content markdown-content">
        <h1
          ref={titleRef}
          className="fit-heading note-title-heading"
        >
          {displayTitle}
        </h1>
      </div>
    </div>
  );
};

// ─── BLOCK VIEW ──────────────────────────────────────────────────────────────

const BlockView = ({ block, isReading, onLinkClick, onDoubleClick, fileRegistry = {} }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !window.marked) return;
    let html = window.marked.parse(block.raw || '');
    if (!html || !html.trim() || html === '<p></p>') html = '<p><br></p>';
    divRef.current.innerHTML = html;

    // Mark internal links that point to non-existent notes.
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
  }, [block.raw, fileRegistry]);

  useEffect(() => {
    const handler = () => { if (divRef.current) divRef.current.querySelectorAll('h6.fit-heading').forEach(fitHeading); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleClick = useCallback((e) => {
    const link = e.target.closest('a, .internal-link');
    if (link) onLinkClick(e);
  }, [onLinkClick]);

  return (
    <div
      ref={divRef}
      className={`block-content markdown-content block-view${isReading ? ' block-reading-highlight' : ''}`}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    />
  );
};

// ─── BLOCK EDITOR (read-only) ────────────────────────────────────────────────

const BlockEditor = ({ content, fileName, onLinkClick, fileRegistry = {}, reader }) => {
  const [blocks, setBlocks]       = useState([]);
  const [libsReady, setLibsReady] = useState(false);
  const [readingBlockIndex, setReadingBlockIndex] = useState(-1);
  const isAutoReadingRef = useRef(false);
  const readingIndexRef = useRef(-1);

  useEffect(() => { ensureLibsLoaded().then(() => setLibsReady(true)); }, []);

  useEffect(() => {
    const handleClick = (e) => {
      const container = e.target.closest('.video-container');
      if (!container) return;
      container.classList.add('active');
      const deactivate = () => {
        container.classList.remove('active');
        document.removeEventListener('wheel', deactivate);
      };
      document.addEventListener('wheel', deactivate, { passive: true, once: true });
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!libsReady || !window.marked || !fileName) return;
    const tokens = window.marked.lexer(content || '');
    const newBlocks = tokens.filter(t => t.type !== 'space').map(t => mkBlock(t.raw.trimEnd(), t.type));
    setBlocks(newBlocks.length > 0 ? newBlocks : [mkBlock('', 'paragraph')]);
  }, [content, fileName, libsReady]);

  const { readChunk, stop, isPlaying } = reader || {};

  const stripMarkdown = useCallback((raw) => {
    if (!window.marked) return raw;
    const html = window.marked.parse(raw);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }, []);

  const handleStop = useCallback(() => {
    isAutoReadingRef.current = false;
    readingIndexRef.current = -1;
    setReadingBlockIndex(-1);
    stop?.();
  }, [stop]);

  const startReadingFrom = useCallback(async (startIndex) => {
    if (!readChunk) return;

    handleStop();
    await new Promise(r => setTimeout(r, 100));

    isAutoReadingRef.current = true;
    readingIndexRef.current = startIndex;
    setReadingBlockIndex(startIndex);

    // Reading loop
    while (isAutoReadingRef.current && readingIndexRef.current < blocks.length) {
      setReadingBlockIndex(readingIndexRef.current);

      let textToRead = "";
      if (readingIndexRef.current === -1) {
        // Special case for title
        textToRead = fileName.split('/').pop().replace(/\.md$/, '');
      } else {
        const block = blocks[readingIndexRef.current];
        textToRead = stripMarkdown(block.raw);
      }

      if (textToRead.trim()) {
        // Split by sentences for smoother delivery while keeping block highlight
        const sentences = textToRead.match(/[^.!?。！？]+[.!?。！？]?/g) || [textToRead];
        for (const sentence of sentences) {
          if (!isAutoReadingRef.current) break;
          const success = await readChunk(sentence.trim(), undefined, true);
          if (!success) {
            isAutoReadingRef.current = false;
            setReadingBlockIndex(-1);
            return;
          }
        }
      }
      readingIndexRef.current += 1;
    }
    isAutoReadingRef.current = false;
    readingIndexRef.current = -1;
    setReadingBlockIndex(-1);
  }, [readChunk, blocks, stripMarkdown, handleStop, fileName]);

  useEffect(() => {
    if (!isPlaying) {
      isAutoReadingRef.current = false;
      readingIndexRef.current = -1;
      setReadingBlockIndex(-1);
    }
  }, [isPlaying]);

  if (!libsReady) return <div className="status-msg">Booting Vault Engine…</div>;

  return (
    <>
    <EditorStyles />
    <MarkdownStyles />
    <div className={`block-editor ${styles.editor}`}>
      <TitleBlock fileName={fileName} reader={reader} onDoubleClick={() => startReadingFrom(-1)} isReading={isPlaying && readingBlockIndex === -1} />
      {blocks.map((block, index) => {
        const isReading = isPlaying && readingBlockIndex === index;

        return (
          <div key={block.id} className="block-wrapper">
            <BlockView
              block={block}
              isReading={isReading}
              onLinkClick={onLinkClick}
              onDoubleClick={(e) => reader?.triggerRead ? reader.triggerRead(e, () => startReadingFrom(index)) : startReadingFrom(index)}
              fileRegistry={fileRegistry}
            />
          </div>
        );
      })}
    </div>
    </>
  );
};

export default BlockEditor;
