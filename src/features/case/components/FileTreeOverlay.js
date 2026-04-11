import React from 'react';
import dynamic from 'next/dynamic';
import FileSystemItem from './FileSystemItem';
import FloatingActions from './FloatingActions';

const GraphView = dynamic(() => import('./GraphView'), { ssr: false });

export default function FileTreeOverlay({
  isOpen,
  activeOverlay,
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  filteredTree,
  loadFile,
  fileName,
  handleRenameFile,
  handleDeleteFile,
  graphFiles,
  fullContentCache,
}) {
  const tab = { id: 'filetree', title: 'File Tree' };

  return (
    <div className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-filetree`} data-tab-id="filetree">
      {isOpen && (
        <div className="acc-content" onClick={(e) => e.stopPropagation()}>
          <FloatingActions
            tab={tab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <div className="acc-body">
            {viewMode === 'list' ? (
              <div className="file-list" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                {filteredTree.map((item, i) => (
                  <FileSystemItem
                    key={i}
                    item={item}
                    onSelectFile={loadFile}
                    activeFile={fileName}
                    onRename={handleRenameFile}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <GraphView
                  allFiles={graphFiles}
                  onSelectFile={loadFile}
                  searchTerm={searchTerm}
                  activeNodeId={fileName}
                  fullContentCache={fullContentCache}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
