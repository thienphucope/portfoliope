// src/app/api/cases/route.js
import { NextResponse } from 'next/server';
import { getFileFromGithub } from '@/services/github';
import { marked } from 'marked';
import {
  hydrateServerCache,
  getCacheSnapshot,
  updateFileInCache,
} from '@/services/caseProvider';

function decodeContent(base64) {
  return Buffer.from(base64 || '', 'base64').toString('utf8');
}

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const snapshot = await hydrateServerCache(false);
    return NextResponse.json(snapshot.tree);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to fetch cases from GitHub' }, { status: 500 });
  }
}

// ─── POST: read-only actions (bootstrap, get) ────────────────────────────────

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action, path } = body;

  if (action === 'bootstrap') {
    try {
      const snapshot = await hydrateServerCache(true);
      return NextResponse.json({ ok: true, ...snapshot });
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Bootstrap failed' }, { status: 500 });
    }
  }

  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const finalPath = path.endsWith('.md') ? path : `${path}.md`;

  if (action === 'get') {
    try {
      await hydrateServerCache(false);
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message || 'Failed to refresh server cache' }, { status: 500 });
    }

    const snapshot = getCacheSnapshot();
    if (!Object.prototype.hasOwnProperty.call(snapshot.rawCache, finalPath)) {
      const fileData = await getFileFromGithub(finalPath);
      if (!fileData?.ok) return NextResponse.json({ ok: false, error: fileData?.error || 'Not found' }, { status: 404 });
      const raw = decodeContent(fileData.content);
      updateFileInCache(finalPath, raw, fileData.sha, marked.parse(raw || ''));
    }

    const updatedSnapshot = getCacheSnapshot();
    return NextResponse.json({
      ok: true,
      path: finalPath,
      raw: updatedSnapshot.rawCache[finalPath] || '',
      html: updatedSnapshot.htmlCache[finalPath] || null,
      sha: updatedSnapshot.shaCache[finalPath] || null,
    });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
