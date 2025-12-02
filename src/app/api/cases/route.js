// src/app/api/cases/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Hàm đệ quy để quét thư mục
const getDirectoryTree = (dirPath, relativePath = '') => {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  
  const tree = items.map((item) => {
    const itemPath = path.join(relativePath, item.name); // Đường dẫn tương đối dùng cho URL
    
    if (item.isDirectory()) {
      return {
        kind: 'directory',
        name: item.name,
        children: getDirectoryTree(path.join(dirPath, item.name), itemPath)
      };
    } else {
      // Chỉ lấy file .md
      if (!item.name.endsWith('.md')) return null;
      return {
        kind: 'file',
        name: item.name,
        path: `/cases/${itemPath.replace(/\\/g, '/')}` // Đường dẫn fetch thực tế từ public
      };
    }
  }).filter(Boolean); // Loại bỏ null

  // Sắp xếp folder lên đầu
  return tree.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'directory' ? -1 : 1));
};

export async function GET() {
  try {
    // Trỏ tới thư mục public/cases của dự án
    const casesDir = path.join(process.cwd(), 'public', 'cases');
    
    if (!fs.existsSync(casesDir)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const tree = getDirectoryTree(casesDir);
    return NextResponse.json(tree);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}