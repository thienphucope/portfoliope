// src/app/api/cases/route.js
import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; 
const GITHUB_REPO = 'thienphucope/cases';
const EDIT_PASS = process.env.EDIT_PASS || 'default_hardcoded_pass';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const RAG_API_URL = "https://rag-backend-zh2e.onrender.com/rag";

const fileLocks = new Map();
const LOCK_TIMEOUT = 30000; // 30 seconds expiration

// ─── HELPER: build tree from github ──────────────────────────────────────────

async function getGithubCasesTree() {
  if (!GITHUB_TOKEN) {
    console.error("❌ [GitHub] GITHUB_TOKEN is not configured.");
    return null;
  }
  const branches = ["main", "master"];
  let data = null;
  let activeBranch = null;

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`
  };

  for (const branch of branches) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${branch}?recursive=1`;
    try {
      const resp = await fetch(url, { headers, cache: 'no-store' });
      if (resp.status === 200) {
        data = await resp.json();
        activeBranch = branch;
        break;
      }
    } catch (e) {
      console.error(`⚠️ [GitHub] Error on branch '${branch}':`, e.message);
    }
  }

  if (!data || !activeBranch) return null;

  try {
    const rawBaseUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${activeBranch}`;
    const root = [];
    const nodes = { "": root };
    const items = data.tree.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of items) {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');
      if (pathParts.some(p => p.startsWith('.'))) continue;

      if (item.type === "tree") {
        const newFolder = { kind: "directory", name: name, path: item.path, children: [] };
        nodes[item.path] = newFolder.children;
        if (nodes[parentPath]) nodes[parentPath].push(newFolder);
      } else if (item.path.endsWith(".md")) {
        const newFile = { kind: "file", name: name, path: `${rawBaseUrl}/${item.path}`, repoPath: item.path };
        if (nodes[parentPath]) nodes[parentPath].push(newFile);
      }
    }

    const sortTree = (tree) => {
      tree.sort((a, b) => {
        const typeA = a.kind === "directory" ? 0 : 1;
        const typeB = b.kind === "directory" ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        return a.name.localeCompare(b.name);
      });
      for (const item of tree) {
        if (item.kind === "directory") sortTree(item.children);
      }
      return tree;
    };
    return sortTree(root);
  } catch (e) {
    console.error(`❌ [GitHub] Process error:`, e.message);
    return null;
  }
}

// ─── HELPER: get from github ──────────────────────────────────────────────────

async function getFileFromGithub(path) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`
  };
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  try {
    const resp = await fetch(url, { headers, cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, content: data.content, sha: data.sha }; // content is base64
    }
    return { error: `File not found: ${resp.status}` };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── HELPER: save to github ──────────────────────────────────────────────────

async function saveToGithub(path, content, create = false, sha = null) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
  };

  let activeBranch = null;
  for (const branch of ["main", "master"]) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${branch}`, { headers });
      if (r.ok) { activeBranch = branch; break; }
    } catch {}
  }

  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  let existingSha = sha;

  if (!existingSha) {
    try {
      const getResp = await fetch(`${url}?ref=${activeBranch}`, { headers, cache: 'no-store' });
      if (getResp.ok) {
        const data = await getResp.json();
        existingSha = data.sha;
      }
    } catch {}
  }

  if (create && existingSha) return { error: "File already exists" };
  if (!create && !existingSha) return { error: "File not found for update" };

  const encodedContent = Buffer.from(content).toString('base64');
  const payload = {
    message: `${existingSha ? 'Update' : 'Create'} ${path} via Red Vault`,
    content: encodedContent,
    branch: activeBranch,
  };
  if (existingSha) payload.sha = existingSha;

  const putResp = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });

  if (putResp.ok) {
    const data = await putResp.json();
    return { ok: true, path, sha: data.content.sha };
  }
  const errorText = await putResp.text();
  return { error: `GitHub PUT error: ${errorText}` };
}

// ─── HELPER: delete from github ──────────────────────────────────────────────

async function deleteFromGithub(path, sha) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
  };

  let activeBranch = null;
  for (const branch of ["main", "master"]) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${branch}`, { headers });
      if (r.ok) { activeBranch = branch; break; }
    } catch {}
  }

  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const payload = {
    message: `Delete ${path} via Red Vault`,
    sha: sha,
    branch: activeBranch,
  };

  const resp = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(payload)
  });

  if (resp.ok) return { ok: true };
  const errorText = await resp.text();
  return { error: `GitHub DELETE error: ${errorText}` };
}

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  console.log(`📡 [API Route] GET Cases: Fetching from GitHub...`);
  const tree = await getGithubCasesTree();
  if (tree) {
    console.log(`✅ [API Route] Successfully fetched tree from GitHub`);
    return NextResponse.json(tree);
  }

  return NextResponse.json({ error: "Failed to fetch cases from GitHub. Check GITHUB_TOKEN and repository." }, { status: 500 });
}

// ─── POST: save or create a .md file ─────────────────────────────────────────

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action, path, newPath, content, create = false, comment = false, password, sha, sessionId, query, history, username } = body;

  // 1. Handle AI requests
  if (action === 'ai') {
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    console.log(`🤖 [AI Action] Request received. Query: "${query.slice(0, 50)}..."`);

    const systemInstruction = process.env.SYSTEM_INSTRUCTION || " ";

    // 1a. Try Grok (xAI) first
    if (XAI_API_KEY) {
      console.log(`📡 [AI Action] Attempting Grok (grok-4-1-fast) via Responses API...`);
      try {
        const grokResp = await fetch("https://api.x.ai/v1/responses", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${XAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "grok-4-1-fast",
            input: [
              ...(history || []).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
              })),
              { role: "user", content: query }
            ],
            instructions: systemInstruction || "You are a helpful assistant.",
            tools: [
              { type: "web_search" },
              { type: "x_search" },
              { type: "file_search", vector_store_ids: ["collection_06dd3ffc-16df-4db5-9eef-ff869f21d5e5"] }
            ],
            temperature: 0.7,
            max_output_tokens: 8192,
            stream: false
          }),
        });

        if (!grokResp.ok) {
          const errorBody = await grokResp.text();
          console.error(`Grok Responses error ${grokResp.status}: ${errorBody}`);
          throw new Error(`Grok failed: ${grokResp.status}`);
        }

        const data = await grokResp.json();
        let text = "";
        for (const item of data.output || []) {
          if (item.type === "message") {
            for (const block of item.content || []) {
              if (block.type === "output_text") {
                text = block.text;
                break;
              }
            }
          }
          if (text) break;
        }

        if (text) {
          console.log(`✅ [AI Action] Grok responded successfully.`);
          return NextResponse.json({ response: text });
        } else {
          console.warn(`⚠️ [AI Action] Grok returned empty output_text`);
        }
      } catch (e) {
        console.warn("❌ [AI Action] Grok failed, falling back to Gemini:", e.message);
      }
    } else {
      console.log(`⏭️ [AI Action] Skipping Grok (XAI_API_KEY not set).`);
    }

    // 1b. Fallback to Gemini
    if (GEMINI_API_KEY) {
      console.log(`📡 [AI Action] Attempting Gemini (gemini-2.5-flash)...`);
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const contents = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          ...(history || []).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: query }] }
        ];

        const geminiResp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, tools: [{ google_search: {} }] }),
        });

        if (geminiResp.ok) {
          const data = await geminiResp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`✅ [AI Action] Gemini responded successfully.`);
            return NextResponse.json({ response: text });
          }
        } else {
          console.warn(`⚠️ [AI Action] Gemini returned status ${geminiResp.status}`);
        }
      } catch (e) {
        console.warn("❌ [AI Action] Gemini failed, falling back to RAG:", e.message);
      }
    } else {
      console.log(`⏭️ [AI Action] Skipping Gemini (GEMINI_API_KEY not set).`);
    }

    // 1c. Final Fallback: RAG
    console.log(`📡 [AI Action] Attempting RAG fallback...`);
    try {
      const ragResp = await fetch(RAG_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || 'AI_Assistant', query }),
      });
      if (ragResp.ok) {
        const data = await ragResp.json();
        if (data.response) {
          console.log(`✅ [AI Action] RAG responded successfully.`);
          return NextResponse.json({ response: data.response });
        }
      } else {
        console.warn(`⚠️ [AI Action] RAG returned status ${ragResp.status}`);
      }
    } catch (e) {
      console.warn("❌ [AI Action] RAG failed:", e.message);
    }

    console.error(`💀 [AI Action] All AI services failed.`);
    return NextResponse.json({ error: 'All AI services failed' }, { status: 500 });
  }

  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  
  const finalPath = path.endsWith('.md') ? path : `${path}.md`;
  const now = Date.now();
  const currentLock = fileLocks.get(finalPath);

  // 1. Handle File Content Fetching (No password required, no lock)
  if (action === 'get') {
    const fileData = await getFileFromGithub(finalPath);
    return NextResponse.json({ ok: true, ...fileData });
  }

  // 2. Handle File Locking & Getting latest content (No password required)
  if (action === 'lock') {
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
      return NextResponse.json({ ok: false, error: 'File is being edited by another user', locked: true }, { status: 423 });
    }
    fileLocks.set(finalPath, { expiresAt: now + LOCK_TIMEOUT, sessionId });
    const fileData = await getFileFromGithub(finalPath);
    return NextResponse.json({ ok: true, locked: true, ...fileData });
  }

  // 2. Handle File Unlocking (No password required)
  if (action === 'unlock') {
    if (currentLock && currentLock.sessionId === sessionId) {
      fileLocks.delete(finalPath);
    }
    return NextResponse.json({ ok: true });
  }

  // 3. Password Check for destructive/modifying actions
  if (!create && !comment && password !== EDIT_PASS) {
    console.warn(`❌ [API Route] Wrong password attempt during modification.`);
    return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
  }

  // Check lock for modification actions
  if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
    return NextResponse.json({ error: 'Lock lost or held by another user' }, { status: 423 });
  }

  // 4. Handle Delete Action
  if (action === 'delete') {
    if (!sha) return NextResponse.json({ error: 'Missing sha' }, { status: 400 });
    console.log(`🗑️ [API Route] Deleting ${finalPath} from GitHub...`);
    const result = await deleteFromGithub(finalPath, sha);
    if (result.ok) {
      fileLocks.delete(finalPath);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // 5. Handle Rename/Move Action
  if (action === 'rename') {
    if (!newPath) return NextResponse.json({ error: 'Missing newPath' }, { status: 400 });
    const finalNewPath = newPath.endsWith('.md') ? newPath : `${newPath}.md`;
    
    console.log(`🔄 [API Route] Renaming ${finalPath} to ${finalNewPath}...`);
    
    // 1. Get content of old path if not provided
    let finalContent = content;
    let finalSha = sha;
    if (!finalContent || !finalSha) {
      const oldData = await getFileFromGithub(finalPath);
      if (!oldData.ok) return NextResponse.json({ error: `Could not fetch old file: ${oldData.error}` }, { status: 404 });
      finalContent = Buffer.from(oldData.content, 'base64').toString('utf8');
      finalSha = oldData.sha;
    }

    // 2. Create new file
    const createResult = await saveToGithub(finalNewPath, finalContent, true);
    if (!createResult.ok) return NextResponse.json({ error: `Create new file failed: ${createResult.error}` }, { status: 500 });

    // 3. Delete old file
    const deleteResult = await deleteFromGithub(finalPath, finalSha);
    if (!deleteResult.ok) {
      console.error(`⚠️ [API Route] Rename partial success: Created ${finalNewPath} but failed to delete ${finalPath}`);
      return NextResponse.json({ ok: true, partial: true, error: deleteResult.error });
    }

    // 4. Update links in other files
    const oldBase = finalPath.replace('.md', '');
    const newBase = finalNewPath.replace('.md', '');
    const oldNameOnly = oldBase.split('/').pop();
    const newNameOnly = newBase.split('/').pop();

    console.log(`🔗 [Rename] Updating links across repository...`);
    console.log(`🔗 [Rename] Patterns: [[${oldBase}]] -> [[${newBase}]], [[${oldNameOnly}]] -> [[${newNameOnly}]]`);

    const treeData = await getGithubCasesTree();
    if (treeData) {
      const allFiles = [];
      const collect = (nodes) => {
        for (const n of nodes) {
          if (n.kind === 'file' && n.repoPath !== finalNewPath) allFiles.push(n);
          if (n.children) collect(n.children);
        }
      };
      collect(treeData);

      console.log(`🔗 [Rename] Scanning ${allFiles.length} files for links...`);

      for (const file of allFiles) {
        const fileData = await getFileFromGithub(file.repoPath);
        if (fileData.ok) {
          let text = Buffer.from(fileData.content, 'base64').toString('utf8');
          let changed = false;

          const pathRegex = new RegExp(`\\[\\[${oldBase.replace(/\//g, '\\/')}\\]\\]`, 'g');
          if (pathRegex.test(text)) {
            text = text.replace(pathRegex, `[[${newBase}]]`);
            changed = true;
          }

          const nameRegex = new RegExp(`\\[\\[${oldNameOnly}\\]\\]`, 'g');
          if (nameRegex.test(text)) {
            text = text.replace(nameRegex, `[[${newNameOnly}]]`);
            changed = true;
          }

          if (changed) {
            console.log(`📝 [Rename] Updated links in: ${file.repoPath}`);
            await saveToGithub(file.repoPath, text, false, fileData.sha);
          }
        }
      }
      console.log(`🔗 [Rename] Link update complete.`);
    }

    fileLocks.delete(finalPath);
    return NextResponse.json({ ok: true, path: finalNewPath });
  }

  // 6. Handle Save Logic (Existing)
  if (typeof content !== 'string') return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  
  console.log(`📝 [API Route] POST: Saving directly to GitHub...`);
  const result = await saveToGithub(finalPath, content, create, sha);
  
  if (result.ok) {
    fileLocks.delete(finalPath); // Release lock after successful save
    console.log(`✅ [API Route] Saved to GitHub successfully.`);
    return NextResponse.json(result);
  } else {
    console.error(`❌ [API Route] GitHub save failed: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}

