// src/services/ai.js

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const RAG_API_URL = "https://rag-backend-zh2e.onrender.com/rag";
const SYSTEM_INSTRUCTION = process.env.SYSTEM_INSTRUCTION || " ";

export async function handleAiRequest({ query, history, username }) {
  if (!query) throw new Error('Missing query');
  console.log(`🤖 [AI Action] Request received. Query: "${query.slice(0, 50)}..."`);

  const systemInstruction = SYSTEM_INSTRUCTION;

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
        return { response: text };
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
          return { response: text };
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
        return { response: data.response };
      }
    } else {
      console.warn(`⚠️ [AI Action] RAG returned status ${ragResp.status}`);
    }
  } catch (e) {
    console.warn("❌ [AI Action] RAG failed:", e.message);
  }

  console.error(`💀 [AI Action] All AI services failed.`);
  throw new Error('All AI services failed');
}
