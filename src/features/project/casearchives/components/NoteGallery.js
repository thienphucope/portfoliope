import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Pin } from 'lucide-react';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';


const FitTapeText = ({ text, className }) => {
  const wrapRef = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const span = spanRef.current;
    if (!wrap || !span) return;
    const fit = () => {
      span.style.fontSize = '';
      const w = wrap.clientWidth * 0.9;
      const tw = span.scrollWidth;
      if (w > 0 && tw > w) {
        const computed = parseFloat(getComputedStyle(span).fontSize);
        span.style.fontSize = `${computed * (w / tw)}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={wrapRef} className={className} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '90%' }}>
      <span ref={spanRef} style={{ whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
};

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

const LazyGalleryItem = ({ className, onClick, style, children }) => {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setLoaded(true); io.disconnect(); } },
      { rootMargin: '500px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} onClick={onClick} style={{ ...style, ...(!loaded ? { minHeight: 180 } : {}) }}>
      {loaded && children}
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
const NoteGallery = ({ graphFiles, onSelectFile, headerSlot }) => {
  const pinnedIds = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || '';
    return raw.split(',').map(s => s.trim().replace(/\.md$/i, '').toLowerCase()).filter(Boolean);
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
      const topLinesHeight = ((idHash >> 4) % 5) * 32 + 32;
      const bottomLinesHeight = ((idHash >> 8) % 5) * 32 + 32;
      const leftPct = 40 + (idHash % 21); // 40–60%

      return {
        ...file,
        displayTitle,
        introText,
        video,
        image,
        quote,
        titleNormal,
        titleHover,
        topLinesHeight,
        bottomLinesHeight,
        leftPct
      };
    }).filter(note => note.displayTitle || note.introText || note.video || note.image || note.quote);
  }, [graphFiles]);

  const isPinned = (note) => {
    if (pinnedIds.length === 0) return false;
    const title = note.displayTitle.toLowerCase();
    const name = note.name.replace(/\.md$/, '').toLowerCase();
    const id = note.id.toLowerCase();
    return pinnedIds.some(p => p === title || p === name || p === id || id.endsWith('/' + p));
  };

  const pinnedNotes = useMemo(() => notePreviews.filter(isPinned), [notePreviews, pinnedIds]);
  const unpinnedNotes = useMemo(() => notePreviews.filter(n => !isPinned(n)), [notePreviews, pinnedIds]);

  if (notePreviews.length === 0) return null;

  const renderRegularContent = (note) => {
    const media = note.image
      ? <div className="gallery-item-image"><img src={note.image} alt={note.displayTitle} style={{ width: '100%' }} /></div>
      : note.video
      ? <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" />
      : null;

    const isTwoCol = !!media && !!note.introText;

    if (isTwoCol) {
      return (
        <>
          <div className="gallery-item-row" style={{ '--top-lines': note.topLinesHeight, '--bottom-lines': note.bottomLinesHeight }}>
            <div className="gallery-item-col gallery-item-col-left" style={{ flex: note.leftPct }}>
              {media}
            </div>
            <div className="gallery-item-col gallery-item-col-right" style={{ flex: 100 - note.leftPct }}>
              <MarkdownPreview raw={note.introText} className="gallery-intro-rendered" />
            </div>
          </div>
          {note.image && note.video && <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" />}
          {note.quote && <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />}
        </>
      );
    }

    return (
      <>
        {note.video && <img src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`} alt={note.displayTitle} className="gallery-video-thumbnail" />}
        {note.introText && <MarkdownPreview raw={note.introText} className="gallery-intro-rendered" />}
        {note.image && <div className="gallery-item-image"><img src={note.image} alt={note.displayTitle} /></div>}
        {note.quote && <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />}
      </>
    );
  };

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
        {/* Header slot — right above personal tape */}
        {headerSlot && (
          <div className="gallery-header-slot">
            {headerSlot}
          </div>
        )}

        {/* Personal space tape above pinned */}
        {pinnedNotes.length > 0 && (
          <div className="gallery-personal-tape" aria-hidden="true">
            <div className="gallery-personal-tape-inner">
              {Array.from({ length: 20 }).map((_, i) => <span key={i}>✦ &nbsp;</span>)}
              <FitTapeText text="OPE WATSON — PERSONAL SPACE FOR JOURNALING" className="gallery-personal-tape-main" />
              {Array.from({ length: 20 }).map((_, i) => <span key={i + 20}>✦ &nbsp;</span>)}
            </div>
          </div>
        )}

        {/* Pinned notes — span all columns */}
        {pinnedNotes.map(note => (
          <div
            key={note.id}
            className="gallery-item gallery-item-pinned markdown-content"
            onClick={() => onSelectFile(note.path, note.name, note.id)}
          >
            <span className="gallery-pin-indicator"><Pin size={13} /></span>
            <FitTitle text={note.displayTitle} borderPx={Math.max(5, 12 - Math.floor(note.displayTitle.length / 2))} normalVariant={note.titleNormal} hoverVariant={note.titleHover} />
            {renderRegularContent(note)}
          </div>
        ))}

        {/* Crime scene tape divider */}
        {pinnedNotes.length > 0 && (
          <div className="gallery-crime-tape" aria-hidden="true">
            <div className="gallery-crime-tape-inner">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i}>CRIME SCENE DO NOT CROSS &nbsp;★&nbsp; </span>
              ))}
            </div>
          </div>
        )}

        {/* Regular notes */}
        {unpinnedNotes.map(note => (
          <LazyGalleryItem
            key={note.id}
            className={`gallery-item markdown-content ${(note.video || note.image) && note.introText ? 'gallery-item-two-col' : ''}`}
            onClick={() => onSelectFile(note.path, note.name, note.id)}
          >
            <FitTitle text={note.displayTitle} borderPx={Math.max(5, 12 - Math.floor(note.displayTitle.length / 2))} normalVariant={note.titleNormal} hoverVariant={note.titleHover} />
            {renderRegularContent(note)}
          </LazyGalleryItem>
        ))}
      </div>
    </div>
    </>
  );
};


export default NoteGallery;
