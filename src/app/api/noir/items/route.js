import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const displayDir = join(process.cwd(), 'public', 'display');
    const dataPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'boardData.json');
    
    // 1. Scan directory for images
    const files = await readdir(displayDir);
    const imageFiles = files.filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f));
    
    // 2. Read single data file
    let boardData = { items: [], config: {} };
    try {
      const content = await readFile(dataPath, 'utf8');
      boardData = JSON.parse(content);
    } catch (e) {
      console.warn('Could not read boardData.json, using defaults');
    }
    
    // 3. Merge images with saved data
    const mergedItems = imageFiles.map((fileName, i) => {
      const saved = boardData.items?.find(it => it.name === fileName);
      return {
        id: `po-display-${fileName}`,
        type: 'polaroid',
        imageUrl: `/display/${fileName}`,
        title: saved?.title || fileName.split('.')[0],
        scale: saved?.scale ?? 1.0,
        rotation: saved?.rotation ?? 0,
        x: saved?.x ?? 1250,
        y: saved?.y ?? 850,
        z: saved?.z ?? (i + 1)
      };
    });
    
    return NextResponse.json({ 
      items: mergedItems, 
      config: boardData.config || {},
      connections: [] 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
