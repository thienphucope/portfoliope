import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Upload } from 'lucide-react';
import styles from '../styles/PDFViewer.module.css';

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
      style={{ minHeight: calculatedHeight || '200px' }}
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
    // Sync state changes back to parent
    if (onStateChange && !isResizingRef.current) {
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
    prevPage: () => { if (pageNumber > 1) { const p = pageNumber - 1; setPageNumber(p); pageNumberRef.current = p; goToPage(p); } },
    nextPage: () => { if (pageNumber < numPages) { const p = pageNumber + 1; setPageNumber(p); pageNumberRef.current = p; goToPage(p); } },
    upload: () => fileInputRef.current?.click(),
    toggleFit: () => setFitMode(prev => prev === 'width' ? 'height' : 'width'),
    setPage: (p) => { if (p >= 1 && p <= numPages) { setPageNumber(p); pageNumberRef.current = p; goToPage(p); } }
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

  // Use scroll listener to track page number - more predictable for "middle of page" logic
  useEffect(() => {
    if (!bodyEl || !numPages) return;

    const handleScroll = () => {
      if (isResizingRef.current || isJumpingRef.current) return;

      const scrollTop = bodyEl.scrollTop;
      const pages = bodyEl.querySelectorAll('.pdf-page-wrapper');
      let detectedPage = 1;

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        const pageTop = pageEl.offsetTop;
        const pageHeight = pageEl.offsetHeight;
        const pageMiddle = pageTop + (pageHeight / 2);

        // If the top of the container has passed the middle of the current page, 
        // we consider ourselves to be on the next page.
        if (scrollTop >= pageMiddle) {
          detectedPage = i + 2; // i is 0-indexed, so current is i+1, next is i+2
        } else {
          break; // Found the current page
        }
      }

      // Clamp to valid range
      detectedPage = Math.max(1, Math.min(detectedPage, numPages));

      if (detectedPage !== pageNumberRef.current) {
        setPageNumber(detectedPage);
        pageNumberRef.current = detectedPage;
      }
    };

    bodyEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => bodyEl.removeEventListener('scroll', handleScroll);
  }, [bodyEl, numPages]);

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
    <div className={`pdf-viewer-overlay ${styles.viewer}`}>
      <div ref={onBodyRef} className="pdf-body" onDoubleClick={(e) => {
        if (isPlaying) return;
        const sel = window.getSelection()?.toString().trim();
        const txt = sel || e.target?.textContent?.trim();
        if (!txt) return;
        const pNode = e.target.closest('.pdf-page-wrapper');
        const pNum = pNode ? parseInt(pNode.getAttribute('data-page-number')) : pageNumber;
        const idx = (textContentRef.current[pNum] || []).findIndex(l => l.includes(txt));
        if (idx !== -1) triggerRead ? triggerRead(e, () => startReadingFrom(idx, pNum)) : startReadingFrom(idx, pNum);
      }} data-has-file={Boolean(file)}>
        {!memoizedFile ? (
          <button type="button" className="pdf-empty-container" aria-label="Upload PDF" onClick={() => fileInputRef.current.click()}>
            <Upload size={64} aria-hidden="true" />
          </button>
        ) : (
          <Document file={memoizedFile} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="pdf-loading">Opening...</div>} className={`pdf-document fit-${fitMode}`}>
            {Array.from(new Array(numPages || 0), (_, i) => (
              <LazyPage key={i} pageNumber={i + 1} width={containerWidth} height={containerHeight} fitMode={fitMode} scale={1} pageAspectRatio={pageAspectRatio} onPageLoadSuccess={onPageLoadSuccess} rootRef={bodyRef} highlightText={activeHighlight} />
            ))}
          </Document>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" hidden />
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';
export default PDFViewer;
