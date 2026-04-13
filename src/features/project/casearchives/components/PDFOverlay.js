import React from 'react';
import dynamic from 'next/dynamic';
import { VolumeX } from 'lucide-react';

const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false });

export default function PDFOverlay({
  isOpen,
  setActiveOverlay,
  reader,
}) {
  const { stop, isPlaying, readChunk, currentText, triggerRead } = reader;

  return (
    <div className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-pdf`} data-tab-id="pdf">
      <div
        className="acc-content"
        onClick={(e) => e.stopPropagation()}
        style={!isOpen ? { display: 'none' } : {}}
      >
        <div className="acc-body">
          <div className="pdf-container" style={{ flex: 1, overflow: 'hidden' }}>
            <PDFViewer 
              onClose={() => setActiveOverlay(null)} 
              reader={{ readChunk, stop, isPlaying, currentText, triggerRead }}
              isOpen={isOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
