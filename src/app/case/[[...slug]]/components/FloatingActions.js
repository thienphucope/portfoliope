import React from 'react';
import { Share2, Search } from 'lucide-react';

export default function FloatingActions({
  tab,
  isEditing,
  handleToggleEditMode,
  saveStatus,
  handleSidebarSave,
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm
}) {
  if (tab.type === 'editor') {
    return (
      <div className="floating-actions">
        <button
          className={`icon-btn${isEditing ? ' icon-btn--active' : ''}`}
          onClick={handleToggleEditMode}
          title={isEditing ? 'Switch to Read mode' : 'Switch to Edit mode'}
        >
          {isEditing ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          )}
        </button>
        <button
          className={`icon-btn icon-btn--save${saveStatus === 'saved' ? ' icon-btn--active' : saveStatus === 'error' ? ' icon-btn--error' : saveStatus === 'saving' ? ' icon-btn--saving' : ''}`}
          onClick={handleSidebarSave}
          disabled={saveStatus === 'saving'}
          title="Save"
        >
          {saveStatus === 'saving' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.5}}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.06-5.96"/>
            </svg>
          ) : saveStatus === 'saved' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : saveStatus === 'error' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          )}
        </button>
      </div>
    );
  }

  if (tab.id === 'filetree') {
    return (
      <div className="floating-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className={`icon-btn pc-only ${viewMode === 'graph' ? 'icon-btn--active' : ''}`}
          onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
          title="Toggle Graph/List View"
        >
          <Share2 size={18} />
        </button>
        {showSearch && (
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="search-input"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--txt)',
              fontSize: '13px',
              outline: 'none',
              width: '150px'
            }}
          />
        )}
        <button 
          className={`icon-btn ${showSearch ? 'icon-btn--active' : ''}`} 
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchTerm('');
          }}
          title="Search notes"
        >
          <Search size={18} />
        </button>
      </div>
    );
  }

  return null;
}
