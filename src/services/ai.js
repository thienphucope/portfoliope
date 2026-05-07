// src/services/ai.js

// ─── Static config ────────────────────────────────────────────────────────────
const TEMPERATURE       = 0.7;
const MAX_TOKENS        = 8192;
const MAX_TOKENS_SMALL  = 2048; // for providers with lower limits

// ─── Keys & models from env ───────────────────────────────────────────────────
const XAI_API_KEY         = process.env.XAI_API_KEY || '';
const XAI_MODEL           = process.env.XAI_MODEL || 'grok-4-1-fast';

const GEMINI_API_KEY      = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL        = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SEA_LION_API_KEY    = process.env.SEA_LION_API_KEY || '';
const SEA_LION_MODEL      = process.env.SEA_LION_MODEL || 'aisingapore/Gemma-SEA-LION-v4-27B-IT';

const ANTHROPIC_API_KEY   = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL     = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY || '';
const OPEN_ROUTER_MODEL   = process.env.OPEN_ROUTER_MODEL || 'openai/gpt-4o-mini';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HUGGINGFACE_MODEL   = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

const RAG_API_URL         = process.env.RAG_API_URL || 'https://rag-backend-zh2e.onrender.com/rag';
const SYSTEM_INSTRUCTION  = process.env.SYSTEM_INSTRUCTION || 'You are a helpful assistant.';

// ─── Circuit breaker ─────────────────────────────────────────────────────────
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS  = 60_000;
const failures = new Map();

function isOpen(name) {
  const f = failures.get(name);
  if (!f) return false;
  if (Date.now() > f.until) { failures.delete(name); return false; }
  return f.count >= CIRCUIT_THRESHOLD;
}

function recordFailure(name) {
  const f = failures.get(name) || { count: 0, until: 0 };
  failures.set(name, { count: f.count + 1, until: Date.now() + CIRCUIT_RESET_MS });
}

function recordSuccess(name) {
  failures.delete(name);
}

// ─── Normalize ────────────────────────────────────────────────────────────────
// Standard internal format: { messages: [{role, content}], system, username }

function normalize({ query, history, username, systemInstruction }) {
  if (!query) throw new Error('Missing query');
  return {
    messages: [
      ...(history || []).map(({ role, content }) => ({ role, content })),
      { role: 'user', content: query },
    ],
    system: systemInstruction || SYSTEM_INSTRUCTION,
    username: username || 'AI_Assistant',
  };
}

// ─── Providers ────────────────────────────────────────────────────────────────

async function callGrok({ messages, system }) {
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: XAI_MODEL,
      input: messages.map(({ role, content }) => ({
        role: role === 'assistant' ? 'assistant' : 'user',
        content,
      })),
      instructions: system,
      tools: [
        { type: "web_search" },
        { type: "x_search" },
        { type: "file_search", vector_store_ids: ["collection_06dd3ffc-16df-4db5-9eef-ff869f21d5e5"] },
      ],
      temperature: TEMPERATURE,
      max_output_tokens: MAX_TOKENS,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = await res.json();
  for (const item of data.output || []) {
    if (item.type !== 'message') continue;
    for (const block of item.content || []) {
      if (block.type === 'output_text' && block.text) return block.text;
    }
  }
  return null;
}

async function callGemini({ messages, system }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: system }] },
        ...messages.map(({ role, content }) => ({
          role: role === 'user' ? 'user' : 'model',
          parts: [{ text: content }],
        })),
      ],
      tools: [{ google_search: {} }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callSeaLion({ messages, system }) {
  const res = await fetch("https://api.sea-lion.ai/v1/chat/completions", {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SEA_LION_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: SEA_LION_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: TEMPERATURE,
      max_completion_tokens: MAX_TOKENS_SMALL,
    }),
  });
  if (!res.ok) throw new Error(`SEA-LION ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callAnthropic({ messages, system }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      system,
      messages: messages.map(({ role, content }) => ({
        role: role === 'assistant' ? 'assistant' : 'user',
        content,
      })),
      max_tokens: MAX_TOKENS,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

async function callOpenRouter({ messages, system }) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPEN_ROUTER_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callHuggingFace({ messages, system }) {
  const res = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HUGGINGFACE_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS_SMALL,
    }),
  });
  if (!res.ok) throw new Error(`HuggingFace ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callRag({ messages, username }) {
  const query = messages.at(-1)?.content || '';
  const res = await fetch(RAG_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, query }),
  });
  if (!res.ok) throw new Error(`RAG ${res.status}`);
  const data = await res.json();
  return data.response || null;
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'Grok',        fn: callGrok,        enabled: () => !!XAI_API_KEY },
  { name: 'Gemini',      fn: callGemini,      enabled: () => !!GEMINI_API_KEY },
  { name: 'SEA-LION',    fn: callSeaLion,     enabled: () => !!SEA_LION_API_KEY },
  { name: 'Anthropic',   fn: callAnthropic,   enabled: () => !!ANTHROPIC_API_KEY },
  { name: 'OpenRouter',  fn: callOpenRouter,  enabled: () => !!OPEN_ROUTER_API_KEY },
  { name: 'HuggingFace', fn: callHuggingFace, enabled: () => !!HUGGINGFACE_API_KEY },
  { name: 'RAG',         fn: callRag,         enabled: () => true },
];

export async function handleAiRequest(rawInput) {
  const normalized = normalize(rawInput);
  console.log(`🤖 [AI] Query: "${(rawInput.query || '').slice(0, 50)}..."`);

  for (const { name, fn, enabled } of PROVIDERS) {
    if (!enabled()) {
      console.log(`⏭️ [${name}] Skipped (no API key).`);
      continue;
    }
    if (isOpen(name)) {
      console.log(`🔴 [${name}] Circuit open, skipping.`);
      continue;
    }
    console.log(`📡 [${name}] Attempting...`);
    try {
      const text = await fn(normalized);
      if (text) {
        console.log(`✅ [${name}] Success.`);
        recordSuccess(name);
        return { response: text, provider: name };
      }
      console.warn(`⚠️ [${name}] Empty response.`);
      recordFailure(name);
    } catch (e) {
      console.warn(`❌ [${name}] Failed:`, e.message);
      recordFailure(name);
    }
  }

  throw new Error('All AI services failed');
}
