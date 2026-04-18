import React, { useMemo, useEffect, useRef } from 'react';
import { Pin } from 'lucide-react';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';

const FitTitle = ({ text, borderPx, normalVariant, hoverVariant }) => {
  const wrapRef = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const span = spanRef.current;
    if (!wrap || !span) return;

    const fit = () => {
      span.style.fontSize = '1.8rem';
      const style = getComputedStyle(wrap);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const w = wrap.clientWidth - padding;
      const tw = span.scrollWidth;
      if (w > 0 && tw > 0) {
        span.style.fontSize = `${1.8 * (w / tw)}rem`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={wrapRef} className={`gallery-title-wrap gallery-title-${normalVariant} gallery-hover-${hoverVariant}`} style={{ '--border-px': `${borderPx}px` }}>
      <span ref={spanRef} className="gallery-item-title">{text}</span>
    </div>
  );
};

/**
 * Small helper to render markdown snippets within the gallery.
 */
const MarkdownPreview = ({ raw, className }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;
    const render = () => {
      if (window.marked) {
        // Parse and post-process for math/mermaid if needed
        divRef.current.innerHTML = window.marked.parse(raw || '');
        postProcess(divRef.current);
      }
    };
    ensureLibsLoaded().then(render);
  }, [raw]);

  return <div ref={divRef} className={className} />;
};

/**
 * NoteGallery component that displays a 4-column masonry layout of notes.
 * Extracts titles, video embeds, and quotes from note content for a visual overview.
 */
const NoteGallery = ({ graphFiles, onSelectFile }) => {
  const pinnedIds = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_PINNED_NOTES || '';
    return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }, []);

  const notePreviews = useMemo(() => {
    return graphFiles.map(file => {
      const content = file.fetchedContent || '';
      const lines = content.split('\n');
      
      // Extract block title: strictly use filename without extension to match BlockEditor
      const displayTitle = file.name.split('/').pop().replace(/\.md$/, '');

      const ytRegex = /(?:youtube\.com\/(?:[^\/\n]+\/[^\n]+\/|(?:v|e(?:mbed)?)\/|[^\n]*?[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

      // 1. Extract first text block with >= 10 words (skip lines with video embeds)
      const isSkippedLine = t =>
        !t || t.startsWith('#') || t.startsWith('>') || t.startsWith('![') ||
        t.startsWith('|') || ytRegex.test(t) || /^[*_].+:[*_]?/.test(t);

      let introText = '';
      let i = 0;
      while (i < lines.length) {
        while (i < lines.length && isSkippedLine(lines[i].trim())) i++;
        const blockLines = [];
        while (i < lines.length && !isSkippedLine(lines[i].trim())) {
          blockLines.push(lines[i].trim());
          i++;
          if (blockLines.length >= 3) break;
        }
        if (blockLines.length > 0) {
          const candidate = blockLines.join('\n\n');
          if (candidate.split(/\s+/).filter(Boolean).length >= 10) {
            introText = candidate;
            break;
          }
        }
      }

      // 2. Extract first video
      const videoMatch = content.match(ytRegex);
      const video = videoMatch ? videoMatch[1] : null;

      // 3. Extract first image (skip images on lines containing YouTube links)
      const imageRegex = /!\[.*?\]\((.*?)\)/g;
      let image = null;
      let imgMatch;
      while ((imgMatch = imageRegex.exec(content)) !== null) {
        const lineStart = content.lastIndexOf('\n', imgMatch.index) + 1;
        const lineEnd = content.indexOf('\n', imgMatch.index);
        const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        if (!ytRegex.test(line)) {
          image = imgMatch[1];
          break;
        }
      }

      // 4. Extract first quote
      const rawQuote = lines.find(l => l.trim().startsWith('>'))?.trim();
      const quote = rawQuote ? (() => {
        const words = rawQuote.split(/\s+/);
        return words.length > 30 ? words.slice(0, 30).join(' ') + '...' : rawQuote;
      })() : null;

      const idHash = String(file.id || file.name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const titleNormal = ['plain', 'border'][idHash % 2];
      const titleHover = ['invert', 'border'][(idHash >> 2) % 2];
      const topLinesHeight = ((idHash >> 4) % 5) * 32;

      return {
        ...file,
        displayTitle,
        introText,
        video,
        image,
        quote,
        titleNormal,
        titleHover,
        topLinesHeight
      };
    }).filter(note => note.displayTitle || note.introText || note.video || note.image || note.quote);
  }, [graphFiles]);

  const pinnedNotes = useMemo(() => notePreviews.filter(n => pinnedIds.includes(n.id)), [notePreviews, pinnedIds]);
  const unpinnedNotes = useMemo(() => notePreviews.filter(n => !pinnedIds.includes(n.id)), [notePreviews, pinnedIds]);

  if (notePreviews.length === 0) return null;

  const renderPinBtn = (note, isPinned) => (
    <button
      className={`gallery-pin-btn${isPinned ? ' gallery-pin-btn-active' : ''}`}
      onClick={(e) => togglePin(note.id, e)}
      title={isPinned ? 'Unpin' : 'Pin to top'}
    >
      <Pin size={13} />
    </button>
  );

  const renderRegularContent = (note) => (
    note.video && note.introText ? (
      <>
        <div className="gallery-item-row" style={{ '--top-lines': `${note.topLinesHeight}px` }}>
          <div className="gallery-item-col gallery-item-col-left">
            <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" style={{ width: '100%', display: 'block', borderRadius: '4px' }} />
          </div>
          <div className="gallery-item-col gallery-item-col-right">
            <MarkdownPreview raw={note.introText} className="gallery-intro-rendered" />
          </div>
        </div>
        {note.image && <div className="gallery-item-image"><img src={note.image} alt={note.displayTitle} /></div>}
        {note.quote && <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />}
      </>
    ) : (
      <>
        {note.video && <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" style={{ width: '100%', display: 'block', borderRadius: '4px' }} />}
        {note.introText && <MarkdownPreview raw={note.introText} className="gallery-intro-rendered" />}
        {note.image && <div className="gallery-item-image"><img src={note.image} alt={note.displayTitle} /></div>}
        {note.quote && <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />}
      </>
    )
  );

  return (
    <>
    <div className="note-gallery-container">
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="rough-border" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <a href="/project" className="gallery-main-title">CASE ARCHIVES</a>
      <div className="note-gallery">
        {/* Pinned notes — span all columns */}
        {pinnedNotes.map(note => (
          <div
            key={note.id}
            className="gallery-item gallery-item-pinned markdown-content"
            onClick={() => onSelectFile(note.path, note.name, note.id)}
          >
            {renderPinBtn(note, true)}
            <FitTitle text={note.displayTitle} borderPx={Math.max(5, 12 - Math.floor(note.displayTitle.length / 2))} normalVariant={note.titleNormal} hoverVariant={note.titleHover} />
            <div className="gallery-pinned-body">
              <div className="gallery-pinned-col-left">
                {note.video && <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" style={{ width: '100%', display: 'block', borderRadius: '4px' }} />}
                {note.image && <div className="gallery-item-image"><img src={note.image} alt={note.displayTitle} /></div>}
              </div>
              <div className="gallery-pinned-col-right">
                {note.introText && <MarkdownPreview raw={note.introText} className="gallery-intro-rendered gallery-intro-pinned" />}
                {note.quote && <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />}
              </div>
            </div>
          </div>
        ))}

        {/* Regular notes */}
        {unpinnedNotes.map(note => (
          <div
            key={note.id}
            className={`gallery-item markdown-content ${note.video && note.introText ? 'gallery-item-two-col' : ''}`}
            onClick={() => onSelectFile(note.path, note.name, note.id)}
          >
            {renderPinBtn(note, false)}
            <FitTitle text={note.displayTitle} borderPx={Math.max(5, 12 - Math.floor(note.displayTitle.length / 2))} normalVariant={note.titleNormal} hoverVariant={note.titleHover} />
            {renderRegularContent(note)}
          </div>
        ))}
      </div>
    </div>
    </>
  );
};


export default NoteGallery;
