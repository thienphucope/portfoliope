// src/services/aitool.js
import { calculator, calculatorSchema } from './calculatortool.js';
import { ragSearch, ragSearchSchema } from './ragtool.js';
import { bookGet, bookGetSchema } from './booktool.js';
import { webSearch, webSearchSchema, webFetch, webFetchSchema } from './searchtool.js';
import { casesList, casesRead, casesSearch, casesListSchema, casesReadSchema, casesSearchSchema } from './casestool.js';
import { sendOpeAnonymousMessage, sendOpeAnonymousMessageSchema } from './hermestool.js';

const toolsFunctions = {
  calculator,
  rag_search: ragSearch,
  book_get: bookGet,
  ollama_web_search: webSearch,
  ollama_web_fetch: webFetch,
  cases_list: casesList,
  cases_read: casesRead,
  cases_search: casesSearch,
  send_ope_anonymous_message: sendOpeAnonymousMessage,
};

export const availableTools = [calculatorSchema, ragSearchSchema, bookGetSchema, webSearchSchema, webFetchSchema, casesListSchema, casesReadSchema, casesSearchSchema, sendOpeAnonymousMessageSchema];

export async function executeToolCall(toolName, args) {
  console.log(`🛠️ [Tool] AI gọi tool: ${toolName}`, args);

  if (!toolsFunctions[toolName]) {
    return { error: `Tool ${toolName} không tồn tại` };
  }

  try {
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
    return await toolsFunctions[toolName](parsedArgs);
  } catch (e) {
    console.error(`🛠️ [Tool] Lỗi khi chạy ${toolName}:`, e);
    return { error: e.message };
  }
}
