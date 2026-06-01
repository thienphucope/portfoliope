import CaseItem from './CaseItem';

export default function CasesSection({ displayedCases, onLinkClick, loadedCount, totalCount, loading, onLoadMore, searchTerm, setSearchTerm }) {
  return (
    <section className="nf-cases" id="cases">
      <div className="nf-cases-header">
        <div className="nf-cases-label info-wrap">
          Case archives
          <span className="info-icon" data-tooltip="Searchable database of investigative case notes and evidence">i</span>
        </div>
      </div>
      <div className="nf-search-row">
        <input
          type="text"
          className="nf-search-input"
          placeholder="Search evidence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="nf-search-btn"
          disabled={!searchTerm.trim() || loading}
        >
          {loading ? '[ ... ]' : '[ SEARCH ]'}
        </button>
      </div>
      <div className="nf-case-list">
        {displayedCases.length > 0 ? (
          displayedCases.map((c) => (
            <CaseItem key={c.id} caseData={c} onLinkClick={onLinkClick} />
          ))
        ) : (
          <div className="nf-no-cases">
            {loading ? 'Consulting archives...' : 'No matching evidence found.'}
          </div>
        )}
      </div>
      {loadedCount < totalCount && (
        <button className="nf-load-more" onClick={onLoadMore}>
          {loading ? 'Consulting Evidence...' : 'Load More Cases →'}
        </button>
      )}
    </section>
  );
}
