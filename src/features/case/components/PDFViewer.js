import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, FileText, Upload, Plus, Minus } from 'lucide-react';

// Setup worker cho pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Internal component for lazy loading each page
const LazyPage = ({ pageNumber, width, scale, onPageLoadSuccess, onVisible, rootRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
        if (entry.intersectionRatio > 0.1) {
          onVisible(pageNumber);
        }
      },
      { 
        root: rootRef.current,
        rootMargin: '400px',
        threshold: [0, 0.1, 0.5]
      }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pageNumber, onVisible, rootRef]);

  return (
    <div 
      ref={containerRef} 
      className="pdf-page-wrapper" 
      data-page-number={pageNumber}
      style={{ 
        minHeight: isVisible ? 'auto' : '200px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        marginBottom: '4px',
        position: 'relative'
      }}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          scale={scale}
          onLoadSuccess={(page) => onPageLoadSuccess(page, pageNumber)}
          renderTextLayer
          renderAnnotationLayer
        />
      ) : (
        <div className="pdf-page-loading">
          <div className="pdf-loading-spinner" />
          <span>Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
};

export default function PDFViewer({ onClose, reader, isOpen }) {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(null);

  const { readChunk, stop, isPlaying, currentText } = reader || {};

  const textContentRef = useRef({}); 
  const pageNumberRef = useRef(1);
  const numPagesRef = useRef(null);
  const readingIndexRef = useRef(-1);
  const isAutoReadingRef = useRef(false);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  // Highlight and Scroll logic
  useEffect(() => {
    if (!bodyRef.current) return;

    // Luôn xóa highlight cũ trước
    const prevHighlights = bodyRef.current.querySelectorAll('.pdf-text-highlight');
    prevHighlights.forEach(el => el.classList.remove('pdf-text-highlight'));

    if (!currentText || !isPlaying) return;

    // Chỉ tìm trong trang hiện tại để tránh nhảy lung tung
    const currentPage = bodyRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!currentPage) return;

    const spans = currentPage.querySelectorAll('.react-pdf__Page__textContent span');
    const cleanCurrent = currentText.toLowerCase().trim();
    let firstMatch = null;

    for (const span of spans) {
      const txt = span.textContent.trim().toLowerCase();
      // So khớp chính xác hơn để tránh rải rác
      if (txt.length > 3 && cleanCurrent.includes(txt)) {
        span.classList.add('pdf-text-highlight');
        if (!firstMatch) firstMatch = span;
      }
    }
    
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentText, isPlaying, pageNumber]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const handleWheelNative = (e) => e.stopPropagation();
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, []);

  const handlePageIndicatorClick = (p) => {
    setPageNumber(p);
    goToPage(p);
  };

  const goToPage = useCallback((num) => {
    const target = bodyRef.current?.querySelector(`[data-page-number="${num}"]`);
    if (target && bodyRef.current) {
      const top = target.offsetTop;
      bodyRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isOpen]);

  useEffect(() => {
    const updateWidth = () => {
      if (bodyRef.current) {
        setContainerWidth(bodyRef.current.clientWidth);
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 150);
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);

  useEffect(() => () => stop?.(), [stop]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    pageNumberRef.current = 1;
    numPagesRef.current = numPages;
    readingIndexRef.current = -1;
    isAutoReadingRef.current = false;
    textContentRef.current = {};
    if (bodyRef.current) setContainerWidth(bodyRef.current.clientWidth);
  };

  const onPageLoadSuccess = async (page, pNum) => {
    const textContent = await page.getTextContent();
    textContentRef.current[pNum] = textContent.items
      .map((item) => item.str)
      .filter((str) => str.trim().length > 0);

    if (isAutoReadingRef.current && pNum === pageNumberRef.current && readingIndexRef.current >= 0) {
      startReadingFrom(readingIndexRef.current, pNum);
    }
  };

  const startReadingFrom = useCallback(async (startIndex, pNum) => {
    isAutoReadingRef.current = true;
    readingIndexRef.current = startIndex;
    const currentLines = textContentRef.current[pNum] || [];
    
    while (isAutoReadingRef.current && readingIndexRef.current < currentLines.length) {
      const text = currentLines[readingIndexRef.current];
      if (text) {
        const success = await readChunk(text);
        if (!success) {
          isAutoReadingRef.current = false;
          return;
        }
      }
      readingIndexRef.current += 1;
    }
    isAutoReadingRef.current = false;
    readingIndexRef.current = -1;
  }, [readChunk]);

  const handleDoubleClick = (e) => {
    const selection = window.getSelection();
    const selected = selection ? selection.toString().trim() : '';
    const clickedText = selected || e.target?.textContent?.trim() || '';
    if (!clickedText) return;

    const pageWrapper = e.target.closest('.pdf-page-wrapper');
    const pNum = pageWrapper ? parseInt(pageWrapper.getAttribute('data-page-number')) : pageNumber;

    const currentLines = textContentRef.current[pNum] || [];
    const index = currentLines.findIndex((item) => item.includes(clickedText));
    if (index !== -1) {
      setPageNumber(pNum);
      startReadingFrom(index, pNum);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      stop?.();
      setFile(selectedFile);
      setPageNumber(1);
      setNumPages(null);
    }
  };

  const handleStop = () => {
    isAutoReadingRef.current = false;
    readingIndexRef.current = -1;
    stop?.();
  };

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-header">
        <div className="pdf-header-left" />
        <div className="pdf-header-center">
          <div className="pdf-upload-trigger" onClick={() => fileInputRef.current.click()}>
            <Upload size={22} color="var(--colorbutton)" />
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
          {file && (
            <>
              {isPlaying ? (
                <button onClick={handleStop} title="Stop Reading" className="pdf-stop-btn">
                  <VolumeX size={24} color="var(--colorbutton)" />
                </button>
              ) : (
                <Volume2 size={24} className="pdf-idle-audio" color="var(--colorbutton)" />
              )}
            </>
          )}
        </div>
        <div className="pdf-header-right" />
      </div>

      <div
        ref={bodyRef}
        className="pdf-body"
        onDoubleClick={handleDoubleClick}
        onWheel={(e) => e.stopPropagation()}
        style={{ cursor: file ? 'text' : 'default' }}
      >
        {!file ? (
          <div className="pdf-empty-container">
            <div onClick={() => fileInputRef.current.click()} className="pdf-upload-empty">
              <FileText size={44} color="#666" style={{ marginBottom: '14px' }} />
              <h3 className="pdf-empty-title">Click to select a PDF file</h3>
              <p className="pdf-empty-subtitle">Double-click a line to start Sonia reading.</p>
            </div>
          </div>
        ) : (
          <>
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="pdf-loading">Opening your document...</div>} className="pdf-document">
              {Array.from(new Array(numPages), (el, index) => (
                <LazyPage
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={containerWidth}
                  scale={scale}
                  onPageLoadSuccess={onPageLoadSuccess}
                  onVisible={(num) => !isAutoReadingRef.current && setPageNumber(num)}
                  rootRef={bodyRef}
                />
              ))}
            </Document>
            <div className="pdf-side-nav">
              {Array.from(new Array(numPages), (el, index) => {
                const p = index + 1;
                const isActive = p === pageNumber;
                return (
                  <div key={`nav_${p}`} className={`pdf-nav-dot ${isActive ? 'active' : ''}`} onClick={() => handlePageIndicatorClick(p)}>
                    <div className="pdf-nav-line" />
                    {isActive && <span className="pdf-nav-label">{p}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-viewer-overlay {
          display: flex; flex-direction: column; position: absolute; inset: 0;
          height: 100%; width: 100%; color: white; background: transparent;
          animation: fadeInPDF 0.3s ease-out; overflow: hidden; box-sizing: border-box; z-index: 5;
        }
        .pdf-header {
          position: absolute; top: 0; left: 0; right: 0; padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; background: transparent; z-index: 20; height: 60px;
        }
        .pdf-header-center { flex: 1; display: flex; justify-content: center; align-items: center; gap: 20px; }
        .pdf-stop-btn, .pdf-idle-audio { background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
        .pdf-body { 
          flex: 1; 
          overflow-y: scroll !important; 
          overflow-x: hidden; 
          background: #000; 
          position: relative; 
          -webkit-overflow-scrolling: touch; 
          padding: 0; 
          display: block; 
          width: 100%; 
          z-index: 1; 
        }
        
        /* Custom Scrollbar */
        .pdf-body::-webkit-scrollbar {
          width: 10px !important;
          display: block !important;
        }
        .pdf-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2) !important;
        }
        .pdf-body::-webkit-scrollbar-thumb {
          background: var(--colorbutton) !important;
          opacity: 0.2 !important; /* Luôn hiện mờ mờ */
          border-radius: 10px !important;
          border: 2px solid transparent !important;
          background-clip: content-box !important;
        }
        .pdf-body:hover::-webkit-scrollbar-thumb {
          opacity: 0.8 !important;
          background: var(--colorbutton) !important;
        }
        .pdf-body::-webkit-scrollbar-thumb:hover {
          background: #ffffff !important;
          opacity: 1 !important;
        }
        
        /* Firefox */
        .pdf-body {
          scrollbar-width: thin;
          scrollbar-color: var(--colorbutton) transparent;
        }
        
        .pdf-document { display: flex; flex-direction: column; alignItems: stretch; width: 100%; }
        .pdf-side-nav { position: fixed; right: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 4px; padding: 20px 4px; z-index: 30; opacity: 0; transition: opacity 0.3s ease; max-height: 80vh; overflow-y: auto; scrollbar-width: none; }
        .pdf-side-nav:hover { opacity: 1; }
        .pdf-empty-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
          padding: 100px 20px;
          box-sizing: border-box;
        }
        .pdf-upload-empty {
          width: 100%;
          max-width: 500px;
          padding: 60px 30px;
          border: 2px dashed #222;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255, 250, 205, 0.02);
        }
        .pdf-upload-empty:hover {
          border-color: var(--colorbutton);
          background: rgba(255, 250, 205, 0.05);
        }
        .pdf-empty-title { color: #888; margin-bottom: 8px; }
        .pdf-empty-subtitle { color: #555; font-size: 14px; }
        .pdf-nav-dot { display: flex; align-items: center; justify-content: flex-end; width: 40px; height: 12px; cursor: pointer; position: relative; }
        .pdf-nav-line { width: 12px; height: 2px; background: rgba(255, 255, 255, 0.2); transition: all 0.2s; }
        .pdf-nav-dot.active .pdf-nav-line { width: 24px; background: var(--colorbutton); }
        .pdf-nav-label { position: absolute; right: 30px; font-size: 10px; color: var(--colorbutton); font-weight: bold; }
        .pdf-text-highlight { background-color: var(--colorlink) !important; color: var(--background) !important; border-radius: 2px; box-shadow: 0 0 8px var(--colorlink); padding: 0 2px; }
        @media (max-width: 1024px) { .pdf-viewer-overlay { padding-top: 50px; } .pdf-body { padding-bottom: 180px; } .pdf-side-nav { display: none; } }
      `}} />
    </div>
  );
}
