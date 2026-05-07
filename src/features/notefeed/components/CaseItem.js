"use client";
import { useRef, useEffect } from 'react';
import { postProcess } from '@/features/casearchives/utils/markdown';

export default function CaseItem({ caseData, onLinkClick }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) postProcess(contentRef.current);
  }, [caseData.descriptionHtml]);

  const mediaSrc = caseData.media
    ? caseData.media.type === 'youtube'
      ? `https://img.youtube.com/vi/${caseData.media.videoId}/mqdefault.jpg`
      : caseData.media.url
    : null;

  return (
    <div className="case-item reveal">
      <div className="case-left">
        <span className="case-date">{caseData.formattedDate}</span>
        {mediaSrc && (
          <div className="case-media-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaSrc} alt="" />
          </div>
        )}
      </div>
      <div className="case-info">
        <h3 className="case-title-main" onClick={() => onLinkClick(caseData.id)}>{caseData.displayTitle}</h3>
        <div className="case-metadata">
          {caseData.author && <span className="meta-item"><strong>Author:</strong> {caseData.author}</span>}
          {caseData.tag    && <span className="meta-item"><strong>Tag:</strong> {caseData.tag}</span>}
          {caseData.links  && <span className="meta-item"><strong>Links:</strong> {caseData.links}</span>}
        </div>
        <div ref={contentRef} className="case-desc-compiled markdown-content" dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} />
        <span className="case-status solved" onClick={() => onLinkClick(caseData.id)}>Examine Dossier</span>
      </div>
    </div>
  );
}
