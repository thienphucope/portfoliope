// scripts/test-rag.mjs
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI || !GEMINI_API_KEY) {
  console.error("❌ Thiếu MONGODB_URI hoặc GEMINI_API_KEY.");
  process.exit(1);
}

async function generateEmbedding(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });
  
  if (!res.ok) throw new Error(`Lỗi API Gemini: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

async function testSearch(query) {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('chat_db');
    const collection = db.collection('documents');

    console.log(`🔍 Đang tìm kiếm vector cho: "${query}"...`);
    const queryVector = await generateEmbedding(query);

    const results = await collection.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index_chat",
          "path": "embedding",
          "queryVector": queryVector,
          "numCandidates": 50,
          "limit": 5
        }
      },
      {
        "$project": {
          "_id": 0,
          "text": 1,
          "content": 1,
          "score": { "$meta": "vectorSearchScore" }
        }
      }
    ]).toArray();

    console.log("\n✅ Kết quả tìm thấy:");
    if (results.length === 0) {
      console.log("Không tìm thấy kết quả nào khớp.");
    } else {
      results.forEach((res, i) => {
        console.log(`--- Kết quả ${i + 1} (Score: ${res.score.toFixed(4)}) ---`);
        console.log(res.text || res.content);
      });
    }
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await client.close();
  }
}

testSearch("birthplace ope");

// node --env-file=.env scripts/test-rag.mjs
