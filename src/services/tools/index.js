// src/services/tools/index.js — AI tool registry & dispatcher
import { calculator, calculatorSchema } from './calculator.js';
import { ragSearch, ragSearchSchema } from './rag.js';
import { bookGet, bookGetSchema } from './book.js';
import { webSearch, webSearchSchema, webFetch, webFetchSchema } from './search.js';
import { casesList, casesRead, casesSearch, casesListSchema, casesReadSchema, casesSearchSchema } from './cases.js';
import { sendOpeAnonymousMessage, sendOpeAnonymousMessageSchema } from './discordMessaging.js';
import { setOpeAvatarEmotion, setOpeAvatarEmotionSchema, setOpeAvatarCustomEmotion, setOpeAvatarCustomEmotionSchema } from './opeAvatar.js';

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
  ope_avatar_set_emotion: setOpeAvatarEmotion,
  ope_avatar_set_custom_emotion: setOpeAvatarCustomEmotion,
};

export const availableTools = [calculatorSchema, ragSearchSchema, bookGetSchema, webSearchSchema, webFetchSchema, casesListSchema, casesReadSchema, casesSearchSchema, sendOpeAnonymousMessageSchema, setOpeAvatarEmotionSchema, setOpeAvatarCustomEmotionSchema];

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
