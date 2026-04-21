import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const displayDir = join(process.cwd(), 'public', 'display');
    const itemsPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'items.json');
    const configPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'boardConfig.json');
    
    const files = await readdir(displayDir);
    const imageFiles = files.filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f));
    
    let savedItems = [];
    try {
      const itemsContent = await readFile(itemsPath, 'utf8');
      savedItems = JSON.parse(itemsContent);
    } catch (e) {}

    let config = { pov: { position: [0, 0, 15], target: [0, 0, 0] } };
    try {
      const configContent = await readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } catch (e) {}
    
    const mergedItems = imageFiles.map((fileName, i) => {
      const saved = savedItems.find(it => it.name === fileName);
      return {
        id: `po-display-${fileName}`,
        type: 'polaroid',
        imageUrl: `/display/${fileName}`,
        title: saved?.title || fileName.split('.')[0],
        scale: saved?.scale ?? 1.0,
        x: saved?.x ?? 1250,
        y: saved?.y ?? 850,
        z: saved?.z ?? (i + 1)
      };
    });
    
    return NextResponse.json({ 
      items: mergedItems, 
      config: config,
      connections: [] 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
