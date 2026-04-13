import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText } from 'lucide-react';

// Cấu hình Worker ổn định cho Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

const LazyPage = ({ pageNumber, width, height, fitMode, scale, pageAspectRatio, onPageLoadSuccess, rootRef }) => {
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
          renderTextLayer renderAnnotationLayer
          loading={<div className="pdf-page-loading" style={{ height: calculatedHeight }}><div className="pdf-loading-spinner" /><span>Page {pageNumber}</span></div>}
        />
      ) : (
        <div className="pdf-page-loading" style={{ height: calculatedHeight }}><div className="pdf-loading-spinner" /><span>Page {pageNumber}</span></div>
      )}
    </div>
  );
};

const PDFViewer = forwardRef(({ onClose, reader, isOpen, onStateChange }, ref) => {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [currentBlockText, setCurrentBlockText] = useState("");
  const [pageAspectRatio, setPageAspectRatio] = useState(1.414);
  const [fitMode, setFitMode] = useState('width');
  const [bodyEl, setBodyEl] = useState(null);

  const { readChunk, stop, isPlaying, currentText, triggerRead } = reader || {};
  const textContentRef = useRef({}); 
  const pageNumberRef = useRef(1);
  const isAutoReadingRef = useRef(false);
  const isJumpingRef = useRef(false);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  // Memoize file object to prevent detached buffer issues
  const memoizedFile = useMemo(() => file, [file]);

  useEffect(() => {
    if (onStateChange) onStateChange({ pageNumber, numPages, fitMode });
  }, [pageNumber, numPages, fitMode]); // Giảm dependency để tránh vòng lặp

  const goToPage = useCallback((num, behavior = 'smooth') => {
    const target = bodyEl?.querySelector(`[data-page-number="${num}"]`);
    if (target && bodyEl) {
      isJumpingRef.current = true;
      bodyEl.scrollTo({ top: target.offsetTop, behavior });
      setTimeout(() => { isJumpingRef.current = false; }, behavior === 'auto' ? 100 : 800);
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

  useEffect(() => {
    if (!bodyEl) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
          setContainerHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(bodyEl);
    return () => observer.disconnect();
  }, [bodyEl]);

  useEffect(() => {
    if (!bodyEl || !numPages) return;
    const handleScroll = () => {
      if (isJumpingRef.current || isAutoReadingRef.current) return;
      const pageH = fitMode === 'height' ? containerHeight : (containerWidth * pageAspectRatio);
      const newPage = Math.max(1, Math.min(numPages, Math.round(bodyEl.scrollTop / (pageH + 10)) + 1));
      if (newPage !== pageNumberRef.current) {
        setPageNumber(newPage);
        pageNumberRef.current = newPage;
      }
    };
    bodyEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => bodyEl.removeEventListener('scroll', handleScroll);
  }, [bodyEl, numPages, fitMode, containerWidth, containerHeight, pageAspectRatio]);

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    pageNumberRef.current = 1;
    textContentRef.current = {};
    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageAspectRatio(viewport.height / viewport.width);
    } catch (err) {}
  };

  const onPageLoadSuccess = async (page, pNum) => {
    const text = await page.getTextContent();
    textContentRef.current[pNum] = text.items.map(item => item.str).filter(s => s.trim().length > 0);
  };

  const startReadingFrom = useCallback(async (startIndex, pNum) => {
    isAutoReadingRef.current = true;
    let currentP = pNum;
    let currentIndex = startIndex;
    while (isAutoReadingRef.current && currentP <= (numPages || 0)) {
      setPageNumber(currentP); goToPage(currentP);
      let attempts = 0; 
      while (!textContentRef.current[currentP] && attempts < 50) { 
        await new Promise(r => setTimeout(r, 200)); attempts++; 
        if (!isAutoReadingRef.current) return;
      }
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
    if (f && f.type === 'application/pdf') {
      stop?.(); setFile(f); setPageNumber(1); setNumPages(null);
    }
  };

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
          <div className="pdf-empty-container"><div onClick={() => fileInputRef.current.click()} className="pdf-upload-empty"><FileText size={44} color="#666" style={{ marginBottom: '14px' }} /><h3 className="pdf-empty-title">Click to select a PDF file</h3><p className="pdf-empty-subtitle">Double-click a line to start Sonia reading.</p></div></div>
        ) : (
          <Document file={memoizedFile} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="pdf-loading">Opening...</div>} className={`pdf-document fit-${fitMode}`}>
            {Array.from(new Array(numPages || 0), (_, i) => (
              <LazyPage key={i} pageNumber={i + 1} width={containerWidth} height={containerHeight} fitMode={fitMode} scale={1} pageAspectRatio={pageAspectRatio} onPageLoadSuccess={onPageLoadSuccess} rootRef={bodyRef} />
            ))}
          </Document>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-viewer-overlay { display: flex; flex-direction: column; position: absolute; inset: 0; height: 100%; width: 100%; color: white; background: transparent; overflow: hidden; z-index: 5; }
        .pdf-body { flex: 1; overflow-y: auto; background: #000; position: relative; -webkit-overflow-scrolling: touch; }
        .pdf-body::-webkit-scrollbar { width: 6px; }
        .pdf-body::-webkit-scrollbar-thumb { background: var(--colorbutton); border-radius: 10px; }
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

export default PDFViewer;
