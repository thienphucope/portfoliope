import React from 'react';

export default function PDFStyles() {
  return (
    <style jsx global>{`
        .acc-panel.tab-pdf.open {
          position: fixed;
          left: 84.375px;
          top: 0;
          width: calc(100vw - 84.375px);
          z-index: 45;
          flex-basis: auto !important;
          min-width: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-right: none;
        }

        .acc-panel.tab-pdf .acc-content {
          width: 100%;
        }

        .acc-panel.tab-pdf .acc-body,
        .pdf-container,
        .pdf-body,
        .pdf-viewer-overlay,
        .pdf-empty-container {
          background: #0a0a0c !important;
          border: 1px solid rgba(255, 250, 205, 0.05);
        }

        /* Overlay Mode for PDF */
        .pdf-active .acc-panel.closed {
          opacity: 0;
          pointer-events: none;
        }

        .pdf-active .acc-panel.open:not(.tab-pdf) {
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
    `}</style>
  );
}
