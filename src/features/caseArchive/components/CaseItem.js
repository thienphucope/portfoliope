"use client";
import { useRef, useEffect } from 'react';
import { postProcess } from '@/lib/markdown';

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
    <article className={`nf-case reveal${mediaSrc ? '' : ' nf-case-text-only'}`}>
      {mediaSrc && (
        <button type="button" className="nf-case-img" onClick={() => onLinkClick(caseData.id)} aria-label={`Read ${caseData.displayTitle}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaSrc} alt="" />
        </button>
      )}
      <h2 className="nf-case-title"><button type="button" onClick={() => onLinkClick(caseData.id)}>{caseData.displayTitle}</button></h2>
      <div ref={contentRef} className="nf-case-excerpt markdown-content" dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} />
      <div className="nf-case-bottom">
        <div className="nf-case-meta">
          {caseData.author && <span className="nf-case-author">{caseData.author}</span>}
          <div className="nf-case-details">
            {caseData.tag && <span className="nf-case-tag">{caseData.tag}</span>}
            <span className="nf-case-date">{caseData.formattedDate}</span>
          </div>
        </div>
        <button type="button" className="nf-case-read" onClick={() => onLinkClick(caseData.id)} title="[ examine dossier ]" aria-label={`Examine dossier: ${caseData.displayTitle}`}><span aria-hidden="true">↗</span></button>
      </div>
    </article>
  );
}
