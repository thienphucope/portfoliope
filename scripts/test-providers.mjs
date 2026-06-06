// scripts/test-providers.mjs
// node --env-file=.env scripts/test-providers.mjs
// node --env-file=.env scripts/test-providers.mjs gemini

import { handleAiRequest } from '../src/services/aiGateway.js';

// Chỉ test provider có API key
const ALL_PROVIDERS = [
  { name: 'Gemini',      key: 'GEMINI_API_KEY' },
  { name: 'HuggingFace', key: 'HUGGINGFACE_API_KEY' },
  { name: 'OpenRouter',  key: 'OPEN_ROUTER_API_KEY' },
  { name: 'SEALION',     key: 'SEA_LION_API_KEY' },
  { name: 'Ollama',      key: 'OLLAMA_API_KEY' },
];

// Mỗi tool 1 query — nói rõ tên tool để model bắt buộc phải gọi
const TOOL_TESTS = [
  { tool: 'calculator',       query: 'Use the calculator tool to compute 123 * 456. You must call the calculator tool.' },
  { tool: 'ollama_web_search',query: 'Use the ollama_web_search tool to search for "AI news 2025". You must call the ollama_web_search tool.' },
  { tool: 'ollama_web_fetch', query: 'Use the ollama_web_fetch tool to fetch https://example.com. You must call the ollama_web_fetch tool.' },
  { tool: 'book_get',         query: 'Use the book_get tool to find the book "The Great Gatsby". You must call the book_get tool.' },
  { tool: 'rag_search',       query: 'Use the rag_search tool to search for information about Ope. You must call the rag_search tool.' },
];

const target = process.argv[2];
const toTest = target
  ? ALL_PROVIDERS.filter(p => p.name.toLowerCase() === target.toLowerCase())
  : ALL_PROVIDERS.filter(p => !!process.env[p.key]);

if (toTest.length === 0) {
  console.error(target
    ? `❌ Provider "${target}" không tồn tại hoặc chưa có API key.`
    : `❌ Không có provider nào được enable (chưa set API key).`
  );
  process.exit(1);
}

console.log(`\n🧪 Providers sẽ test: ${toTest.map(p => p.name).join(', ')}`);
console.log('═'.repeat(60));

for (const { name } of toTest) {
  console.log(`\n▶ [${name}]`);
  console.log('─'.repeat(60));

  for (const { tool, query } of TOOL_TESTS) {
    process.stdout.write(`  🛠️  ${tool.padEnd(20)} → `);
    const start = Date.now();
    try {
      const result = await handleAiRequest({ query, provider: name, history: [], username: 'test' });
      const ms = Date.now() - start;
      console.log(`✅ ${ms}ms | ${result.response.slice(0, 80).replace(/\n/g, ' ')}${result.response.length > 80 ? '...' : ''}`);
    } catch (e) {
      const ms = Date.now() - start;
      console.log(`❌ ${ms}ms | ${e.message.slice(0, 80)}`);
    }
  }
}

console.log('\n' + '═'.repeat(60));
console.log('✔ Done');
