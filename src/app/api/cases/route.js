// src/app/api/cases/route.js
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  console.log(`📡 [API Route] Fetching from backend: ${BACKEND}/cases`);
  try {
    const response = await fetch(`${BACKEND}/cases`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API Route] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    const tree = await response.json();
    console.log(`✅ [API Route] Successfully fetched tree with ${tree.length} root items`);
    return NextResponse.json(tree);
  } catch (error) {
    console.error(`❌ [API Route] Fetch failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: save or create a .md file ─────────────────────────────────────────
// Body: { path: "filename.md", content: "...", create: true|false }
//
// Forwards to Python backend POST /cases
// Your Python server should handle:
//   create=true  → create new file (fail if exists, or upsert — your choice)
//   create=false → overwrite/save existing file

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { path, content, create = false } = body;

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "path"' }, { status: 400 });
  }
  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "content"' }, { status: 400 });
  }

  console.log(`📝 [API Route] ${create ? 'Creating' : 'Saving'} file: ${path}`);

  try {
    const response = await fetch(`${BACKEND}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, create }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API Route] Backend save error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json().catch(() => ({ ok: true }));
    console.log(`✅ [API Route] File ${create ? 'created' : 'saved'}: ${path}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`❌ [API Route] Save failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}