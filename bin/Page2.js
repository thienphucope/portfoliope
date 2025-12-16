"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// --- UTILS: Load Scripts Dynamically ---
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

// --- PROCESS CONTENT INTO BLOCKS (shared logic) ---
const processContentToBlocks = (lines) => {
  const blocks = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed === '') {
      i++;
      continue;
    }
    // --- THÊM ĐOẠN NÀY: Check Spacer ---
    const spaceMatch = trimmed.match(/^\{space:(\d+px)\}$/);
    if (spaceMatch) {
      blocks.push({
        type: 'spacer',
        height: spaceMatch[1]
      });
      i++;
      continue; // Xong block này, nhảy sang dòng tiếp
    }
    
    let blockContent = [];
    let bgColor = null;
    let textColor = null;
    let textAlign = null; // <--- BIẾN MỚI
    
    // Helper function để check syntax align
    // Trả về align value nếu có, và tăng i lên
    const checkAlign = (currentIndex) => {
      if (currentIndex >= lines.length) return { val: null, idx: currentIndex };
      const l = lines[currentIndex].trim();
      const match = l.match(/^\{align:(left|center|right|justify)\}$/);
      if (match) {
        return { val: match[1], idx: currentIndex + 1 };
      }
      return { val: null, idx: currentIndex };
    };

    // Helper function check color
    const checkColor = (currentIndex) => {
      if (currentIndex >= lines.length) return { val: null, idx: currentIndex };
      const l = lines[currentIndex].trim();
      const match = l.match(/^\{color:(red|blue|yellow|green|gray|orange|purple|pink|white|black)\}$/);
      if (match) {
        return { val: match[1], idx: currentIndex + 1 };
      }
      return { val: null, idx: currentIndex };
    };

    // 1. Check BG
    const bgMatch = trimmed.match(/^\{bg:(red|blue|yellow|green|gray|orange|purple|pink)\}$/);
    if (bgMatch) {
      bgColor = bgMatch[1];
      i++;
      
      // 2. Check Color sau BG
      const cResult = checkColor(i);
      textColor = cResult.val;
      i = cResult.idx;

      // 3. Check Align sau Color (hoặc sau BG)
      const aResult = checkAlign(i);
      textAlign = aResult.val;
      i = aResult.idx;

    } else {
      // Nếu không có BG, check Color
      const cResult = checkColor(i);
      if (cResult.val) {
        textColor = cResult.val;
        i = cResult.idx;

        // Check Align sau Color
        const aResult = checkAlign(i);
        textAlign = aResult.val;
        i = aResult.idx;
      } else {
        // Nếu không có Color, check Align đứng một mình
        const aResult = checkAlign(i);
        if (aResult.val) {
          textAlign = aResult.val;
          i = aResult.idx;
        }
        // Nếu không có gì đặc biệt thì là text thường, i giữ nguyên
      }
    }

    // Collect content
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      
      // Dừng lại nếu gặp dòng trống hoặc syntax đặc biệt bắt đầu block mới
      if (nextTrimmed === '' || 
          nextTrimmed.match(/^\{bg:/) || 
          nextTrimmed.match(/^\{color:/) ||
          nextTrimmed.match(/^\{align:/)) { // <--- NHỚ THÊM ĐK DỪNG NÀY
        break;
      }
      
      blockContent.push(nextLine);
      i++;
    }
    
    if (blockContent.length > 0) {
      blocks.push({
        type: 'normal',
        content: blockContent,
        bgColor: bgColor,
        color: textColor,
        align: textAlign // <--- PASS GIÁ TRỊ VÀO BLOCK
      });
    }
  }
  
  return blocks;
};

// --- BLOCK-BASED MARKDOWN PROCESSOR ---
const processBlockMarkdown = (markdown) => {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for row start
    if (trimmed === ':::row') {
      const row = { type: 'row', columns: [] };
      i++; // Move to next line
      
      // Process columns in this row
      while (i < lines.length) {
        const colLine = lines[i].trim();
        
        // End of row
        if (colLine === ':::') {
          i++;
          break;
        }
        
        // Start of column
        if (colLine.startsWith(':::col')) {
          const widthMatch = colLine.match(/:::col\s+(\d+%?)/);
          const width = widthMatch ? widthMatch[1] : 'auto';
          
          const columnLines = [];
          i++; // Move past :::col line
          
          // Collect column content until :::
          while (i < lines.length) {
            const contentLine = lines[i];
            const contentTrimmed = contentLine.trim();
            
            // End of column
            if (contentTrimmed === ':::') {
              i++;
              break;
            }
            
            columnLines.push(contentLine);
            i++;
          }
          
          // Process column lines into blocks (same logic as outside)
          const columnBlocks = processContentToBlocks(columnLines);
          
          row.columns.push({
            width,
            blocks: columnBlocks
          });
        } else {
          i++;
        }
      }
      
      if (row.columns.length > 0) {
        blocks.push(row);
      }
      continue;
    }
    
    // Skip row-related syntax outside of row context
    if (trimmed === ':::' || trimmed.startsWith(':::col')) {
      i++;
      continue;
    }
    
    // Regular block (not in a row)
    // Collect lines until we hit a row or end
    const regularLines = [];
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      
      if (nextTrimmed === ':::row') {
        break;
      }
      
      regularLines.push(nextLine);
      i++;
    }
    
    // Process regular lines into blocks
    const regularBlocks = processContentToBlocks(regularLines);
    blocks.push(...regularBlocks);
  }
  
  return blocks;
};

// --- MARKDOWN BLOCK COMPONENT ---
const MarkdownBlock = ({ block, onLinkClick }) => {
  // --- THÊM ĐOẠN NÀY Ở ĐẦU COMPONENT ---
  if (block.type === 'spacer') {
    return <div style={{ height: block.height, width: '100%' }} />;
  }
  // -------------------------------------
  const blockRef = useRef(null);
  
  useEffect(() => {
    if (blockRef.current && window.marked && window.renderMathInElement) {
      const renderer = new window.marked.Renderer();
      
      // ... trong component MarkdownBlock ...
      renderer.image = (arg1, arg2, arg3) => {
        let href = arg1, title = arg2, text = arg3;
        if (typeof arg1 === 'object' && arg1 !== null) {
          href = arg1.href;
          title = arg1.title;
          text = arg1.text;
        }
        let safeHref = (typeof href === 'string') ? href : '';
        const safeText = (typeof text === 'string') ? text : '';
        const safeTitle = (typeof title === 'string') ? title : '';

        // --- LOGIC MỚI: Check xem có #circle không ---
        let extraClass = '';
        if (safeHref.endsWith('#circle')) {
          extraClass = 'img-circle';
          safeHref = safeHref.replace('#circle', ''); // Xóa cái đuôi đi để link ảnh vẫn chạy đúng
        }
        // ---------------------------------------------

        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = safeHref.match(youtubeRegex);

        if (match && match[1]) {
          return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${match[1]}" title="${safeText}" frameborder="0" allowfullscreen></iframe></div>`;
        }
        
        const titlePart = safeTitle ? ` title="${safeTitle}"` : '';
        
        // Thêm biến ${extraClass} vào thẻ img
        return `<img src="${safeHref}" alt="${safeText}" class="${extraClass}"${titlePart}>`;
      };

      window.marked.use({ renderer });
      
      let content = block.content.join('\n');
      
      // Process internal links
      content = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
        return `<span class="internal-link" data-target="${p1}">${p1}</span>`;
      });
      
      const htmlContent = window.marked.parse(content);
      blockRef.current.innerHTML = htmlContent;
      
      window.renderMathInElement(blockRef.current, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }
  }, [block]);
  
  const bgColorClass = block.bgColor ? `bg-${block.bgColor}` : '';
  const textColorClass = block.color ? `text-${block.color}` : '';
  
  // --- THÊM DÒNG NÀY ---
  const alignClass = block.align ? `text-align-${block.align}` : ''; 
  
  // Thêm alignClass vào chuỗi class
  const combinedClasses = `markdown-block ${bgColorClass} ${textColorClass} ${alignClass}`;
  
  return (
    <div 
      ref={blockRef} 
      className={combinedClasses.trim()}
      onClick={onLinkClick}
    />
  );
};

// --- ROW COMPONENT ---
const MarkdownRow = ({ row, onLinkClick }) => {
  return (
    <div className="md-row">
      {row.columns.map((col, idx) => {
        const style = col.width !== 'auto' 
          ? { flex: `0 0 ${col.width}`, maxWidth: col.width }
          : {};
        
        return (
          <div key={idx} className="md-col" style={style}>
            {col.blocks.map((block, blockIdx) => (
              <MarkdownBlock key={blockIdx} block={block} onLinkClick={onLinkClick} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// --- MARKDOWN VIEWER ---
const MarkdownViewer = ({ content, onLinkClick }) => {
  const [blocks, setBlocks] = useState([]);
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
    if (libsLoaded && window.marked) {
      const processedBlocks = processBlockMarkdown(content);
      setBlocks(processedBlocks);
    }
  }, [content, libsLoaded]);

  if (!libsLoaded) return <div className="loading-container">Loading...</div>;

  return (
    <div className="markdown-body">
      {blocks.map((block, idx) => {
        if (block.type === 'row') {
          return <MarkdownRow key={idx} row={block} onLinkClick={onLinkClick} />;
        }
        return <MarkdownBlock key={idx} block={block} onLinkClick={onLinkClick} />;
      })}
    </div>
  );
};

// --- FILE SYSTEM ITEM ---
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
          {item.name.replace('.md', '')}
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

// --- MAIN COMPONENT ---
export default function RedMathVault() {
  const [fileTree, setFileTree] = useState([]);
  const [content, setContent] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const fileRegistry = useRef({}); 
  const sidebarHoverAreaRef = useRef(null);

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

  const loadFile = async (path, name) => {
    try {
      const res = await fetch(path);
      const text = await res.text();
      setCurrentFileName(name ? name.replace('.md', '') : '');
      setContent(text); 
    } catch (err) {
      console.error(err);
      setContent('# Error\nKhông tải được file.');
    }
  };

 useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch('/api/cases');
        if (!res.ok) throw new Error('Failed to fetch cases');
        const tree = await res.json();

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

        // --- PHẦN CHỈNH SỬA Ở ĐÂY ---
        
        // 1. Đặt tên file cậu muốn load đầu tiên
        const DEFAULT_FILE_NAME = 'Dash Board.md'; // Hoặc 'intro.md', 'home.md' tùy cậu

        // 2. Tìm path của file đó trong registry (đã build ở trên)
        const defaultPath = fileRegistry.current[DEFAULT_FILE_NAME.toLowerCase()];

        if (defaultPath) {
          // Nếu tìm thấy file mặc định, load nó
          loadFile(defaultPath, DEFAULT_FILE_NAME);
        } else {
          // Nếu KHÔNG tìm thấy, quay về logic cũ: load file đầu tiên trong cây thư mục
          const firstFile = findFirstMdFile(tree);
          if (firstFile) {
            loadFile(firstFile.path, firstFile.name);
          }
        }
        
        // --- KẾT THÚC PHẦN CHỈNH SỬA ---

      } catch (err) {
        console.error("Error loading file tree:", err);
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

  // Handle sidebar hover behavior
  useEffect(() => {
    const handleMouseEnter = () => {
      setSidebarVisible(true);
    };
    
    const handleMouseLeave = (e) => {
      if (e.relatedTarget && e.relatedTarget.closest('.sidebar')) {
        return;
      }
      setSidebarVisible(false);
    };
    
    const sidebarElement = document.querySelector('.sidebar');
    const hoverAreaElement = sidebarHoverAreaRef.current;
    
    if (hoverAreaElement) {
      hoverAreaElement.addEventListener('mouseenter', handleMouseEnter);
    }
    
    if (sidebarElement) {
      sidebarElement.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (hoverAreaElement) {
        hoverAreaElement.removeEventListener('mouseenter', handleMouseEnter);
      }
      if (sidebarElement) {
        sidebarElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar hover detection area */}
      <div 
        ref={sidebarHoverAreaRef} 
        className="sidebar-hover-area"
        aria-label="Hover to show sidebar"
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarVisible ? 'visible' : ''}`}>
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

      {/* Main Content */}
      <main className="main-viewport">
        <div className="content-wrapper">
          <MarkdownViewer content={content} onLinkClick={handlePreviewClick} />
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

        :root {
          --bg-color: #121212;
          --text-color: #ffffff;
          --text-red: #ff4444;
          --bright-red: #ffffff;
          --sidebar-width: 300px;
          --table-border-color: rgba(255, 255, 255, 0.2);
        }

        body { 
          margin: 0; 
          background: var(--bg-color); 
          color: var(--text-color); 
          font-family: 'Crimson Text', serif;
          overflow-y: auto; 
          font-size: 18px; 
          line-height: 1.7;
        }

        /* --- MARKDOWN BODY --- */
        .markdown-body {
          background-color: transparent !important;
          color: var(--text-color) !important;
          font-family: 'Crimson Text', serif !important;
          font-size: 20px;
          line-height: 1.8;
          width: 100%;
          text-align: justify;
        }

/* --- BLOCK SYSTEM (Notion-style) --- */
        .markdown-block {
          /* SỬA 2 DÒNG NÀY */
          margin: 1px 0 !important;      /* Giảm margin trên dưới xuống siêu nhỏ (1px) */
          padding: 0px 10px !important;  /* Giảm padding trên dưới xuống 2px, giữ nguyên trái phải */
          
          /* Giữ nguyên các dòng này */
          border-radius: 4px;
          transition: background-color 0.2s;
          /* Nhớ XÓA dòng 'width: fit-content' nếu cậu lỡ thêm vào nhé */
        }

        .markdown-block:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }

        /* Background Colors */
        .bg-red { background-color: rgba(220, 38, 38, 0.15) !important; }
        .bg-blue { background-color: rgba(59, 130, 246, 0.15) !important; }
        .bg-yellow { background-color: rgba(234, 179, 8, 0.15) !important; }
        .bg-green { background-color: rgba(34, 197, 94, 0.15) !important; }
        .bg-gray { background-color: rgba(156, 163, 175, 0.15) !important; }
        .bg-orange { background-color: rgba(249, 115, 22, 0.15) !important; }
        .bg-purple { background-color: rgba(168, 85, 247, 0.15) !important; }
        .bg-pink { background-color: rgba(236, 72, 153, 0.15) !important; }

        /* Text Colors */
        .text-red { color: #ff4444 !important; }
        .text-blue { color: #3b82f6 !important; }
        .text-yellow { color: #eab308 !important; }
        .text-green { color: #22c55e !important; }
        .text-gray { color: #9ca3af !important; }
        .text-orange { color: #f97316 !important; }
        .text-purple { color: #a855f7 !important; }
        .text-pink { color: #ec4899 !important; }
        .text-white { color: #ffffff !important; }
        .text-black { color: #000000 !important; }

        /* --- HEADINGS --- */
        .markdown-block h1, .markdown-block h2, .markdown-block h3, 
        .markdown-block h4, .markdown-block h5, .markdown-block h6 {
          border: none !important;
          color: inherit !important;
          font-weight: 700;
          line-height: 1.3 !important;
          margin: 0.2em 0 !important;
        }

        .markdown-block h1 { font-size: 2.2em !important; }
        .markdown-block h2 { font-size: 1.8em !important; }
        .markdown-block h3 { font-size: 1.5em !important; }
        .markdown-block h4 { font-size: 1.3em !important; }
        .markdown-block h5 { font-size: 1.1em !important; }
        .markdown-block h6 { font-size: 3.0em !important; }

        /* --- TABLES --- */
        .markdown-block table { 
          display: table !important; 
          width: 100% !important; 
          margin: 1em 0 !important;
          border-collapse: collapse;
          border: 1px solid var(--table-border-color) !important;
        }

        .markdown-block table th, 
        .markdown-block table td { 
          border: 1px solid var(--table-border-color) !important;
          padding: 8px 12px !important;
          line-height: 1.4 !important;
          vertical-align: top;
        }

        .markdown-block table th {
          font-weight: 700;
          background: rgba(255, 255, 255, 0.05);
          text-align: left;
        }

        /* --- IMAGES & VIDEOS --- */
        .markdown-block img { 
          width: 100%; 
          max-width: 100%; 
          height: auto; 
          display: block; 
          margin: 12px 0; 
          object-fit: contain;
          border-radius: 4px;
        }

        .video-wrapper { 
          position: relative; 
          padding-bottom: 56.25%; 
          height: 0; 
          overflow: hidden; 
          max-width: 100%; 
          margin: 12px 0; 
        }

        .video-wrapper iframe { 
          position: absolute; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
        }

        /* --- LISTS --- */
        .markdown-block ul, .markdown-block ol {
          margin: 0.3em 0;
          padding-left: 2em;
        }

        .markdown-block ul {
          list-style-type: disc;
        }

        .markdown-block ol {
          list-style-type: decimal;
        }

        /* --- COLUMNS --- */
        .md-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
          width: 100%;
        }
        
        .md-col {
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          /* 1. Ép dòng chuyển thành cột dọc thực sự */
          .md-row { 
            display: flex !important;
            flex-direction: column !important; /* Quan trọng: Xếp chồng dọc thay vì ngang */
            gap: 20px; /* Tăng khoảng cách giữa các phần tử khi xếp chồng cho thoáng */
            height: auto !important; /* Đảm bảo chiều cao tự động giãn theo nội dung */
          }
          
          /* 2. Cột chiếm full chiều ngang */
          .md-col { 
            width: 100% !important;
            flex: 0 0 auto !important; /* Reset flex để không bị co kéo */
            max-width: 100% !important; 
            margin-bottom: 12px; /* Thêm margin dưới cho chắc cốp */
          }

          /* 3. Fix riêng cho hình ảnh/video để không bị đè */
          .markdown-block img, 
          .video-wrapper {
            max-width: 100% !important;
            height: auto !important;
            display: block; /* Tránh lỗi inline image tạo khoảng trắng thừa */
          }
        }

        /* --- OTHER ELEMENTS --- */
        .markdown-block p { margin: 0.3em 0; }
        .markdown-block blockquote {
          border-left: 10px solid #ffffff !important;
          padding-left: 1em;
          margin: 0.5em 0;
          opacity: 0.8;
        }

        .markdown-block a { 
          color: var(--bright-red) !important; 
          text-decoration: none; 
          color: #FFFACD !important;
        }

        .internal-link { 
          color: #FFFACD; 
          cursor: pointer; 
          // border-bottom: 1px solid #FFFACD;
        }

        /* --- SIDEBAR --- */
        .app-container { 
          position: relative; 
          min-height: 100vh; 
          width: 100vw; 
          overflow-x: hidden;
        }

        .sidebar-hover-area {
          position: fixed;
          top: 0;
          left: 0;
          width: 20px;
          height: 100vh;
          z-index: 999;
          cursor: pointer;
        }

        .sidebar { 
          position: fixed; 
          top: 0; 
          left: 0; 
          height: 100vh; 
          width: var(--sidebar-width); 
          display: flex; 
          flex-direction: column; 
          z-index: 1000; 
          background: #000000; 
          color: var(--text-color);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
        }

        .sidebar.visible {
          transform: translateX(0);
        }

        .sidebar-header { 
          padding: 40px 30px 20px; 
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .brand { 
          font-family: 'Crimson Text', serif; 
          font-size: 20px; 
          letter-spacing: 2px; 
          color: var(--text-color);
        }

        .file-tree-scroll { 
          flex: 1; 
          overflow-y: auto; 
          padding: 10px; 
        }

        .file-tree-scroll::-webkit-scrollbar { width: 4px; }
        .file-tree-scroll::-webkit-scrollbar-thumb { background: var(--text-white); border-radius: 2px; }

        .loading-msg { 
          text-align: center; 
          margin-top: 20px; 
          opacity: 0.6; 
        }

        .tree-item { 
          display: flex; 
          align-items: center; 
          cursor: pointer; 
          font-family: 'Crimson Text', serif; 
          font-size: 16px; 
          padding: 6px 0; 
          color: var(--text-color); 
          opacity: 0.8; 
          transition: opacity 0.2s; 
        }

        .tree-item:hover { 
          opacity: 1; 
          color: var(--text-yellow); 
        }

        .arrow-wrapper { width: 20px; display: flex; justify-content: center; }
        .spacer { width: 20px; }

        .item-name { 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .font-bold { font-weight: 600; }

        /* --- MAIN VIEWPORT --- */
        .main-viewport { 
          width: 100%; 
          box-sizing: border-box; 
          min-height: 100vh; 
          display: flex; 
          justify-content: center; 
        }
        
        .content-wrapper { 
          width: 100%;
          padding: 30px 40px 100px; 
        }

        .page-title { 
          font-family: 'Crimson Text', serif; 
          font-size: 2.5rem; 
          font-weight: 600; 
          margin-bottom: 30px; 
          color: var(--text-color); 
          text-align: left; 
        }

        /* Loading indicator */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: var(--text-color);
          font-size: 1.2rem;
        }

        /* --- KATEX --- */
        .katex { font-size: 1.1em; }
        .katex-display { overflow-x: auto; padding: 10px 0; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(138, 0, 0, 0.3); border-radius: 3px; }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .sidebar {
            width: 280px;
          }
          
          .content-wrapper {
            padding: 20px 15px 80px;
          }
          
          .page-title {
            font-size: 2rem;
          }
        }
        /* --- CIRCULAR IMAGE --- */
        .img-circle {
          border-radius: 50% !important;
          object-fit: cover !important; /* Cắt ảnh vừa khung, không bị méo */
          aspect-ratio: 1 / 1; /* Ép ảnh thành hình vuông tỉ lệ 1:1 để tròn đẹp */
          
          /* Tuỳ chọn: Giới hạn kích thước nếu cậu muốn avatar nhỏ */
          max-width: 100vw !important; 
          margin: 12px auto !important; /* Căn giữa */
          display: block;
        }
        .text-align-left { text-align: left !important; }
        .text-align-center { text-align: center !important; }
        .text-align-right { text-align: right !important; }
        .text-align-justify { text-align: justify !important; }
        /* ... Các code CSS cũ ở trên ... */

      /* --- MOBILE RESPONSIVE TWEAKS --- */
      @media (max-width: 768px) {
        
        /* 1. Giảm size chữ Body xuống mức chuẩn mobile (16px hoặc 17px) */
        /* Hiện tại PC đang là 20px */
        .markdown-body {
          font-size: 16px !important; 
          line-height: 1.6 !important; /* Giảm giãn dòng chút cho đỡ tốn diện tích */
          text-align: justify; /* Giữ căn đều cho đẹp */
        }

        /* 2. Tinh chỉnh lại Heading cho đỡ "hét vào mặt" người xem */
        /* Vì màn hình nhỏ, tỉ lệ Heading nên giảm đi một chút so với body */
        .markdown-block h1 { font-size: 1.8em !important; } /* PC: 2.2em */
        .markdown-block h2 { font-size: 1.5em !important; } /* PC: 1.8em */
        .markdown-block h3 { font-size: 1.3em !important; } /* PC: 1.5em */
        .markdown-block h4 { font-size: 1.2em !important; } /* PC: 1.3em */

        /* 3. Mở rộng không gian hiển thị */
        /* Mobile đất chật người đông, giảm padding lề để chữ có chỗ thở */
        .content-wrapper {
          padding: 20px 4px 80px 4px !important;        }

        /* 4. Giảm size tiêu đề trang chính (Page Title) */
        .page-title {
          font-size: 1.8rem !important; /* PC: 2.5rem */
          margin-bottom: 20px !important;
        }
        
        /* 5. Block quote (trích dẫn) nên thụt lề ít hơn */
        .markdown-block blockquote {
          margin: 0.5em 0 !important;
          padding-left: 0.8em !important;
        }
        /* 1. Điều khiển khoảng cách ở đây */
        .md-row {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important; /* <--- Sửa số này: Khoảng cách chính thức giữa các khối (8px là đẹp) */
        }

        /* 2. Xóa margin thừa của khối con */
        .md-col {
          width: 100% !important;
          max-width: 100% !important;
          margin-bottom: 0 !important; /* <--- QUAN TRỌNG: Set về 0 để không bị cộng dồn với gap ở trên */
        }
        .markdown-block {
          padding-left: 5px !important;
          padding-right: 5px !important;
        }
      }
      `}</style>
    </div>
  );
}