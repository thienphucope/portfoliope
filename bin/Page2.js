"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// --- UTILS: Load Scripts Dynamically (GIỮ NGUYÊN) ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadStyle = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

// --- MARKDOWN VIEWER (GIỮ NGUYÊN) ---
const MarkdownViewer = ({ content, onLinkClick }) => {
  const containerRef = useRef(null);
  const [libsLoaded, setLibsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
      loadStyle('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css')
    ]).then(() => {
      return loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js');
    }).then(() => setLibsLoaded(true)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (libsLoaded && containerRef.current && window.marked && window.renderMathInElement) {
      const renderer = new window.marked.Renderer();
      renderer.image = (arg1, arg2, arg3) => {
        let href = arg1, title = arg2, text = arg3;
        if (typeof arg1 === 'object' && arg1 !== null) { href = arg1.href; title = arg1.title; text = arg1.text; }
        const safeHref = (typeof href === 'string') ? href : '';
        const safeText = (typeof text === 'string') ? text : '';
        const safeTitle = (typeof title === 'string') ? title : '';
        
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = safeHref.match(youtubeRegex);

        if (match && match[1]) {
          return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${match[1]}" title="${safeText}" frameborder="0" allowfullscreen></iframe></div>`;
        }
        const titlePart = safeTitle ? ` title="${safeTitle}"` : '';
        return `<img src="${safeHref}" alt="${safeText}"${titlePart}>`;
      };

      window.marked.use({ renderer });
      containerRef.current.innerHTML = window.marked.parse(content);
      window.renderMathInElement(containerRef.current, {
        delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
        throwOnError: false
      });
    }
  }, [content, libsLoaded]);

  return <div ref={containerRef} className="markdown-body" onClick={onLinkClick} />;
};

// --- COMPONENT CÂY THƯ MỤC (KHÔNG ĐỔI) ---
const FileSystemItem = ({ item, level = 0, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const paddingLeft = `${level * 12}px`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.kind === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(item.path, item.name);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`tree-item ${item.kind === 'file' ? 'is-file' : 'is-folder'}`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        <span className="arrow-wrapper">
          {item.kind === 'directory' ? (
            isOpen ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />
          ) : <span className="spacer"></span>}
        </span>
        <span className={`item-name ${item.kind === 'directory' ? 'font-bold' : ''}`}>
          {item.name}
        </span>
      </div>
      {item.kind === 'directory' && isOpen && item.children && (
        <div className="tree-children">
          {item.children.map((child, index) => (
            <FileSystemItem key={`${child.name}-${index}`} item={child} level={level + 1} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT CHÍNH (CÓ THAY ĐỔI FONT + AUTO LOAD FILE ĐẦU TIÊN) ---
export default function RedMathVault() {
  const [fileTree, setFileTree] = useState([]);
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  
  const fileRegistry = useRef({}); 

  // Tìm file .md đầu tiên trong cây (đệ quy)
  const findFirstMdFile = (nodes) => {
    for (const node of nodes) {
      if (node.kind === 'file' && node.name.endsWith('.md')) {
        return { path: node.path, name: node.name };
      }
      if (node.kind === 'directory' && node.children) {
        const found = findFirstMdFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Load file
  const loadFile = async (path, name) => {
    try {
      const res = await fetch(path);
      const text = await res.text();
      setCurrentFileName(name ? name.replace('.md', '') : '');
      const processedText = text.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
        return `<span class="internal-link" data-target="${p1}">${p1}</span>`;
      });
      setContent(processedText);
    } catch (err) {
      console.error(err);
      setContent('# Error\nKhông tải được file.');
    }
  };

  // Fetch tree + tự động mở file đầu tiên
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch('/api/cases');
        if (!res.ok) throw new Error('Failed to fetch cases');
        const tree = await res.json();

        // Build registry
        const buildRegistry = (nodes) => {
          nodes.forEach(node => {
            if (node.kind === 'file') {
              fileRegistry.current[node.name.toLowerCase()] = node.path;
              fileRegistry.current[node.name.replace('.md', '').toLowerCase()] = node.path;
            } else if (node.children) {
              buildRegistry(node.children);
            }
          });
        };
        buildRegistry(tree);
        setFileTree(tree);

        // === TỰ ĐỘNG LOAD FILE ĐẦU TIÊN ===
        const firstFile = findFirstMdFile(tree);
        if (firstFile) {
          loadFile(firstFile.path, firstFile.name);
        } else {
          setContent('# RED VAULT\nChưa có file nào trong thư mục cases.');
        }

      } catch (err) {
        console.error("Error loading file tree:", err);
        setContent("# Error\nKhông tải được danh sách cases.");
      }
    };

    fetchTree();
  }, []);

  const handlePreviewClick = (e) => {
    const target = e.target.closest('.internal-link');
    if (target) {
      const fileName = target.getAttribute('data-target');
      const filePath = fileRegistry.current[fileName.toLowerCase()];
      if (filePath) {
        loadFile(filePath, fileName);
      }
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="brand">RED VAULT</span>
        </div>
        <div className="file-tree-scroll">
          {fileTree.length === 0 && <div className="loading-msg">Loading files...</div>}
          {fileTree.map((item, idx) => (
            <FileSystemItem key={idx} item={item} onSelectFile={loadFile} />
          ))}
        </div>
      </aside>

      <main className="main-viewport">
        <div className="content-wrapper">
          {currentFileName && <h1 className="page-title">{currentFileName}</h1>}
          <MarkdownViewer content={content} onLinkClick={handlePreviewClick} />
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

        :root {
          --bg-color: var(--background);
          --text-red: #8a0000;
          --bright-red: #ff0000;
          --sidebar-width: 300px;
        }

        body { 
          margin: 0; background: var(--bg-color); color: var(--text-red); 
          font-family: 'Crimson Text', serif;
          overflow-y: auto; font-size: 18px; line-height: 1.7;
        }

        /* Tất cả các style cũ giữ nguyên, chỉ đổi font ở đây */
        .markdown-body {
          background-color: transparent !important;
          color: var(--text-red) !important;
          font-family: 'Crimson Text', serif !important;
          font-size: 20px; line-height: 1.7; width: 100%;
        }

        .brand, .page-title, .tree-item, .item-name {
          font-family: 'Crimson Text', serif !important;
        }

        /* Giữ nguyên toàn bộ style còn lại... */
        .app-container { position: relative; min-height: 100vh; width: 100vw; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: var(--sidebar-width); display: flex; flex-direction: column; z-index: 1000; background: #d2e3eeff; }
        .sidebar-header { padding: 30px 10px; text-align: center;}
        .brand { font-size: 20px; letter-spacing: 2px; }
        .file-tree-scroll { flex: 1; overflow-y: auto; padding: 10px 20px; }
        .file-tree-scroll::-webkit-scrollbar { width: 4px; }
        .file-tree-scroll::-webkit-scrollbar-thumb { background: var(--text-red); border-radius: 2px; }
        .loading-msg { text-align: center; margin-top: 20px; opacity: 0.6; }
        .tree-item { display: flex; align-items: center; cursor: pointer; font-size: 15px; padding: 8px 0; color: var(--text-red); opacity: 0.8; transition: opacity 0.2s; }
        .tree-item:hover { opacity: 1; color: var(--bright-red); }
        .arrow-wrapper { width: 20px; display: flex; justify-content: center; }
        .spacer { width: 20px; }
        .item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .font-bold { font-weight: 600; }
        .main-viewport { width: 100%; padding-left: var(--sidebar-width); box-sizing: border-box; min-height: 100vh; display: flex; justify-content: center; }
        .content-wrapper { width: 90%; max-width: 900px; padding-top: 30px; padding-bottom: 100px; }
        .page-title { font-size: 3rem; font-weight: 600; margin-bottom: 40px; color: var(--text-red); text-align: center; }
        .markdown-body p, .markdown-body ul, .markdown-body ol { margin-bottom: 1em; }
        .markdown-body table { display: block; overflow-x: auto; white-space: nowrap; width: 100%; margin: 1.5em 0; border-collapse: collapse; }
        .markdown-body td, .markdown-body th { border: 1px solid var(--text-red) !important; padding: 12px 16px; color: var(--text-red) !important; min-width: 100px; }
        .markdown-body th { font-weight: 600; border-bottom: 2px solid var(--text-red) !important; }
        .markdown-body img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
        .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; background: rgba(0,0,0,0.05); }
        .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .markdown-body a { color: var(--bright-red) !important; text-decoration: none; border: none !important; }
        .internal-link { color: var(--bright-red); cursor: pointer; border: none !important; text-decoration: none; }
        .markdown-body h1, .markdown-body h2 { border: none !important; color: var(--text-red) !important; padding-bottom: 0.3em; margin-bottom: 1em; font-weight: 600; }
        .katex { font-family: KaTeX_Main, 'Times New Roman', serif !important; font-size: 1.1em; }
        .katex-display { overflow-x: auto; overflow-y: hidden; padding: 10px 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(138, 0, 0, 0.2); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}