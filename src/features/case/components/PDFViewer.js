import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, FileText, Upload, Plus, Minus, Maximize2, Minimize2 } from 'lucide-react';

// Setup worker cho pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Internal component for lazy loading each page
const LazyPage = ({ pageNumber, width, height, fitMode, scale, onPageLoadSuccess, onVisible, rootRef }) => {
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
        alignItems: 'center',
        marginBottom: '0px', // Đưa padding/margin về 0
        position: 'relative'
      }}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber}
          width={fitMode === 'width' ? width : undefined}
          height={fitMode === 'height' ? height : undefined}
          scale={scale}
          devicePixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio * 2 : 2}
          onLoadSuccess={(page) => onPageLoadSuccess(page, pageNumber)}
          renderTextLayer
          renderAnnotationLayer
        />
      ) : (
        <div className="pdf-page-loading" style={{ height: fitMode === 'height' ? height : '200px' }}>
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
  const [pageInput, setPageInput] = useState('1');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(null);
  const [containerHeight, setContainerHeight] = useState(null);
  const [currentBlockText, setCurrentBlockText] = useState("");
  const [pageAspectRatio, setPageAspectRatio] = useState(1.414); // Mặc định là A4
  const [fitMode, setFitMode] = useState('width'); // 'width' | 'height'

  const { readChunk, stop, isPlaying, currentText, triggerRead } = reader || {};

  const textContentRef = useRef({}); 
  const pageNumberRef = useRef(1);
  const numPagesRef = useRef(null);
  const readingIndexRef = useRef(-1);
  const isAutoReadingRef = useRef(false);
  const isJumpingRef = useRef(false);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);

  // Highlight and Scroll logic
  useEffect(() => {
    if (!bodyRef.current) return;

    // Luôn xóa highlight cũ trước
    const prevHighlights = bodyRef.current.querySelectorAll('.pdf-text-highlight');
    prevHighlights.forEach(el => el.classList.remove('pdf-text-highlight'));

    const textToHighlight = currentBlockText || currentText;
    if (!textToHighlight || !isPlaying) return;

    // Chỉ tìm trong trang hiện tại để tránh nhảy lung tung
    const currentPage = bodyRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!currentPage) return;

    const spans = currentPage.querySelectorAll('.react-pdf__Page__textContent span');
    const cleanCurrent = textToHighlight.toLowerCase().trim();
    let firstMatch = null;

    for (const span of spans) {
      const txt = span.textContent.trim().toLowerCase();
      // So khớp: nếu mẩu văn bản nằm trong Block/Câu đang đọc
      if (txt.length > 2 && cleanCurrent.includes(txt)) {
        span.classList.add('pdf-text-highlight');
        if (!firstMatch) firstMatch = span;
      }
    }
    
    if (firstMatch) {
      // firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentText, currentBlockText, isPlaying, pageNumber]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const handleWheelNative = (e) => e.stopPropagation();
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, []);

  const handlePageIndicatorClick = (p) => {
    if (p === pageNumber) return;
    const diff = Math.abs(p - pageNumber);
    // Nếu nhảy xa (>5 trang) thì nhảy tức thì để tránh lag, gần thì cuộn mượt
    goToPage(p, diff > 5 ? 'auto' : 'smooth');
    setPageNumber(p);
  };

  const goToPage = useCallback((num, behavior = 'smooth') => {
    const target = bodyRef.current?.querySelector(`[data-page-number="${num}"]`);
    if (target && bodyRef.current) {
      isJumpingRef.current = true;
      const top = target.offsetTop;
      bodyRef.current.scrollTo({ top, behavior });
      
      // Sau khi nhảy xong thì mới cho phép đồng bộ lại pageNumber
      const delay = behavior === 'auto' ? 100 : 800;
      setTimeout(() => {
        isJumpingRef.current = false;
      }, delay);
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
    const updateSize = () => {
      if (bodyRef.current) {
        setContainerWidth(bodyRef.current.clientWidth);
        setContainerHeight(bodyRef.current.clientHeight);
      }
    };
    updateSize();
    const timer = setTimeout(updateSize, 150);
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    pageNumberRef.current = pageNumber;
    if (!isInputFocused) {
      setPageInput(pageNumber.toString());
    }
  }, [pageNumber, isInputFocused]);

  useEffect(() => {
    numPagesRef.current = numPages;
  }, [numPages]);

  useEffect(() => {
    if (!isPlaying) {
      isAutoReadingRef.current = false;
      readingIndexRef.current = -1;
      setCurrentBlockText("");
    }
  }, [isPlaying]);

  useEffect(() => () => stop?.(), [stop]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    pageNumberRef.current = 1;
    numPagesRef.current = numPages;
    readingIndexRef.current = -1;
    isAutoReadingRef.current = false;
    textContentRef.current = {};
    setCurrentBlockText("");
    if (bodyRef.current) {
      setContainerWidth(bodyRef.current.clientWidth);
      setContainerHeight(bodyRef.current.clientHeight);
    }
  };

  const onPageLoadSuccess = async (page, pNum) => {
    // Cập nhật tỷ lệ khung hình từ trang thực tế
    if (page.width && page.height) {
      setPageAspectRatio(page.height / page.width);
    }

    const textContent = await page.getTextContent();
    textContentRef.current[pNum] = textContent.items
      .map((item) => item.str)
      .filter((str) => str.trim().length > 0);
  };

  const startReadingFrom = useCallback(async (startIndex, pNum) => {
    isAutoReadingRef.current = true;
    let currentP = pNum;
    let currentIndex = startIndex;
    let accumulatedBlock = "";

    while (isAutoReadingRef.current && currentP <= numPagesRef.current) {
      setPageNumber(currentP);
      goToPage(currentP);

      // Chờ cho đến khi nội dung trang được load
      let attempts = 0;
      while (!textContentRef.current[currentP] && attempts < 100) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
        if (!isAutoReadingRef.current) return;
      }

      const currentLines = textContentRef.current[currentP] || [];
      
      for (let i = currentIndex; i < currentLines.length; i++) {
        if (!isAutoReadingRef.current) return;
        
        const text = currentLines[i];
        accumulatedBlock += (accumulatedBlock ? " " : "") + text;
        
        const isLastInPage = i === currentLines.length - 1;
        const hasTerminator = /[.!?。！？]$/.test(text.trim());

        // Nếu xác định được 1 Block (kết thúc câu hoặc hết trang)
        if (hasTerminator || isLastInPage) {
          setCurrentBlockText(accumulatedBlock); // Highlight cả Block
          
          // Tách Block này thành các câu nhỏ hơn (nếu có)
          const sentences = accumulatedBlock.match(/[^.!?。！？]+[.!?。！？]?/g) || [accumulatedBlock];
          
          for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed) {
              // Gửi từng câu đi đọc ngay lập tức (immediate = true)
              const success = await readChunk(trimmed, null, true);
              if (!success) {
                isAutoReadingRef.current = false;
                setCurrentBlockText("");
                return;
              }
            }
            if (!isAutoReadingRef.current) return;
          }
          accumulatedBlock = ""; // Xóa block sau khi đã đọc xong các câu bên trong
        }
      }

      // Chuẩn bị sang trang tiếp theo
      if (isAutoReadingRef.current) {
        if (currentP < numPagesRef.current) {
          currentP += 1;
          currentIndex = 0;
        } else {
          isAutoReadingRef.current = false;
        }
      }
    }
    
    isAutoReadingRef.current = false;
    readingIndexRef.current = -1;
  }, [readChunk, goToPage]);

  const handleDoubleClick = (e) => {
    if (isPlaying) return;
    const selection = window.getSelection();
    const selected = selection ? selection.toString().trim() : '';
    const clickedText = selected || e.target?.textContent?.trim() || '';
    if (!clickedText) return;

    const pageWrapper = e.target.closest('.pdf-page-wrapper');
    const pNum = pageWrapper ? parseInt(pageWrapper.getAttribute('data-page-number')) : pageNumber;

    const currentLines = textContentRef.current[pNum] || [];
    const index = currentLines.findIndex((item) => item.includes(clickedText));
    if (index !== -1) {
      if (triggerRead) {
        triggerRead(e, () => {
          setPageNumber(pNum);
          startReadingFrom(index, pNum);
        });
      } else {
        setPageNumber(pNum);
        startReadingFrom(index, pNum);
      }
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

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    setIsInputFocused(false);
    const p = parseInt(pageInput);
    if (!isNaN(p) && p > 0 && p <= numPages) {
      handlePageIndicatorClick(p);
    } else {
      setPageInput(pageNumber.toString());
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
      e.target.blur();
    }
  };

  const toggleFitMode = () => {
    setFitMode(prev => prev === 'width' ? 'height' : 'width');
  };

  return (
    <div className="pdf-viewer-overlay">
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
          <Document 
            file={file} 
            onLoadSuccess={onDocumentLoadSuccess} 
            loading={<div className="pdf-loading">Opening your document...</div>} 
            className={`pdf-document fit-${fitMode}`}
          >
            {Array.from(new Array(numPages), (el, index) => {
              const p = index + 1;
              const isNeighbor = Math.abs(p - pageNumber) <= 5;
              
              if (isNeighbor) {
                return (
                  <LazyPage
                    key={`page_${p}`}
                    pageNumber={p}
                    width={containerWidth} // Không trừ 40 nữa
                    height={containerHeight} // Không trừ 60 nữa
                    fitMode={fitMode}
                    scale={scale}
                    onPageLoadSuccess={onPageLoadSuccess}
                    onVisible={(num) => {
                      if (!isJumpingRef.current && !isAutoReadingRef.current) {
                        setPageNumber(num);
                      }
                    }}
                    rootRef={bodyRef}
                  />
                );
              } else {
                const calculatedHeight = fitMode === 'height' 
                  ? containerHeight 
                  : (containerWidth * pageAspectRatio);
                
                return (
                  <div 
                    key={`placeholder_${p}`} 
                    className="pdf-page-wrapper placeholder" 
                    data-page-number={p}
                    style={{ 
                      height: calculatedHeight || '800px',
                      width: '100%',
                      marginBottom: '0px'
                    }}
                  />
                );
              }
            })}
          </Document>
        )}
      </div>

      <div className="pdf-footer-nav">
        <div className="pdf-upload-trigger" onClick={() => fileInputRef.current.click()} title="Upload PDF">
          <Upload size={16} color="#000" />
        </div>
        
        <div className="pdf-footer-nav-divider" />

        <button 
          className="pdf-nav-arrow" 
          onClick={() => handlePageIndicatorClick(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft size={14} />
        </button>
        
        <div className="pdf-page-tracker">
          <input 
            type="text" 
            className="pdf-page-input"
            value={pageInput}
            onChange={handlePageInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
          />
          <span className="pdf-page-total">/ {numPages || 0}</span>
        </div>

        <button 
          className="pdf-nav-arrow" 
          onClick={() => handlePageIndicatorClick(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight size={14} />
        </button>

        <div className="pdf-footer-nav-divider" />

        <div className="pdf-mode-toggle" onClick={toggleFitMode} title={fitMode === 'width' ? "Fit Height" : "Fit Width"}>
          {fitMode === 'width' ? <Maximize2 size={16} color="#000" /> : <Minimize2 size={16} color="#000" />}
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-viewer-overlay {
          display: flex; flex-direction: column; position: absolute; inset: 0;
          height: 100%; width: 100%; color: white; background: transparent;
          animation: fadeInPDF 0.3s ease-out; overflow: hidden; box-sizing: border-box; z-index: 5;
        }
        
        .pdf-body { 
          flex: 1; 
          overflow-y: scroll !important; 
          overflow-x: hidden; 
          background: #000; 
          position: relative; 
          -webkit-overflow-scrolling: touch; 
          padding: 0; /* Padding góc bằng 0 */
          display: block; 
          width: 100%; 
          z-index: 1; 
        }
        
        /* Custom Scrollbar */
        .pdf-body::-webkit-scrollbar {
          width: 6px !important;
          display: block !important;
        }
        .pdf-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2) !important;
        }
        .pdf-body::-webkit-scrollbar-thumb {
          background: var(--colorbutton) !important;
          opacity: 0.2 !important;
          border-radius: 10px !important;
        }
        .pdf-body:hover::-webkit-scrollbar-thumb {
          opacity: 0.8 !important;
        }
        
        .pdf-document { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .pdf-empty-container {
          display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;
          box-sizing: border-box;
        }
        .pdf-upload-empty {
          width: 100%; max-width: 500px; padding: 60px 30px; border: 2px dashed #222; border-radius: 16px;
          text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(255, 250, 205, 0.02);
        }
        .pdf-upload-empty:hover {
          border-color: var(--colorbutton); background: rgba(255, 250, 205, 0.05);
        }
        .pdf-empty-title { color: #888; margin-bottom: 8px; }
        .pdf-empty-subtitle { color: #555; font-size: 14px; }
        .pdf-text-highlight { background-color: var(--colorlink) !important; color: var(--colortab) !important; border-radius: 2px; box-shadow: 0 0 8px var(--colorlink); padding: 0 2px; }
        
        .pdf-footer-nav {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--colorbutton);
          color: #000;
          padding: 6px 16px;
          border-radius: 30px;
          z-index: 40;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          border: 1px solid rgba(0,0,0,0.1);
        }
        .pdf-footer-nav-divider {
          width: 1px;
          height: 16px;
          background: rgba(0,0,0,0.1);
          margin: 0 2px;
        }
        .pdf-nav-arrow, .pdf-upload-trigger, .pdf-mode-toggle {
          background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #000; opacity: 0.7; transition: all 0.2s; padding: 2px;
        }
        .pdf-nav-arrow:hover:not(:disabled), .pdf-upload-trigger:hover, .pdf-mode-toggle:hover { opacity: 1; transform: scale(1.1); }
        .pdf-nav-arrow:disabled { opacity: 0.1; cursor: default; }
        
        .pdf-page-tracker { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 11px; }
        .pdf-page-input {
          background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); color: #000; width: 28px;
          text-align: center; padding: 1px 2px; border-radius: 3px; font-weight: 700; font-family: inherit; font-size: 11px;
        }
        .pdf-page-input:focus { outline: none; background: rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.3); }
        .pdf-page-total { opacity: 0.5; }

        .pdf-page-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border-radius: 4px; color: #444; font-size: 12px; gap: 10px; }
        .pdf-loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--colorbutton); border-radius: 50%; animation: pdf-spin 1s linear infinite; }
        @keyframes pdf-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) { .pdf-body { padding-bottom: 100px; } }
      `}} />
    </div>
  );
}
