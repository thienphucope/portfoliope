import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { type, items, config } = await request.json();
    const dataPath = join(process.cwd(), 'src', 'features', 'me', 'noirboard', 'utils', 'boardData.json');
    
    // 1. Read existing data
    let currentData = { items: [], config: {} };
    try {
      const content = await readFile(dataPath, 'utf8');
      currentData = JSON.parse(content);
    } catch (e) {}

    // 2. Patch data based on type
    if (type === 'items') {
      currentData.items = items;
    } else if (type === 'pov' || type === 'config') {
      currentData.config = { ...currentData.config, ...config };
    } else {
      // Full save fallback
      if (items) currentData.items = items;
      if (config) currentData.config = { ...currentData.config, ...config };
    }

    // 3. Write back
    await writeFile(dataPath, JSON.stringify(currentData, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
