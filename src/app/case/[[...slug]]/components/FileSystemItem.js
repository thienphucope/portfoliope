import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const FileSystemItem = ({ item, level = 0, onSelectFile, activeFile }) => {
  const [isOpen, setIsOpen] = useState(item.isOpen || false);
  const isActive = item.kind === 'file' && item.name.toLowerCase() === activeFile?.toLowerCase();
  return (
    <div className="select-none">
      <div
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}${isActive ? ' is-active' : ''}${item.isLocal ? ' is-local' : ''}`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (item.kind === 'directory') setIsOpen(o => !o);
          else onSelectFile(item.path, item.name, item.id);
        }}
      >
        <span className="arrow-wrapper">
          {item.kind === 'directory'
            ? isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />
            : <span className="spacer" />}
        </span>
        <span className="item-name">{item.name.replace('.md', '')}</span>
        {item.isLocal && <span className="local-badge">●</span>}
      </div>
      {item.kind === 'directory' && isOpen && item.children?.map((child, i) => (
        <FileSystemItem key={i} item={child} level={level + 1} onSelectFile={onSelectFile} activeFile={activeFile} />
      ))}
    </div>
  );
};

export default FileSystemItem;
