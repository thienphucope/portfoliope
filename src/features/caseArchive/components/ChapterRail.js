// src/features/caseArchive/components/ChapterRail.js
// Left-side table of contents for the active note; jumps to a heading on click.
const ChapterRail = ({ chapters, activeIndex, onJump }) => {
  if (!chapters.length) return null;
  return (
    <nav className="chapter-rail" aria-label="Chapters">
      <div className="chapter-rail-title">Chapters</div>
      <ul className="chapter-rail-list">
        {chapters.map((c, i) => (
          <li key={i} className="chapter-rail-item">
            <button
              type="button"
              className={`chapter-rail-link ${i === activeIndex ? 'is-active' : ''}`}
              data-level={c.level}
              aria-current={i === activeIndex ? 'location' : undefined}
              style={{ paddingLeft: `${(c.level - 1) * 12 + 14}px` }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onJump(i);
              }}
              title={c.text}
            >
              <span className="chapter-text">{c.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ChapterRail;
