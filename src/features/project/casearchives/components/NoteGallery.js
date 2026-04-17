import React, { useMemo, useEffect, useRef } from 'react';
import { ensureLibsLoaded, postProcess } from '../utils/markdown';

const FitTitle = ({ text, borderPx }) => {
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
    <div ref={wrapRef} className="gallery-title-wrap" style={{ borderWidth: `${borderPx}px` }}>
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
  const notePreviews = useMemo(() => {
    return graphFiles.map(file => {
      const content = file.fetchedContent || '';
      const lines = content.split('\n');
      
      // Extract block title: strictly use filename without extension to match BlockEditor
      const displayTitle = file.name.split('/').pop().replace(/\.md$/, '');

      // 1. Extract first block of regular text
      let introText = '';
      const introLines = [];
      for (const l of lines) {
        const t = l.trim();
        if (t && 
            !t.startsWith('#') && 
            !t.startsWith('>') && 
            !t.startsWith('![') && 
            !/^[*_].+:[*_]?/.test(t)) {
          introLines.push(t);
          if (introLines.length >= 3) break; // Limit intro block to 3 lines
        } else if (introLines.length > 0) {
          break; // Stop at first break after finding text
        }
      }
      introText = introLines.join('\n\n');
      if (introText.split(/\s+/).filter(Boolean).length < 10) introText = '';

      // 2. Extract first video
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
      const videoMatch = content.match(ytRegex);
      const video = videoMatch ? videoMatch[1] : null;

      // 3. Extract first quote
      const rawQuote = lines.find(l => l.trim().startsWith('>'))?.trim();
      const quote = rawQuote ? (() => {
        const words = rawQuote.split(/\s+/);
        return words.length > 30 ? words.slice(0, 30).join(' ') + '...' : rawQuote;
      })() : null;

      return { 
        ...file, 
        displayTitle, 
        introText,
        video,
        quote
      };
    }).filter(note => note.displayTitle || note.introText || note.video || note.quote);
  }, [graphFiles]);

  if (notePreviews.length === 0) return null;

  return (
    <div className="note-gallery-container">
      <a href="/project" className="gallery-main-title">CASE ARCHIVES</a>
      <div className="note-gallery">
        {notePreviews.map(note => (
          <div 
            key={note.id} 
            className="gallery-item markdown-content" 
            onClick={() => onSelectFile(note.path, note.name, note.id)}
          >
            <FitTitle text={note.displayTitle} borderPx={Math.max(2, 12 - Math.floor(note.displayTitle.length / 2))} />
            
            {note.video ? (
              <div className="gallery-polaroid">
                <img
                  src={`https://img.youtube.com/vi/${note.video}/mqdefault.jpg`}
                  alt={note.displayTitle}
                  className="gallery-polaroid-img"
                />
              </div>
            ) : (
              /* Otherwise show intro text and quote */
              <>
                {note.introText && (
                  <MarkdownPreview raw={note.introText} className="gallery-intro-rendered" />
                )}

                {note.quote && (
                  <MarkdownPreview raw={note.quote} className="gallery-quote-rendered" />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteGallery;
