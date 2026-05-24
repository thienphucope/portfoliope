// src/services/ai.js

import { Ollama } from 'ollama';
import { availableTools, executeToolCall } from './aitool.js';
import { 
  MOXXI_SYSTEM_PROMPT, 
  TEMPERATURE, 
  MAX_TOKENS, 
  MAX_TOKENS_SMALL, 
  MAX_TOOL_TURNS 
} from '@/configs/ai';

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

const OPENCODE_API_KEY    = process.env.OPENCODE_API_KEY || '';
const OPENCODE_MODEL      = process.env.OPENCODE_MODEL || 'deepseek-v4-flash';

const OLLAMA_API_KEY      = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL        = process.env.OLLAMA_MODEL || 'gpt-oss:120b';

const ollamaClient = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: `Bearer ${OLLAMA_API_KEY}` },
});

const RAG_API_URL        = process.env.RAG_API_URL || 'https://rag-backend-zh2e.onrender.com/rag';
const SYSTEM_INSTRUCTION = MOXXI_SYSTEM_PROMPT;

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

// ─── Shared OpenAI-compatible tool loop ──────────────────────────────────────
// Grok, OpenRouter, HuggingFace đều dùng OpenAI chat completions format
async function runOpenAIToolLoop(url, headers, buildBody, { messages, system }, toolCalls) {
  let currentMessages = [{ role: 'system', content: system }, ...messages];

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(buildBody(currentMessages)),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const message = (await res.json()).choices?.[0]?.message;

    if (message?.tool_calls?.length > 0) {
      const assistantMsg = { role: 'assistant', tool_calls: message.tool_calls };
      if (message.content) assistantMsg.content = message.content;
      if (message.reasoning_content) assistantMsg.reasoning_content = message.reasoning_content;
      currentMessages.push(assistantMsg);
      for (const tc of message.tool_calls) {
        const result = await executeToolCall(tc.function.name, tc.function.arguments);
        toolCalls.push({ name: tc.function.name, args: tc.function.arguments });
        currentMessages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) });
      }
      continue;
    }
    return message?.content || null;
  }
  throw new Error("Vượt quá số lần gọi tool liên tiếp cho phép.");
}

// ─── Providers ────────────────────────────────────────────────────────────────

async function callGemini({ messages, system }, toolCalls) {
  const geminiTools = [
    {
      functionDeclarations: availableTools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }
  ];

  let currentContents = messages.map(({ role, content }) => ({
    role: role === 'user' ? 'user' : 'model',
    parts: [{ text: content }],
  }));

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: currentContents,
        tools: geminiTools,
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const candidate = data.candidates?.[0];
    if (!candidate) return null;

    const parts = candidate.content?.parts || [];
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length > 0) {
      currentContents.push(candidate.content);
      const functionResponses = [];
      for (const call of functionCalls) {
        const result = await executeToolCall(call.functionCall.name, call.functionCall.args);
        toolCalls.push({ name: call.functionCall.name, args: call.functionCall.args });
        functionResponses.push({ functionResponse: { name: call.functionCall.name, response: result } });
      }
      currentContents.push({ role: 'user', parts: functionResponses });
      continue;
    }
    return parts.find(p => p.text)?.text || null;
  }
  throw new Error("Gemini: Vượt quá số lần gọi tool liên tiếp cho phép.");
}

async function callGrok({ messages, system }, toolCalls) {
  const grokTools = [
    { type: "web_search" },
    { type: "x_search" },
    ...availableTools.map(t => ({
      type: "function",
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  ];

  let currentInput = messages.map(({ role, content }) => ({
    role: role === 'user' ? 'user' : 'assistant',
    content,
  }));

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        input: currentInput,
        instructions: system,
        tools: grokTools,
        temperature: TEMPERATURE,
        max_output_tokens: MAX_TOKENS,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const output = data.output || [];
    const functionCalls = output.filter(item => item.type === 'function_call');

    if (functionCalls.length > 0) {
      for (const fc of functionCalls) currentInput.push(fc);
      for (const fc of functionCalls) {
        const result = await executeToolCall(fc.name, fc.arguments);
        toolCalls.push({ name: fc.name, args: fc.arguments });
        currentInput.push({
          type: 'function_call_output',
          call_id: fc.call_id,
          output: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }
      continue;
    }

    const message = output.find(item => item.type === 'message');
    const textBlock = message?.content?.find(b => b.type === 'output_text' || b.type === 'text');
    return textBlock?.text || null;
  }
  throw new Error("Grok: Vượt quá số lần gọi tool liên tiếp cho phép.");
}

async function callAnthropic({ messages, system }, toolCalls) {
  const anthropicTools = availableTools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  let currentMessages = [...messages];

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, system, messages: currentMessages, max_tokens: MAX_TOKENS, tools: anthropicTools }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length > 0) {
      currentMessages.push({ role: 'assistant', content: data.content });
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await executeToolCall(block.name, block.input);
        toolCalls.push({ name: block.name, args: block.input });
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: typeof result === 'string' ? result : JSON.stringify(result) });
      }
      currentMessages.push({ role: 'user', content: toolResults });
      continue;
    }
    return data.content.find(b => b.type === 'text')?.text || null;
  }
  throw new Error("Anthropic: Vượt quá số lần gọi tool liên tiếp cho phép.");
}

async function callSeaLion(ctx, toolCalls) {
  return runOpenAIToolLoop(
    "https://api.sea-lion.ai/v1/chat/completions",
    { 'Authorization': `Bearer ${SEA_LION_API_KEY}` },
    (msgs) => ({ model: SEA_LION_MODEL, messages: msgs, tools: availableTools, temperature: TEMPERATURE, max_tokens: MAX_TOKENS_SMALL }),
    ctx, toolCalls
  );
}

async function callOpenRouter(ctx, toolCalls) {
  return runOpenAIToolLoop(
    "https://openrouter.ai/api/v1/chat/completions",
    { 'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}` },
    (msgs) => ({ model: OPEN_ROUTER_MODEL, messages: msgs, tools: availableTools, temperature: TEMPERATURE, max_tokens: MAX_TOKENS }),
    ctx, toolCalls
  );
}

async function callHuggingFace(ctx, toolCalls) {
  return runOpenAIToolLoop(
    "https://router.huggingface.co/v1/chat/completions",
    { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}` },
    (msgs) => ({ model: HUGGINGFACE_MODEL, messages: msgs, tools: availableTools, temperature: TEMPERATURE, max_tokens: MAX_TOKENS_SMALL }),
    ctx, toolCalls
  );
}

async function callOpenCode(ctx, toolCalls) {
  return runOpenAIToolLoop(
    "https://opencode.ai/zen/go/v1/chat/completions",
    { 'Authorization': `Bearer ${OPENCODE_API_KEY}` },
    (msgs) => ({ model: OPENCODE_MODEL, messages: msgs, tools: availableTools, temperature: TEMPERATURE, max_tokens: MAX_TOKENS }),
    ctx, toolCalls
  );
}

async function callOllama({ messages, system }, toolCalls) {
  let currentMessages = [{ role: 'system', content: system }, ...messages];

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const response = await ollamaClient.chat({
      model: OLLAMA_MODEL,
      messages: currentMessages,
      tools: availableTools,
      stream: false,
    });

    const message = response.message;

    if (message.tool_calls?.length > 0) {
      currentMessages.push(message);
      for (const tc of message.tool_calls) {
        const result = await executeToolCall(tc.function.name, tc.function.arguments);
        toolCalls.push({ name: tc.function.name, args: tc.function.arguments });
        currentMessages.push({ role: 'tool', content: JSON.stringify(result) });
      }
      continue;
    }
    return message.content || null;
  }
  throw new Error("Ollama: Vượt quá số lần gọi tool liên tiếp cho phép.");
}

async function callRag({ messages, username }) {
  const query = messages.at(-1)?.content || '';
  const res = await fetch(RAG_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, query }),
  });
  if (!res.ok) throw new Error(`RAG ${res.status}`);
  return (await res.json()).response || null;
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'OpenCode',    fn: callOpenCode,    enabled: () => !!OPENCODE_API_KEY },
  { name: 'Ollama',      fn: callOllama,      enabled: () => !!OLLAMA_API_KEY },
  { name: 'Gemini',      fn: callGemini,      enabled: () => !!GEMINI_API_KEY },
  { name: 'HuggingFace', fn: callHuggingFace, enabled: () => !!HUGGINGFACE_API_KEY },
  { name: 'OpenRouter',  fn: callOpenRouter,  enabled: () => !!OPEN_ROUTER_API_KEY },
  { name: 'SEALION',     fn: callSeaLion,     enabled: () => !!SEA_LION_API_KEY },
  { name: 'Grok',        fn: callGrok,        enabled: () => false },
  { name: 'Anthropic',   fn: callAnthropic,   enabled: () => false },
  { name: 'RAG',         fn: callRag,         enabled: () => false },
];

export async function handleAiRequest(rawInput, onToolCall = () => {}) {
  const normalized = normalize(rawInput);
  console.log(`🤖 [AI] Query: "${(rawInput.query || '').slice(0, 50)}..."`);

  const targetName = rawInput.provider?.toLowerCase();
  const providers = targetName
    ? PROVIDERS.filter(p => p.name.toLowerCase() === targetName)
    : PROVIDERS;

  if (targetName && providers.length === 0) throw new Error(`Provider "${rawInput.provider}" không tồn tại.`);

  for (const { name, fn, enabled } of providers) {
    if (!enabled()) { console.log(`⏭️ [${name}] Skipped (no API key).`); continue; }
    if (isOpen(name)) { console.log(`🔴 [${name}] Circuit open, skipping.`); continue; }
    console.log(`📡 [${name}] Attempting...`);
    try {
      const toolCalls = [];
      toolCalls.push = function(item) {
        Array.prototype.push.call(this, item);
        onToolCall(item);
      };
      const text = await fn(normalized, toolCalls);
      if (text) {
        console.log(`✅ [${name}] Success.`);
        recordSuccess(name);
        return { response: text, provider: name, toolCalls: [...toolCalls] };
      }
      console.warn(`⚠️ [${name}] Empty response.`);
      recordFailure(name);
    } catch (e) {
      console.warn(`❌ [${name}] Failed:`, e.message);
      recordFailure(name);
    }
  }

  throw new Error(targetName ? `Provider "${rawInput.provider}" failed.` : 'All AI services failed');
}
