// test-ollama-models.mjs
// Kiểm tra model nào còn free tier trên ollama.com

import { Ollama } from 'ollama';

const OLLAMA_API_KEY = 'ec9f9e75231944e7b4a0d42dbf27e59a.wODvTqbe1I8AdqLCeM7nIoH5';

const client = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: `Bearer ${OLLAMA_API_KEY}` },
});

const MODELS = [
  'kimi-k2.6:cloud',
  'deepseek-v4-flash:cloud',
  'deepseek-v4-pro:cloud',
  'gemma4:cloud',
  'qwen3.5:cloud',
  'glm-5.1:cloud',
  'minimax-m2.7:cloud',
  'nemotron-3-super:cloud',
  'glm-5:cloud',
  'minimax-m2.5:cloud',
  'qwen3-coder-next:cloud',
  'glm-4.7:cloud',
  'gemini-3-flash-preview:cloud',
  'minimax-m2.1:cloud',
  'deepseek-v3.2:cloud',
  'ministral-3:cloud',
  'devstral-small-2:cloud',
  'qwen3-next:cloud',
  'nemotron-3-nano:cloud',
  'rnj-1:cloud',
  'kimi-k2.5:cloud',
  'devstral-2:cloud',
  'mistral-large-3:cloud',
  'gpt-oss:cloud',
  'qwen3-coder:cloud',
  'kimi-k2-thinking:cloud',
  'minimax-m2:cloud',
  'glm-4.6:cloud',
  'deepseek-v3.1:cloud',
  'kimi-k2:cloud',
  'gemma3:cloud',
];

async function testModel(model) {
  try {
    const res = await client.chat({
      model,
      messages: [{ role: 'user', content: 'hi' }],
      stream: false,
      options: { num_predict: 10 },
    });
    const text = res.message?.content?.trim()?.slice(0, 60) || '(empty)';
    return { status: 'OK', text };
  } catch (e) {
    const msg = e?.message || String(e);
    const short = msg.slice(0, 120).replace(/\n/g, ' ');
    return { status: 'FAIL', text: short };
  }
}

const ok = [];
const fail = [];

for (const model of MODELS) {
  process.stdout.write(`Testing ${model.padEnd(32)} ... `);
  const result = await testModel(model);
  if (result.status === 'OK') {
    ok.push(model);
    console.log(`✅ "${result.text}"`);
  } else {
    fail.push({ model, reason: result.text });
    console.log(`❌ ${result.text}`);
  }
}

console.log('\n─── KẾT QUẢ ───────────────────────────────────────────');
console.log(`✅ Còn free (${ok.length}):`, ok.join(', '));
console.log(`❌ Lỗi    (${fail.length}):`, fail.map(f => f.model).join(', '));
