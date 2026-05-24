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
    <div className="nf-case reveal">
      {mediaSrc && (
        <div className="nf-case-img" onClick={() => onLinkClick(caseData.id)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaSrc} alt="" />
        </div>
      )}
      <div className="nf-case-meta">
        <span className="nf-case-date">{caseData.formattedDate}</span>
        {caseData.tag    && <span className="nf-case-tag">{caseData.tag}</span>}
        {caseData.author && <span className="nf-case-author">{caseData.author}</span>}
      </div>
      <h3 className="nf-case-title" onClick={() => onLinkClick(caseData.id)}>{caseData.displayTitle}</h3>
      <div ref={contentRef} className="nf-case-excerpt markdown-content" dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} />
      <button className="nf-case-read" onClick={() => onLinkClick(caseData.id)}>→ Examine Dossier</button>
    </div>
  );
}
