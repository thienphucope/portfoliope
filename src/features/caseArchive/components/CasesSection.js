import { useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import CaseItem from './CaseItem';

export default function CasesSection({ displayedCases, onLinkClick, loadedCount, totalCount, loading, onLoadMore, searchTerm, setSearchTerm }) {
  const [showAll, setShowAll] = useState(false);
  const expanded = showAll || Boolean(searchTerm.trim());
  const visibleCases = expanded ? displayedCases : displayedCases.slice(0, 5);

  return (
    <section className="nf-cases" id="cases" aria-labelledby="latest-writing-title">
      <div className="nf-section-heading">
        <h2 id="latest-writing-title">Latest Writing</h2>
        <button type="button" className="nf-text-link" onClick={() => setShowAll(!showAll)} aria-expanded={showAll} aria-controls="writing-list">
          {showAll ? 'Latest five' : 'All writing'} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="nf-search-row" role="search">
        <Search size={16} strokeWidth={1.5} aria-hidden="true" />
        <input id="archive-search" type="search" className="nf-search-input" aria-label="Search evidence" placeholder="Search the archives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button type="button" className="nf-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      <div id="writing-list" className="nf-case-list" aria-busy={loading}>
        {visibleCases.length > 0 ? visibleCases.map((c) => <CaseItem key={c.id} caseData={c} onLinkClick={onLinkClick} />) : (
          <div className="nf-no-cases" role="status">{loading ? 'Consulting archives...' : 'No matching evidence found.'}</div>
        )}
      </div>
      {expanded && loadedCount < totalCount && <button type="button" className="nf-load-more" onClick={onLoadMore} disabled={loading}>{loading ? 'Consulting Evidence...' : 'Load more cases'} <ArrowRight size={16} aria-hidden="true" /></button>}
    </section>
  );
}
