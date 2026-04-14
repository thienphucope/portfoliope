import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Upload } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

const LazyPage = ({ pageNumber, width, height, fitMode, scale, pageAspectRatio, onPageLoadSuccess, rootRef, highlightText }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { root: rootRef.current, rootMargin: '1000px', threshold: [0, 0.1] }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [rootRef]);

  const applyHighlight = useCallback(() => {
    if (!containerRef.current || !highlightText) return;
    const prev = containerRef.current.querySelectorAll('.pdf-text-highlight');
    prev.forEach(el => el.classList.remove('pdf-text-highlight'));

    const spans = containerRef.current.querySelectorAll('.react-pdf__Page__textContent span');
    const cleanCurrent = highlightText.toLowerCase().trim();
    for (const span of spans) {
      const txt = span.textContent.trim().toLowerCase();
      if (txt.length > 2 && cleanCurrent.includes(txt)) span.classList.add('pdf-text-highlight');
    }
  }, [highlightText]);

  useEffect(() => {
    if (isVisible) applyHighlight();
  }, [isVisible, applyHighlight]);

  const calculatedHeight = fitMode === 'height' ? height : (width * pageAspectRatio);

  return (
    <div 
      ref={containerRef} className="pdf-page-wrapper" data-page-number={pageNumber}
      style={{ 
        minHeight: calculatedHeight || '200px', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', marginBottom: '10px', position: 'relative', background: '#1a1a1a'
      }}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber} width={fitMode === 'width' ? width : undefined} height={fitMode === 'height' ? height : undefined}
          scale={scale} devicePixelRatio={2}
          onLoadSuccess={(page) => onPageLoadSuccess(page, pageNumber)}
          onRenderTextLayerSuccess={applyHighlight}
          renderTextLayer renderAnnotationLayer
          loading={<div className="pdf-page-loading" style={{ height: calculatedHeight }}><div className="pdf-loading-spinner" /><span>Page {pageNumber}</span></div>}
        />
      ) : (
        <div className="pdf-page-loading" style={{ height: calculatedHeight }}><div className="pdf-loading-spinner" /><span>Page {pageNumber}</span></div>
      )}
    </div>
  );
};

const PDFViewer = forwardRef(({ onClose, reader, isOpen, onStateChange, initialFile, initialPage, initialFitMode }, ref) => {
  const [file, setFile] = useState(initialFile || null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [currentBlockText, setCurrentBlockText] = useState("");
  const [pageAspectRatio, setPageAspectRatio] = useState(1.414);
  const [fitMode, setFitMode] = useState(initialFitMode || 'width');
  const [bodyEl, setBodyEl] = useState(null);

  const { readChunk, stop, isPlaying, currentText, triggerRead } = reader || {};
  const textContentRef = useRef({}); 
  const pageNumberRef = useRef(initialPage || 1);
  const isAutoReadingRef = useRef(false);
  const isJumpingRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  const memoizedFile = useMemo(() => file, [file]);

  useEffect(() => {
    // Only emit state change when not in the middle of a jump or resize
    if (onStateChange && !isResizingRef.current && !isJumpingRef.current) {
      onStateChange({ pageNumber, numPages, fitMode, file });
    }
  }, [pageNumber, numPages, fitMode, file, onStateChange]);

  const goToPage = useCallback((num, behavior = 'smooth') => {
    if (!bodyEl) return;
    const target = bodyEl.querySelector(`[data-page-number="${num}"]`);
    if (target) {
      isJumpingRef.current = true;
      bodyEl.scrollTo({ top: target.offsetTop, behavior });
      // Clear the jumping flag after the animation/scroll finishes
      setTimeout(() => { isJumpingRef.current = false; }, behavior === 'auto' ? 50 : 800);
    }
  }, [bodyEl]);

  useImperativeHandle(ref, () => ({
    prevPage: () => { if (pageNumber > 1) { const p = pageNumber - 1; setPageNumber(p); goToPage(p); } },
    nextPage: () => { if (pageNumber < numPages) { const p = pageNumber + 1; setPageNumber(p); goToPage(p); } },
    upload: () => fileInputRef.current?.click(),
    toggleFit: () => setFitMode(prev => prev === 'width' ? 'height' : 'width'),
    setPage: (p) => { if (p >= 1 && p <= numPages) { setPageNumber(p); goToPage(p); } }
  }));

  const onBodyRef = useCallback((node) => {
    if (node) { bodyRef.current = node; setBodyEl(node); setContainerWidth(node.clientWidth); setContainerHeight(node.clientHeight); }
  }, []);

  // Handle Resize more robustly
  useEffect(() => {
    if (!bodyEl) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          // Immediately lock scroll-based page updates
          isResizingRef.current = true;
          if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);

          setContainerWidth(entry.contentRect.width);
          setContainerHeight(entry.contentRect.height);
          
          // Debounce the re-scroll to ensure layout has settled
          resizeTimeoutRef.current = setTimeout(() => {
            if (pageNumberRef.current) {
              goToPage(pageNumberRef.current, 'auto');
            }
            // Brief extra delay to let scroll events settle
            setTimeout(() => {
              isResizingRef.current = false;
              // Sync state back after resize settled
              if (onStateChange) onStateChange({ pageNumber: pageNumberRef.current, numPages, fitMode, file });
            }, 100);
          }, 150);
        }
      }
    });
    observer.observe(bodyEl);
    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [bodyEl, goToPage, numPages, fitMode, file, onStateChange]);

  // Use IntersectionObserver to track page number - MUCH more stable than math during resize
  useEffect(() => {
    if (!bodyEl || !numPages) return;

    const io = new IntersectionObserver((entries) => {
      // Ignore visibility changes while we are programmatically scrolling or resizing
      if (isResizingRef.current || isJumpingRef.current) return;

      let topPage = null;
      let minTop = Infinity;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rect = entry.target.getBoundingClientRect();
          const containerRect = bodyEl.getBoundingClientRect();
          const relativeTop = Math.abs(rect.top - containerRect.top);
          
          // The page closest to the top of the container is our current page
          if (relativeTop < minTop) {
            minTop = relativeTop;
            topPage = parseInt(entry.target.getAttribute('data-page-number'));
          }
        }
      });

      if (topPage && topPage !== pageNumberRef.current) {
        setPageNumber(topPage);
        pageNumberRef.current = topPage;
      }
    }, {
      root: bodyEl,
      threshold: [0, 0.1, 0.5],
      rootMargin: '-10% 0% -10% 0%' // Focus on middle 80% of view
    });

    const pages = bodyEl.querySelectorAll('.pdf-page-wrapper');
    pages.forEach(p => io.observe(p));

    return () => io.disconnect();
  }, [bodyEl, numPages, containerWidth, containerHeight]); // Re-observe when containers or page count changes

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages); 
    textContentRef.current = {};
    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageAspectRatio(viewport.height / viewport.width);
    } catch (err) {}

    if (pageNumberRef.current > 1) {
      setTimeout(() => goToPage(pageNumberRef.current, 'auto'), 300);
    } else {
      setPageNumber(1); 
      pageNumberRef.current = 1;
    }
  };

  const onPageLoadSuccess = async (page, pNum) => {
    const text = await page.getTextContent();
    textContentRef.current[pNum] = text.items.map(item => item.str).filter(s => s.trim().length > 0);
  };

  const startReadingFrom = useCallback(async (startIndex, pNum) => {
    isAutoReadingRef.current = true;
    let currentP = pNum; let currentIndex = startIndex;
    while (isAutoReadingRef.current && currentP <= (numPages || 0)) {
      setPageNumber(currentP); goToPage(currentP);
      let attempts = 0; while (!textContentRef.current[currentP] && attempts < 50) { await new Promise(r => setTimeout(r, 200)); attempts++; if (!isAutoReadingRef.current) return; }
      const lines = textContentRef.current[currentP] || [];
      let acc = "";
      for (let i = currentIndex; i < lines.length; i++) {
        if (!isAutoReadingRef.current) return;
        acc += (acc ? " " : "") + lines[i];
        if (/[.!?。！？]$/.test(lines[i].trim()) || i === lines.length - 1) {
          setCurrentBlockText(acc);
          const sentences = acc.match(/[^.!?。！？]+[.!?。！？]?/g) || [acc];
          for (const s of sentences) {
            if (s.trim() && !(await readChunk(s.trim(), null, true))) { isAutoReadingRef.current = false; return; }
            if (!isAutoReadingRef.current) return;
          }
          acc = "";
        }
      }
      currentP++; currentIndex = 0;
    }
    isAutoReadingRef.current = false;
  }, [readChunk, goToPage, numPages]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') { stop?.(); setFile(f); setPageNumber(1); setNumPages(null); }
  };

  const activeHighlight = currentBlockText || currentText;

  return (
    <div className="pdf-viewer-overlay">
      <div ref={onBodyRef} className="pdf-body" onDoubleClick={(e) => {
        if (isPlaying) return;
        const sel = window.getSelection()?.toString().trim();
        const txt = sel || e.target?.textContent?.trim();
        if (!txt) return;
        const pNode = e.target.closest('.pdf-page-wrapper');
        const pNum = pNode ? parseInt(pNode.getAttribute('data-page-number')) : pageNumber;
        const idx = (textContentRef.current[pNum] || []).findIndex(l => l.includes(txt));
        if (idx !== -1) triggerRead ? triggerRead(e, () => startReadingFrom(idx, pNum)) : startReadingFrom(idx, pNum);
      }} style={{ cursor: file ? 'text' : 'default' }}>
        {!memoizedFile ? (
          <div className="pdf-empty-container" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
            <Upload size={64} color="var(--colorbutton, #FFFACD)" style={{ opacity: 0.15 }} />
          </div>
        ) : (
          <Document file={memoizedFile} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="pdf-loading">Opening...</div>} className={`pdf-document fit-${fitMode}`}>
            {Array.from(new Array(numPages || 0), (_, i) => (
              <LazyPage key={i} pageNumber={i + 1} width={containerWidth} height={containerHeight} fitMode={fitMode} scale={1} pageAspectRatio={pageAspectRatio} onPageLoadSuccess={onPageLoadSuccess} rootRef={bodyRef} highlightText={activeHighlight} />
            ))}
          </Document>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-viewer-overlay { display: flex; flex-direction: column; position: absolute; inset: 0; height: 100%; width: 100%; color: white; background: transparent; overflow: hidden; z-index: 5; }
        .pdf-body { flex: 1; overflow-y: auto; background: #000; position: relative; -webkit-overflow-scrolling: touch; }
        .pdf-document { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .pdf-empty-container { display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; }
        .pdf-upload-empty { width: 100%; max-width: 500px; padding: 60px 30px; border: 2px dashed #222; border-radius: 16px; text-align: center; cursor: pointer; background: rgba(255, 250, 205, 0.02); }
        .pdf-text-highlight { background-color: var(--colorlink) !important; color: var(--colortab) !important; border-radius: 2px; }
        .pdf-page-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); color: #444; font-size: 12px; gap: 10px; }
        .pdf-loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--colorbutton); border-radius: 50%; animation: pdf-spin 1s linear infinite; }
        @keyframes pdf-spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';
export default PDFViewer;
