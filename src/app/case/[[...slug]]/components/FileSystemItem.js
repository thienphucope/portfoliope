import React from 'react';
import { ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';

const FileSystemItem = ({ item, level = 0, onSelectFile, activeFile, onRename, onDelete }) => {
  const [isOpen, setIsOpen] = React.useState(item.isOpen || false);
  const isActive = item.kind === 'file' && (item.repoPath || item.name).toLowerCase() === activeFile?.toLowerCase();
  
  return (
    <div className="select-none">
      <div
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}${isActive ? ' is-active' : ''}${item.isLocal ? ' is-local' : ''}`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (item.kind === 'directory') setIsOpen(o => !o);
          else onSelectFile(item.path, item.name, item.repoPath || item.id);
        }}
      >
        <span className="arrow-wrapper">
          {item.kind === 'directory'
            ? isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />
            : <span className="spacer" />}
        </span>
        <span className="item-name">{item.name.replace('.md', '')}</span>
        {item.isLocal && <span className="local-badge">●</span>}

        {item.kind === 'file' && (
          <div className="file-actions">
            <span 
              className="file-action-icon" 
              title="Rename/Move" 
              onClick={(e) => { e.stopPropagation(); onRename(item.repoPath); }}
            >
              <Edit2 size={14} />
            </span>
            <span 
              className="file-action-icon" 
              title="Delete" 
              onClick={(e) => { e.stopPropagation(); onDelete(item.repoPath); }}
            >
              <Trash2 size={14} />
            </span>
          </div>
        )}
      </div>
      {item.kind === 'directory' && isOpen && item.children?.map((child, i) => (
        <FileSystemItem 
          key={i} 
          item={child} 
          level={level + 1} 
          onSelectFile={onSelectFile} 
          activeFile={activeFile} 
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default FileSystemItem;
